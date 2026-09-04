"use client";

import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: Direction;
  className?: string;
  threshold?: number;
  once?: boolean;
};

// Lightweight IntersectionObserver-based fade-in. Adds the .reveal-in class
// when the element enters the viewport; the actual transition is defined in
// globals.css so we keep DOM noise minimal. Uses CSS variables so each
// instance can override delay/distance/duration without a stylesheet rebuild.
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  duration = 700,
  distance = 24,
  direction = "up",
  className = "",
  threshold = 0.15,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("reveal-in");
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("reveal-in");
            if (once) obs.unobserve(el);
          } else if (!once) {
            el.classList.remove("reveal-in");
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  const axis: Record<Direction, string> = {
    up: `translate3d(0, ${distance}px, 0)`,
    down: `translate3d(0, -${distance}px, 0)`,
    left: `translate3d(${distance}px, 0, 0)`,
    right: `translate3d(-${distance}px, 0, 0)`,
    none: "translate3d(0, 0, 0)",
  };

  const style: CSSProperties = {
    // Cast to satisfy CSSProperties; CSS custom props aren't typed on it.
    ["--reveal-delay" as string]: `${delay}ms`,
    ["--reveal-duration" as string]: `${duration}ms`,
    ["--reveal-from" as string]: axis[direction],
  };

  return createElement(
    Tag,
    {
      ref,
      className: `reveal ${className}`.trim(),
      style,
    },
    children
  );
}
