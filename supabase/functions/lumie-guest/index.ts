import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGINS = new Set([
  "https://www.lumiepost.com",
  "https://lumiepost.com",
  "https://lumie-six-phi.vercel.app",
  "http://localhost:5173",
]);

function allowedOrigin(value: string | null) {
  if (!value) return "";
  if (ALLOWED_ORIGINS.has(value)) return value;
  try {
    const host = new URL(value).hostname;
    return host.startsWith("lumie-") && host.endsWith(".vercel.app") ? value : "";
  } catch { return ""; }
}

function response(status: number, body?: unknown, origin = "") {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...(origin ? {
        "access-control-allow-origin": origin,
        "access-control-allow-headers": "apikey, content-type, x-client-info",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-max-age": "86400",
        "vary": "Origin",
      } : {}),
    },
  });
}

function fail(status: number, code: string, message: string, origin: string) {
  return response(status, { code, message }, origin);
}

async function hashToken(token: string) {
  if (!/^[0-9a-f]{64}$/i.test(token)) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const origin = allowedOrigin(req.headers.get("origin"));
  if (req.method === "OPTIONS") return response(204, undefined, origin || "https://www.lumiepost.com");
  if (req.headers.get("origin") && !origin) return fail(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed.", "");
  if (req.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST for this endpoint.", origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return fail(503, "SERVICE_NOT_CONFIGURED", "The contribution service is not configured.", origin);
  }
  if (!req.headers.get("apikey")) return fail(401, "UNAUTHORIZED", "This request could not be verified.", origin);

  try {
    const raw = await req.text();
    if (!raw || new TextEncoder().encode(raw).byteLength > 12_000) {
      return fail(413, "REQUEST_TOO_LARGE", "The contribution is too large.", origin);
    }
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
      body = parsed as Record<string, unknown>;
    } catch {
      return fail(400, "INVALID_BODY", "A valid JSON object is required.", origin);
    }

    const token = typeof body.token === "string" ? body.token : "";
    const tokenHash = await hashToken(token);
    if (!tokenHash) return fail(404, "LINK_NOT_AVAILABLE", "This invitation link is no longer available.", origin);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (body.action === "info") {
      const { data: link, error } = await admin.from("collection_guest_links")
        .select("id,collection_id,owner_id,expires_at,max_contributions,contribution_count")
        .eq("token_hash", tokenHash).is("revoked_at", null)
        .gt("expires_at", new Date().toISOString()).maybeSingle();
      if (error) throw error;
      if (!link || link.contribution_count >= link.max_contributions) {
        return fail(404, "LINK_NOT_AVAILABLE", "This invitation link is no longer available.", origin);
      }
      const [{ data: collection, error: collectionError }, { data: profile, error: profileError }] = await Promise.all([
        admin.from("collections").select("title,description").eq("id", link.collection_id).maybeSingle(),
        admin.from("profiles").select("display_name").eq("id", link.owner_id).maybeSingle(),
      ]);
      if (collectionError) throw collectionError;
      if (profileError) throw profileError;
      if (!collection) return fail(404, "LINK_NOT_AVAILABLE", "This invitation link is no longer available.", origin);
      return response(200, {
        collectionTitle: collection.title,
        description: collection.description,
        ownerName: profile?.display_name || "A Lumie member",
        expiresAt: new Date(link.expires_at).toISOString(),
        remaining: link.max_contributions - link.contribution_count,
      }, origin);
    }

    if (body.action === "submit") {
      const guestName = typeof body.guestName === "string" ? body.guestName.trim() : "";
      const guestEmail = typeof body.guestEmail === "string" ? body.guestEmail.trim() : "";
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!guestName || guestName.length > 80 || !message || message.length > 5000) {
        return fail(400, "INVALID_CONTRIBUTION", "Add your name and a note before sending.", origin);
      }
      if (guestEmail && (guestEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))) {
        return fail(400, "INVALID_EMAIL", "Check the email address and try again.", origin);
      }
      const { data, error } = await admin.rpc("lumie_submit_collection_contribution", {
        p_token_hash: tokenHash,
        p_guest_name: guestName,
        p_guest_email: guestEmail || null,
        p_message: message,
      });
      if (error) throw error;
      if (data?.error === "LINK_NOT_AVAILABLE") return fail(404, "LINK_NOT_AVAILABLE", "This invitation link is no longer available.", origin);
      if (data?.error === "INVALID_EMAIL") return fail(400, "INVALID_EMAIL", "Check the email address and try again.", origin);
      if (data?.error === "INVALID_CONTRIBUTION") return fail(400, "INVALID_CONTRIBUTION", "Add your name and a note before sending.", origin);
      return response(201, data, origin);
    }

    return fail(400, "INVALID_ACTION", "Choose a valid contribution action.", origin);
  } catch (error) {
    console.error("Lumie guest contribution request failed", error);
    return fail(500, "INTERNAL_ERROR", "Something went wrong. Please try again.", origin);
  }
});
