import { supabase } from "@/integrations/supabase/client";
import type { BradoxDatabase } from "@/integrations/supabase/types";

export type UsefulLinkCategoryRow = BradoxDatabase["bradox_revenda"]["Tables"]["useful_link_categories"]["Row"];
export type UsefulLinkRow = BradoxDatabase["bradox_revenda"]["Tables"]["useful_links"]["Row"];

export type UsefulLinkCategoryInput = {
  id?: string;
  name: string;
  icon?: string | null;
  displayOrder?: number;
};

export type UsefulLinkInput = {
  id?: string;
  categoryId?: string | null;
  title: string;
  url: string;
  icon?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
};

const TOOL_IMAGE_BUCKET = "tool-images";

export async function fetchUsefulLinkCategories(networkId?: string | null): Promise<UsefulLinkCategoryRow[]> {
  if (!networkId) return [];

  const { data, error } = await supabase
    .from("useful_link_categories")
    .select("*")
    .eq("network_id", networkId)
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as UsefulLinkCategoryRow[];
}

export async function fetchUsefulLinks(networkId?: string | null): Promise<UsefulLinkRow[]> {
  if (!networkId) return [];

  const { data, error } = await supabase
    .from("useful_links")
    .select("*")
    .eq("network_id", networkId)
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw error;
  return (data ?? []) as UsefulLinkRow[];
}

export async function fetchToolsSnapshot(networkId?: string | null) {
  const [categories, links] = await Promise.all([
    fetchUsefulLinkCategories(networkId),
    fetchUsefulLinks(networkId),
  ]);

  return { categories, links };
}

export async function saveUsefulLinkCategory(networkId: string | null | undefined, input: UsefulLinkCategoryInput) {
  const resolvedNetworkId = requireNetworkId(networkId);
  const payload = {
    network_id: resolvedNetworkId,
    name: input.name.trim(),
    icon: input.icon?.trim() || null,
    display_order: input.displayOrder ?? 0,
    status: "active",
  };

  const query = input.id
    ? supabase.from("useful_link_categories").update(payload as never).eq("id", input.id).select("*").maybeSingle()
    : supabase.from("useful_link_categories").insert(payload as never).select("*").maybeSingle();

  const { data, error } = await query;
  if (error) throw error;
  if (!data) throw new Error("Nao foi possivel salvar a categoria.");
  return data as UsefulLinkCategoryRow;
}

export async function reorderUsefulLinkCategories(networkId: string | null | undefined, categoryIds: string[]) {
  const resolvedNetworkId = requireNetworkId(networkId);
  const results = await Promise.all(categoryIds.map((id, index) => supabase
    .from("useful_link_categories")
    .update({ display_order: (index + 1) * 10 } as never)
    .eq("network_id", resolvedNetworkId)
    .eq("id", id)));
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function deleteUsefulLinkCategory(networkId: string | null | undefined, id: string) {
  const resolvedNetworkId = requireNetworkId(networkId);

  const { error: linkError } = await supabase
    .from("useful_links")
    .update({ category_id: null } as never)
    .eq("network_id", resolvedNetworkId)
    .eq("category_id", id);

  if (linkError) throw linkError;

  const { error } = await supabase
    .from("useful_link_categories")
    .update({ status: "inactive" } as never)
    .eq("network_id", resolvedNetworkId)
    .eq("id", id);

  if (error) throw error;
}

export async function saveUsefulLink(networkId: string | null | undefined, input: UsefulLinkInput) {
  const resolvedNetworkId = requireNetworkId(networkId);
  const payload = {
    network_id: resolvedNetworkId,
    category_id: input.categoryId || null,
    title: input.title.trim(),
    url: normalizeUrl(input.url),
    icon: input.icon?.trim() || "link",
    image_url: input.imageUrl?.trim() || null,
    display_order: input.displayOrder ?? 0,
    status: "active",
  };

  const query = input.id
    ? supabase.from("useful_links").update(payload as never).eq("id", input.id).select("*").maybeSingle()
    : supabase.from("useful_links").insert(payload as never).select("*").maybeSingle();

  const { data, error } = await query;
  if (error) throw error;
  if (!data) throw new Error("Nao foi possivel salvar a ferramenta.");
  return data as UsefulLinkRow;
}

export async function reorderUsefulLinks(networkId: string | null | undefined, linkIds: string[]) {
  const resolvedNetworkId = requireNetworkId(networkId);
  const results = await Promise.all(linkIds.map((id, index) => supabase
    .from("useful_links")
    .update({ display_order: (index + 1) * 10 } as never)
    .eq("network_id", resolvedNetworkId)
    .eq("id", id)));
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function uploadUsefulLinkImage(file: File) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userResult.user;
  if (!user) throw new Error("Sessao expirada. Entre novamente.");

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "imagem";
  const path = `${user.id}/tools/${Date.now()}-${safeName}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(TOOL_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(TOOL_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteUsefulLink(networkId: string | null | undefined, id: string) {
  const resolvedNetworkId = requireNetworkId(networkId);
  const { error } = await supabase
    .from("useful_links")
    .update({ status: "inactive" } as never)
    .eq("network_id", resolvedNetworkId)
    .eq("id", id);

  if (error) throw error;
}

function requireNetworkId(networkId: string | null | undefined) {
  if (!networkId) throw new Error("Selecione uma rede antes de continuar.");
  return networkId;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}