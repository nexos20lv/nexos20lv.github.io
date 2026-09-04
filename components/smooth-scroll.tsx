"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

// Wraps the document scroll in Lenis for inertial smooth-scrolling, the same
// "premium" feel Naresh's portfolio uses. `root` makes Lenis hijack window
// scroll instead of a child container, so window.scrollY values stay correct
// for our IntersectionObserver-based section tracking.
export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      }}
    >
      {children}
    </ReactLenis>
  );
}
