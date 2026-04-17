"use client";

import { supabase } from "@/lib/supabase";

export const DEFAULT_POST_AUTH_ROUTE = "/board";

type RouterLike = {
  push: (href: string) => void;
  replace: (href: string) => void;
};

export function normalizeRedirectPath(
  candidate: string | null | undefined,
  fallback = DEFAULT_POST_AUTH_ROUTE,
) {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//")) return fallback;
  if (candidate.startsWith("/login") || candidate.startsWith("/signup")) return fallback;
  return candidate;
}

export function buildSignupRedirect(path: string) {
  return `/signup?redirect=${encodeURIComponent(normalizeRedirectPath(path, DEFAULT_POST_AUTH_ROUTE))}`;
}

export async function getAuthUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function resolveProtectedDestination(
  intendedPath: string,
  authenticatedPath = intendedPath,
) {
  const normalizedIntended = normalizeRedirectPath(intendedPath, DEFAULT_POST_AUTH_ROUTE);
  const normalizedAuthed = normalizeRedirectPath(authenticatedPath, normalizedIntended);
  const user = await getAuthUser();

  return {
    authenticated: Boolean(user),
    destination: user ? normalizedAuthed : buildSignupRedirect(normalizedIntended),
    user,
  };
}

export async function navigateWithAuth(
  router: RouterLike,
  intendedPath: string,
  authenticatedPath = intendedPath,
  replace = false,
) {
  const { destination } = await resolveProtectedDestination(intendedPath, authenticatedPath);
  if (replace) {
    router.replace(destination);
    return destination;
  }
  router.push(destination);
  return destination;
}
