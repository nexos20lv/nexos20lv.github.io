"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type Tab = "pv" | "vg" | "lv" | "logs";

interface LogicalVolume {
  id: string;
  name: string;
  vg: string;
  sizeGb: number;
  fs: string;
  mount: string;
  status: string;
}

const INITIAL_LVS: LogicalVolume[] = [
  { id: "1", name: "lv_root", vg: "vg_system", sizeGb: 60, fs: "ext4", mount: "/", status: "ACTIVE" },
  { id: "2", name: "lv_home", vg: "vg_system", sizeGb: 296, fs: "xfs", mount: "/home", status: "ACTIVE" },
  { id: "3", name: "lv_docker", vg: "vg_data", sizeGb: 800, fs: "btrfs", mount: "/var/lib/docker", status: "ACTIVE" },
  { id: "4", name: "lv_backup", vg: "vg_data", sizeGb: 600, fs: "ext4", mount: "/mnt/backup", status: "ACTIVE" },
];

export default function LvmDemo() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("lv");
  const [lvs, setLvs] = useState<LogicalVolume[]>(INITIAL_LVS);
  const [selectedLvIndex, setSelectedLvIndex] = useState<number>(2); // Default to lv_docker
  const [showExtendModal, setShowExtendModal] = useState<boolean>(false);
  const [extendAmount, setExtendAmount] = useState<number>(50);
  const [logs, setLogs] = useState<string[]>([
    "systemd-udevd[412]: Scanning LVM storage subsystems...",
    "lvm[520]: 3 PVs found, 2 VGs active, 4 LVs mounted cleanly.",
    "kernel: [ 1.412892] LVM2: Device-mapper driver initialized.",
    "lvm-manager-pro: Textual TUI session started on /dev/pts/2.",
  ]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for authentic Textual TUI experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting ESC so parent modal can close
      if (e.key === "Escape") {
        if (showExtendModal) {
          e.stopPropagation();
          setShowExtendModal(false);
        }
        return;
      }

      if (e.key === "1") setActiveTab("pv");
      if (e.key === "2") setActiveTab("vg");
      if (e.key === "3") setActiveTab("lv");
      if (e.key === "4") setActiveTab("logs");

      if (activeTab === "lv" && !showExtendModal) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedLvIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedLvIndex((prev) => Math.min(lvs.length - 1, prev + 1));
        } else if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          setShowExtendModal(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, showExtendModal, lvs.length]);

  const handleApplyExtend = () => {
    const target = lvs[selectedLvIndex];
    if (!target) return;

    const oldSize = target.sizeGb;
    const newSize = oldSize + extendAmount;

    setLvs((prev) =>
      prev.map((lv, idx) => (idx === selectedLvIndex ? { ...lv, sizeGb: newSize } : lv))
    );

    const now = new Date().toTimeString().split(" ")[0];
    setLogs((prev) => [
      ...prev,
      `[${now}] root: lvextend -L +${extendAmount}G /dev/${target.vg}/${target.name} -r`,
      `[${now}] lvm: Size of /dev/${target.vg}/${target.name} changed: ${oldSize}.00 GiB -> ${newSize}.00 GiB.`,
      `[${now}] resize2fs: Filesystem online resize completed successfully.`,
    ]);

    setShowExtendModal(false);
  };

  const handleReset = () => {
    setLvs(INITIAL_LVS);
    setSelectedLvIndex(2);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toTimeString().split(" ")[0]}] lvm: Configuration restored to default mock state.`,
    ]);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="lvm-demo flex flex-col justify-between w-full h-full p-2.5 font-mono text-xs select-none bg-slate-950 text-slate-200 focus:outline-none rounded-lg border border-slate-800 shadow-2xl relative overflow-hidden"
    >
      {/* Textual Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] rounded-t">
        <div className="flex items-center gap-2">
          <span className="font-bold text-cyan-400">LVM Manager Pro</span>
          <span className="text-slate-500">v1.4.2</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">Host: debian-srv01</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>

      {/* Textual Tabs Navigation */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/60 border-b border-slate-800 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab("pv")}
          className={`px-2.5 py-0.5 rounded transition-all ${
            activeTab === "pv"
              ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          [1] PV (Physique)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vg")}
          className={`px-2.5 py-0.5 rounded transition-all ${
            activeTab === "vg"
              ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          [2] VG (Groupes)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("lv")}
          className={`px-2.5 py-0.5 rounded transition-all ${
            activeTab === "lv"
              ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          [3] LV (Logiques)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`px-2.5 py-0.5 rounded transition-all ${
            activeTab === "logs"
              ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          [4] Logs
        </button>
      </div>

      {/* Main Body Viewport */}
      <div className="flex-1 p-2 overflow-y-auto min-h-[140px]">
        {/* Tab 1: Physical Volumes (PV) */}
        {activeTab === "pv" && (
          <div className="space-y-1.5 text-[11px]">
            <div className="grid grid-cols-5 text-slate-500 font-bold pb-1 border-b border-slate-800">
              <span>Device</span>
              <span>VG</span>
              <span>Total</span>
              <span>Libre</span>
              <span>Utilisation</span>
            </div>
            <div className="grid grid-cols-5 py-1 text-slate-300 hover:bg-slate-900/60 rounded px-1">
              <span className="text-cyan-300">/dev/nvme0n1p3</span>
              <span>vg_system</span>
              <span>476.9 GB</span>
              <span className="text-emerald-400">120.0 GB</span>
              <span className="text-amber-400">[███████░░░] 74%</span>
            </div>
            <div className="grid grid-cols-5 py-1 text-slate-300 hover:bg-slate-900/60 rounded px-1">
              <span className="text-cyan-300">/dev/sda2</span>
              <span>vg_data</span>
              <span>1.82 TB</span>
              <span className="text-emerald-400">420.0 GB</span>
              <span className="text-blue-400">[████████░░] 77%</span>
            </div>
            <div className="grid grid-cols-5 py-1 text-slate-300 hover:bg-slate-900/60 rounded px-1">
              <span className="text-cyan-300">/dev/sdb1</span>
              <span className="text-slate-500">-- libre --</span>
              <span>500.0 GB</span>
              <span className="text-emerald-400">500.0 GB</span>
              <span className="text-slate-500">[░░░░░░░░░░] 0%</span>
            </div>
          </div>
        )}

        {/* Tab 2: Volume Groups (VG) */}
        {activeTab === "vg" && (
          <div className="space-y-1.5 text-[11px]">
            <div className="grid grid-cols-5 text-slate-500 font-bold pb-1 border-b border-slate-800">
              <span>Nom VG</span>
              <span>PVs / LVs</span>
              <span>Taille Totale</span>
              <span>Espace Libre</span>
              <span>Taille PE</span>
            </div>
            <div className="grid grid-cols-5 py-1 text-slate-300 hover:bg-slate-900/60 rounded px-1">
              <span className="text-cyan-300 font-bold">vg_system</span>
              <span>1 PV / 2 LV</span>
              <span>476.94 GiB</span>
              <span className="text-emerald-400">120.00 GiB</span>
              <span>4.00 MiB</span>
            </div>
            <div className="grid grid-cols-5 py-1 text-slate-300 hover:bg-slate-900/60 rounded px-1">
              <span className="text-cyan-300 font-bold">vg_data</span>
              <span>1 PV / 2 LV</span>
              <span>1.82 TiB</span>
              <span className="text-emerald-400">420.00 GiB</span>
              <span>4.00 MiB</span>
            </div>
          </div>
        )}

        {/* Tab 3: Logical Volumes (LV) - with interactive selection and resize */}
        {activeTab === "lv" && (
          <div className="space-y-1 text-[11px]">
            <div className="grid grid-cols-6 text-slate-500 font-bold pb-1 border-b border-slate-800">
              <span className="col-span-2">Volume Logique</span>
              <span>VG</span>
              <span>Taille</span>
              <span>Système (FS)</span>
              <span>Point de montage</span>
            </div>

            {lvs.map((lv, idx) => {
              const isSelected = selectedLvIndex === idx;
              return (
                <div
                  key={lv.id}
                  onClick={() => setSelectedLvIndex(idx)}
                  className={`grid grid-cols-6 py-1 px-1 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold"
                      : "text-slate-300 hover:bg-slate-900/50"
                  }`}
                >
                  <span className="col-span-2 flex items-center gap-1">
                    <span className="text-cyan-400">{isSelected ? "▶" : " "}</span>
                    {lv.name}
                  </span>
                  <span className="text-slate-400">{lv.vg}</span>
                  <span className="text-emerald-400 font-bold">{lv.sizeGb} GiB</span>
                  <span className="text-amber-300">{lv.fs}</span>
                  <span className="text-slate-400">{lv.mount}</span>
                </div>
              );
            })}

            {/* Quick Actions bar for selected LV */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800">
              <div className="text-[10px] text-slate-400">
                Sélectionné : <strong className="text-cyan-300">{lvs[selectedLvIndex]?.name}</strong> ({lvs[selectedLvIndex]?.sizeGb} GiB)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(true)}
                  className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/50 text-[10px] font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                >
                  [E] + Étendre LV
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 rounded bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px]"
                  title="Réinitialiser les volumes"
                >
                  [Q] Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Logs */}
        {activeTab === "logs" && (
          <div className="space-y-1 text-[10px] font-mono text-slate-400">
            {logs.slice(-6).map((line, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-cyan-500 select-none">&gt;</span>
                <span className={line.includes("lvextend") ? "text-amber-300" : line.includes("successfully") ? "text-emerald-400 font-bold" : ""}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Modal for Extending LV */}
      {showExtendModal && (
        <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-3 max-w-xs w-full shadow-2xl space-y-3">
            <div className="text-cyan-300 font-bold text-xs pb-1 border-b border-slate-800 flex justify-between">
              <span>Étendre Volume Logique</span>
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1">
              <div>Cible : <strong className="text-white">{lvs[selectedLvIndex]?.name}</strong></div>
              <div>Taille actuelle : <span className="text-emerald-400">{lvs[selectedLvIndex]?.sizeGb} GiB</span></div>
              
              <div className="pt-2">
                <label className="text-[10px] text-slate-400 block mb-1">
                  Extension supplémentaire (+Go) :
                </label>
                <div className="flex gap-1.5">
                  {[10, 20, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setExtendAmount(val)}
                      className={`flex-1 py-1 rounded text-[10px] font-mono border ${
                        extendAmount === val
                          ? "bg-cyan-500/30 text-cyan-300 border-cyan-400 font-bold"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      +{val}G
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-1">
                ✓ Option <code className="text-amber-300">-r</code> activée (redimensionne le FS à chaud)
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="px-2.5 py-1 rounded text-[10px] text-slate-400 hover:text-white bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleApplyExtend}
                className="px-3 py-1 rounded text-[10px] font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              >
                Appliquer lvextend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Textual Footer Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 rounded-b">
        <div className="flex items-center gap-3">
          <span><strong className="text-cyan-400">[1-4]</strong> Onglets</span>
          <span><strong className="text-cyan-400">[↑↓]</strong> Naviguer</span>
          <span><strong className="text-cyan-400">[E]</strong> Étendre</span>
        </div>
        <div className="text-slate-500 hidden sm:inline">
          {lang === "fr" ? "Émulateur Textual TUI" : "Textual TUI Emulator"}
        </div>
      </div>
    </div>
  );
}

