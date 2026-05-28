import { createClient } from "@supabase/supabase-js";
import type { BradoxDatabase } from "./types";
import { BRADOX_SCHEMA } from "./schema";

const runtimeEnv = typeof process === "undefined" ? undefined : process.env;
const browserSupabaseUrl = typeof window === "undefined"
  ? undefined
  : `${window.location.protocol}//api.${window.location.host}`;
const supabaseUrl = import.meta.env.VITE_BRADOX_SUPABASE_URL || runtimeEnv?.VITE_BRADOX_SUPABASE_URL || browserSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_BRADOX_SUPABASE_ANON_KEY || runtimeEnv?.VITE_BRADOX_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("VITE_BRADOX_SUPABASE_URL nao configurado");
}

if (!supabaseAnonKey) {
  throw new Error("VITE_BRADOX_SUPABASE_ANON_KEY nao configurado");
}

export const supabase = createClient<BradoxDatabase, "bradox_revenda">(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window === "undefined" ? undefined : window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: BRADOX_SCHEMA,
  },
});