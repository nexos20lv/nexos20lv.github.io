"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { useLanguage } from "@/components/LanguageProvider";
import Carousel from "@/components/Carousel";
import PovDemo from "@/components/demos/PovDemo";
import NexShareDemo from "@/components/demos/NexShareDemo";
import LvmDemo from "@/components/demos/LvmDemo";
import type { Lang } from "@/lib/i18n";

type Localised = { fr: string; en: string };

export type ProjectDetail = {
  num: string;
  name: Localised;
  // Main technologies — shown both on the card and in the modal. We kept a
  // single canonical list so chips don't balloon inside the dialog.
  stack: string[];
  desc: Localised; // short card copy
  details: Localised; // longer modal copy
  url?: string;
  github?: string;
  badge?: Localised;
  // simple-icons slugs from the 3D keyboard to light up + animate when
  // this project's section is active.
  highlights?: string[];
  // Optional screenshot/preview URLs for the carousel. When missing the
  // modal falls back to stylised placeholder slides.
  media?: string[];
};

type Props = {
  project: ProjectDetail | null;
  onClose: () => void;
};

type DemoType = "nexshare" | "pov" | "lvm";

function pick<T>(loc: { fr: T; en: T }, lang: Lang): T {
  return loc[lang === "fr" || lang === "en" ? lang : "fr"] ?? loc.fr;
}

function getDemoType(project: ProjectDetail): DemoType | null {
  const num = project.num;
  const nameFr = project.name?.fr || "";

  if (num === "01" || nameFr.includes("NexShare")) {
    return "nexshare";
  }
  if (num === "03" || nameFr.includes("POV")) {
    return "pov";
  }
  if (num === "05" || nameFr.includes("LVM")) {
    return "lvm";
  }
  return null;
}

function ProjectModalContent({
  project,
  onClose,
}: {
  project: ProjectDetail;
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  const demoType = getDemoType(project);
  const hasDemo = demoType !== null;
  const [activeTab, setActiveTab] = useState<"demo" | "gallery">(
    hasDemo ? "demo" : "gallery"
  );

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        data-cursor="hover"
        className="project-modal__close"
        aria-label={t("projects.close")}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6l-12 12" />
        </svg>
      </button>

      <div
        className={`project-modal__media ${
          hasDemo && activeTab === "demo" ? "project-modal__media--demo" : ""
        }`}
      >
        {hasDemo && (
          <div
            role="tablist"
            className="absolute top-3 left-3 z-30 inline-flex items-center gap-1.5 p-1 rounded-full bg-slate-950/90 border border-ice-700/40 backdrop-blur-md shadow-2xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "demo"}
              onClick={() => setActiveTab("demo")}
              data-cursor="hover"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                activeTab === "demo"
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.35)] font-semibold"
                  : "text-ice-400 hover:text-ice-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              {t("projects.tabDemo")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "gallery"}
              onClick={() => setActiveTab("gallery")}
              data-cursor="hover"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                activeTab === "gallery"
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.35)] font-semibold"
                  : "text-ice-400 hover:text-ice-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              {t("projects.tabMedia")}
            </button>
          </div>
        )}

        {hasDemo && activeTab === "demo" ? (
          <div className="w-full pt-14 pb-3 px-1 sm:px-2 flex flex-col items-center">
            {demoType === "nexshare" && <NexShareDemo />}
            {demoType === "pov" && <PovDemo />}
            {demoType === "lvm" && <LvmDemo />}
          </div>
        ) : (
          <Carousel media={project.media} projectNum={project.num} />
        )}
      </div>

      <div className="project-modal__body">
        <p className="font-mono text-xs text-ice-400 uppercase tracking-[0.25em] mb-2">
          {project.num} · {t("projects.kicker")}
        </p>
        <h3
          id="project-modal-title"
          className="text-3xl sm:text-4xl font-bold tracking-tight text-ice-50 mb-3"
        >
          {pick(project.name, lang)}
        </h3>
        {project.badge && (
          <span className="inline-block text-[10px] uppercase tracking-widest text-ice-300 border border-ice-700 rounded-full px-2 py-0.5 mb-4">
            {pick(project.badge, lang)}
          </span>
        )}
        <p className="text-ice-200 leading-relaxed mb-6 whitespace-pre-line">
          {pick(project.details, lang)}
        </p>

        {(project.url || project.github) && (
          <div className="flex flex-wrap gap-3 mb-6">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="hover"
                data-magnetic
                className="frost-btn frost-btn--primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M7 17L17 7M8 7h9v9" />
                </svg>
                {t("projects.openSite")}
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="hover"
                data-magnetic
                className="frost-btn"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                {t("projects.viewCode")}
              </a>
            )}
          </div>
        )}

        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-ice-400 mb-2">
            {t("projects.stackLabel")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <span key={s} className="frost-chip">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Fullscreen modal that details a project. Closes on ESC, click outside,
// and via the explicit close button. Stops Lenis while open (overflow:hidden
// alone isn't enough — Lenis listens to wheel events) and restores it on
// close.
export default function ProjectModal({ project, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const open = project !== null;
  const lenis = useLenis();

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Freeze the page while the modal is open: stop Lenis so wheel/touch
  // events don't leak through, plus overflow:hidden on html/body as a
  // belt-and-braces fallback.
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open, lenis]);

  // Move focus into the modal when it opens so ESC captures and keyboard
  // users don't have to tab through the whole page first.
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  return (
    <div
      className={`project-modal ${open ? "project-modal--open" : ""}`}
      aria-hidden={!open}
      onClick={(e) => {
        // Click on the backdrop (not inside the dialog) closes.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="project-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        tabIndex={-1}
        data-lenis-prevent
      >
        {project && (
          <ProjectModalContent
            key={project.num}
            project={project}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
