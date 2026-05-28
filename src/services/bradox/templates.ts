import { supabase } from "@/integrations/supabase/client";
import type { BradoxDatabase } from "@/integrations/supabase/types";

export type MessageTemplateRow = BradoxDatabase["bradox_revenda"]["Tables"]["message_templates"]["Row"];

export type TemplateDraft = {
  network_id: string;
  name: string;
  category?: string | null;
  content: string;
  media?: unknown;
};

export async function fetchMessageTemplates(networkId: string): Promise<MessageTemplateRow[]> {
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("network_id", networkId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MessageTemplateRow[];
}

export async function upsertMessageTemplate(template: TemplateDraft & { id?: string }) {
  const { data, error } = await supabase
    .from("message_templates")
    .upsert(template as never, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as MessageTemplateRow;
}

export async function deleteMessageTemplate(networkId: string, templateId: string) {
  const { error } = await supabase
    .from("message_templates")
    .delete()
    .eq("network_id", networkId)
    .eq("id", templateId);

  if (error) throw error;
}