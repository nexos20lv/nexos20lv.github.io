"use client";

import { useEffect, useRef, useState, useId } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type PatternType = "nexos" | "radar" | "telemetry";

export default function PovDemo() {
  const { lang } = useLanguage();
  const sliderId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rpm, setRpm] = useState<number>(1200);
  const [pattern, setPattern] = useState<PatternType>("nexos");
  const [isHallTriggered, setIsHallTriggered] = useState<boolean>(false);

  // Keep animated values in refs for smooth 60fps canvas loop
  const stateRef = useRef({
    rpm: 1200,
    angle: 0,
    pattern: "nexos" as PatternType,
    lastTime: 0,
    lastRev: 0,
  });

  useEffect(() => {
    stateRef.current.rpm = rpm;
    stateRef.current.pattern = pattern;
  }, [rpm, pattern]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    // Resize canvas to device pixels
    const width = 420;
    const height = 320;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = 110;
    const ledCount = 28;

    // Radial resolution: how many angular slices for image projection
    const slices = 180;

    // Precompute pattern pixel matrices (radius step, angle step)
    // 0 = off, 1 = on
    const patternData: Record<PatternType, (rRatio: number, theta: number) => { r: number; g: number; b: number; a: number } | null> = {
      nexos: (rRatio, theta) => {
        // Holographic NeXoS Cyberpunk Shield / Gear & Emblem
        // Outer tech ring
        if (rRatio > 0.88 && rRatio < 0.94) {
          const notch = Math.floor(theta / (Math.PI / 12)) % 2 === 0;
          return notch ? { r: 56, g: 189, b: 248, a: 1 } : { r: 14, g: 165, b: 233, a: 0.3 };
        }
        // Concentric inner ring
        if (rRatio > 0.68 && rRatio < 0.72) {
          return { r: 96, g: 165, b: 250, a: 0.8 };
        }
        // Hexagonal / Tech nodes in 6-fold symmetry
        const sixAngle = (theta % (Math.PI / 3)) - Math.PI / 6;
        const hexDist = rRatio * Math.cos(sixAngle);
        if (hexDist > 0.48 && hexDist < 0.54) {
          return { r: 147, g: 197, b: 253, a: 0.9 };
        }
        // NeXoS Star / N emblem in center
        if (rRatio < 0.38) {
          const cross = Math.abs(Math.sin(theta * 2));
          if (cross > 0.6 || rRatio < 0.12) {
            return { r: 234, g: 242, b: 251, a: 1 };
          }
        }
        // 4 glowing cardinal dots
        if (rRatio > 0.78 && rRatio < 0.84) {
          const modPi2 = Math.abs(theta % (Math.PI / 2));
          if (modPi2 < 0.08 || Math.abs(modPi2 - Math.PI / 2) < 0.08) {
            return { r: 244, g: 63, b: 94, a: 1 };
          }
        }
        return null;
      },
      radar: (rRatio, theta) => {
        // Sonar / Radar sweep with ping targets
        // Concentric radar rings
        if (
          Math.abs(rRatio - 0.3) < 0.02 ||
          Math.abs(rRatio - 0.6) < 0.02 ||
          Math.abs(rRatio - 0.9) < 0.02
        ) {
          return { r: 16, g: 185, b: 129, a: 0.6 };
        }
        // Crosshair lines
        const cross = Math.abs(Math.sin(theta * 2));
        if (cross < 0.03 && rRatio < 0.92) {
          return { r: 52, g: 211, b: 153, a: 0.5 };
        }
        // Rotating radar beam (active at current blade angle)
        const beamDelta = (theta + Math.PI * 2) % (Math.PI * 2);
        if (beamDelta < Math.PI / 2) {
          const intensity = 1 - beamDelta / (Math.PI / 2);
          return { r: 16, g: 185, b: 129, a: intensity * 0.9 };
        }
        // Simulated blip targets
        if (
          (Math.abs(rRatio - 0.65) < 0.06 && Math.abs(theta - 1.2) < 0.12) ||
          (Math.abs(rRatio - 0.42) < 0.06 && Math.abs(theta - 3.8) < 0.12)
        ) {
          return { r: 239, g: 68, b: 68, a: 1 };
        }
        return null;
      },
      telemetry: (rRatio, theta) => {
        // Tachymeter gauge / Arc display
        // Arc of speed from 0.8pi to 2.2pi
        const normalizedTheta = (theta + Math.PI) % (Math.PI * 2);
        if (normalizedTheta < Math.PI * 1.5) {
          if (rRatio > 0.78 && rRatio < 0.88) {
            const tick = Math.floor(normalizedTheta / (Math.PI / 10)) % 2 === 0;
            return tick ? { r: 245, g: 158, b: 11, a: 1 } : { r: 245, g: 158, b: 11, a: 0.3 };
          }
          if (rRatio > 0.68 && rRatio < 0.74) {
            return { r: 217, g: 119, b: 6, a: 0.8 };
          }
        }
        // Digital center ring
        if (rRatio > 0.25 && rRatio < 0.32) {
          return { r: 168, g: 85, b: 247, a: 0.9 };
        }
        return null;
      },
    };

    const render = (time: number) => {
      const state = stateRef.current;
      if (!state.lastTime) state.lastTime = time;
      const dt = Math.min((time - state.lastTime) / 1000, 0.1);
      state.lastTime = time;

      // Update angle based on current RPM
      // 1200 RPM = 20 revs/sec = 40 * PI rad/sec
      const revsPerSec = state.rpm / 60;
      const angleDelta = revsPerSec * Math.PI * 2 * dt;
      const oldAngle = state.angle;
      state.angle = (state.angle + angleDelta) % (Math.PI * 2);

      // Hall effect sensor trigger: detect when passing 0 rad
      if (state.rpm > 0 && oldAngle > state.angle && time - state.lastRev > 40) {
        state.lastRev = time;
        setIsHallTriggered(true);
        setTimeout(() => setIsHallTriggered(false), 30);
      }

      // Persistence factor:
      // At 0 RPM: trail clears instantly (alpha = 1)
      // At 1200 RPM: high persistence trail (alpha = 0.08)
      const persistenceAlpha =
        state.rpm === 0
          ? 1
          : Math.max(0.06, 0.85 - (state.rpm / 1200) * 0.77);

      // Fill canvas background with persistence trail
      ctx.fillStyle = `rgba(5, 11, 22, ${persistenceAlpha})`;
      ctx.fillRect(0, 0, width, height);

      // Persistence factor for rendering the full hologram image
      // Below 300 RPM: human eye can't assemble hologram
      // Above 300 RPM: blends in proportionally up to 1.0 at 1200 RPM
      const hologramAlpha = Math.max(0, Math.min(1, (state.rpm - 250) / 950));

      // Draw projected holographic picture if persistence is active
      if (hologramAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = hologramAlpha * 0.85;

        // Render radial slices of pattern
        const patFn = patternData[state.pattern];
        const stepTheta = (Math.PI * 2) / slices;

        for (let s = 0; s < slices; s++) {
          const curTheta = s * stepTheta;
          for (let l = 1; l <= ledCount; l++) {
            const rRatio = l / ledCount;
            const pixel = patFn(rRatio, curTheta);
            if (pixel) {
              const r = rRatio * maxRadius;
              const px = centerX + Math.cos(curTheta) * r;
              const py = centerY + Math.sin(curTheta) * r;

              ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a})`;
              ctx.beginPath();
              // Dot with subtle glow
              const dotSize = 1.3 + (rRatio * 0.8);
              ctx.arc(px, py, dotSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.restore();
      }

      // Draw the physical rotating blade / LED strip
      // At high speed (1200 RPM), the blade itself physically blurs out and becomes faint
      const bladeAlpha = Math.max(0.12, 1 - (state.rpm / 1200) * 0.75);
      const bladeAngle = state.angle;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(bladeAngle);

      // Mechanical blade arm
      ctx.strokeStyle = `rgba(166, 197, 228, ${bladeAlpha * 0.5})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(maxRadius + 4, 0);
      ctx.stroke();

      // Individual LEDs on the blade
      const patFn = patternData[state.pattern];
      for (let l = 1; l <= ledCount; l++) {
        const rRatio = l / ledCount;
        const r = rRatio * maxRadius;
        const pixel = patFn(rRatio, bladeAngle);

        if (pixel) {
          // LED is lit
          ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, 1)`;
          ctx.shadowColor = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(r, 0, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // LED is off
          ctx.fillStyle = `rgba(70, 90, 120, ${bladeAlpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(r, 0, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // Center motor axle / bearing
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#38bdf8";
      ctx.stroke();
      ctx.restore();

      // Hall effect sensor representation at 0 rad (right side)
      ctx.save();
      const hallX = centerX + maxRadius + 14;
      const hallY = centerY;
      ctx.beginPath();
      ctx.arc(hallX, hallY, 4, 0, Math.PI * 2);
      ctx.fillStyle = isHallTriggered ? "#22c55e" : "#334155";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isHallTriggered ? "#86efac" : "#64748b";
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isHallTriggered]);

  const presets = [
    { label: "0 RPM", value: 0, desc: lang === "fr" ? "Arrêt" : "Stop" },
    { label: "120 RPM", value: 120, desc: lang === "fr" ? "Points défilants" : "Scrolling dots" },
    { label: "600 RPM", value: 600, desc: lang === "fr" ? "Persistance partielle" : "Partial trail" },
    { label: "1200 RPM", value: 1200, desc: lang === "fr" ? "Hologramme net" : "Crisp hologram" },
  ];

  return (
    <div className="pov-demo flex flex-col items-center justify-between w-full h-full p-3 select-none">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-mono border-b border-ice-800/60 bg-slate-950/40 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-ice-300 font-semibold tracking-wider uppercase">
            POV Engine · {rpm} RPM
          </span>
          <span className="text-ice-500">
            ({(rpm / 60).toFixed(1)} Hz)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-ice-400">
            {lang === "fr" ? "Capteur Hall :" : "Hall Sensor :"}
          </span>
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full transition-colors duration-75 ${
              isHallTriggered ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-700"
            }`}
            title="Hall Effect Magnet Trigger (1 pulse/rev)"
          />
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative flex items-center justify-center my-auto w-full">
        <canvas
          ref={canvasRef}
          style={{ width: 420, height: 210, maxWidth: "100%", maxHeight: "210px" }}
          className="rounded-lg shadow-inner bg-slate-950"
        />

        {/* Floating status label when 1200 RPM is reached */}
        {rpm >= 1100 && (
          <div className="absolute bottom-2 left-3 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur pointer-events-none">
            ⚡ {lang === "fr" ? "Persistance rétinienne : 100% active" : "Persistence of vision: 100% active"}
          </div>
        )}
      </div>

      {/* Controls & Presets */}
      <div className="w-full bg-slate-950/80 border border-ice-800/60 rounded-b-lg p-2.5 space-y-2">
        {/* RPM Slider */}
        <div className="flex items-center gap-3">
          <label htmlFor={sliderId} className="text-[11px] font-mono text-ice-300 whitespace-nowrap min-w-[75px]">
            {lang === "fr" ? "Vitesse :" : "Speed :"}
          </label>
          <input
            id={sliderId}
            type="range"
            min="0"
            max="1200"
            step="10"
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
          <span className="text-[11px] font-mono text-cyan-300 w-16 text-right font-bold">
            {rpm} RPM
          </span>
        </div>

        {/* Quick presets & Pattern selection */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1">
            {presets.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setRpm(p.value)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all ${
                  rpm === p.value
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-900 text-ice-400 hover:text-ice-200 border border-slate-800"
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-ice-400 font-mono hidden sm:inline">
              {lang === "fr" ? "Motif :" : "Pattern :"}
            </span>
            {(["nexos", "radar", "telemetry"] as PatternType[]).map((pat) => (
              <button
                key={pat}
                type="button"
                onClick={() => setPattern(pat)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider transition-all ${
                  pattern === pat
                    ? "bg-blue-600/30 text-blue-300 border border-blue-400/50"
                    : "bg-slate-900 text-ice-400 hover:text-ice-200 border border-slate-800"
                }`}
              >
                {pat === "nexos" ? "Logo" : pat === "radar" ? "Radar" : "Jauge"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
