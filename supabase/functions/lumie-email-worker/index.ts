import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DELIVERY_URL = Deno.env.get("EMAIL_DELIVERY_URL");
const DELIVERY_API_KEY = Deno.env.get("EMAIL_DELIVERY_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM");
const APP_URL = (Deno.env.get("APP_URL") || "https://www.lumiepost.com").replace(/\/$/, "");
const MAX_BATCH = 25;

type QueuedEmail = {
  id: string;
  event_type: "correspondence_received" | "invitation_received";
  recipient_email: string;
  recipient_profile_id: string | null;
  payload: Record<string, unknown>;
  attempts: number;
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] || character);
}

function messageFor(item: QueuedEmail) {
  const sender = (typeof item.payload.senderName === "string" ? item.payload.senderName : "Someone").replace(/[\\r\\n]+/g, " ").slice(0, 80);
  if (item.event_type === "invitation_received") {
    const inviteUrl = typeof item.payload.inviteUrl === "string" ? item.payload.inviteUrl : "";
    if (!/^https:\/\/www\.lumiepost\.com\/invite\/[A-Za-z0-9_-]{43}$/.test(inviteUrl)) {
      throw new Error("The invitation link is invalid.");
    }
    const safeSender = escapeHtml(sender);
    return {
      subject: `${sender} has sent you a letter`,
      text: `${sender} has sent you a letter through Lumie. Open your invitation: ${inviteUrl}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17213b;line-height:1.6"><p style="font-weight:700;color:#3157c8">LUMIE</p><h1 style="font-size:28px">A letter for you.</h1><p>${safeSender} has sent you a letter. Open your invitation to receive it.</p><p><a href="${inviteUrl}" style="display:inline-block;background:#3157c8;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px">Open your letter</a></p><p style="font-size:13px;color:#667085">This invitation is intended for the email address that received it.</p></div>`,
    };
  }
  const inboxUrl = `${APP_URL}/app/inbox`;
  const safeSender = escapeHtml(sender);
  return {
    subject: "A letter is waiting in Lumie",
    text: `${sender} has sent you a letter in Lumie. Sign in to read it: ${inboxUrl}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17213b;line-height:1.6"><p style="font-weight:700;color:#3157c8">LUMIE</p><h1 style="font-size:28px">A letter is waiting.</h1><p>${safeSender} has sent you something in Lumie.</p><p><a href="${inboxUrl}" style="display:inline-block;background:#3157c8;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px">Open your inbox</a></p><p style="font-size:13px;color:#667085">The letter itself stays in your private Lumie inbox.</p></div>`,
  };
}

async function deliver(item: QueuedEmail) {
  if (!DELIVERY_URL || !DELIVERY_API_KEY || !EMAIL_FROM) {
    throw new Error("Email delivery is not configured.");
  }
  const message = messageFor(item);
  const response = await fetch(DELIVERY_URL, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${DELIVERY_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": item.id,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: item.recipient_email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const detail = typeof result.message === "string" ? result.message : `Email provider returned HTTP ${response.status}.`;
    throw new Error(detail.slice(0, 500));
  }
  return typeof result.id === "string" ? result.id : typeof result.message_id === "string" ? result.message_id : null;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (request.headers.get("authorization") !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  let deliveryUrl: URL | null = null;
  try { if (DELIVERY_URL) deliveryUrl = new URL(DELIVERY_URL); } catch { /* invalid configuration */ }
  if (!deliveryUrl || deliveryUrl.protocol !== "https:" || !DELIVERY_API_KEY || !EMAIL_FROM) {
    return Response.json({ error: "EMAIL_DELIVERY_NOT_CONFIGURED" }, { status: 503 });
  }

  const { data, error } = await admin.rpc("lumie_claim_email_notification_batch", { p_limit: MAX_BATCH });
  if (error) {
    console.error("Could not claim email notifications", error);
    return Response.json({ error: "QUEUE_UNAVAILABLE" }, { status: 500 });
  }

  const items = (data || []) as QueuedEmail[];
  const results = { claimed: items.length, sent: 0, retried: 0, failed: 0 };
  for (const item of items) {
    try {
      if (item.event_type === "correspondence_received" && item.recipient_profile_id) {
        const { data: preference, error: preferenceError } = await admin.from("email_notification_preferences")
          .select("email_correspondence").eq("user_id", item.recipient_profile_id).maybeSingle();
        if (preferenceError) throw preferenceError;
        if (preference?.email_correspondence === false) {
          const { error: suppressError } = await admin.from("email_notification_outbox").update({
            status: "suppressed", locked_at: null, last_error: null, updated_at: new Date().toISOString(),
          }).eq("id", item.id).eq("status", "processing");
          if (suppressError) throw suppressError;
          continue;
        }
      }
      const providerMessageId = await deliver(item);
      const { error: updateError } = await admin.from("email_notification_outbox").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        locked_at: null,
        provider_message_id: providerMessageId,
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq("id", item.id).eq("status", "processing");
      if (updateError) throw updateError;
      results.sent += 1;
    } catch (reason) {
      const attempts = Number(item.attempts) || 1;
      const terminal = attempts >= 6;
      const delayMinutes = Math.min(60, 2 ** Math.min(attempts, 6));
      const retryAt = new Date(Date.now() + delayMinutes * 60_000).toISOString();
      const message = reason instanceof Error ? reason.message : "Email delivery failed.";
      const { error: updateError } = await admin.from("email_notification_outbox").update({
        status: terminal ? "failed" : "pending",
        available_at: retryAt,
        locked_at: null,
        last_error: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", item.id).eq("status", "processing");
      if (updateError) console.error("Could not record email delivery failure", item.id, updateError);
      if (terminal) results.failed += 1;
      else results.retried += 1;
    }
  }

  return Response.json(results);
});
