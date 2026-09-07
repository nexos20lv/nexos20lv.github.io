"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { nexsuAudio } from "./audio";

interface CircleTarget {
  id: number;
  x: number;
  y: number;
  spawnTime: number;
  hitTime: number; // exact target hit time in ms
  radius: number;
  number: number;
  color: string;
  isHit: boolean;
  isMissed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

interface HitBurst {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

type GameState = "countdown" | "playing" | "results" | "failed";

const GAME_DURATION = 32000; // 32 seconds session
const APPROACH_DURATION = 750; // ms before hit time when circle appears

export default function NexsuGame({ onClose }: { onClose: () => void }) {
  const { lang } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("countdown");
  const [countdown, setCountdown] = useState<number>(3);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Stats
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [hp, setHp] = useState<number>(100);
  const [hits300, setHits300] = useState<number>(0);
  const [hits100, setHits100] = useState<number>(0);
  const [hits50, setHits50] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);

  // Live state refs for 60fps canvas loop
  const stateRef = useRef({
    gameState: "countdown" as GameState,
    startTime: 0,
    mousePos: { x: 0, y: 0 },
    targets: [] as CircleTarget[],
    particles: [] as Particle[],
    bursts: [] as HitBurst[],
    score: 0,
    combo: 0,
    maxCombo: 0,
    hp: 100,
    hits300: 0,
    hits100: 0,
    hits50: 0,
    misses: 0,
  });

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      nexsuAudio.setMuted(next);
      return next;
    });
  };

  // Generate beatmap targets
  const generateBeatmap = (startOffset: number) => {
    const targets: CircleTarget[] = [];
    const colors = ["#38bdf8", "#f43f5e", "#a855f7", "#34d399"];
    const beatInterval = (60 / 130) * 1000; // ~461.5 ms per beat

    let id = 1;
    let comboNum = 1;
    let prevX = 360;
    let prevY = 240;

    // Generate ~55 rhythmic circles
    for (let t = 1200; t < GAME_DURATION - 2000; t += beatInterval) {
      // Occasional half-beat jumps
      const shouldSpawn = Math.random() > 0.15;
      if (!shouldSpawn) {
        comboNum = 1;
        continue;
      }

      // Generate coordinate keeping away from canvas borders
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 140;
      let x = prevX + Math.cos(angle) * dist;
      let y = prevY + Math.sin(angle) * dist;

      x = Math.max(70, Math.min(650, x));
      y = Math.max(70, Math.min(410, y));

      prevX = x;
      prevY = y;

      targets.push({
        id: id++,
        x,
        y,
        spawnTime: startOffset + t - APPROACH_DURATION,
        hitTime: startOffset + t,
        radius: 34,
        number: comboNum,
        color: colors[Math.floor((id / 6) % colors.length)],
        isHit: false,
        isMissed: false,
      });

      comboNum = (comboNum % 4) + 1;
    }

    return targets;
  };

  // Check hit logic (shared between mouse click and Z/X keyboard keys)
  const attemptHit = useCallback(() => {
    const state = stateRef.current;
    if (state.gameState !== "playing") return;

    const now = performance.now();
    const { x: mx, y: my } = state.mousePos;

    // Find the oldest active target that mouse is hovering over
    const candidate = state.targets.find((target) => {
      if (target.isHit || target.isMissed) return false;
      if (now < target.spawnTime) return false;
      const dx = target.x - mx;
      const dy = target.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= target.radius + 18;
    });

    if (!candidate) return;

    const delta = Math.abs(now - candidate.hitTime);

    if (delta <= 65) {
      // 300 (Perfect)
      candidate.isHit = true;
      state.hits300++;
      setHits300(state.hits300);
      state.combo++;
      setCombo(state.combo);
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      setMaxCombo(state.maxCombo);
      state.score += 300 * Math.max(1, Math.floor(state.combo / 5));
      setScore(state.score);
      state.hp = Math.min(100, state.hp + 5);
      setHp(state.hp);

      nexsuAudio.playHit300();
      spawnBurst(candidate.x, candidate.y, "300", "#38bdf8");
      spawnParticles(candidate.x, candidate.y, candidate.color, 16);
    } else if (delta <= 125) {
      // 100 (Great)
      candidate.isHit = true;
      state.hits100++;
      setHits100(state.hits100);
      state.combo++;
      setCombo(state.combo);
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      setMaxCombo(state.maxCombo);
      state.score += 100 * Math.max(1, Math.floor(state.combo / 5));
      setScore(state.score);
      state.hp = Math.min(100, state.hp + 2);
      setHp(state.hp);

      nexsuAudio.playHit100();
      spawnBurst(candidate.x, candidate.y, "100", "#34d399");
      spawnParticles(candidate.x, candidate.y, candidate.color, 10);
    } else if (delta <= 180) {
      // 50 (OK)
      candidate.isHit = true;
      state.hits50++;
      setHits50(state.hits50);
      state.combo++;
      setCombo(state.combo);
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      setMaxCombo(state.maxCombo);
      state.score += 50;
      setScore(state.score);

      nexsuAudio.playHit50();
      spawnBurst(candidate.x, candidate.y, "50", "#f59e0b");
      spawnParticles(candidate.x, candidate.y, candidate.color, 6);
    }
  }, []);

  const spawnBurst = (x: number, y: number, text: string, color: string) => {
    stateRef.current.bursts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1.4,
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: 2.5 + Math.random() * 2,
      });
    }
  };

  // Keyboard controls: ESC to quit, Z / X to hit!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        nexsuAudio.stopMusic();
        onClose();
        return;
      }

      if (e.key === "z" || e.key === "Z" || e.key === "x" || e.key === "X") {
        attemptHit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attemptHit, onClose]);

  // Handle Countdown 3-2-1
  useEffect(() => {
    if (gameState !== "countdown") return;

    let count = 3;
    nexsuAudio.playCountdown(false);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        nexsuAudio.playCountdown(false);
      } else {
        clearInterval(interval);
        setGameState("playing");
        stateRef.current.gameState = "playing";
        stateRef.current.startTime = performance.now();
        stateRef.current.targets = generateBeatmap(stateRef.current.startTime);

        nexsuAudio.playCountdown(true);
        nexsuAudio.startMusic();
      }
    }, 850);

    return () => clearInterval(interval);
  }, [gameState]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = 720;
    const height = 480;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      const state = stateRef.current;
      const now = performance.now();

      // Clear with dark space gradient
      ctx.fillStyle = "#050b16";
      ctx.fillRect(0, 0, width, height);

      // Cyberpunk grid backdrop
      ctx.strokeStyle = "rgba(30, 58, 100, 0.25)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (state.gameState === "playing") {
        // Check game timer
        const elapsed = now - state.startTime;
        if (elapsed >= GAME_DURATION) {
          state.gameState = "results";
          setGameState("results");
          nexsuAudio.stopMusic();
        }

        // Draw and update targets
        for (const target of state.targets) {
          if (target.isHit) continue;

          // Check if missed (time expired beyond window)
          if (!target.isMissed && now > target.hitTime + 180) {
            target.isMissed = true;
            state.misses++;
            setMisses(state.misses);
            state.combo = 0;
            setCombo(0);
            state.hp = Math.max(0, state.hp - 10);
            setHp(state.hp);

            nexsuAudio.playMiss();
            spawnBurst(target.x, target.y, "MISS", "#f43f5e");

            // Check if player failed HP
            if (state.hp <= 0) {
              state.gameState = "failed";
              setGameState("failed");
              nexsuAudio.stopMusic();
            }
          }

          if (now < target.spawnTime || target.isMissed) continue;

          // Target is currently active on screen
          const progress = (now - target.spawnTime) / APPROACH_DURATION;
          const approachRadius = Math.max(
            target.radius,
            target.radius * (3.0 - progress * 2.0)
          );

          // Inner Circle Body
          ctx.save();
          ctx.beginPath();
          ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(10, 20, 40, 0.85)";
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = target.color;
          ctx.shadowColor = target.color;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Number inside
          ctx.fillStyle = "#f8fbff";
          ctx.font = "bold 20px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(target.number), target.x, target.y);

          // Outer Approach Circle
          ctx.beginPath();
          ctx.arc(target.x, target.y, approachRadius, 0, Math.PI * 2);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = target.color;
          ctx.stroke();
          ctx.restore();
        }

        // Update and draw floating hit bursts
        for (let i = state.bursts.length - 1; i >= 0; i--) {
          const b = state.bursts[i];
          b.alpha -= 0.025;
          b.y -= 0.8;
          b.scale = Math.max(1, b.scale - 0.02);

          if (b.alpha <= 0) {
            state.bursts.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = b.alpha;
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 12;
          ctx.font = `bold ${Math.floor(22 * b.scale)}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(b.text, b.x, b.y);
          ctx.restore();
        }

        // Update and draw particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const p = state.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.alpha -= 0.03;

          if (p.alpha <= 0) {
            state.particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Cursor crosshair ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(state.mousePos.x, state.mousePos.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(state.mousePos.x, state.mousePos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fbff";
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      nexsuAudio.stopMusic();
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 720 / rect.width;
    const scaleY = 480 / rect.height;

    stateRef.current.mousePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = () => {
    attemptHit();
  };

  const calculateAccuracy = () => {
    const total = hits300 + hits100 + hits50 + misses;
    if (total === 0) return 100;
    const points = hits300 * 300 + hits100 * 100 + hits50 * 50;
    const maxPoints = total * 300;
    return Math.round((points / maxPoints) * 1000) / 10;
  };

  const calculateGrade = () => {
    const acc = calculateAccuracy();
    if (acc === 100 && misses === 0) return { grade: "SS", color: "text-amber-300" };
    if (acc >= 95 && misses === 0) return { grade: "S", color: "text-cyan-300" };
    if (acc >= 90) return { grade: "A", color: "text-emerald-400" };
    if (acc >= 80) return { grade: "B", color: "text-blue-400" };
    if (acc >= 70) return { grade: "C", color: "text-purple-400" };
    return { grade: "D", color: "text-rose-400" };
  };

  const handleRestart = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHp(100);
    setHits300(0);
    setHits100(0);
    setHits50(0);
    setMisses(0);

    stateRef.current.score = 0;
    stateRef.current.combo = 0;
    stateRef.current.maxCombo = 0;
    stateRef.current.hp = 100;
    stateRef.current.hits300 = 0;
    stateRef.current.hits100 = 0;
    stateRef.current.hits50 = 0;
    stateRef.current.misses = 0;
    stateRef.current.particles = [];
    stateRef.current.bursts = [];

    setCountdown(3);
    setGameState("countdown");
    stateRef.current.gameState = "countdown";
  };

  const accuracy = calculateAccuracy();
  const { grade, color: gradeColor } = calculateGrade();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col">
        {/* Top Arcade Chrome */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-extrabold text-sm tracking-wider">
              NeXsu!
            </span>
            <span className="text-slate-500 hidden sm:inline">
              · 130 BPM Cyber Rhythm
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] text-cyan-300">
              Contrôles : Souris ou Touches [Z] & [X]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-ice-300 text-xs transition-colors"
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? "🔇 Mute" : "🔊 Audio"}
            </button>
            <button
              type="button"
              onClick={() => {
                nexsuAudio.stopMusic();
                onClose();
              }}
              className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* HUD Bar (during play) */}
        {gameState === "playing" && (
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            {/* Health Bar */}
            <div className="flex items-center gap-2 w-1/3">
              <span className="text-[10px] text-slate-400">HP</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-100 ${
                    hp > 50 ? "bg-cyan-400" : hp > 25 ? "bg-amber-400" : "bg-rose-500 animate-pulse"
                  }`}
                  style={{ width: `${hp}%` }}
                />
              </div>
            </div>

            {/* Score */}
            <div className="text-cyan-300 font-bold text-base tracking-widest">
              {String(score).padStart(7, "0")}
            </div>

            {/* Accuracy & Combo */}
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-semibold">{accuracy}%</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                {combo}x
              </span>
            </div>
          </div>
        )}

        {/* Canvas Game Area */}
        <div className="relative flex items-center justify-center bg-slate-950 aspect-[3/2] max-h-[480px]">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            className="w-full h-full cursor-crosshair block"
          />

          {/* Countdown Overlay */}
          {gameState === "countdown" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-none">
              <span className="text-8xl font-black text-cyan-400 animate-ping font-mono">
                {countdown}
              </span>
              <span className="text-sm font-mono text-ice-300 mt-6 tracking-widest uppercase">
                {lang === "fr" ? "Préparez vos clics ou touches Z & X" : "Get ready! Click or press Z & X"}
              </span>
            </div>
          )}

          {/* Results Screen */}
          {gameState === "results" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 animate-fade-in">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400 mb-1">
                SESSION TERMINÉE
              </span>
              <h2 className="text-3xl font-bold text-white mb-6">Résultats NeXsu!</h2>

              <div className="flex items-center gap-8 mb-6">
                <span className={`text-7xl font-black font-mono ${gradeColor} drop-shadow-[0_0_20px_currentColor]`}>
                  {grade}
                </span>
                <div className="space-y-1 font-mono text-sm text-slate-300">
                  <div>Score Total : <strong className="text-cyan-300 font-bold">{score.toLocaleString()}</strong></div>
                  <div>Précision : <strong className="text-emerald-400">{accuracy}%</strong></div>
                  <div>Max Combo : <strong className="text-amber-300">{maxCombo}x</strong></div>
                </div>
              </div>

              <div className="flex gap-4 text-xs font-mono text-slate-400 mb-6 border-y border-slate-800 py-2 px-6">
                <span>300: <strong className="text-cyan-400">{hits300}</strong></span>
                <span>100: <strong className="text-emerald-400">{hits100}</strong></span>
                <span>50: <strong className="text-amber-400">{hits50}</strong></span>
                <span>Miss: <strong className="text-rose-400">{misses}</strong></span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Rejouer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    nexsuAudio.stopMusic();
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-all border border-slate-700"
                >
                  Quitter (ESC)
                </button>
              </div>
            </div>
          )}

          {/* Failed Screen */}
          {gameState === "failed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/90 backdrop-blur-md p-6 animate-fade-in">
              <span className="text-5xl font-black text-rose-500 font-mono mb-2">
                FAILED
              </span>
              <p className="text-rose-200 text-xs font-mono mb-6">
                La jauge d&apos;énergie est tombée à zéro !
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold font-mono text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                >
                  Réessayer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    nexsuAudio.stopMusic();
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-all border border-slate-700"
                >
                  Quitter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Touche Échap pour quitter</span>
          <span className="text-cyan-400/80">NeXsu v1.0 · Easter Egg Edition</span>
        </div>
      </div>
    </div>
  );
}
