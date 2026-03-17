import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore - middleware will refresh session
          }
        },
      },
    }
  );
}

/**
 * Returns the authenticated user for the current request.
 * Cached with React cache() so multiple server components in the same
 * request share one network call instead of each calling Supabase separately.
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/**
 * Returns the full profile row for the current user.
 * Cached with React cache() so layout + page + any other server component
 * in the same request all share one DB call.
 * Returns null if there is no authenticated user.
 */
export const getCachedProfile = cache(async () => {
  const user = await getCachedUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, team_id, name, disabled, teams(name)")
    .eq("id", user.id)
    .single();
  console.log("PROFILE DEBUG:", { userId: user.id, profile, error });
  return profile;
});
