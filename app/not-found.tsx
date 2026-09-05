import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 · Page introuvable — NeXoS_20",
  description: "La page que vous recherchez semble s'être évanouie dans le blizzard.",
};

export default function NotFound() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-[#090514] text-ice-50 overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none translate-y-20" />

      <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center">
        {/* Animated Frost Logo Container */}
        <div className="w-20 h-20 rounded-2xl bg-ink-1/90 border border-ice-700/40 p-4 shadow-[0_0_40px_rgba(124,58,237,0.3)] flex items-center justify-center mb-6">
          <img
            src="/logo.svg"
            alt="NeXoS_20"
            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(167,139,250,0.6)]"
          />
        </div>

        {/* 404 Headline */}
        <h1 className="text-7xl sm:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-ice-50 via-ice-200 to-ice-400 leading-none mb-4">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-ice-100 mb-3">
          Perdu dans le blizzard ?
        </h2>

        <p className="text-sm text-ice-400 mb-8 max-w-xs leading-relaxed">
          La page que vous tentez d&apos;atteindre n&apos;existe pas ou a été déplacée.
        </p>

        {/* Back Home Button */}
        <Link
          href="/"
          className="frost-btn frost-btn--primary !px-6 !py-3 flex items-center gap-2 group"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="transition-transform group-hover:-translate-x-1"
            aria-hidden
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Retour à l&apos;accueil</span>
        </Link>
      </div>

      {/* Footer watermark */}
      <footer className="absolute bottom-6 text-center text-[11px] text-ice-400/60 font-mono">
        Pierre · NeXoS_20
      </footer>
    </main>
  );
}
