// Server-side Supabase client (App Router server components, route handlers,
// server actions).
//
// TODO before this can run live:
//   npm i @supabase/ssr @supabase/supabase-js
//
// Returns `null` when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
// are unset so callers can fall back to the localStorage path.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Returns a Supabase server client with cookie-based auth wired in, or
 * `null` when env vars aren't set / the package isn't installed.
 *
 * Call from a server component, route handler, or server action.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const cookieStore = await cookies();

    return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `cookies().set` throws inside a server component (read-only).
            // Safe to ignore — middleware refresh handles the write path.
          }
        },
      },
    }) as SupabaseClient;
  } catch (err) {
    console.warn("[supabase/server] init failed:", err);
    return null;
  }
}
