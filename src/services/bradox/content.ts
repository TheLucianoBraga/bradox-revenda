import { supabase } from "@/integrations/supabase/client";
import type { BradoxDatabase, Json } from "@/integrations/supabase/types";

export type ContentCategoryRow = BradoxDatabase["bradox_revenda"]["Tables"]["content_categories"]["Row"];
export type ContentRow = BradoxDatabase["bradox_revenda"]["Tables"]["content"]["Row"];

export type ContentCategoryInput = {
  id?: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  bg?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
};

export type ContentInput = {
  id?: string;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  body?: string | null;
  contentType?: ContentRow["content_type"];
  contentUrl?: string | null;
  videoUrl?: string | null;
  images?: string[];
  links?: Json;
  ctaText?: string | null;
  ctaLink?: string | null;
  status?: ContentRow["status"];
  isFeatured?: boolean;
  featuredOrder?: number;
  publishedAt?: string | null;
};

type ContentQueryOptions = {
  publishedOnly?: boolean;
};

const CONTENT_IMAGE_BUCKET = "content-images";

export async function fetchContentCategories(networkId?: string | null): Promise<ContentCategoryRow[]> {
  if (!networkId) return [];

  const { data, error } = await supabase
    .from("content_categories")
    .select("*")
    .eq("network_id", networkId)
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ContentCategoryRow[];
}

export async function fetchContent(networkId?: string | null, options?: ContentQueryOptions): Promise<ContentRow[]> {
  if (!networkId) return [];

  let query = supabase
    .from("content")
    .select("*")
    .eq("network_id", networkId)
    .neq("status", "archived");

  if (options?.publishedOnly) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("featured_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ContentRow[];
}

export async function fetchContentSnapshot(networkId?: string | null, options?: ContentQueryOptions) {
  const [categories, content] = await Promise.all([
    fetchContentCategories(networkId),
    fetchContent(networkId, options),
  ]);

  return { categories, content };
}

export async function saveContentCategory(networkId: string | null | undefined, input: ContentCategoryInput) {
  const resolvedNetworkId = requireNetworkId(networkId);
  const ownerId = await getCurrentUserId();
  const payload = {
    network_id: resolvedNetworkId,
    owner_id: ownerId,
    name: input.name.trim(),
    icon: input.icon?.trim() || "folder-tree",
    color: input.color?.trim() || "amber",
    bg: input.bg?.trim() || null,
    image_url: input.imageUrl?.trim() || null,
    display_order: input.displayOrder ?? 0,
    status: "active",
  };

  const query = input.id
    ? supabase.from("content_categories").update(payload as never).eq("id", input.id).select("*").maybeSingle()
    : supabase.from("content_categories").insert(payload as never).select("*").maybeSingle();

  const { data, error } = await query;
  if (error) throw error;
  if (!data) throw new Error("Nao foi possivel salvar a categoria.");
  return data as ContentCategoryRow;
}

export async function deleteContentCategory(networkId: string | null | undefined, id: string) {
  const resolvedNetworkId = requireNetworkId(networkId);

  const { error: contentError } = await supabase
    .from("content")
    .update({ category_id: null } as never)
    .eq("network_id", resolvedNetworkId)
    .eq("category_id", id);

  if (contentError) throw contentError;

  const { error } = await supabase
    .from("content_categories")
    .update({ status: "inactive" } as never)
    .eq("network_id", resolvedNetworkId)
    .eq("id", id);

  if (error) throw error;
}

export async function saveContent(networkId: string | null | undefined, input: ContentInput) {
  const resolvedNetworkId = requireNetworkId(networkId);
  const userId = await getCurrentUserId();
  const status = input.status ?? "draft";
  const now = new Date().toISOString();
  const payload = {
    network_id: resolvedNetworkId,
    category_id: input.categoryId || null,
    created_by: userId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    body: input.body?.trim() || null,
    content_type: input.contentType ?? "comunicado",
    content_url: input.contentUrl?.trim() || null,
    video_url: input.videoUrl?.trim() || null,
    images: input.images ?? [],
    links: input.links ?? [],
    cta_text: input.ctaText?.trim() || null,
    cta_link: normalizeOptionalUrl(input.ctaLink),
    status,
    is_featured: input.isFeatured ?? false,
    featured_order: input.featuredOrder ?? 0,
    published_at: status === "published" ? normalizeOptionalDate(input.publishedAt) ?? now : null,
  };

  const query = input.id
    ? supabase.from("content").update(payload as never).eq("id", input.id).select("*").maybeSingle()
    : supabase.from("content").insert(payload as never).select("*").maybeSingle();

  const { data, error } = await query;
  if (error) throw error;
  if (!data) throw new Error("Nao foi possivel salvar o conteudo.");
  return data as ContentRow;
}

export async function updateFeaturedContentOrder(networkId: string | null | undefined, orderedIds: string[]) {
  const resolvedNetworkId = requireNetworkId(networkId);
  await Promise.all(orderedIds.map((id, index) => supabase
    .from("content")
    .update({ featured_order: index } as never)
    .eq("network_id", resolvedNetworkId)
    .eq("id", id)
    .eq("is_featured", true),
  ));
}

export async function deleteContent(networkId: string | null | undefined, id: string) {
  const resolvedNetworkId = requireNetworkId(networkId);
  const { error } = await supabase
    .from("content")
    .update({ status: "archived" } as never)
    .eq("network_id", resolvedNetworkId)
    .eq("id", id);

  if (error) throw error;
}

export async function uploadContentImage(file: File) {
  const userId = await getCurrentUserId();
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "imagem";
  const path = `${userId}/content/${Date.now()}-${safeName}.${extension}`;

  const { error } = await supabase.storage.from(CONTENT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(CONTENT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Sessao expirada. Entre novamente.");
  return userId;
}

function requireNetworkId(networkId: string | null | undefined) {
  if (!networkId) throw new Error("Selecione uma rede antes de continuar.");
  return networkId;
}

function normalizeOptionalUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function normalizeOptionalDate(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
