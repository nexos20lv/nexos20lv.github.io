"use client";

import { useSyncExternalStore } from "react";

// Width-based mobile detection shared across the page + 3D scene. Uses
// matchMedia so it tracks viewport changes (rotation, resize, desktop window
// shrink) rather than a one-shot userAgent sniff. SSR snapshot is `false`
// (desktop) so the server renders the desktop tree; useSyncExternalStore then
// corrects to mobile on the client after mount without a hydration error.
const QUERY = "(max-width: 767px)";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
