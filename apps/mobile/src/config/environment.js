export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
);

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "";

export const isApiConfigured = Boolean(API_URL);
