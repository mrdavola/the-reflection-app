// Browser-side Supabase client.
//
// TODO before this can run live:
//   npm i @supabase/ssr @supabase/supabase-js
//
// Until those packages are installed (and NEXT_PUBLIC_SUPABASE_URL +
// NEXT_PUBLIC_SUPABASE_ANON_KEY are set), `getSupabaseClient()` returns
// `null` and the app falls back to the localStorage store in
// `@/lib/storage`. The runtime path is unchanged until the env flips.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Returns a configured Supabase browser client, or `null` when env vars
 * aren't set. Memoised across calls.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    cached = null;
    return cached;
  }

  try {
    cached = createBrowserClient(url, anonKey) as SupabaseClient;
  } catch (err) {
    // Package not installed yet, or runtime init failed. Fall through to
    // the localStorage path.
    console.warn("[supabase/client] init failed, falling back to local storage:", err);
    cached = null;
  }

  return cached;
}
