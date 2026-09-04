"use client";

import { useEffect } from "react";

// Mounts once at the root and gives every element marked with
// `data-magnetic` a soft pull toward the cursor when hovered. We attach
// per-element listeners (not a global one) so we only do work while a
// cursor is actually inside an element. Translation is applied via
// CSS variables that the .frost-btn / .frost-icon styles already
// compose with their hover transform, so we never fight Tailwind.
export default function MagneticTargets() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;

    const STRENGTH = 0.32; // 0..1 — fraction of cursor offset applied
    const MAX = 14; // px — clamp so big buttons don't slide off

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-magnetic]")
    );
    const cleanups: Array<() => void> = [];

    for (const el of targets) {
      let raf = 0;
      let cx = 0;
      let cy = 0;
      let tx = 0;
      let ty = 0;

      const apply = () => {
        tx += (cx - tx) * 0.25;
        ty += (cy - ty) * 0.25;
        el.style.setProperty("--mag-x", `${tx.toFixed(2)}px`);
        el.style.setProperty("--mag-y", `${ty.toFixed(2)}px`);
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
          raf = requestAnimationFrame(apply);
        } else {
          raf = 0;
        }
      };

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        cx = Math.max(-MAX, Math.min(MAX, dx * STRENGTH));
        cy = Math.max(-MAX, Math.min(MAX, dy * STRENGTH));
        if (!raf) raf = requestAnimationFrame(apply);
      };

      const onLeave = () => {
        cx = 0;
        cy = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      };

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
        if (raf) cancelAnimationFrame(raf);
        el.style.removeProperty("--mag-x");
        el.style.removeProperty("--mag-y");
      });
    }

    return () => {
      for (const c of cleanups) c();
    };
  }, []);

  return null;
}
