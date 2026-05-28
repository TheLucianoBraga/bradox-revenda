import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BradoxDatabase, Json } from "../integrations/supabase/types";

type ServerEnv = Record<string, string | undefined>;
type AdminClient = SupabaseClient<BradoxDatabase, "bradox_revenda">;
type AdminDb = { from: (table: string) => any };
type WhatsappSession = BradoxDatabase["bradox_revenda"]["Tables"]["whatsapp_sessions"]["Row"];
type Profile = BradoxDatabase["bradox_revenda"]["Tables"]["profiles"]["Row"];

type WahaConfig = {
  apiBaseUrl: string;
  apiKey: string;
  namespace: string;
  webhookUrl?: string;
  webhookSecret?: string;
};

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

export async function handleWahaRequest(request: Request, env: unknown): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/bradox/whatsapp")) return null;

  try {
    if (url.pathname === "/api/bradox/whatsapp/webhook" && request.method === "POST") {
      return await handleWebhook(request, env);
    }
    if (url.pathname === "/api/bradox/whatsapp/session/start" && request.method === "POST") {
      return await handleStartSession(request, env);
    }
    if (url.pathname === "/api/bradox/whatsapp/session/status" && request.method === "POST") {
      return await handleSessionStatus(request, env);
    }
    return json({ error: "Rota WhatsApp nao encontrada." }, 404);
  } catch (error) {
    console.error(error);
    const status = error instanceof HttpError ? error.status : 500;
    return json({ error: error instanceof Error ? error.message : "Falha no gateway WhatsApp." }, status);
  }
}

async function handleStartSession(request: Request, env: unknown) {
  const { sessionId } = await readJson<{ sessionId?: string }>(request);
  if (!sessionId) return json({ error: "Sessao obrigatoria." }, 400);

  const serverEnv = resolveEnv(env);
  const admin = createAdminClient(serverEnv);
  const profile = await authenticateRequest(admin, request);
  const session = await getAuthorizedSession(admin, profile, sessionId);
  const config = await getWahaConfig(admin, serverEnv);

  assertNamespaced(session.external_session_name, config.namespace);
  await ensureRemoteSession(config, session.external_session_name);
  const remote = await startRemoteSession(config, session.external_session_name);
  const qr = await fetchRemoteQr(config, session.external_session_name);
  const nextStatus = qr ? "qr" : mapWahaStatus(remote.status);
  const updated = await updateSessionStatus(admin, session.id, nextStatus, remote.payload, qr ? null : remote.phoneNumber);

  return json({ session: updated, remote: remote.payload, qr });
}

async function handleSessionStatus(request: Request, env: unknown) {
  const { sessionId } = await readJson<{ sessionId?: string }>(request);
  if (!sessionId) return json({ error: "Sessao obrigatoria." }, 400);

  const serverEnv = resolveEnv(env);
  const admin = createAdminClient(serverEnv);
  const profile = await authenticateRequest(admin, request);
  const session = await getAuthorizedSession(admin, profile, sessionId);
  const config = await getWahaConfig(admin, serverEnv);

  assertNamespaced(session.external_session_name, config.namespace);
  const remote = await getRemoteSession(config, session.external_session_name);
  const qr = mapWahaStatus(remote.status) === "connected" ? null : await fetchRemoteQr(config, session.external_session_name);
  const updated = await updateSessionStatus(admin, session.id, qr ? "qr" : mapWahaStatus(remote.status), remote.payload, remote.phoneNumber);

  return json({ session: updated, remote: remote.payload, qr });
}

async function handleWebhook(request: Request, env: unknown) {
  const serverEnv = resolveEnv(env);
  const admin = createAdminClient(serverEnv);
  const config = await getWahaConfig(admin, serverEnv);
  if (config.webhookSecret && request.headers.get("x-bradox-webhook-secret") !== config.webhookSecret) {
    return json({ error: "Webhook nao autorizado." }, 401);
  }

  const payload = await readJson<Record<string, unknown>>(request);
  const sessionName = extractSessionName(payload);
  const eventType = String(payload.event ?? payload.type ?? payload.eventType ?? "unknown");

  if (!sessionName || !sessionName.startsWith(config.namespace)) {
    await insertWebhookEvent(admin, null, null, sessionName ?? null, eventType, payload, "ignored", "Sessao fora do namespace Bradox.");
    return json({ ok: true, ignored: true });
  }

  const { data: session, error } = await db(admin).from("whatsapp_sessions").select("*").eq("external_session_name", sessionName).maybeSingle();
  if (error) throw error;
  if (!session) {
    await insertWebhookEvent(admin, null, null, sessionName, eventType, payload, "ignored", "Sessao Bradox nao cadastrada.");
    return json({ ok: true, ignored: true });
  }

  await updateSessionStatus(admin, session.id, mapWahaStatus(extractStatus(payload)), payload, extractPhoneNumber(payload));
  await insertWebhookEvent(admin, session.network_id, session.id, sessionName, eventType, payload, "processed", null);
  return json({ ok: true });
}

function resolveEnv(env: unknown): ServerEnv {
  return { ...(typeof process !== "undefined" ? process.env : {}), ...((env && typeof env === "object") ? env as ServerEnv : {}) };
}

function createAdminClient(env: ServerEnv): AdminClient {
  const supabaseUrl = env.VITE_BRADOX_SUPABASE_URL;
  const serviceRoleKey = env.SERVICE_ROLE_KEY || env.BRADOX_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) throw new Error("VITE_BRADOX_SUPABASE_URL nao configurado no servidor.");
  if (!serviceRoleKey) throw new Error("SERVICE_ROLE_KEY nao configurado no servidor.");
  return createClient<BradoxDatabase, "bradox_revenda">(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "bradox_revenda" },
  });
}

async function authenticateRequest(admin: AdminClient, request: Request): Promise<Profile> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new HttpError("Sessao obrigatoria.", 401);

  const { data: userResult, error: userError } = await admin.auth.getUser(token);
  if (userError || !userResult.user) throw new HttpError("Sessao invalida.", 401);

  const { data: profile, error } = await db(admin).from("profiles").select("*").eq("id", userResult.user.id).eq("status", "active").maybeSingle();
  if (error) throw error;
  if (!profile) throw new HttpError("Perfil ativo nao encontrado.", 403);
  if (!["admin", "revenda"].includes(profile.role)) throw new HttpError("Sem permissao para WhatsApp API.", 403);
  return profile as Profile;
}

async function getAuthorizedSession(admin: AdminClient, profile: Profile, sessionId: string): Promise<WhatsappSession> {
  const { data: session, error } = await db(admin).from("whatsapp_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (error) throw error;
  if (!session) throw new HttpError("Sessao WhatsApp nao encontrada.", 404);
  if (profile.role !== "admin" && profile.network_id !== session.network_id) throw new HttpError("Sessao WhatsApp fora da sua rede.", 403);
  return session as WhatsappSession;
}

async function getWahaConfig(admin: AdminClient, env: ServerEnv): Promise<WahaConfig> {
  const { data, error } = await db(admin).from("whatsapp_gateway_settings").select("api_base_url, api_key_secret_ref, session_namespace").eq("provider", "waha_plus").maybeSingle();
  if (error) throw error;
  const apiBaseUrl = env.WAHA_PLUS_API_URL || data?.api_base_url;
  const secretRef = data?.api_key_secret_ref || "WAHA_PLUS_API_KEY";
  const apiKey = env[secretRef] || env.WAHA_PLUS_API_KEY;
  if (!apiBaseUrl) throw new Error("WAHA_PLUS_API_URL nao configurado.");
  if (!apiKey) throw new Error(`${secretRef} nao configurado no servidor.`);
  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
    apiKey,
    namespace: data?.session_namespace || "bradox-revenda_",
    webhookUrl: env.WAHA_PLUS_WEBHOOK_URL,
    webhookSecret: env.WAHA_PLUS_WEBHOOK_SECRET,
  };
}

async function ensureRemoteSession(config: WahaConfig, sessionName: string) {
  const current = await getRemoteSession(config, sessionName).catch(() => null);
  if (current) return current;
  const body: Record<string, unknown> = { name: sessionName, start: false };
  if (config.webhookUrl) body.config = { webhooks: [{ url: config.webhookUrl, events: ["session.status", "message", "message.any"] }] };
  const response = await wahaFetch(config, "/api/sessions", { method: "POST", body: JSON.stringify(body) });
  if (!response.ok && response.status !== 409) throw new Error(`WAHA recusou criar sessao (${response.status}).`);
  return getRemoteSession(config, sessionName).catch(async () => ({ status: "starting", payload: await readResponsePayload(response), phoneNumber: null }));
}

async function startRemoteSession(config: WahaConfig, sessionName: string) {
  const response = await wahaFetch(config, `/api/sessions/${encodeURIComponent(sessionName)}/start`, { method: "POST" });
  if (!response.ok && response.status !== 409) {
    const fallback = await wahaFetch(config, "/api/sessions", { method: "POST", body: JSON.stringify({ name: sessionName, start: true }) });
    if (!fallback.ok && fallback.status !== 409) throw new Error(`WAHA recusou iniciar sessao (${fallback.status}).`);
    return { status: "starting", payload: await readResponsePayload(fallback), phoneNumber: null };
  }
  return getRemoteSession(config, sessionName).catch(async () => ({ status: "starting", payload: await readResponsePayload(response), phoneNumber: null }));
}

async function getRemoteSession(config: WahaConfig, sessionName: string) {
  const response = await wahaFetch(config, `/api/sessions/${encodeURIComponent(sessionName)}`);
  if (!response.ok) throw new Error(`WAHA status ${response.status} ao consultar sessao.`);
  const payload = await readResponsePayload(response);
  return { status: extractStatus(payload), payload, phoneNumber: extractPhoneNumber(payload) };
}

async function fetchRemoteQr(config: WahaConfig, sessionName: string) {
  const paths = [`/api/${encodeURIComponent(sessionName)}/auth/qr?format=image`, `/api/${encodeURIComponent(sessionName)}/auth/qr`, `/api/${encodeURIComponent(sessionName)}/auth/qr?format=raw`];
  for (const path of paths) {
    const response = await wahaFetch(config, path).catch(() => null);
    if (!response?.ok) continue;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.startsWith("image/")) return `data:${contentType};base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
    const payload = await readResponsePayload(response);
    const raw = typeof payload === "string" ? payload : String((payload as Record<string, unknown>).qr ?? (payload as Record<string, unknown>).code ?? "");
    if (raw.startsWith("data:image/") || raw.trim()) return raw.trim();
  }
  return null;
}

function wahaFetch(config: WahaConfig, path: string, init: RequestInit = {}) {
  return fetch(`${config.apiBaseUrl}${path}`, { ...init, headers: { "x-api-key": config.apiKey, "content-type": "application/json", ...(init.headers ?? {}) } });
}

async function updateSessionStatus(admin: AdminClient, sessionId: string, status: WhatsappSession["status"], payload: unknown, phoneNumber?: string | null) {
  const patch: Partial<WhatsappSession> = { status, last_status_payload: toJson(payload), last_seen_at: new Date().toISOString() };
  if (phoneNumber) patch.phone_number = phoneNumber;
  if (status === "connected") patch.connected_at = new Date().toISOString();
  if (["disconnected", "failed", "stopped"].includes(status)) patch.disconnected_at = new Date().toISOString();
  const { data, error } = await db(admin).from("whatsapp_sessions").update(patch).eq("id", sessionId).select("*").single();
  if (error) throw error;
  return data as WhatsappSession;
}

async function insertWebhookEvent(admin: AdminClient, networkId: string | null, sessionId: string | null, externalSessionName: string | null, eventType: string, payload: unknown, processingStatus: "pending" | "processed" | "failed" | "ignored", errorMessage: string | null) {
  const { error } = await db(admin).from("whatsapp_webhook_events").insert({
    network_id: networkId,
    session_id: sessionId,
    external_session_name: externalSessionName,
    event_type: eventType,
    payload: toJson(payload),
    processing_status: processingStatus,
    error_message: errorMessage,
    processed_at: processingStatus === "processed" || processingStatus === "ignored" ? new Date().toISOString() : null,
  });
  if (error) throw error;
}

function db(admin: AdminClient): AdminDb {
  return admin as unknown as AdminDb;
}

async function readJson<T>(request: Request): Promise<T> {
  try { return await request.json() as T; } catch { return {} as T; }
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

function extractSessionName(payload: Record<string, unknown>) {
  return [payload.session, payload.sessionName, payload.name, payload.sessionId].find((value) => typeof value === "string") as string | undefined;
}

function extractStatus(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const data = payload as Record<string, unknown>;
  return data.status ?? data.state ?? data.sessionStatus;
}

function extractPhoneNumber(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const me = data.me && typeof data.me === "object" ? data.me as Record<string, unknown> : null;
  const value = data.phone ?? data.phoneNumber ?? data.number ?? me?.id ?? me?.pushName;
  return typeof value === "string" ? value : null;
}

function mapWahaStatus(status: unknown): WhatsappSession["status"] {
  const normalized = String(status ?? "").toLowerCase();
  if (["working", "connected", "open", "authenticated"].some((part) => normalized.includes(part))) return "connected";
  if (["scan", "qr"].some((part) => normalized.includes(part))) return "qr";
  if (["start", "pair", "init"].some((part) => normalized.includes(part))) return "starting";
  if (["fail", "error"].some((part) => normalized.includes(part))) return "failed";
  if (["stop"].some((part) => normalized.includes(part))) return "stopped";
  if (["disconnect", "close"].some((part) => normalized.includes(part))) return "disconnected";
  return "not_configured";
}

function assertNamespaced(sessionName: string, namespace: string) {
  if (!sessionName.startsWith(namespace)) throw new HttpError("Sessao fora do namespace permitido.", 403);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}