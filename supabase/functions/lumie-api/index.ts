import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "lumie-private";
const MAX_BODY_BYTES = 1_048_576;
const MAX_ASSET_BYTES = 10 * 1024 * 1024;
const ASSET_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const FORMATS = new Set(["letter", "postcard", "photo-card", "collage", "memory"]);
const ALLOWED_ORIGINS = new Set([
  "https://www.lumiepost.com",
  "https://lumiepost.com",
  "https://lumie-six-phi.vercel.app",
  "http://localhost:5173",
]);

type Json = Record<string, unknown>;
type CreationRow = {
  id: string; title: string; format: string; document_json: unknown;
  revision: number; status: "draft" | "archived"; created_at: string; updated_at: string;
};

function response(status: number, body?: unknown, origin = "") {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...(origin ? {
        "access-control-allow-origin": origin,
        "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
        "access-control-allow-methods": "GET, POST, PATCH, DELETE, PUT, OPTIONS",
        "access-control-max-age": "86400",
        "vary": "Origin",
      } : {}),
    },
  });
}
function allowedOrigin(origin: string | null) {
  if (!origin) return "";
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  try {
    const host = new URL(origin).hostname;
    return host.startsWith("lumie-") && host.endsWith(".vercel.app") ? origin : "";
  } catch { return ""; }
}
function parseJson(raw: string): Json | null {
  if (!raw || new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value as Json : null;
  } catch { return null; }
}
function parseFutureDelivery(value: unknown): string | null | false {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp <= Date.now() || timestamp > Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) return false;
  return new Date(timestamp).toISOString();
}
function validDocument(document: unknown, format: unknown) {
  if (!document || typeof document !== "object" || Array.isArray(document)) return false;
  const d = document as Record<string, unknown>;
  if (d.schemaVersion !== 2 || typeof d.id !== "string" || !d.id ||
      typeof d.name !== "string" || !d.name.trim() || d.name.length > 80 ||
      d.format !== format || typeof d.background !== "string" ||
      !Array.isArray(d.elements) || d.elements.length > 100 ||
      typeof d.updatedAt !== "string" || !Number.isFinite(Date.parse(d.updatedAt))) return false;
  const ids = new Set<string>();
  for (const item of d.elements) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const el = item as Record<string, unknown>;
    if (typeof el.id !== "string" || !el.id || ids.has(el.id) ||
        !["text", "stamp", "decoration", "photo"].includes(String(el.kind)) ||
        (typeof el.image === "string" && el.image.startsWith("data:"))) return false;
    ids.add(el.id);
    for (const key of ["x", "y", "width"]) if (typeof el[key] !== "number" || !Number.isFinite(el[key])) return false;
    if (el.imageAssetId !== undefined && (el.kind !== "photo" || typeof el.imageAssetId !== "string" || !/^[0-9a-f-]{36}$/i.test(el.imageAssetId))) return false;
  }
  return new TextEncoder().encode(JSON.stringify(d)).byteLength <= MAX_BODY_BYTES;
}
function mapCreation(row: CreationRow) {
  return {
    id: row.id, title: row.title, format: row.format, document: row.document_json,
    revision: row.revision, status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}
function encodeCursor(row: CreationRow) {
  return btoa(JSON.stringify({ updatedAt: row.updated_at, id: row.id })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeCursor(value: string | null) {
  if (!value) return null;
  if (value.length > 512) return undefined;
  try {
    const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(raw);
    if (typeof parsed.updatedAt !== "string" || !Number.isFinite(Date.parse(parsed.updatedAt)) || typeof parsed.id !== "string") return undefined;
    return parsed as { updatedAt: string; id: string };
  } catch { return undefined; }
}
function fail(status: number, code: string, message: string, origin: string) {
  return response(status, { code, message }, origin);
}
Deno.serve(async (req: Request) => {
  const origin = allowedOrigin(req.headers.get("origin"));
  if (req.method === "OPTIONS") return response(204, undefined, origin || "https://www.lumiepost.com");
  if (req.headers.get("origin") && !origin) return fail(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed.", "");
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token || token === authHeader) return fail(401, "UNAUTHORIZED", "Sign in to continue.", origin);
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) return fail(503, "SERVICE_NOT_CONFIGURED", "The service is not configured.", origin);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return fail(401, "UNAUTHORIZED", "Your session has expired. Sign in again.", origin);
  const user = authData.user;
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/lumie-api/, "") || "/";
  const method = req.method.toUpperCase();
  const creationMatch = path.match(/^\/v1\/creations\/([0-9a-f-]{36})$/i);
  const revisionsMatch = path.match(/^\/v1\/creations\/([0-9a-f-]{36})\/revisions$/i);
  const assetMatch = path.match(/^\/v1\/assets\/([0-9a-f-]{36})\/(complete|download-url)$/i);
  const assetUploadMatch = path.match(/^\/v1\/assets\/([0-9a-f-]{36})\/upload$/i);
  const threadMatch = path.match(/^\/v1\/threads\/([0-9a-f-]{36})$/i);
  const replyMatch = path.match(/^\/v1\/threads\/([0-9a-f-]{36})\/replies$/i);

  try {
    if (method === "GET" && path === "/v1/me") {
      const { data, error } = await userClient.from("profiles")
        .select("id,display_name,avatar_asset_id,locale,time_zone,created_at").eq("id", user.id).single();
      if (error) throw error;
      return response(200, {
        id: data.id, displayName: data.display_name, avatarAssetId: data.avatar_asset_id,
        locale: data.locale, timeZone: data.time_zone, createdAt: new Date(data.created_at).toISOString(),
      }, origin);
    }

    if (method === "GET" && path === "/v1/creations") {
      const status = url.searchParams.get("status") || "draft";
      if (!["draft", "archived"].includes(status)) return fail(400, "INVALID_STATUS", "The requested status is invalid.", origin);
      const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
      const cursor = decodeCursor(url.searchParams.get("cursor"));
      if (cursor === undefined) return fail(400, "INVALID_CURSOR", "The page cursor is invalid.", origin);
      let query = userClient.from("creations").select("id,title,format,document_json,revision,status,created_at,updated_at")
        .eq("owner_id", user.id).eq("status", status)
        .order("updated_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1);
      if (cursor) query = query.or(`updated_at.lt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.lt.${cursor.id})`);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data || []) as CreationRow[];
      const hasMore = rows.length > limit;
      const page = rows.slice(0, limit);
      return response(200, { items: page.map(mapCreation), nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null }, origin);
    }

    if (method === "POST" && path === "/v1/creations") {
      const body = parseJson(await req.text());
      if (!body) return fail(400, "INVALID_BODY", "A valid JSON object is required.", origin);
      const { title, document } = body;
      const format = (document as Json | null)?.format;
      if (typeof title !== "string" || !title.trim() || title.trim().length > 80 ||
          typeof format !== "string" || !FORMATS.has(format) || !validDocument(document, format)) {
        return fail(400, "INVALID_CREATION", "The creation details are invalid.", origin);
      }
      const { data, error } = await userClient.rpc("lumie_create_creation", {
        p_title: title.trim(), p_format: format, p_document: document,
      });
      if (error) throw error;
      return response(201, mapCreation(data as CreationRow), origin);
    }

    if (method === "GET" && creationMatch) {
      const { data, error } = await userClient.from("creations")
        .select("id,title,format,document_json,revision,status,created_at,updated_at")
        .eq("id", creationMatch[1]).eq("status", "draft").maybeSingle();
      if (error) throw error;
      return data ? response(200, mapCreation(data as CreationRow), origin)
        : fail(404, "NOT_FOUND", "Creation not found.", origin);
    }

    if (method === "PATCH" && creationMatch) {
      const body = parseJson(await req.text());
      if (!body) return fail(400, "INVALID_BODY", "A valid JSON object is required.", origin);
      const { title, document, expectedRevision } = body;
      const format = (document as Json | null)?.format;
      if (typeof title !== "string" || !title.trim() || title.trim().length > 80 ||
          !Number.isInteger(expectedRevision) || Number(expectedRevision) < 1 ||
          typeof format !== "string" || !FORMATS.has(format) || !validDocument(document, format)) {
        return fail(400, "INVALID_CREATION", "The creation details are invalid.", origin);
      }
      const { data, error } = await userClient.rpc("lumie_update_creation", {
        p_creation_id: creationMatch[1], p_title: title.trim(), p_format: format,
        p_document: document, p_expected_revision: expectedRevision,
      });
      if (error) throw error;
      if (!data) return fail(404, "NOT_FOUND", "Creation not found.", origin);
      if ((data as Json).conflict) return fail(409, "REVISION_CONFLICT", "This creation changed elsewhere. Reload the latest version before saving.", origin);
      return response(200, mapCreation(data as CreationRow), origin);
    }

    if (method === "DELETE" && creationMatch) {
      const { data, error } = await userClient.rpc("lumie_archive_creation", {
        p_creation_id: creationMatch[1],
      });
      if (error) throw error;
      return data ? response(204, undefined, origin) : fail(404, "NOT_FOUND", "Creation not found.", origin);
    }

    if (method === "GET" && revisionsMatch) {
      const { data, error } = await userClient.from("creation_revisions")
        .select("id,revision,document_json,created_at").eq("creation_id", revisionsMatch[1])
        .order("revision", { ascending: false });
      if (error) throw error;
      return response(200, (data || []).map((row: Json) => ({
        id: row.id, revision: row.revision, document: row.document_json,
        createdAt: new Date(String(row.created_at)).toISOString(),
      })), origin);
    }

    if (method === "POST" && path === "/v1/assets/upload-intents") {
      const body = parseJson(await req.text());
      if (!body) return fail(400, "INVALID_BODY", "A valid JSON object is required.", origin);
      const { fileName, contentType, sizeBytes } = body;
      if (typeof fileName !== "string" || !fileName.trim() || fileName.length > 180 ||
          typeof contentType !== "string" || !ASSET_TYPES.has(contentType) ||
          !Number.isInteger(sizeBytes) || Number(sizeBytes) < 1 || Number(sizeBytes) > MAX_ASSET_BYTES) {
        return fail(Number(sizeBytes) > MAX_ASSET_BYTES ? 413 : 400, "INVALID_UPLOAD", "Choose a JPEG, PNG, WebP or AVIF image no larger than 10 MB.", origin);
      }
      const assetId = crypto.randomUUID();
      const objectKey = `${user.id}/${assetId}`;
      const { error: insertError } = await userClient.from("assets").insert({
        id: assetId, owner_id: user.id, object_key: objectKey,
        original_file_name: Array.from(fileName.trim(), (character) => { const code = character.charCodeAt(0); return code < 32 || code === 127 || character === "/" || character === "\\\\" ? "_" : character; }).join(""),
        content_type: contentType, size_bytes: sizeBytes,
      });
      if (insertError) throw insertError;
      const uploadUrl = `${SUPABASE_URL}/functions/v1/lumie-api/v1/assets/${assetId}/upload`;
      return response(201, {
        assetId, uploadUrl, expiresAt: new Date(Date.now() + 300000).toISOString(),
        requiredHeaders: { "Content-Type": contentType },
      }, origin);
    }

    if (method === "PUT" && assetUploadMatch) {
      const contentType = req.headers.get("content-type") || "";
      const contentLength = Number(req.headers.get("content-length") || 0);
      if (!ASSET_TYPES.has(contentType) || contentLength < 1 || contentLength > MAX_ASSET_BYTES) {
        return fail(contentLength > MAX_ASSET_BYTES ? 413 : 400, "INVALID_UPLOAD", "Choose a JPEG, PNG, WebP or AVIF image no larger than 10 MB.", origin);
      }
      const { data: asset, error } = await userClient.from("assets")
        .select("id,object_key,content_type,size_bytes,status").eq("id", assetUploadMatch[1]).eq("owner_id", user.id).maybeSingle();
      if (error) throw error;
      if (!asset || asset.status !== "pending") return fail(404, "NOT_FOUND", "Upload not found or already completed.", origin);
      if (asset.content_type !== contentType || Number(asset.size_bytes) !== contentLength) {
        return fail(422, "UPLOAD_MISMATCH", "The uploaded file does not match its authorised details.", origin);
      }
      const bytes = await req.arrayBuffer();
      if (bytes.byteLength !== contentLength || bytes.byteLength > MAX_ASSET_BYTES) {
        return fail(413, "INVALID_UPLOAD", "The uploaded file size is invalid.", origin);
      }
      const { error: uploadError } = await admin.storage.from(BUCKET).upload(
        asset.object_key, new Blob([bytes], { type: contentType }),
        { contentType, upsert: false, cacheControl: "3600" },
      );
      if (uploadError) throw uploadError;
      return response(200, { assetId: asset.id, uploaded: true }, origin);
    }

    if (method === "POST" && assetMatch?.[2] === "complete") {
      const { data: asset, error } = await admin.from("assets").select("id,owner_id,object_key,content_type,size_bytes,status")
        .eq("id", assetMatch[1]).eq("owner_id", user.id).maybeSingle();
      if (error) throw error;
      if (!asset || !["pending", "ready"].includes(asset.status)) return fail(404, "NOT_FOUND", "Asset not found.", origin);
      if (asset.status === "ready") return response(200, { assetId: asset.id, status: "ready" }, origin);
      const { data: info, error: infoError } = await admin.storage.from(BUCKET).info(asset.object_key);
      if (infoError || !info) return fail(409, "UPLOAD_INCOMPLETE", "The image has not finished uploading.", origin);
      const actualSize = Number(info.metadata?.size);
      const actualType = String(info.metadata?.mimetype || info.metadata?.contentType || "");
      if (actualSize !== Number(asset.size_bytes) || actualType !== asset.content_type) {
        await admin.storage.from(BUCKET).remove([asset.object_key]);
        await admin.from("assets").update({ status: "rejected", deleted_at: new Date().toISOString() }).eq("id", asset.id).eq("owner_id", user.id);
        return fail(422, "UPLOAD_REJECTED", "Uploaded image details do not match the authorised file.", origin);
      }
      const { error: updateError } = await admin.from("assets").update({ status: "ready" })
        .eq("id", asset.id).eq("owner_id", user.id).eq("status", "pending");
      if (updateError) throw updateError;
      return response(200, { assetId: asset.id, status: "ready" }, origin);
    }

    if (method === "GET" && assetMatch?.[2] === "download-url") {
      const { data: asset, error } = await userClient.from("assets").select("object_key")
        .eq("id", assetMatch[1]).eq("status", "ready").maybeSingle();
      if (error) throw error;
      if (!asset) return fail(404, "NOT_FOUND", "Asset not found.", origin);
      const { data, error: signedError } = await userClient.storage.from(BUCKET).createSignedUrl(asset.object_key, 300);
      if (signedError || !data?.signedUrl) throw signedError || new Error("Could not create a download URL.");
      return response(200, { assetId: assetMatch[1], url: data.signedUrl, expiresAt: new Date(Date.now() + 300000).toISOString() }, origin);
    }

    if (method === "POST" && path === "/v1/invitations") {
      const body = parseJson(await req.text());
      if (!body) return fail(400, "INVALID_BODY", "A valid JSON object is required.", origin);
      const recipientEmail = typeof body.recipientEmail === "string" ? body.recipientEmail.trim().toLowerCase() : "";
      const creationId = typeof body.creationId === "string" ? body.creationId : "";
      const availableAt = parseFutureDelivery(body.availableAt);
      if (availableAt === false) return fail(400, "INVALID_DELIVERY_TIME", "Choose a future opening date within the next five years.", origin);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail) || !/^[0-9a-f-]{36}$/i.test(creationId)) {
        return fail(400, "INVALID_INVITATION", "Choose a recipient email and a saved creation.", origin);
      }
      if (user.email && user.email.toLowerCase() === recipientEmail) {
        return fail(400, "SELF_SEND", "Choose someone else to receive this letter.", origin);
      }
      const inviteWindow = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [recipientInviteCount, senderInviteCount] = await Promise.all([
        admin.from("correspondence_invitations").select("id", { count: "exact", head: true })
          .eq("sender_id", user.id).eq("recipient_email", recipientEmail).gte("created_at", inviteWindow),
        admin.from("correspondence_invitations").select("id", { count: "exact", head: true })
          .eq("sender_id", user.id).gte("created_at", inviteWindow),
      ]);
      if (recipientInviteCount.error) throw recipientInviteCount.error;
      if (senderInviteCount.error) throw senderInviteCount.error;
      if ((recipientInviteCount.count || 0) >= 3 || (senderInviteCount.count || 0) >= 15) {
        return fail(429, "INVITATION_RATE_LIMIT", "You have reached the invitation limit for today. Try again later.", origin);
      }

      const { data: existingRecipient, error: recipientError } = await admin.from("profiles")
        .select("id").eq("email", recipientEmail).maybeSingle();
      if (recipientError) throw recipientError;
      if (existingRecipient) return fail(409, "RECIPIENT_ALREADY_REGISTERED", "This person already has a Lumie account. Send the letter directly.", origin);

      const { data: creation, error: creationError } = await admin.from("creations")
        .select("id,title,format,document_json,revision,status")
        .eq("id", creationId).eq("owner_id", user.id).eq("status", "draft").maybeSingle();
      if (creationError) throw creationError;
      if (!creation) return fail(404, "CREATION_NOT_FOUND", "That saved creation could not be found.", origin);

      const document = creation.document_json as Json;
      const elements = Array.isArray(document.elements) ? document.elements as Json[] : [];
      const assetIds = [...new Set(elements
        .filter((element) => element && typeof element === "object" && typeof element.imageAssetId === "string")
        .map((element) => String(element.imageAssetId)))];
      for (const assetId of assetIds) {
        const { data: asset, error: assetError } = await admin.from("assets")
          .select("id").eq("id", assetId).eq("owner_id", user.id).eq("status", "ready").maybeSingle();
        if (assetError) throw assetError;
        if (!asset) return fail(409, "ASSET_UNAVAILABLE", "One or more photos are no longer available. Reopen the creation and try again.", origin);
      }

      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
      const tokenHash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
      const expiryBase = availableAt ? new Date(availableAt).getTime() + 14 * 24 * 60 * 60 * 1000 : Date.now() + 14 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Math.max(Date.now() + 14 * 24 * 60 * 60 * 1000, expiryBase)).toISOString();
      const snapshot = { title: creation.title, format: creation.format, document: creation.document_json };
      const { error: insertError } = await admin.from("correspondence_invitations").insert({
        sender_id: user.id,
        recipient_email: recipientEmail,
        token_hash: tokenHash,
        creation_id: creation.id,
        creation_revision: creation.revision,
        snapshot,
        expires_at: expiresAt,
        available_at: availableAt || new Date().toISOString(),
      });
      if (insertError) throw insertError;
      return response(201, {
        inviteUrl: `https://www.lumiepost.com/invite/${token}`,
        expiresAt,
        availableAt: availableAt || new Date().toISOString(),
      }, origin);
    }

    if (method === "POST" && path === "/v1/invitations/accept") {
      const body = parseJson(await req.text());
      const token = typeof body?.token === "string" ? body.token : "";
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
        return fail(404, "INVITATION_NOT_FOUND", "This invitation link is not valid.", origin);
      }
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
      const tokenHash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
      const { data, error } = await admin.rpc("lumie_accept_correspondence_invitation", {
        p_token_hash: tokenHash,
        p_recipient_id: user.id,
      });
      if (error) throw error;
      const result = data as Json;
      if (result.error === "INVITATION_NOT_FOUND") return fail(404, "INVITATION_NOT_FOUND", "This invitation link is not valid.", origin);
      if (result.error === "INVITATION_EMAIL_MISMATCH") return fail(403, "INVITATION_EMAIL_MISMATCH", "Sign in with the email address this invitation was sent to.", origin);
      if (result.error === "INVITATION_EXPIRED") return fail(410, "INVITATION_EXPIRED", "This invitation has expired.", origin);
      if (result.error === "INVITATION_ALREADY_USED") return fail(409, "INVITATION_ALREADY_USED", "This invitation has already been accepted by someone else.", origin);
      if (result.error === "INVITATION_NOT_AVAILABLE") return fail(409, "INVITATION_NOT_AVAILABLE", "This invitation is no longer available.", origin);
      if (result.error === "ASSET_UNAVAILABLE") return fail(409, "ASSET_UNAVAILABLE", "One or more photos in this letter are no longer available.", origin);
      return response(200, result, origin);
    }

    if (method === "POST" && path === "/v1/correspondence") {
      const body = parseJson(await req.text());
      if (!body) return fail(400, "INVALID_BODY", "A valid JSON object is required.", origin);
      const recipientEmail = typeof body.recipientEmail === "string" ? body.recipientEmail.trim().toLowerCase() : "";
      const creationId = typeof body.creationId === "string" ? body.creationId : "";
      const availableAt = parseFutureDelivery(body.availableAt);
      if (availableAt === false) return fail(400, "INVALID_DELIVERY_TIME", "Choose a future opening date within the next five years.", origin);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail) || !/^[0-9a-f-]{36}$/i.test(creationId)) {
        return fail(400, "INVALID_CORRESPONDENCE", "Choose a recipient email and a saved creation.", origin);
      }
      const { data, error } = await admin.rpc("lumie_send_correspondence_scheduled", {
        p_sender_id: user.id, p_recipient_email: recipientEmail, p_creation_id: creationId, p_available_at: availableAt,
      });
      if (error) throw error;
      const result = data as Json;
      if (result.error === "RECIPIENT_NOT_FOUND") return fail(404, "RECIPIENT_NOT_FOUND", "No Lumie account is registered with that email address yet.", origin);
      if (result.error === "SELF_SEND") return fail(400, "SELF_SEND", "Choose someone else to receive this letter.", origin);
      if (result.error === "CREATION_NOT_FOUND") return fail(404, "CREATION_NOT_FOUND", "That saved creation could not be found.", origin);
      if (result.error === "ASSET_UNAVAILABLE") return fail(409, "ASSET_UNAVAILABLE", "One or more photos are no longer available. Reopen the creation and try again.", origin);
      if (result.error === "INVALID_DELIVERY_TIME") return fail(400, "INVALID_DELIVERY_TIME", "Choose a future opening date within the next five years.", origin);
      return response(201, result, origin);
    }

    if (method === "GET" && path === "/v1/open-when") {
      const { data: memberships, error: membershipError } = await userClient.from("correspondence_participants")
        .select("thread_id").eq("profile_id", user.id);
      if (membershipError) throw membershipError;
      const threadIds = (memberships || []).map((item: Json) => String(item.thread_id));
      if (!threadIds.length) return response(200, { items: [] }, origin);
      const [{ data: messages, error: messageError }, { data: threads, error: threadError }, { data: participants, error: participantError }] = await Promise.all([
        admin.from("correspondence_messages")
          .select("id,thread_id,sender_id,snapshot,created_at,available_at")
          .in("thread_id", threadIds).gt("available_at", new Date().toISOString())
          .order("available_at", { ascending: true }),
        admin.from("correspondence_threads").select("id,subject").in("id", threadIds),
        admin.from("correspondence_participants").select("thread_id,profile_id").in("thread_id", threadIds),
      ]);
      if (messageError) throw messageError;
      if (threadError) throw threadError;
      if (participantError) throw participantError;
      const otherIds = [...new Set((participants || []).filter((p: Json) => p.profile_id !== user.id).map((p: Json) => String(p.profile_id)))];
      const { data: profiles, error: profileError } = await admin.from("profiles").select("id,display_name").in("id", otherIds);
      if (profileError) throw profileError;
      const names = new Map((profiles || []).map((p: Json) => [String(p.id), p.display_name || "Lumie member"]));
      const correspondentByThread = new Map<string,string>();
      for (const participant of participants || []) if (participant.profile_id !== user.id) {
        correspondentByThread.set(String(participant.thread_id), String(names.get(String(participant.profile_id)) || "Lumie member"));
      }
      const subjects = new Map((threads || []).map((thread: Json) => [String(thread.id), String(thread.subject)]));
      const items = (messages || []).map((message: Json) => {
        const isLocked = message.sender_id !== user.id;
        const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot as Json : {};
        const title = !isLocked && typeof snapshot.title === "string" ? snapshot.title : null;
        return {
          id: message.id,
          threadId: message.thread_id,
          subject: isLocked ? "A letter is waiting" : title || subjects.get(String(message.thread_id)) || "A letter for later",
          title,
          correspondentName: correspondentByThread.get(String(message.thread_id)) || "Lumie member",
          direction: isLocked ? "received" : "sent",
          isLocked,
          availableAt: new Date(String(message.available_at)).toISOString(),
        };
      });
      return response(200, { items }, origin);
    }

    if (method === "GET" && path === "/v1/inbox") {
      const { data: memberships, error } = await userClient.from("correspondence_participants")
        .select("thread_id,role").eq("profile_id", user.id);
      if (error) throw error;
      const ids = (memberships || []).map((item: Json) => String(item.thread_id));
      if (!ids.length) return response(200, { items: [] }, origin);
      const roles = new Map((memberships || []).map((item: Json) => [String(item.thread_id), item.role]));
      const { data: threads, error: threadError } = await admin.from("correspondence_threads")
        .select("id,subject,created_at,last_message_at").in("id", ids)
        .order("last_message_at", { ascending: false }).limit(100);
      if (threadError) throw threadError;
      const threadIds = (threads || []).map((item: Json) => String(item.id));
      const [{ data: participants, error: participantError }, { data: messages, error: messageError }] = await Promise.all([
        admin.from("correspondence_participants").select("thread_id,profile_id").in("thread_id", threadIds),
        admin.from("correspondence_messages").select("thread_id,sender_id,snapshot,created_at,available_at").in("thread_id", threadIds).order("created_at", { ascending: false }),
      ]);
      if (participantError) throw participantError;
      if (messageError) throw messageError;
      const otherIds = [...new Set((participants || []).filter((p: Json) => p.profile_id !== user.id).map((p: Json) => String(p.profile_id)))];
      const { data: profiles, error: profileError } = await admin.from("profiles").select("id,display_name").in("id", otherIds);
      if (profileError) throw profileError;
      const names = new Map((profiles || []).map((p: Json) => [String(p.id), p.display_name || "Lumie member"]));
      const correspondentByThread = new Map<string,string>();
      for (const participant of participants || []) if (participant.profile_id !== user.id) correspondentByThread.set(String(participant.thread_id), String(names.get(String(participant.profile_id)) || "Lumie member"));
      const latest = new Map<string, Json>();
      const visibleTitleByThread = new Map<string, string>();
      for (const message of messages || []) {
        const threadId = String(message.thread_id);
        if (!latest.has(threadId)) latest.set(threadId, message as Json);
        const availableAt = message.available_at ? new Date(String(message.available_at)) : null;
        const visibleToUser = message.sender_id === user.id || Boolean(availableAt && availableAt.getTime() <= Date.now());
        const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot as Json : {};
        if (visibleToUser && typeof snapshot.title === "string" && !visibleTitleByThread.has(threadId)) {
          visibleTitleByThread.set(threadId, snapshot.title);
        }
      }
      const items = (threads || []).map((thread: Json) => {
        const last = latest.get(String(thread.id));
        const availableAt = last?.available_at ? new Date(String(last.available_at)) : null;
        const isLocked = Boolean(last && last.sender_id !== user.id && availableAt && availableAt.getTime() > Date.now());
        const latestTitle = !isLocked && typeof last?.snapshot === "object" && last.snapshot
          ? (last.snapshot as Json).title || null
          : null;
        return {
          id: thread.id,
          subject: isLocked ? "A letter is waiting" : latestTitle || visibleTitleByThread.get(String(thread.id)) || thread.subject,
          role: roles.get(String(thread.id)) || "recipient",
          correspondentName: correspondentByThread.get(String(thread.id)) || "Lumie member",
          latestTitle,
          isLocked,
          unlockAt: isLocked ? availableAt?.toISOString() : null,
          createdAt: new Date(String(thread.created_at)).toISOString(),
          lastMessageAt: new Date(String(last?.created_at || thread.last_message_at)).toISOString(),
        };
      });
      return response(200, { items }, origin);
    }

    if (method === "GET" && threadMatch) {
      const { data: participant, error: memberError } = await userClient.from("correspondence_participants")
        .select("role").eq("thread_id", threadMatch[1]).eq("profile_id", user.id).maybeSingle();
      if (memberError) throw memberError;
      if (!participant) return fail(404, "NOT_FOUND", "Correspondence not found.", origin);
      const { data: thread, error: threadError } = await admin.from("correspondence_threads")
        .select("id,subject").eq("id", threadMatch[1]).maybeSingle();
      if (threadError) throw threadError;
      if (!thread) return fail(404, "NOT_FOUND", "Correspondence not found.", origin);

      const [{ data: messages, error: messageError }, { data: lockedMessages, error: lockedError }] = await Promise.all([
        userClient.from("correspondence_messages")
          .select("id,sender_id,snapshot,created_at,available_at").eq("thread_id", threadMatch[1])
          .order("created_at", { ascending: true }).order("id", { ascending: true }),
        admin.from("correspondence_messages").select("available_at")
          .eq("thread_id", threadMatch[1]).neq("sender_id", user.id)
          .gt("available_at", new Date().toISOString()).order("available_at", { ascending: true }).limit(1),
      ]);
      if (messageError) throw messageError;
      if (lockedError) throw lockedError;
      const senderIds = [...new Set((messages || []).map((m: Json) => String(m.sender_id)))];
      const { data: profiles, error: profileError } = await admin.from("profiles")
        .select("id,display_name").in("id", senderIds);
      if (profileError) throw profileError;
      const names = new Map((profiles || []).map((p: Json) => [String(p.id), p.display_name || "Lumie member"]));
      const lastVisible = messages?.length ? messages[messages.length - 1] as Json : null;
      const lockedUntil = lockedMessages?.[0]?.available_at ? new Date(String(lockedMessages[0].available_at)).toISOString() : null;
      const visibleTitle = (messages || []).map((message: Json) => {
        const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot as Json : {};
        return typeof snapshot.title === "string" ? snapshot.title : null;
      }).find(Boolean);
      const latestTitle = lastVisible && typeof lastVisible.snapshot === "object" && lastVisible.snapshot
        ? (lastVisible.snapshot as Json).title
        : null;
      const subject = latestTitle || visibleTitle || (lockedUntil && !messages?.length ? "A letter is waiting" : thread.subject);
      return response(200, {
        id: thread.id, subject, lockedUntil,
        messages: (messages || []).map((message: Json) => ({
          id: message.id, senderId: message.sender_id,
          senderName: names.get(String(message.sender_id)) || "Lumie member",
          snapshot: message.snapshot, sentAt: new Date(String(message.created_at)).toISOString(),
        })),
      }, origin);
    }

    if (method === "POST" && replyMatch) {
      const body = parseJson(await req.text());
      if (!body || !body.snapshot || typeof body.snapshot !== "object" || Array.isArray(body.snapshot)) {
        return fail(400, "INVALID_REPLY", "A letter or message is required.", origin);
      }
      const { data, error } = await userClient.rpc("lumie_reply_to_correspondence", {
        p_thread_id: replyMatch[1], p_snapshot: body.snapshot,
      });
      if (error) throw error;
      if (!data) return fail(404, "NOT_FOUND", "Correspondence not found.", origin);
      return response(201, { id: data.id, sentAt: new Date(data.sent_at).toISOString() }, origin);
    }

    return fail(404, "NOT_FOUND", "The requested endpoint does not exist.", origin);
  } catch (error) {
    console.error("Lumie API request failed", error);
    const known = error as { code?: string; message?: string };
    if (known.code === "23505") return fail(409, "CONFLICT", "This record already exists.", origin);
    if (known.code === "42501" || known.code === "PGRST301") return fail(403, "FORBIDDEN", "You do not have permission to perform this action.", origin);
    return fail(500, "INTERNAL_ERROR", "Something went wrong. Please try again.", origin);
  }
});
