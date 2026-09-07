import {
  siJavascript,
  siTypescript,
  siHtml5,
  siCss,
  siTailwindcss,
  siReact,
  siNextdotjs,
  siVuedotjs,
  siSvelte,
  siNodedotjs,
  siExpress,
  siFastapi,
  siPython,
  siRust,
  siGo,
  siCplusplus,
  siC,
  siGnubash,
  siLinux,
  siDebian,
  siUbuntu,
  siRaspberrypi,
  siArduino,
  siHomeassistant,
  siTextual,
  siDocker,
  siGit,
  siPm2,
  siElectron,
  siWebrtc,
  siPostgresql,
  siMongodb,
  siRedis,
  siSqlite,
} from "simple-icons";

export type SkillIcon = {
  title: string;
  slug: string;
  path: string;
  hex: string;
};

// Generic fallback icon for stack tools without a simple-icons entry
export const FALLBACK_CODE_ICON: SkillIcon = {
  title: "Code",
  slug: "code",
  hex: "38bdf8",
  path: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
};

// Rich curated catalog of icons
export const SKILLS_CATALOG: Record<string, SkillIcon> = {
  javascript: siJavascript,
  typescript: siTypescript,
  html5: siHtml5,
  css: siCss,
  tailwindcss: siTailwindcss,
  react: siReact,
  nextdotjs: siNextdotjs,
  vuedotjs: siVuedotjs,
  svelte: siSvelte,
  nodedotjs: siNodedotjs,
  express: siExpress,
  fastapi: siFastapi,
  python: siPython,
  rust: siRust,
  go: siGo,
  cplusplus: siCplusplus,
  c: siC,
  gnubash: siGnubash,
  linux: siLinux,
  debian: siDebian,
  ubuntu: siUbuntu,
  raspberrypi: siRaspberrypi,
  arduino: siArduino,
  homeassistant: siHomeassistant,
  textual: siTextual,
  docker: siDocker,
  git: siGit,
  pm2: siPm2,
  electron: siElectron,
  webrtc: siWebrtc,
  postgresql: siPostgresql,
  mongodb: siMongodb,
  redis: siRedis,
  sqlite: siSqlite,
};

// Common aliases mapping casual names to simple-icons slugs
export const SKILL_ALIASES: Record<string, string> = {
  bash: "gnubash",
  sh: "gnubash",
  shell: "gnubash",
  js: "javascript",
  ts: "typescript",
  node: "nodedotjs",
  nodejs: "nodedotjs",
  next: "nextdotjs",
  nextjs: "nextdotjs",
  tailwind: "tailwindcss",
  css3: "css",
  html: "html5",
  vue: "vuedotjs",
  vuejs: "vuedotjs",
  "c++": "cplusplus",
  cpp: "cplusplus",
  "c#": "csharp",
  cs: "csharp",
  postgres: "postgresql",
  mongo: "mongodb",
  p2p: "webrtc",
  websockets: "webrtc",
  rest: "express",
  "api rest": "express",
  api: "express",
  tui: "textual",
  embedded: "raspberrypi",
  "systèmes embarqués": "raspberrypi",
  "systemes embarques": "raspberrypi",
  iot: "arduino",
  arduino: "arduino",
  smarthome: "homeassistant",
  domotique: "homeassistant",
  "cross-platform": "electron",
  "multiplateforme": "electron",
  lvm: "linux",
  "effet hall": "raspberrypi",
  "impression 3d & cao": "raspberrypi",
};

/**
 * Resolves any human-friendly tech name or slug into a normalized simple-icons slug.
 */
export function getSkillSlug(name: string): string {
  if (!name) return "code";
  const clean = name.toLowerCase().trim();
  if (SKILL_ALIASES[clean]) return SKILL_ALIASES[clean];

  const noSymbols = clean.replace(/[^a-z0-9]/g, "");
  if (SKILL_ALIASES[noSymbols]) return SKILL_ALIASES[noSymbols];
  if (SKILLS_CATALOG[noSymbols]) return noSymbols;
  if (SKILLS_CATALOG[clean]) return clean;

  // Lookup in catalog by title
  for (const slug in SKILLS_CATALOG) {
    if (
      SKILLS_CATALOG[slug].title.toLowerCase().replace(/[^a-z0-9]/g, "") ===
      noSymbols
    ) {
      return slug;
    }
  }

  return noSymbols || "code";
}

/**
 * Returns the SkillIcon object corresponding to a tech name or slug,
 * with a fallback icon if unknown.
 */
export function resolveSkill(nameOrSlug: string): SkillIcon {
  const slug = getSkillSlug(nameOrSlug);
  if (SKILLS_CATALOG[slug]) {
    return SKILLS_CATALOG[slug];
  }
  return {
    ...FALLBACK_CODE_ICON,
    title: nameOrSlug || "Tech",
    slug: slug || "code",
  };
}

// 15 core skills featured in default views (Hero, Stack, Experience, Contact)
export const CORE_SKILLS: readonly SkillIcon[] = [
  siJavascript,
  siTypescript,
  siHtml5,
  siCss,
  siTailwindcss,
  siReact,
  siNextdotjs,
  siNodedotjs,
  siExpress,
  siPython,
  siRaspberrypi,
  siElectron,
  siHomeassistant,
  siGnubash,
  siLinux,
] as const;

// 3 rows x 5 columns = 15 keys
export const DEFAULT_SKILLS_GRID: readonly (readonly SkillIcon[])[] = [
  [siJavascript, siTypescript, siHtml5, siCss, siTailwindcss],
  [siReact, siNextdotjs, siNodedotjs, siExpress, siPython],
  [siRaspberrypi, siElectron, siHomeassistant, siGnubash, siLinux],
] as const;

export const SKILLS_GRID = DEFAULT_SKILLS_GRID;
export const SKILLS_FLAT: readonly SkillIcon[] = CORE_SKILLS;

/**
 * Dynamically computes the 3x5 (15 keys) grid for the active section.
 * When on a project section, the project's stack icons are placed
 * in the first keys and highlighted, with the remaining keys filled
 * from the core catalog.
 */
export function getSectionSkillsGrid(
  sectionId: string,
  projectHighlights?: string[] | Set<string>
): SkillIcon[][] {
  if (!sectionId.startsWith("project") || !projectHighlights) {
    return DEFAULT_SKILLS_GRID.map((row) => [...row]);
  }

  const highlightList =
    projectHighlights instanceof Set
      ? Array.from(projectHighlights)
      : projectHighlights;

  if (highlightList.length === 0) {
    return DEFAULT_SKILLS_GRID.map((row) => [...row]);
  }

  const featuredIcons: SkillIcon[] = [];

  for (const nameOrSlug of highlightList) {
    const icon = resolveSkill(nameOrSlug);
    if (!featuredIcons.some((i) => i.slug === icon.slug)) {
      featuredIcons.push(icon);
    }
  }

  // Fill up to 15 slots with core skills (avoiding duplicates)
  const resultIcons: SkillIcon[] = [...featuredIcons];
  for (const coreIcon of CORE_SKILLS) {
    if (resultIcons.length >= 15) break;
    if (!resultIcons.some((i) => i.slug === coreIcon.slug)) {
      resultIcons.push(coreIcon);
    }
  }

  // If still less than 15, pull from broader catalog
  if (resultIcons.length < 15) {
    for (const slug in SKILLS_CATALOG) {
      if (resultIcons.length >= 15) break;
      const catIcon = SKILLS_CATALOG[slug];
      if (!resultIcons.some((i) => i.slug === catIcon.slug)) {
        resultIcons.push(catIcon);
      }
    }
  }

  // Group into 3 rows of 5
  const grid: SkillIcon[][] = [];
  for (let r = 0; r < 3; r++) {
    grid.push(resultIcons.slice(r * 5, (r + 1) * 5));
  }
  return grid;
}
