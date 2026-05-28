import { supabase } from "@/integrations/supabase/client";
import type { BradoxDatabase } from "@/integrations/supabase/types";

export type AppRole = "admin" | "revenda" | "cliente";
export type NetworkRow = BradoxDatabase["bradox_revenda"]["Tables"]["networks"]["Row"];
export type ProfileRow = BradoxDatabase["bradox_revenda"]["Tables"]["profiles"]["Row"];

export type AppSessionData = {
  profile: ProfileRow;
  networks: NetworkRow[];
};

export async function fetchAppSessionData(): Promise<AppSessionData | null> {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userResult.user;
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  const currentProfile = (profile ?? null) as ProfileRow | null;
  if (!currentProfile) return null;

  if (currentProfile.email && user.email && normalizeEmail(currentProfile.email) !== normalizeEmail(user.email)) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("Sessao invalida detectada. Entre novamente.");
  }

  const networks = await fetchNetworksForProfile(currentProfile);
  return { profile: currentProfile, networks };
}

async function fetchNetworksForProfile(profile: ProfileRow) {
  let query = supabase
    .from("networks")
    .select("*")
    .order("name", { ascending: true });

  if (profile.role !== "admin") {
    if (!profile.network_id) return [];
    query = query.eq("id", profile.network_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}