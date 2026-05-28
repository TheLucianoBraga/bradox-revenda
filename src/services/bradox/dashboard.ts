import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/services/bradox/session";

export async function fetchDashboardCounts(networkId?: string | null, role?: AppRole | null) {
  if (!networkId) return { networks: 0, servers: 0, plans: 0, templates: 0 };

  const shouldLoadTemplates = role === "admin" || role === "revenda";

  const [networks, servers, plans, templates] = await Promise.all([
    supabase.from("networks").select("id", { count: "exact", head: true }).eq("id", networkId),
    supabase.from("servers").select("id", { count: "exact", head: true }).eq("network_id", networkId),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("network_id", networkId),
    shouldLoadTemplates
      ? supabase.from("message_templates").select("id", { count: "exact", head: true }).eq("network_id", networkId)
      : Promise.resolve({ count: 0, error: null } as const),
  ]);

  for (const result of [networks, servers, plans, templates]) {
    if (result.error) throw result.error;
  }

  return {
    networks: networks.count ?? 0,
    servers: servers.count ?? 0,
    plans: plans.count ?? 0,
    templates: templates.count ?? 0,
  };
}