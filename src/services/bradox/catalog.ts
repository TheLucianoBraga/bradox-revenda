import { supabase } from "@/integrations/supabase/client";
import type { BradoxDatabase } from "@/integrations/supabase/types";

export type NetworkRow = BradoxDatabase["bradox_revenda"]["Tables"]["networks"]["Row"];
export type ServerRow = BradoxDatabase["bradox_revenda"]["Tables"]["servers"]["Row"];
export type PlanRow = BradoxDatabase["bradox_revenda"]["Tables"]["plans"]["Row"];
export type CustomerDirectoryRow = BradoxDatabase["bradox_revenda"]["Views"]["customer_directory"]["Row"];

export type ServerInput = {
  id?: string | null;
  networkId?: string | null;
  name: string;
  baseUrl?: string | null;
  billingType: "prepaid" | "postpaid";
  creditPrice?: number | null;
  minimumCredits?: number | null;
  status: string;
};

export type PlanInput = {
  id?: string | null;
  networkId?: string | null;
  serverId?: string | null;
  name: string;
  planType: string;
  price: number;
  credits: number;
  durationDays: number;
  status: string;
};

export const BRAGA_OWNER_EMAIL = "thebragafuture@gmail.com";

export async function fetchNetworks(networkId?: string | null): Promise<NetworkRow[]> {
  let query = supabase
    .from("networks")
    .select("*")
    .order("name", { ascending: true });

  if (networkId) query = query.eq("id", networkId);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as NetworkRow[];
}

export async function fetchServers(networkId?: string | null): Promise<ServerRow[]> {
  if (!networkId) return [];

  const { data, error } = await supabase
    .from("servers")
    .select("*")
    .eq("network_id", networkId)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ServerRow[];
}

export async function saveServer(input: ServerInput): Promise<ServerRow> {
  const { data, error } = await supabase.rpc("save_server", {
    target_server_id: input.id || null,
    target_network_id: input.networkId || null,
    target_name: input.name,
    target_base_url: input.baseUrl || null,
    target_billing_type: input.billingType,
    target_credit_price: input.creditPrice ?? 0,
    target_minimum_credits: input.minimumCredits ?? 0,
    target_status: input.status,
  } as never);

  if (error) throw error;
  return data as ServerRow;
}

export async function deleteServer(serverId: string) {
  const { error } = await supabase.rpc("delete_server", { target_server_id: serverId } as never);
  if (error) throw error;
}

export async function fetchPlans(networkId?: string | null): Promise<PlanRow[]> {
  if (!networkId) return [];

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("network_id", networkId)
    .eq("status", "active")
    .order("price", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PlanRow[];
}

export async function savePlan(input: PlanInput): Promise<PlanRow> {
  const { data, error } = await supabase.rpc("save_plan", {
    target_plan_id: input.id || null,
    target_network_id: input.networkId || null,
    target_server_id: input.serverId || null,
    target_name: input.name,
    target_plan_type: input.planType,
    target_price: input.price,
    target_credits: input.credits,
    target_duration_days: input.durationDays,
    target_status: input.status,
  } as never);

  if (error) throw error;
  return data as PlanRow;
}

export async function deletePlan(planId: string) {
  const { error } = await supabase.rpc("delete_plan", { target_plan_id: planId } as never);
  if (error) throw error;
}

export async function fetchCustomers(networkId?: string | null): Promise<CustomerDirectoryRow[]> {
  if (!networkId) return [];

  const { data, error } = await supabase
    .from("customer_directory")
    .select("*")
    .eq("network_id", networkId)
    .neq("status", "inactive")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CustomerDirectoryRow[];
}

export async function fetchCatalogSnapshot(networkId?: string | null) {
  const [networks, servers, plans, customers] = await Promise.all([
    fetchNetworks(networkId),
    fetchServers(networkId),
    fetchPlans(networkId),
    fetchCustomers(networkId),
  ]);

  return { networks, servers, plans, customers };
}