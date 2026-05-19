import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type Preference = {
  profile_id: string;
  inactivity_email: boolean;
  inactivity_push: boolean;
  inactivity_in_app: boolean;
  inactivity_min_hours: number;
  inactivity_max_hours: number;
};

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  last_active_at: string | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.");
  }
  return createClient(url, serviceRoleKey);
}

function getNextReminderAt(minHours = 24, maxHours = 96) {
  const min = Math.min(96, Math.max(24, Number(minHours) || 24));
  const max = Math.max(min, Math.min(96, Math.max(24, Number(maxHours) || 96)));
  const selectedHours = min + Math.floor(Math.random() * (max - min + 1));
  return new Date(Date.now() + selectedHours * 60 * 60 * 1000).toISOString();
}

async function sendEmail(email: string | null, message: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("NOTIFICATION_FROM_EMAIL") || "Pathway to Christ <notifications@example.com>";
  const emailDeliveryEnabled = Deno.env.get("EMAIL_DELIVERY_ENABLED") !== "false";
  if (!emailDeliveryEnabled) {
    return { skipped: true, reason: "email_delivery_disabled" };
  }
  if (!apiKey || !email) {
    return { skipped: true, reason: "missing_email_configuration" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject: "Goal tracker reminder",
      text: message
    })
  });

  if (!response.ok) {
    return { skipped: false, ok: false, status: response.status, body: await response.text() };
  }
  return { skipped: false, ok: true };
}

async function sendPush(adminClient: ReturnType<typeof createClient>, profileId: string, message: string) {
  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const { data } = await adminClient
    .from("user_push_tokens")
    .select("token")
    .eq("profile_id", profileId)
    .eq("enabled", true);
  const tokens = (data || []).map((row) => row.token).filter(Boolean);
  if (!tokens.length) {
    return { skipped: true, reason: "missing_push_token" };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (expoAccessToken) {
    headers.Authorization = `Bearer ${expoAccessToken}`;
  }

  const body = tokens.map((token) => ({
    to: token,
    title: "Goal tracker reminder",
    body: message,
    data: { type: "inactivity_reminder" }
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify(body.length === 1 ? body[0] : body)
  });

  if (!response.ok) {
    return { skipped: false, ok: false, status: response.status, body: await response.text() };
  }
  return { skipped: false, ok: true, count: tokens.length };
}

function getDeliveryStatus(email: Record<string, unknown>, push: Record<string, unknown>, preference: Preference) {
  const requested = [preference.inactivity_email ? email : null, preference.inactivity_push ? push : null].filter(Boolean);
  if (!requested.length) {
    return "in_app";
  }
  const sent = requested.filter((result) => result?.ok === true);
  if (sent.length === requested.length) {
    return "sent";
  }
  if (sent.length) {
    return "partially_sent";
  }
  return "failed";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const adminClient = getAdminClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: preferences, error: preferenceError } = await adminClient
    .from("notification_preferences")
    .select("profile_id, inactivity_email, inactivity_push, inactivity_in_app, inactivity_min_hours, inactivity_max_hours")
    .eq("inactivity_reminders_enabled", true)
    .lte("next_inactivity_reminder_at", now.toISOString());

  if (preferenceError) {
    return jsonResponse({ error: preferenceError.message }, 500);
  }

  const profileIds = (preferences || []).map((preference: Preference) => preference.profile_id);
  if (!profileIds.length) {
    return jsonResponse({ ok: true, processed: 0, results: [] });
  }

  const { data: profiles, error: profileError } = await adminClient
    .from("profiles")
    .select("id, email, full_name, last_active_at")
    .in("id", profileIds);

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500);
  }

  const profilesById = new Map((profiles || []).map((profile: Profile) => [profile.id, profile]));
  const results = [];

  for (const preference of (preferences || []) as Preference[]) {
    const profile = profilesById.get(preference.profile_id);
    const lastActiveAt = profile?.last_active_at || null;
    if (lastActiveAt && lastActiveAt > cutoff) {
      await adminClient
        .from("notification_preferences")
        .update({ next_inactivity_reminder_at: getNextReminderAt(preference.inactivity_min_hours, preference.inactivity_max_hours), updated_at: now.toISOString() })
        .eq("profile_id", preference.profile_id);
      continue;
    }

    const message = `Hi ${profile?.full_name || "there"}, this is a reminder to open the goal tracker and record your progress.`;
    const email = preference.inactivity_email ? await sendEmail(profile?.email || null, message) : { skipped: true, reason: "email_not_requested" };
    const push = preference.inactivity_push ? await sendPush(adminClient, preference.profile_id, message) : { skipped: true, reason: "push_not_requested" };
    const status = getDeliveryStatus(email, push, preference);

    const { data: notification } = await adminClient
      .from("notifications")
      .insert({
        recipient_id: preference.profile_id,
        type: "inactivity_reminder",
        goal_title: "Goal tracker reminder",
        message,
        recipient_email: profile?.email || null,
        channels: {
          inApp: preference.inactivity_in_app !== false,
          email: Boolean(preference.inactivity_email),
          push: Boolean(preference.inactivity_push)
        },
        status,
        sent_at: status === "sent" || status === "partially_sent" ? now.toISOString() : null
      })
      .select("id")
      .single();

    await adminClient
      .from("notification_preferences")
      .update({ next_inactivity_reminder_at: getNextReminderAt(preference.inactivity_min_hours, preference.inactivity_max_hours), updated_at: now.toISOString() })
      .eq("profile_id", preference.profile_id);

    results.push({ profileId: preference.profile_id, notificationId: notification?.id || null, email, push, status });
  }

  return jsonResponse({ ok: true, processed: results.length, results });
});
