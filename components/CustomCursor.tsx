"use client";

import { useEffect, useRef } from "react";

// Soft "ice halo" cursor: the native cursor stays visible, and a faint cold
// glow lerps after it as ambient theming. On interactive elements the halo
// expands and brightens so the user gets feedback without a hijacked cursor.
// Disabled on touch devices.
export default function CustomCursor() {
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;

    const halo = haloRef.current;
    if (!halo) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let hx = mx;
    let hy = my;
    let visible = false;
    let hovered = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        halo.style.opacity = "1";
      }
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const interactive = target?.closest(
        '[data-cursor="hover"], a, button, [role="button"]'
      );
      const next = !!interactive;
      if (next !== hovered) {
        hovered = next;
        halo.dataset.hover = String(hovered);
      }
    };

    const onLeave = () => {
      visible = false;
      halo.style.opacity = "0";
    };

    const tick = () => {
      hx += (mx - hx) * 0.18;
      hy += (my - hy) * 0.18;
      halo.style.transform = `translate3d(${hx}px, ${hy}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <div ref={haloRef} className="cursor-halo" aria-hidden />;
}
