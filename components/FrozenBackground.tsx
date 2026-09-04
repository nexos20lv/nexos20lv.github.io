"use client";

import { useEffect, useRef } from "react";
import { useSeason } from "@/components/SeasonProvider";

// Palette particle colours are authored as "rgba(r, g, b, a)". We want to
// paint each flake at its own per-flake alpha, so we strip the authored
// alpha and reassemble with the alpha we want. If parsing fails we fall
// back to the input string unchanged (good enough for one bad frame).
function particleRgba(base: string, alpha: number): string {
  const m = base.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return base;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha.toFixed(3)})`;
}

// Fixed full-viewport background that sits behind everything (including the
// 3D keyboard scene). Three layered visuals:
//   1) An "aurora" of slow-drifting radial gradients (CSS, GPU-cheap).
//   2) A canvas of falling snowflakes with subtle mouse parallax.
//   3) A vignette that pulls focus toward the centre of the viewport.
// All static/animated CSS; the canvas renders ~60–120 particles, well below
// the budget the 3D scene leaves us. Pauses when the tab is hidden.
export default function FrozenBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { palette } = useSeason();
  const particleColor = palette.particle;
  const haloColor = palette.particleHalo;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    type Flake = {
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      phase: number;
      amp: number;
      alpha: number;
    };

    let flakes: Flake[] = [];

    const seed = () => {
      // Density tuned to viewport area, capped on either end.
      const target = Math.min(140, Math.max(50, Math.floor((w * h) / 18000)));
      flakes = Array.from({ length: target }, () => makeFlake(true));
    };

    const makeFlake = (initial: boolean): Flake => {
      const r = 0.5 + Math.pow(Math.random(), 2.2) * 2.4;
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -10,
        r,
        vy: 0.12 + r * 0.18 + Math.random() * 0.25,
        vx: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
        amp: 0.5 + Math.random() * 1.4,
        alpha: 0.25 + Math.random() * 0.55,
      };
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    window.addEventListener("resize", resize);

    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e: MouseEvent) => {
      mx = (e.clientX / w - 0.5) * 2;
      my = (e.clientY / h - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    let last = performance.now();
    let running = true;

    const onVisibility = () => {
      running = !document.hidden;
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const draw = (t: number) => {
      const dt = Math.min(64, t - last) / 16.6667;
      last = t;
      // Smooth mouse parallax target.
      tx += (mx - tx) * 0.05;
      ty += (my - ty) * 0.05;

      ctx.clearRect(0, 0, w, h);

      for (const f of flakes) {
        f.y += f.vy * dt;
        f.x += f.vx * dt;
        f.phase += 0.005 * dt;
        if (f.y > h + 6) {
          Object.assign(f, makeFlake(false));
        }
        if (f.x < -10) f.x = w + 10;
        else if (f.x > w + 10) f.x = -10;

        // Larger flakes drift more with parallax (fake depth).
        const depth = f.r / 2.6;
        const px = f.x + Math.sin(f.phase) * f.amp * 6 - tx * 18 * depth;
        const py = f.y - ty * 12 * depth;

        ctx.beginPath();
        ctx.fillStyle = particleRgba(particleColor, f.alpha);
        ctx.arc(px, py, f.r, 0, Math.PI * 2);
        ctx.fill();

        // Soft halo on the larger flakes.
        if (f.r > 1.6) {
          ctx.beginPath();
          ctx.fillStyle = particleRgba(haloColor, f.alpha * 0.2);
          ctx.arc(px, py, f.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (running) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [particleColor, haloColor]);

  return (
    <div
      aria-hidden
      className="frozen-bg pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="frozen-aurora absolute inset-0" />
      <div className="frozen-aurora frozen-aurora--alt absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="frozen-vignette absolute inset-0" />
      <div className="frozen-grain absolute inset-0" />
    </div>
  );
}
