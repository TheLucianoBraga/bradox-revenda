import { supabase } from "@/integrations/supabase/client";
import type { BradoxDatabase, Json } from "@/integrations/supabase/types";

export type CustomerDirectoryRow = BradoxDatabase["bradox_revenda"]["Views"]["customer_directory"]["Row"];
export type ResellerDirectoryRow = BradoxDatabase["bradox_revenda"]["Views"]["reseller_directory"]["Row"];
export type CustomerPlanPriceRow = BradoxDatabase["bradox_revenda"]["Views"]["customer_plan_price_directory"]["Row"];
export type ManagedUserRole = "cliente" | "revenda";

export type CustomerPlanAssignmentInput = {
  planId: string;
  serverId?: string | null;
  customPrice?: number | null;
  status?: string;
};

export type ManagedUserInput = {
  id?: string | null;
  role: ManagedUserRole;
  email: string;
  fullName: string;
  phone?: string | null;
  status: string;
  networkId?: string | null;
  networkName?: string | null;
  password?: string | null;
};

export async function fetchCustomers(networkId?: string | null): Promise<CustomerDirectoryRow[]> {
  let query = supabase
    .from("customer_directory")
    .select("*")
    .neq("status", "inactive")
    .order("created_at", { ascending: false });

  if (networkId) query = query.eq("network_id", networkId);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as CustomerDirectoryRow[];
}

export async function fetchResellers(networkId?: string | null): Promise<ResellerDirectoryRow[]> {
  let query = supabase
    .from("reseller_directory")
    .select("*")
    .neq("status", "inactive")
    .order("created_at", { ascending: false });

  if (networkId) query = query.eq("network_id", networkId);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as ResellerDirectoryRow[];
}

export async function approveReseller(profileId: string) {
  const { data, error } = await supabase.rpc("approve_reseller_profile", { profile_id: profileId } as never);
  if (error) throw error;
  return data;
}

export async function saveManagedUser(input: ManagedUserInput) {
  const { data, error } = await supabase.rpc("admin_save_profile", {
    profile_id: input.id || null,
    target_role: input.role,
    target_email: input.email.trim().toLowerCase(),
    target_full_name: input.fullName.trim(),
    target_phone: input.phone?.trim() || null,
    target_status: input.status,
    target_network_id: input.networkId || null,
    target_network_name: input.networkName?.trim() || null,
    target_password: input.password || null,
  } as never);

  if (error) throw error;
  return data as BradoxDatabase["bradox_revenda"]["Tables"]["profiles"]["Row"];
}

export async function deleteManagedUser(profileId: string) {
  const { error } = await supabase.rpc("admin_delete_profile", { profile_id: profileId } as never);
  if (error) throw error;
}

export async function fetchUsersSnapshot(networkId?: string | null) {
  const [customers, resellers] = await Promise.all([fetchCustomers(networkId), fetchResellers(networkId)]);
  return { customers, resellers };
}

export async function fetchCustomerPlanPrices(customerId?: string | null): Promise<CustomerPlanPriceRow[]> {
  if (!customerId) return [];

  const { data, error } = await supabase
    .from("customer_plan_price_directory")
    .select("*")
    .eq("customer_id", customerId)
    .neq("status", "inactive")
    .order("plan_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CustomerPlanPriceRow[];
}

export async function saveCustomerPlanPrices(customerId: string, assignments: CustomerPlanAssignmentInput[]): Promise<CustomerPlanPriceRow[]> {
  const payload = assignments.map((assignment) => ({
    plan_id: assignment.planId,
    server_id: assignment.serverId || null,
    custom_price: assignment.customPrice ?? null,
    status: assignment.status ?? "active",
  })) as Json;

  const { data, error } = await supabase.rpc("save_customer_plan_assignments", {
    target_customer_id: customerId,
    assignments: payload,
  } as never);

  if (error) throw error;
  return (data ?? []) as CustomerPlanPriceRow[];
}