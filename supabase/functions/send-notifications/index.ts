import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type NotificationChannels = {
  inApp?: boolean;
  email?: boolean;
  push?: boolean;
};

type NotificationPayload = {
  id?: string;
  userId?: string;
  recipientId?: string;
  actorId?: string;
  goalId?: string;
  goalTitle?: string;
  message?: string;
  type?: string;
  recipientEmail?: string;
  pushToken?: string;
  channels?: NotificationChannels;
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
    return null;
  }
  return createClient(url, serviceRoleKey);
}

async function sendEmail(notification: NotificationPayload) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("NOTIFICATION_FROM_EMAIL") || "Pathway to Christ <notifications@example.com>";
  const emailDeliveryEnabled = Deno.env.get("EMAIL_DELIVERY_ENABLED") !== "false";

  if (!emailDeliveryEnabled) {
    return { skipped: true, reason: "email_delivery_disabled" };
  }

  if (!apiKey || !notification.recipientEmail) {
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
      to: notification.recipientEmail,
      subject: `${notification.goalTitle || "Goal"} update`,
      text: notification.message || "You have a goal tracker update."
    })
  });

  if (!response.ok) {
    return { skipped: false, ok: false, status: response.status, body: await response.text() };
  }

  return { skipped: false, ok: true };
}

async function resolvePushTokens(notification: NotificationPayload) {
  if (notification.pushToken) {
    return [notification.pushToken];
  }

  const recipientId = notification.recipientId || notification.userId;
  const adminClient = getAdminClient();
  if (!recipientId || !adminClient) {
    return [];
  }

  const { data, error } = await adminClient
    .from("user_push_tokens")
    .select("token")
    .eq("profile_id", recipientId)
    .eq("enabled", true);

  if (error) {
    console.warn("Push token lookup failed.", error);
    return [];
  }

  return (data || []).map((row) => row.token).filter(Boolean);
}

async function sendPush(notification: NotificationPayload) {
  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const pushTokens = await resolvePushTokens(notification);
  if (!pushTokens.length) {
    return { skipped: true, reason: "missing_push_token" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (expoAccessToken) {
    headers.Authorization = `Bearer ${expoAccessToken}`;
  }

  const messages = pushTokens.map((token) => ({
    to: token,
    title: notification.goalTitle || "Goal update",
    body: notification.message || "You have a goal tracker update.",
    data: {
      notificationId: notification.id || null,
      type: notification.type || "same_goal_passed",
      goalId: notification.goalId || null
    }
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify(messages.length === 1 ? messages[0] : messages)
  });

  if (!response.ok) {
    return { skipped: false, ok: false, status: response.status, body: await response.text() };
  }

  return { skipped: false, ok: true, count: messages.length };
}

async function persistNotification(notification: NotificationPayload, deliveryStatus: string) {
  const adminClient = getAdminClient();
  const recipientId = notification.recipientId || notification.userId;
  if (!adminClient || !recipientId || !notification.message) {
    return null;
  }

  const { data, error } = await adminClient
    .from("notifications")
    .upsert({
      id: notification.id || undefined,
      recipient_id: recipientId,
      actor_id: notification.actorId || null,
      goal_id: notification.goalId || null,
      type: notification.type || "same_goal_passed",
      goal_title: notification.goalTitle || "Goal update",
      message: notification.message,
      recipient_email: notification.recipientEmail || null,
      channels: {
        inApp: notification.channels?.inApp !== false,
        email: Boolean(notification.channels?.email),
        push: Boolean(notification.channels?.push)
      },
      status: deliveryStatus,
      sent_at: deliveryStatus === "sent" || deliveryStatus === "partially_sent" ? new Date().toISOString() : null
    })
    .select("id")
    .single();

  if (error) {
    console.warn("Notification persistence failed.", error);
    return null;
  }

  return data?.id || null;
}

function getDeliveryStatus(email: Record<string, unknown>, push: Record<string, unknown>, channels: NotificationChannels = {}) {
  if (!channels.email && !channels.push) {
    return "in_app";
  }
  const requested = [channels.email ? email : null, channels.push ? push : null].filter(Boolean);
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

  const body = await req.json().catch(() => ({}));
  const notifications = Array.isArray(body.notifications) ? body.notifications as NotificationPayload[] : [];
  const results = [];

  for (const notification of notifications) {
    const email = notification.channels?.email ? await sendEmail(notification) : { skipped: true, reason: "email_not_requested" };
    const push = notification.channels?.push ? await sendPush(notification) : { skipped: true, reason: "push_not_requested" };
    const status = getDeliveryStatus(email, push, notification.channels || {});
    const persistedId = await persistNotification(notification, status);
    results.push({ id: notification.id || persistedId || null, persistedId, email, push, status });
  }

  return jsonResponse({
    ok: true,
    processed: notifications.length,
    results
  });
});
