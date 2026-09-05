"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";
import "lenis/dist/lenis.css";

// Wraps the document scroll in Lenis for ultra-smooth inertial scrolling.
// Using physics-based lerp (0.075) for a continuous, silky-smooth glide.
export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.075,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        syncTouch: false,
        smoothWheel: true,
        autoRaf: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}

