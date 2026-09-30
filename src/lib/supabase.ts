import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface Scenario {
  id: string;
  owner_id: string;
  title: string;
  created_at: string;
}

/**
  Checks if Supabase credentials are populated with valid non-placeholder values.
 */
export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabasePublishableKey) return false;
  if (
    supabaseUrl.includes('your-project-id') ||
    supabaseUrl.includes('your-supabase-project') ||
    supabasePublishableKey.includes('your-supabase-publishable') ||
    supabasePublishableKey.includes('your-anon-key')
  ) {
    return false;
  }
  try {
    new URL(supabaseUrl);
    return supabasePublishableKey.length > 10;
  } catch {
    return false;
  }
};

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  clientInstance = createClient(supabaseUrl!, supabasePublishableKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = clientInstance;
