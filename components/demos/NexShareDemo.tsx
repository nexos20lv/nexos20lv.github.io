"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type Step = "idle" | "signaling" | "connected" | "transferring" | "completed";

interface FileOption {
  name: string;
  sizeMb: number;
  type: string;
}

const FILES: FileOption[] = [
  { name: "dataset_lidar_3d.tar.gz", sizeMb: 45.2, type: "Archive" },
  { name: "payload_firmware.bin", sizeMb: 18.4, type: "Binary" },
  { name: "video_render_4k.mp4", sizeMb: 84.6, type: "Media" },
];

export default function NexShareDemo() {
  const { lang } = useLanguage();
  const [step, setStep] = useState<Step>("idle");
  const [selectedFile, setSelectedFile] = useState<FileOption>(FILES[0]);
  const [progress, setProgress] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [roomCode] = useState<string>("NXS-7842");
  const animRef = useRef<number | null>(null);

  // Handle transfer progression loop
  useEffect(() => {
    if (step !== "transferring") return;

    let currentProgress = 0;
    const duration = 4000; // 4 seconds simulated transfer
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      currentProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(currentProgress);

      // Fluctuate speed around 140-165 MB/s
      const simulatedSpeed = 135 + Math.sin(now / 150) * 15 + Math.random() * 8;
      setSpeed(Number(simulatedSpeed.toFixed(1)));

      if (currentProgress < 100) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setStep("completed");
        setSpeed(0);
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [step]);

  const handleStartSignaling = () => {
    setStep("signaling");
    setTimeout(() => {
      setStep("connected");
    }, 1400);
  };

  const handleStartTransfer = () => {
    setProgress(0);
    setStep("transferring");
  };

  const handleReset = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setProgress(0);
    setSpeed(0);
    setStep("idle");
  };

  return (
    <div className="nexshare-demo flex flex-col justify-between w-full h-full p-3 font-sans select-none text-ice-100">
      {/* Top Protocol Status Bar */}
      <div className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-mono border-b border-ice-800/60 bg-slate-950/40 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              step === "idle"
                ? "bg-slate-500"
                : step === "signaling"
                ? "bg-amber-400 animate-pulse"
                : step === "transferring"
                ? "bg-cyan-400 animate-ping"
                : "bg-emerald-400"
            }`}
          />
          <span className="text-ice-300 font-semibold uppercase tracking-wider">
            WebRTC DataChannel
          </span>
          <span className="text-ice-500 hidden sm:inline">
            {step === "idle" && (lang === "fr" ? "· En attente" : "· Standby")}
            {step === "signaling" && (lang === "fr" ? "· Négociation SDP / ICE..." : "· SDP/ICE Handshake...")}
            {step === "connected" && (lang === "fr" ? "· Tunnel P2P Ouvert" : "· P2P Direct Ready")}
            {step === "transferring" && (lang === "fr" ? "· Flux Chiffré en cours" : "· Encrypted Stream Active")}
            {step === "completed" && (lang === "fr" ? "· Transfert Terminé" : "· Complete (SHA-256 OK)")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-ice-400 text-[10px]">
            Code: <strong className="text-cyan-300">{roomCode}</strong>
          </span>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div className="relative flex items-center justify-between w-full my-auto px-4 py-3">
        {/* Node A (Sender) */}
        <div className="flex flex-col items-center z-10 w-24 sm:w-28 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span className="font-mono text-xs font-semibold text-ice-200 mt-1">
            {lang === "fr" ? "Pair A" : "Peer A"}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">
            {lang === "fr" ? "Paris · Source" : "Paris · Source"}
          </span>
        </div>

        {/* Central Channel / Tunnel Visualization */}
        <div className="relative flex-1 flex flex-col items-center justify-center mx-2 sm:mx-6 h-24">
          {/* Ephemeral Signaling Server (Ghost node above) */}
          <div className="absolute -top-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-[9px] font-mono text-ice-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                step === "signaling" ? "bg-amber-400 animate-ping" : "bg-slate-600"
              }`}
            />
            <span>{lang === "fr" ? "Serveur Signalisation (SDP)" : "Signaling Broker (SDP)"}</span>
          </div>

          {/* Connection Line */}
          <div className="w-full relative flex items-center justify-center my-auto">
            {/* Background dashed path */}
            <div
              className={`w-full h-1 rounded transition-colors duration-500 ${
                step === "idle"
                  ? "bg-slate-800"
                  : step === "signaling"
                  ? "bg-amber-500/40"
                  : "bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
              }`}
            />

            {/* Flying animated packets during transfer */}
            {step === "transferring" && (
              <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none">
                <span className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] animate-[pulse_0.4s_ease-in-out_infinite] absolute left-[15%] transform -translate-y-1/2" />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa] absolute left-[50%] transform -translate-y-1/2" />
                <span className="w-3 h-3 rounded-full bg-cyan-200 shadow-[0_0_12px_#38bdf8] absolute left-[85%] transform -translate-y-1/2" />
              </div>
            )}

            {/* Center Lock / Status Badge */}
            <div className="absolute bg-slate-950 border border-ice-700/70 rounded-full px-2 py-1 flex items-center gap-1 text-[10px] font-mono shadow-lg">
              {step === "idle" && (
                <span className="text-slate-400">P2P Ready</span>
              )}
              {step === "signaling" && (
                <span className="text-amber-300 animate-pulse">ICE Gathering</span>
              )}
              {(step === "connected" || step === "transferring" || step === "completed") && (
                <>
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-cyan-300 font-semibold">AES-256 E2E</span>
                </>
              )}
            </div>
          </div>

          {/* Real-time Transfer Stats */}
          {step === "transferring" && (
            <div className="absolute -bottom-1 flex items-center gap-3 text-[10px] font-mono text-cyan-300 bg-slate-950/90 border border-cyan-500/30 px-2 py-0.5 rounded">
              <span>{speed} Mo/s</span>
              <span className="text-ice-500">|</span>
              <span>{progress.toFixed(0)}%</span>
              <span className="text-ice-500">|</span>
              <span className="text-emerald-400">RTT 9ms</span>
            </div>
          )}

          {step === "completed" && (
            <div className="absolute -bottom-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-slate-950/90 border border-emerald-500/40 px-2 py-0.5 rounded">
              <span>✓ SHA-256 Validated</span>
            </div>
          )}
        </div>

        {/* Node B (Receiver) */}
        <div className="flex flex-col items-center z-10 w-24 sm:w-28 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-blue-500/50 flex items-center justify-center text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.25)]">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <span className="font-mono text-xs font-semibold text-ice-200 mt-1">
            {lang === "fr" ? "Pair B" : "Peer B"}
          </span>
          <span className="text-[10px] text-blue-400 font-mono">
            {lang === "fr" ? "Lyon · Cible" : "Lyon · Target"}
          </span>
        </div>
      </div>

      {/* Progress Bar (visible during or after transfer) */}
      {(step === "transferring" || step === "completed") && (
        <div className="w-full px-2 mb-2">
          <div className="flex justify-between text-[10px] font-mono text-ice-400 mb-1">
            <span>{selectedFile.name}</span>
            <span>{((selectedFile.sizeMb * progress) / 100).toFixed(1)} / {selectedFile.sizeMb} Mo</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-100 ${
                step === "completed"
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  : "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_#22d3ee]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="w-full bg-slate-950/80 border border-ice-800/60 rounded-b-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
        {step === "idle" && (
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-mono text-ice-400">
              {lang === "fr" ? "Prêt à établir la liaison directe sans serveur" : "Ready to establish direct serverless link"}
            </span>
            <button
              type="button"
              onClick={handleStartSignaling}
              className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            >
              {lang === "fr" ? "1. Connecter les Pairs (P2P)" : "1. Connect Peers (P2P)"}
            </button>
          </div>
        )}

        {step === "signaling" && (
          <div className="w-full flex items-center justify-center py-1">
            <span className="text-xs font-mono text-amber-300 animate-pulse">
              ⚡ {lang === "fr" ? "Échange des candidats ICE et négociation WebRTC..." : "Gathering ICE candidates & negotiating WebRTC..."}
            </span>
          </div>
        )}

        {step === "connected" && (
          <div className="w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-ice-400">
                {lang === "fr" ? "Fichier :" : "File :"}
              </span>
              {FILES.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setSelectedFile(f)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all ${
                    selectedFile.name === f.name
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                      : "bg-slate-900 text-ice-400 hover:text-ice-200 border border-slate-800"
                  }`}
                >
                  {f.name} ({f.sizeMb} Mo)
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleStartTransfer}
              className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            >
              {lang === "fr" ? "2. Envoyer en direct" : "2. Send Direct Stream"}
            </button>
          </div>
        )}

        {step === "transferring" && (
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-mono text-cyan-300 animate-pulse">
              🚀 {lang === "fr" ? "Diffusion P2P en cours sans passer par aucun serveur..." : "Direct P2P streaming without any intermediate server..."}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-ice-400 hover:text-ice-200 border border-slate-800"
            >
              {lang === "fr" ? "Annuler" : "Cancel"}
            </button>
          </div>
        )}

        {step === "completed" && (
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-400">
              ✓ {lang === "fr" ? "Fichier transmis avec succès à 100% en P2P !" : "File successfully transferred 100% peer-to-peer!"}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all"
            >
              {lang === "fr" ? "Recommencer" : "Restart"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

