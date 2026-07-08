import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "../config/environment";

const supabaseUrl = SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const createEphemeralSupabaseClient = () =>
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
