"use client";

import { useEffect, useSyncExternalStore } from "react";

export const SECTION_IDS = [
  "hero",
  "stack",
  "experience",
  "project1",
  "project2",
  "project3",
  "project4",
  "contact",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

let currentSection: string = "hero";
let currentHighlights: Set<string> = new Set();
const sectionRefObject: { current: string } = { current: "hero" };
const highlightsRefObject: { current: Set<string> } = { current: new Set() };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function setActiveSection(id: string, highlights?: Set<string>) {
  let changed = false;
  if (currentSection !== id) {
    currentSection = id;
    sectionRefObject.current = id;
    changed = true;
  }

  if (highlights !== undefined) {
    currentHighlights = highlights;
    highlightsRefObject.current = highlights;
  } else if (typeof document !== "undefined") {
    const el = document.querySelector<HTMLElement>(`[data-kb-section="${id}"]`);
    const raw = el?.dataset.kbHighlights ?? "";
    currentHighlights = new Set(
      raw.split(",").map((s) => s.trim()).filter(Boolean)
    );
    highlightsRefObject.current = currentHighlights;
  }

  if (changed) {
    notify();
  }
}

export function getActiveSection(): string {
  return currentSection;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let isManualNavigating = false;
let manualNavTimeout: ReturnType<typeof setTimeout> | null = null;

export function setManualNavigating(isNav: boolean, durationMs = 850) {
  isManualNavigating = isNav;
  if (manualNavTimeout) clearTimeout(manualNavTimeout);
  if (isNav) {
    manualNavTimeout = setTimeout(() => {
      isManualNavigating = false;
      updateActiveSectionFromScroll();
    }, durationMs);
  }
}

export function updateActiveSectionFromScroll() {
  if (typeof window === "undefined" || isManualNavigating) return;

  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;

  // Bottom of page -> contact
  if (windowHeight + scrollY >= docHeight - 60) {
    const contactEl = document.querySelector<HTMLElement>(
      '[data-kb-section="contact"]'
    );
    const raw = contactEl?.dataset.kbHighlights ?? "";
    setActiveSection(
      "contact",
      new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))
    );
    return;
  }

  // Top of page -> hero
  if (scrollY < 80) {
    const heroEl = document.querySelector<HTMLElement>(
      '[data-kb-section="hero"]'
    );
    const raw = heroEl?.dataset.kbHighlights ?? "";
    setActiveSection(
      "hero",
      new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))
    );
    return;
  }

  // Anchor line: 38% down from viewport top
  const anchorY = windowHeight * 0.38;

  let bestId: string | null = null;
  let bestHighlights: Set<string> = new Set();
  let maxVisibleHeight = 0;

  for (const id of SECTION_IDS) {
    const el = document.querySelector<HTMLElement>(
      `[data-kb-section="${id}"]`
    );
    if (!el) continue;
    const rect = el.getBoundingClientRect();

    // Direct hit on the anchor point
    if (rect.top <= anchorY && rect.bottom > anchorY) {
      const raw = el.dataset.kbHighlights ?? "";
      setActiveSection(
        id,
        new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))
      );
      return;
    }

    // Fallback: choose section with largest pixel coverage in viewport
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(windowHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    if (visibleHeight > maxVisibleHeight) {
      maxVisibleHeight = visibleHeight;
      bestId = id;
      const raw = el.dataset.kbHighlights ?? "";
      bestHighlights = new Set(
        raw.split(",").map((s) => s.trim()).filter(Boolean)
      );
    }
  }

  if (bestId) {
    setActiveSection(bestId, bestHighlights);
  }
}

let scrollListenerAttached = false;
let rafId: number | null = null;

function onScrollThrottled() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    updateActiveSectionFromScroll();
  });
}

export function useActiveSection(): [
  string,
  React.RefObject<string>,
  React.RefObject<Set<string>>
] {
  const section = useSyncExternalStore(
    subscribe,
    getActiveSection,
    () => "hero"
  );

  useEffect(() => {
    if (!scrollListenerAttached && typeof window !== "undefined") {
      scrollListenerAttached = true;
      window.addEventListener("scroll", onScrollThrottled, { passive: true });
      window.addEventListener("resize", onScrollThrottled, { passive: true });
      // Initial check once layout settles
      setTimeout(updateActiveSectionFromScroll, 120);
    }
  }, []);

  return [section, sectionRefObject, highlightsRefObject];
}

