"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useLenis } from "lenis/react";
import { useLanguage } from "./LanguageProvider";

export default function PageLoader() {
  const { progress: dreiProgress, active: dreiActive } = useProgress();
  const lenis = useLenis();
  const { lang } = useLanguage();

  const [visualProgress, setVisualProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);

  // Lock scrolling while the loader is displayed
  useEffect(() => {
    if (!isReady) {
      document.body.style.overflow = "hidden";
      lenis?.stop();
    } else {
      document.body.style.overflow = "";
      lenis?.start();
    }

    return () => {
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [isReady, lenis]);

  // Smoothly increment visual progress towards target
  useEffect(() => {
    let animFrame: number;
    const startTime = Date.now();
    const minDuration = 1200; // minimum display time in ms to avoid jarring flashes

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const timeRatio = Math.min(1, elapsed / minDuration);

      // Drei progress is between 0 and 100
      // If Drei is still loading, cap at 90% until it finishes
      const targetFromDrei = dreiActive ? Math.min(90, dreiProgress) : 100;
      const combinedTarget = Math.max(timeRatio * 90, targetFromDrei);

      setVisualProgress((prev) => {
        const next = prev + (combinedTarget - prev) * 0.12;
        if (next >= 99 && timeRatio >= 1 && (!dreiActive || dreiProgress >= 100)) {
          return 100;
        }
        return Math.min(99.4, next);
      });

      if (elapsed >= minDuration && (!dreiActive || dreiProgress >= 100)) {
        setVisualProgress(100);
        setTimeout(() => {
          setIsReady(true);
          setTimeout(() => {
            setIsUnmounted(true);
          }, 700); // match fade-out duration
        }, 300);
        return;
      }

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);

    // Fallback maximum timeout so the user is never stuck
    const safetyTimer = setTimeout(() => {
      setVisualProgress(100);
      setIsReady(true);
      setTimeout(() => setIsUnmounted(true), 700);
    }, 3500);

    return () => {
      cancelAnimationFrame(animFrame);
      clearTimeout(safetyTimer);
    };
  }, [dreiProgress, dreiActive]);

  if (isUnmounted) return null;

  const currentPercent = Math.round(visualProgress);

  const statusText =
    currentPercent < 35
      ? lang === "fr"
        ? "Initialisation de la scène 3D..."
        : "Initializing 3D environment..."
      : currentPercent < 75
      ? lang === "fr"
        ? "Compilation des shaders & textures..."
        : "Compiling shaders & textures..."
      : currentPercent < 100
      ? lang === "fr"
        ? "Préparation de l'interface..."
        : "Preparing interface..."
      : lang === "fr"
      ? "Prêt"
      : "Ready";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#090514] transition-all duration-700 ease-out select-none ${
        isReady ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      aria-hidden={isReady}
    >
      {/* Background ambient glow / aurora */}
      <div className="absolute w-96 h-96 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/10 blur-[90px] pointer-events-none translate-y-12" />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center max-w-xs text-center px-4">
        {/* Animated logo */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-ink-1/90 border border-ice-700/40 p-3 shadow-[0_0_30px_rgba(124,58,237,0.35)] flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="NeXoS_20"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(167,139,250,0.6)] animate-pulse"
            />
          </div>
          {/* Subtle spinning ring */}
          <div className="absolute -inset-1.5 rounded-2xl border border-cyan-400/20 animate-spin" style={{ animationDuration: "8s" }} />
        </div>

        {/* Title */}
        <h2 className="text-base font-bold tracking-tight text-ice-50 mb-1">
          NeXoS_20
        </h2>

        {/* Status text */}
        <p className="text-xs text-ice-400 h-5 mb-5 font-normal tracking-wide transition-colors">
          {statusText}
        </p>

        {/* Progress bar */}
        <div className="w-60 h-1.5 bg-white/10 rounded-full overflow-hidden relative shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ width: `${visualProgress}%` }}
          />
        </div>

        {/* Percentage Counter */}
        <span className="font-mono text-xs font-semibold tracking-widest text-ice-300/80">
          {currentPercent}%
        </span>
      </div>
    </div>
  );
}
