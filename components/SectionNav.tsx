"use client";

import { useEffect, useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useLenis } from "lenis/react";
import {
  useActiveSection,
  setActiveSection,
  setManualNavigating,
} from "@/lib/useActiveSection";

// Vertical dots fixed to the right edge that highlight the current section
// and listen for keyboard navigation (arrows, 1-5, Home, End).
export default function SectionNav() {
  const [active] = useActiveSection();
  const { t, lang } = useLanguage();
  const lenis = useLenis();

  const SECTIONS = useMemo(
    () => [
      { id: "hero", label: t("nav.home") },
      { id: "stack", label: t("nav.stack") },
      { id: "experience", label: t("nav.experience") },
      { id: "project1", label: `${t("nav.project")} 01` },
      { id: "project2", label: `${t("nav.project")} 02` },
      { id: "project3", label: `${t("nav.project")} 03` },
      { id: "project4", label: `${t("nav.project")} 04` },
      { id: "contact", label: t("nav.contact") },
    ],
    [t]
  );

  const goTo = (id: string) => {
    const target = document.querySelector<HTMLElement>(
      `[data-kb-section="${id}"]`
    );
    if (target) {
      setManualNavigating(true, 1000);
      setActiveSection(id);
      if (lenis) {
        lenis.scrollTo(target, { offset: 0, duration: 1.0 });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger navigation if typing in an input, textarea or modal
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      const currentIndex = SECTIONS.findIndex((s) => s.id === active);

      // Arrow Down / J / PageDown -> next section
      if (
        e.key === "ArrowDown" ||
        e.key === "j" ||
        e.key === "J" ||
        e.key === "PageDown"
      ) {
        e.preventDefault();
        const nextIndex = Math.min(
          SECTIONS.length - 1,
          (currentIndex >= 0 ? currentIndex : 0) + 1
        );
        goTo(SECTIONS[nextIndex].id);
        return;
      }

      // Arrow Up / K / PageUp -> prev section
      if (
        e.key === "ArrowUp" ||
        e.key === "k" ||
        e.key === "K" ||
        e.key === "PageUp"
      ) {
        e.preventDefault();
        const prevIndex = Math.max(
          0,
          (currentIndex >= 0 ? currentIndex : 0) - 1
        );
        goTo(SECTIONS[prevIndex].id);
        return;
      }

      // Direct section jumps via number keys 1 to 5 (and 6-8)
      if (e.code === "Digit1" || e.key === "1") {
        e.preventDefault();
        goTo("hero");
        return;
      }
      if (e.code === "Digit2" || e.key === "2") {
        e.preventDefault();
        goTo("stack");
        return;
      }
      if (e.code === "Digit3" || e.key === "3") {
        e.preventDefault();
        goTo("experience");
        return;
      }
      if (e.code === "Digit4" || e.key === "4") {
        e.preventDefault();
        goTo("project1");
        return;
      }
      if (e.code === "Digit5" || e.key === "5") {
        e.preventDefault();
        goTo("contact");
        return;
      }
      if (e.code === "Digit6" || e.key === "6") {
        e.preventDefault();
        goTo("project2");
        return;
      }
      if (e.code === "Digit7" || e.key === "7") {
        e.preventDefault();
        goTo("project3");
        return;
      }
      if (e.code === "Digit8" || e.key === "8") {
        e.preventDefault();
        goTo("project4");
        return;
      }

      // Home / End
      if (e.key === "Home") {
        e.preventDefault();
        goTo("hero");
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        goTo("contact");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, SECTIONS, lenis]);

  return (
    <nav
      aria-label={t("nav.aria")}
      className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-4 pointer-events-auto"
    >
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(s.id)}
            data-cursor="hover"
            className="group relative flex items-center justify-center w-6 h-6"
            aria-label={s.label}
            aria-current={isActive ? "true" : undefined}
          >
            <span
              className={`absolute right-full mr-2 whitespace-nowrap text-[10px] uppercase tracking-[0.25em] text-ice-200 transition-all duration-300 ${
                isActive
                  ? "opacity-100 -translate-x-1"
                  : "opacity-0 translate-x-2 group-hover:opacity-80 group-hover:translate-x-0"
              }`}
            >
              {s.label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? "w-2.5 h-2.5 bg-ice-100 shadow-[0_0_12px_rgba(234,242,251,0.6)]"
                  : "w-1.5 h-1.5 bg-ice-500/60 group-hover:bg-ice-200"
              }`}
            />
          </button>
        );
      })}

      {/* Keyboard navigation helper pill */}
      <div
        className="mt-2 flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
        title={lang === "fr" ? "Naviguez avec ↑ / ↓ ou les chiffres 1-5" : "Navigate with ↑ / ↓ or keys 1-5"}
      >
        <div className="flex items-center gap-1 text-[9px] font-mono text-ice-300/80 bg-ink-2/80 border border-ice-700/30 rounded px-1.5 py-0.5 shadow-sm">
          <span>↑</span>
          <span>↓</span>
        </div>
      </div>
    </nav>
  );
}



