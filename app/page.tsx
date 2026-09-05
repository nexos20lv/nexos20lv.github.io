
"use client";

import { useState } from "react";
import FrozenKeyboard from "@/components/FrozenKeyboard";
import SmoothScroll from "@/components/smooth-scroll";
import PageLoader from "@/components/PageLoader";
import Reveal from "@/components/Reveal";
import SectionNav from "@/components/SectionNav";
import CopyEmail from "@/components/CopyEmail";

import dynamic from "next/dynamic";
const ContactForm = dynamic(() => import("@/components/ContactForm"), { ssr: false });

import LanguagePicker from "@/components/LanguagePicker";
import DiscordCard from "@/components/DiscordCard";
import ProjectModal, {
  type ProjectDetail,
} from "@/components/ProjectModal";
import { useLanguage } from "@/components/LanguageProvider";
import { useIsMobile } from "@/lib/useIsMobile";
import { SKILLS_FLAT } from "@/lib/skills";
import { setActiveSection, setManualNavigating } from "@/lib/useActiveSection";
import type { Lang } from "@/lib/i18n";

const EMAIL = "contact@nexos20.dev";

// Localised content lives in `{ es, en }` objects inside these arrays so the
// page can be a straightforward array.map() at render time. Tech names stay
// as plain strings (they're brand names, not localised).
type Localised = { fr: string; en: string };

type Project = ProjectDetail & {
  align: "left" | "right";
  section: "project1" | "project2" | "project3" | "project4";
};


import projectsData from "@/data/projects.json";
const projects: Project[] = projectsData as Project[];

const experiences: Array<{
  role: Localised;
  company: string;
  period: Localised;
  location: Localised;
  summary: Localised;
  bullets: Localised[];
  stack: string[];
}> = [
  {
    role: { fr: "Développeur Full-Stack & Logiciel", en: "Full-Stack & Software Developer" },
    company: "Freelance / Open Source",
    period: { fr: "Présent", en: "Present" },
    location: { fr: "Remote", en: "Remote" },
    summary: {
      fr: "Création d'applications web modernes, d'outils systèmes et d'applications bureau (Electron). Passionné par l'open-source, les architectures temps réel et le développement multiplateforme.",
      en: "Building modern web apps, system tools, and desktop applications (Electron). Passionate about open-source, real-time architectures, and cross-platform development.",
    },
    bullets: [
      {
        fr: "Développement d'outils P2P et de transferts de données sécurisés (WebRTC).",
        en: "Development of P2P tools and secure data transfers (WebRTC).",
      },
      {
        fr: "Création de dashboards complexes et panneaux d'administration (React, Next.js, Node.js).",
        en: "Creation of complex dashboards and administration panels (React, Next.js, Node.js).",
      },
      {
        fr: "Conception d'outils de distribution logicielle et d'applications bureau (Electron, auto-updates).",
        en: "Design of software distribution tools and desktop applications (Electron, auto-updates).",
      },
      {
        fr: "Scripts systèmes, intégrations API et automatisation (Python, Bash).",
        en: "System scripts, API integrations, and automation (Python, Bash).",
      },
    ],
    stack: ["Next.js", "React", "Node.js", "TypeScript", "Python"],
  },
];

function pick<T>(loc: { fr: T; en: T }, lang: Lang): T {
  return loc[lang === "fr" || lang === "en" ? lang : "fr"] ?? loc.fr;
}

// Hero name split per word so each can rise independently. Whitespace
// preserved as its own span so the line wraps naturally if needed.
function HeroWord({
  text,
  delay,
  className = "",
}: {
  text: string;
  delay: number;
  className?: string;
}) {
  return (
    <span className={`hero-word ${className}`}>
      <span style={{ animationDelay: `${delay}ms` }}>{text}</span>
    </span>
  );
}

export default function Home() {
  const { t, lang } = useLanguage();
  const isMobile = useIsMobile();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  return (
    <SmoothScroll>
      <PageLoader />
      <div className="relative">
        {/* Desktop: persistent 3D scene fullscreen behind content. On mobile
            the canvas lives inside the hero instead (see below) so it scrolls
            away and the rest of the page is clean, fast 2D. */}
        {!isMobile && (
          <div className="fixed inset-0 z-0">
            <FrozenKeyboard />
          </div>
        )}

        {/* Header */}
        <header className="fixed top-0 inset-x-0 z-50 px-6 sm:px-10 md:px-14 py-5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <span
              data-cursor="hover"
              className="text-sm font-semibold tracking-tight text-ice-100 whitespace-nowrap"
            >
                NeXoS_20
              </span>
            {/* Wrapper (not the pill itself) carries the hide: .status-pill
                hard-sets display:inline-flex, which beats Tailwind's .hidden
                due to CSS source order, so hiding must happen on a parent. */}
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            
            
            <span className="hidden md:inline-flex">
            <a
              href="https://github.com/nexos20lv/nexos20lv.github.io"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="hover"
              className="frost-btn !py-1.5 !px-3 !text-xs"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
                <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span>GitHub</span>
            </a>
            </span>
            <LanguagePicker />
          </div>
        </header>

        <SectionNav />

        <main className="relative z-10 pointer-events-none">
          {/* Hero */}
          <section
            data-kb-section="hero"
            className="min-h-screen flex flex-col justify-center p-6 sm:p-10 md:p-14"
          >
            {/* Mobile-only 3D centerpiece. Lives inside the hero (scrolls away
                with it) and takes pointer events so keycaps are tappable. */}
            {isMobile && (
              <div className="w-full h-[34vh] mt-12 -mb-4 pointer-events-auto">
                <FrozenKeyboard mobile />
              </div>
            )}
            <div className="mt-2 md:mt-20">
              <p
                className="text-[11px] uppercase tracking-[0.3em] text-ice-300 mb-5 fade-in-up"
                style={{ ["--d" as string]: "0ms" }}
              >
                {t("hero.greeting")}
              </p>
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-bold tracking-[-0.03em] text-ice-50 leading-[0.92] whitespace-nowrap">
                <HeroWord text="NeXoS_" delay={120} />
                <HeroWord text="20" delay={260} className="text-ice-400" />
              </h1>
              <p
                className="mt-8 text-base sm:text-lg md:text-xl text-ice-200 max-w-xl leading-relaxed fade-in-up"
                style={{ ["--d" as string]: "520ms" }}
              >
                {t("hero.roleLine")}
                
              </p>

              {/* CTAs */}
              <div
                className="mt-10 flex flex-wrap items-center gap-3 pointer-events-auto fade-in-up"
                style={{ ["--d" as string]: "700ms" }}
              >
                <button
                  type="button"
                  data-cursor="hover"
                  data-magnetic
                  className="frost-btn frost-btn--primary"
                  onClick={() => {
                    setManualNavigating(true, 1000);
                    setActiveSection("contact");
                    document
                      .querySelector<HTMLElement>(
                        '[data-kb-section="contact"]'
                      )
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  {t("hero.hire")}
                </button>
                <button
                  type="button"
                  data-cursor="hover"
                  data-magnetic
                  className="frost-btn"
                  onClick={() => {
                    setManualNavigating(true, 1000);
                    setActiveSection("project1");
                    document
                      .querySelector<HTMLElement>(
                        '[data-kb-section="project1"]'
                      )
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  {lang === "fr" ? "Voir les projets" : "View projects"}
                </button>
                {/* Mobile-only full-width break: forces the social icons onto
                    their own row below the two primary buttons. Hidden on md+
                    so desktop keeps everything on a single line. */}
                <div className="basis-full h-0 md:hidden" aria-hidden />
                
                <a
                  href="https://github.com/nexos20lv"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="hover"
                  data-magnetic
                  className="frost-icon"
                  aria-label="GitHub"
                >
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
                    <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                </a>

                {/* Keyboard navigation hint */}
                <p className="basis-full text-[11px] text-ice-400/50 font-mono mt-1 hidden sm:flex items-center gap-1.5">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-ink-2/60 border border-ice-700/30 text-[10px] text-ice-300">1-5</span>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-ink-2/60 border border-ice-700/30 text-[10px] text-ice-300">↑ / ↓</span>
                  <span>{t("hero.keysHint")}</span>
                </p>
              </div>
            </div>

            {/* Discord presence card */}
            <div className="mt-8">
              <DiscordCard userId="1545915805374357536" />
            </div>
          </section>

          {/* Stack — desktop relies on the 200vh scroll + sticky title while
              the keyboard does the talking on hover. On mobile (md:) that
              choreography is gone, so we drop the tall scroll and render a
              real, legible skills grid with the same taglines. */}
          <section
            data-kb-section="stack"
            className="relative md:min-h-[200vh] p-6 sm:p-10 md:p-14"
          >
            <div className="relative md:h-[150vh]">
              <div className="md:sticky md:top-28 text-center">
                <Reveal>
                  <h2 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-[-0.03em] text-ice-50 leading-[0.95]">
                    {t("stack.title")}
                  </h2>
                </Reveal>
                <Reveal delay={120}>
                  <p className="mt-3 text-sm sm:text-base text-ice-400">
                    <span className="hidden md:inline">{t("stack.hint")}</span>
                    <span className="md:hidden">{t("stack.hintMobile")}</span>
                  </p>
                </Reveal>
              </div>

              {/* Mobile skills grid (recovers the hover interaction as static
                  content the keyboard can't surface on touch). */}
              {isMobile && (
                <div className="md:hidden mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pointer-events-auto">
                  {SKILLS_FLAT.map((s) => (
                    <div
                      key={s.slug}
                      className="flex items-start gap-3 rounded-xl bg-ink-1/70 backdrop-blur-sm border border-ink-3 p-4"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="22"
                        height="22"
                        fill={`#${s.hex}`}
                        className="flex-none mt-0.5"
                        aria-hidden
                      >
                        <path d={s.path} />
                      </svg>
                      <div>
                        <p className="text-ice-50 font-medium text-sm">
                          {s.title}
                        </p>
                        <p className="text-ice-400 text-xs mt-0.5 leading-snug">
                          {t(`keyboard.taglines.${s.slug}`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Experience — title is sticky at top-24 (feels anchored) but sits
              BEHIND the cards (z-0 vs. card wrapper's z-10), so as you scroll
              the card slides over the title. The section has no extra filler
              beyond the cards, so when you scroll past the last card the
              section ends and the title un-pins and exits the viewport at the
              same time — giving the "anchored then both disappear" feel. */}
          <section
            data-kb-section="experience"
            className="relative p-6 sm:p-10 md:p-14 pb-24"
          >
            <div className="sticky top-24 sm:top-28 text-center mb-12 sm:mb-16 z-0">
              <Reveal>
                <h2 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-[-0.03em] text-ice-50 leading-[0.95]">
                  {t("experience.title")}
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-3 text-sm sm:text-base text-ice-300">
                  {t("experience.subtitle")}
                </p>
              </Reveal>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              {experiences.map((exp, idx) => (
                <Reveal
                  key={`${exp.company}-${idx}`}
                  delay={idx * 120}
                  as="article"
                  className="relative rounded-2xl bg-ink-1/75 backdrop-blur-md border border-ink-3 p-6 sm:p-8 md:p-10 pointer-events-auto shadow-[0_8px_40px_-20px_rgba(0,0,0,0.6)]"
                >
                  <header className="flex flex-wrap items-start justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-ice-50 tracking-tight">
                        {pick(exp.role, lang)}
                      </h3>
                      <p className="text-ice-400 font-medium mt-1">
                        {exp.company}
                        <span className="text-ice-500/80 font-normal">
                          {" · "}
                          {pick(exp.location, lang)}
                        </span>
                      </p>
                    </div>
                    <span className="font-mono text-xs text-ice-100 px-3 py-1 rounded-full border border-ice-700/70 bg-ink-2/60 whitespace-nowrap">
                      {pick(exp.period, lang)}
                    </span>
                  </header>

                  <p className="text-ice-200 leading-relaxed mb-5">
                    {pick(exp.summary, lang)}
                  </p>

                  <ul className="space-y-2.5 mb-6">
                    {exp.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-ice-100 leading-relaxed"
                      >
                        <span className="mt-[0.65em] flex-none w-1.5 h-1.5 rounded-full bg-ice-400" />
                        <span>{pick(b, lang)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-1.5">
                    {exp.stack.map((s) => (
                      <span
                        key={s}
                        data-cursor="hover"
                        className="frost-chip"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Projects */}
          {projects.map((p) => (
            <section
              key={p.num}
              data-kb-section={p.section}
              data-kb-highlights={(p.highlights ?? []).join(",")}
              className="relative py-20 md:min-h-screen flex items-center p-6 sm:p-10 md:p-14 overflow-hidden"
            >
              <span
                aria-hidden
                className={`watermark hidden md:block top-1/2 -translate-y-1/2 ${
                  p.align === "left" ? "right-[-2vw]" : "left-[-2vw]"
                }`}
              >
                {p.num}
              </span>

              <div
                className={
                  p.align === "left"
                    ? "max-w-xl relative"
                    : // Right-aligned cards get extra right padding on md+ so
                      // the action buttons ("Ver más") don't sit under the
                      // fixed SectionNav dots on the right edge. On mobile they
                      // collapse to a normal left-aligned full-width card.
                      "max-w-xl relative md:ml-auto md:text-right md:mr-16 lg:mr-24"
                }
              >
                <Reveal>
                  <p className="font-mono text-sm text-ice-400 mb-3">
                    {p.num} · {t("projects.kicker")}
                  </p>
                </Reveal>
                <Reveal delay={80}>
                  <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-ice-50 leading-[1.05] mb-4">
                    {pick(p.name, lang)}
                  </h2>
                </Reveal>
                {p.badge ? (
                  <Reveal delay={140}>
                    <span className="inline-block text-[10px] uppercase tracking-widest text-ice-300 border border-ice-700 rounded-full px-2 py-0.5 mb-4">
                      {pick(p.badge, lang)}
                    </span>
                  </Reveal>
                ) : null}
                <Reveal delay={180}>
                  <p className="text-base sm:text-lg text-ice-200 leading-relaxed mb-6">
                    {pick(p.desc, lang)}
                  </p>
                </Reveal>
                <Reveal delay={260}>
                  <div
                    className={
                      p.align === "right"
                        ? "flex flex-wrap gap-1.5 md:justify-end pointer-events-auto mb-5"
                        : "flex flex-wrap gap-1.5 pointer-events-auto mb-5"
                    }
                  >
                    {p.stack.map((s) => (
                      <span
                        key={s}
                        data-cursor="hover"
                        className="frost-chip"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Reveal>
                <Reveal delay={320}>
                  <div
                    className={
                      p.align === "right"
                        ? "flex md:justify-end pointer-events-auto"
                        : "flex pointer-events-auto"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setActiveProject(p)}
                      data-cursor="hover"
                      data-magnetic
                      className="frost-btn"
                    >
                      {t("projects.viewMore")}
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </Reveal>
              </div>
            </section>
          ))}

          {/* Contact — copy pinned to the left so the (large, hero-posed)
              keyboard on the right has room to bob its random keys. */}
          <section
            data-kb-section="contact"
            className="relative py-24 md:min-h-screen flex flex-col justify-center p-6 sm:p-10 md:p-14 overflow-hidden"
          >
            <div className="max-w-xl relative">
              <Reveal>
                <p className="font-mono text-sm text-ice-400 mb-3">
                  {t("contact.kicker")}
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-ice-50 mb-6">
                  {t("contact.title")}
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="text-ice-200 mb-10">{t("contact.body")}</p>
              </Reveal>
              <Reveal delay={240}>
                <div className="flex flex-wrap gap-3 pointer-events-auto">
                  <CopyEmail
                    email={EMAIL}
                    className="frost-btn frost-btn--primary"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M3 7l9 6 9-6" />
                    </svg>
                    {t("contact.copyEmail")}
                  </CopyEmail>
                  <a
                    href={`mailto:${EMAIL}`}
                    data-cursor="hover"
                    className="frost-btn"
                  >
                    {t("contact.openMail")}
                  </a>
                  <a
                    href="https://github.com/nexos20lv"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="hover"
                    className="frost-btn"
                  >
                    {t("contact.github")}
                  </a>
                  
                </div>
                <ContactForm />
              </Reveal>
            </div>
          </section>
        </main>

        {/* Global Footer with Copyright, Tech Stack & Back to Top */}
        <footer className="relative border-t border-ink-3/60 py-10 px-6 sm:px-10 md:px-14 pointer-events-auto bg-ink-0/80 backdrop-blur-md z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
            
            {/* Left: Branding & Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
              <span className="font-semibold tracking-tight text-ice-50 font-mono text-base">
                Pierre <span className="text-ice-400 font-normal">· NeXoS_20</span>
              </span>
              <span className="hidden sm:inline text-ice-700" aria-hidden>|</span>
              <p className="text-xs text-ice-300">
                © {new Date().getFullYear()} Pierre. {lang === "fr" ? "Tous droits réservés." : "All rights reserved."}
              </p>
            </div>

            {/* Center: Tech stack & status badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-ice-300 bg-ink-1/80 border border-ice-700/40 rounded-full px-3.5 py-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>{lang === "fr" ? "Systèmes opérationnels" : "All systems operational"}</span>
              <span className="text-ice-700" aria-hidden>•</span>
              <span className="text-ice-400">Next.js & Three.js</span>
            </div>

            {/* Right: Social links & Back to top */}
            <div className="flex items-center gap-5 text-xs">
              <a
                href="https://github.com/nexos20lv"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="hover"
                className="text-ice-300 hover:text-ice-50 transition-colors"
              >
                GitHub
              </a>
              <a
                href={`mailto:${EMAIL}`}
                data-cursor="hover"
                className="text-ice-300 hover:text-ice-50 transition-colors"
              >
                Email
              </a>
              <button
                type="button"
                onClick={() => {
                  setManualNavigating(true, 1000);
                  setActiveSection("hero");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                data-cursor="hover"
                className="flex items-center gap-1.5 text-ice-200 hover:text-ice-50 transition-colors font-mono ml-2 group"
              >
                <span>{lang === "fr" ? "Haut de page" : "Back to top"}</span>
                <span className="group-hover:-translate-y-0.5 transition-transform">↑</span>
              </button>
            </div>

          </div>
        </footer>

        <ProjectModal
          project={activeProject}
          onClose={() => setActiveProject(null)}
        />
      </div>
    </SmoothScroll>
  );
}




















