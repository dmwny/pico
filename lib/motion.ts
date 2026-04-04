"use client";

import { useEffect, useMemo, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function usePageHidden() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVisibilityChange = () => setHidden(document.visibilityState === "hidden");
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return hidden;
}

export function useMotionAllowed() {
  const reduced = usePrefersReducedMotion();
  const hidden = usePageHidden();

  return useMemo(() => !reduced && !hidden, [hidden, reduced]);
}
