import { supabase } from "@/integrations/supabase/client";
import type { BradoxDatabase } from "@/integrations/supabase/types";

export type ProfileRow = BradoxDatabase["bradox_revenda"]["Tables"]["profiles"]["Row"];

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userResult.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  const profile = (data ?? null) as ProfileRow | null;

  if (profile?.email && user.email && normalizeEmail(profile.email) !== normalizeEmail(user.email)) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("Inconsistencia de sessao detectada. Entre novamente.");
  }

  return profile;
}

export async function signInWithEmail(email: string, password: string) {
  // Always clear previous session before new login attempt to avoid sticky account context.
  await supabase.auth.signOut({ scope: "local" });

  const expectedEmail = normalizeEmail(email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: expectedEmail,
    password,
  });

  if (error) throw new Error(getFriendlyAuthError(error));

  const signedUser = data.user;
  if (!signedUser?.email || normalizeEmail(signedUser.email) !== expectedEmail) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("Falha de seguranca na autenticacao. Tente novamente.");
  }

  return data;
}

export async function requestAccess(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: "cliente" | "revenda";
  networkName?: string;
}) {
  if (input.role === "revenda" && !input.networkName?.trim()) {
    throw new Error("Nome da rede e obrigatorio para cadastro de revenda");
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        phone: input.phone?.trim() || null,
        role: input.role,
        network_name: input.role === "revenda" ? input.networkName?.trim() : null,
      },
    },
  });

  if (error) throw new Error(getFriendlyAuthError(error));
  return data;
}

export async function updateCurrentProfile(input: { fullName: string; phone: string; avatarUrl?: string | null }) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userResult.user;
  if (!user) throw new Error("Sessao expirada. Entre novamente.");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim() || null,
      phone: input.phone.trim() || null,
      ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
    } as never)
    .eq("id", user.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data as ProfileRow | null;
}

export async function updateCurrentPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(getFriendlyAuthError(error));
}

export async function uploadCurrentUserAvatar(file: File) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userResult.user;
  if (!user) throw new Error("Sessao expirada. Entre novamente.");

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/avatar-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

function getFriendlyAuthError(error: { message?: string; status?: number }) {
  const message = error.message?.toLowerCase() ?? "";

  if (error.status === 400 || message.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (message.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (message.includes("user already registered") || message.includes("already registered")) {
    return "Este e-mail ja possui cadastro. Entre com sua senha ou recupere o acesso.";
  }

  if (message.includes("password")) {
    return "A senha informada nao atende aos requisitos de seguranca.";
  }

  return "Nao foi possivel concluir o acesso agora. Tente novamente em instantes.";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}