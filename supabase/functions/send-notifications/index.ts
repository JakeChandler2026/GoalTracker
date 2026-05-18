const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type NotificationPayload = {
  id?: string;
  goalTitle?: string;
  message?: string;
  recipientEmail?: string;
  pushToken?: string;
  channels?: {
    email?: boolean;
    push?: boolean;
  };
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
      text: notification.message || "A youth passed you on a shared goal."
    })
  });

  if (!response.ok) {
    return { skipped: false, ok: false, status: response.status, body: await response.text() };
  }

  return { skipped: false, ok: true };
}

async function sendPush(notification: NotificationPayload) {
  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  if (!notification.pushToken) {
    return { skipped: true, reason: "missing_push_token" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (expoAccessToken) {
    headers.Authorization = `Bearer ${expoAccessToken}`;
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify({
      to: notification.pushToken,
      title: notification.goalTitle || "Goal update",
      body: notification.message || "A youth passed you on a shared goal.",
      data: {
        notificationId: notification.id || null,
        type: "same_goal_passed"
      }
    })
  });

  if (!response.ok) {
    return { skipped: false, ok: false, status: response.status, body: await response.text() };
  }

  return { skipped: false, ok: true };
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
    results.push({ id: notification.id || null, email, push });
  }

  return jsonResponse({
    ok: true,
    processed: notifications.length,
    results
  });
});
