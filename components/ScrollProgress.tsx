"use client";

import { useEffect, useRef } from "react";

// Thin scroll-progress bar fixed to the very top of the viewport. Updates a
// CSS custom property on a single div so we don't trigger React re-renders
// while scrolling. Lenis hijacks scroll, but scroll/window.scrollY remain
// authoritative because Lenis is mounted with `root`.
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${pct})`;
      raf = 0;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[2px] bg-ice-700/30 pointer-events-none">
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-ice-300 via-ice-100 to-ice-400"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
