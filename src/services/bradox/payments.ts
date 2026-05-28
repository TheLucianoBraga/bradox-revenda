import { supabase } from "@/integrations/supabase/client";
import type { BradoxDatabase, Json } from "@/integrations/supabase/types";

export type OrderRow = BradoxDatabase["bradox_revenda"]["Tables"]["orders"]["Row"];
export type PaymentProviderSettingRow = BradoxDatabase["bradox_revenda"]["Tables"]["payment_provider_settings"]["Row"];
export type InvoicePageRow = BradoxDatabase["bradox_revenda"]["Functions"]["get_invoice_page"]["Returns"][number];
export type Provider = "mercado_pago" | "updepix" | "manual";

const MANUAL_RECEIPT_BUCKET = "manual-payment-receipts";

export async function fetchPaymentSettings(networkId?: string | null): Promise<PaymentProviderSettingRow[]> {
  let query = supabase
    .from("payment_provider_settings")
    .select("*")
    .order("provider", { ascending: true });

  if (networkId) query = query.eq("network_id", networkId);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as PaymentProviderSettingRow[];
}

export async function savePaymentSetting(input: {
  provider: Provider;
  status: "active" | "inactive";
  displayName: string;
  publicConfig: Json;
  privateConfig?: Json;
}) {
  const { data, error } = await supabase.rpc("upsert_payment_provider_setting", {
    provider: input.provider,
    status: input.status,
    display_name: input.displayName,
    public_config: input.publicConfig,
    private_config: input.privateConfig ?? {},
  } as never);

  if (error) throw error;
  return data as PaymentProviderSettingRow;
}

export async function fetchOrders(networkId?: string | null, buyerId?: string | null): Promise<OrderRow[]> {
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (networkId) query = query.eq("network_id", networkId);
  if (buyerId) query = query.eq("buyer_id", buyerId);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export async function createCustomerInvoice(input: { customerId: string; planId: string; dueDate?: string | null; notes?: string | null }) {
  const { data, error } = await supabase.rpc("create_customer_invoice", {
    target_customer_id: input.customerId,
    target_plan_id: input.planId,
    due_date: input.dueDate || null,
    notes: input.notes || null,
  } as never);

  if (error) throw error;
  return data as OrderRow;
}

export async function createSelfPlanInvoice(input: { planId: string; dueDate?: string | null; notes?: string | null }) {
  const { data, error } = await supabase.rpc("create_self_plan_invoice", {
    target_plan_id: input.planId,
    due_date: input.dueDate || null,
    notes: input.notes || null,
  } as never);

  if (error) throw error;
  return data as OrderRow;
}

export async function createCreditInvoice(input: {
  networkId: string;
  serverId: string;
  panelUsername: string;
  creditQuantity: number;
  dueDate?: string | null;
  notes?: string | null;
}) {
  const { data, error } = await supabase.rpc("create_credit_invoice", {
    target_network_id: input.networkId,
    target_server_id: input.serverId,
    panel_username: input.panelUsername,
    credit_quantity: input.creditQuantity,
    due_date: input.dueDate || null,
    notes: input.notes || null,
  } as never);

  if (error) throw error;
  return data as OrderRow;
}

export async function fetchInvoicePage(orderId: string) {
  const { data, error } = await supabase.rpc("get_invoice_page", { order_id: orderId } as never);
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function submitManualPaymentReceipt(input: {
  orderId: string;
  payerName: string;
  payerDocument: string;
  receiptFileName: string;
  receiptUrl: string;
  notes?: string;
}) {
  const { data, error } = await supabase.rpc("submit_manual_payment_receipt", {
    order_id: input.orderId,
    payer_name: input.payerName,
    payer_document: input.payerDocument,
    receipt_file_name: input.receiptFileName,
    receipt_url: input.receiptUrl,
    notes: input.notes ?? null,
  } as never);

  if (error) throw error;
  return data;
}

export async function uploadManualPaymentReceiptFile(orderId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || `comprovante.${extension}`;
  const path = `${orderId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(MANUAL_RECEIPT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) throw error;
  return { fileName: safeName, receiptUrl: path };
}
