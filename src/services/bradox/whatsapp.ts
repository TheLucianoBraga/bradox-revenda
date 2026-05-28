import { supabase } from "@/integrations/supabase/client";
import type { BradoxDatabase } from "@/integrations/supabase/types";

export type WhatsappSessionRow = BradoxDatabase["bradox_revenda"]["Tables"]["whatsapp_sessions"]["Row"];
export type WhatsappQueueRow = BradoxDatabase["bradox_revenda"]["Tables"]["whatsapp_message_queue"]["Row"];
type RpcResult<T> = Promise<{ data: T | null; error: Error | null }>;
const rpc = supabase.rpc as unknown as <T>(name: string, args?: Record<string, unknown>) => RpcResult<T>;

export async function fetchWhatsappSession(networkId?: string | null): Promise<WhatsappSessionRow | null> {
  if (!networkId) return null;

  const { data, error } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("network_id", networkId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as WhatsappSessionRow | null;
}

export async function ensureWhatsappSession(networkId?: string | null): Promise<WhatsappSessionRow> {
  if (!networkId) throw new Error("Selecione uma rede antes de preparar a sessao WhatsApp.");

  const { data, error } = await rpc<WhatsappSessionRow>("ensure_whatsapp_session", { target_network_id: networkId });
  if (error) throw error;
  if (!data) throw new Error("Nao foi possivel preparar a sessao WhatsApp.");
  return data as WhatsappSessionRow;
}

export async function enqueueWhatsappTextMessage(sessionId: string, recipientPhone: string, body: string): Promise<WhatsappQueueRow> {
  const { data, error } = await rpc<WhatsappQueueRow>("enqueue_whatsapp_text_message", {
    target_session_id: sessionId,
    recipient_phone: recipientPhone,
    body,
    metadata: { source: "wa-conexao-test" },
  });

  if (error) throw error;
  if (!data) throw new Error("Nao foi possivel enfileirar a mensagem.");
  return data as WhatsappQueueRow;
}