// Ambient module declarations so typecheck passes without `@supabase/ssr` or
// `@supabase/supabase-js` installed. Once the user runs:
//
//   npm i @supabase/ssr @supabase/supabase-js
//
// these declarations are shadowed by the real package types and the wrappers
// below start working with full type-safety.
//
// We intentionally type the surface as `any`/loosely so the wrappers don't
// need to know the real shape; the wrappers narrow at the use site.

declare module "@supabase/ssr" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createBrowserClient(url: string, key: string, options?: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createServerClient(url: string, key: string, options: any): any;
}

declare module "@supabase/supabase-js" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type SupabaseClient = any;
}
