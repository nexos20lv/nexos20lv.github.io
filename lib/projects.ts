import rawProjectsData from "@/data/projects.json";
import { getSkillSlug } from "@/lib/skills";

export type LocalisedString = string | { fr: string; en: string };

export type RawProjectInput = {
  num?: string;
  name: LocalisedString;
  stack: string[];
  desc: LocalisedString;
  details?: LocalisedString;
  url?: string;
  github?: string;
  media?: string[];
  badge?: LocalisedString;
  highlights?: string[];
  align?: "left" | "right";
  section?: string;
};

export type NormalizedProject = {
  num: string;
  name: { fr: string; en: string };
  desc: { fr: string; en: string };
  details: { fr: string; en: string };
  stack: string[];
  url?: string;
  github?: string;
  media: string[];
  badge?: { fr: string; en: string };
  highlights: string[];
  align: "left" | "right";
  section: string;
};

function toLocalised(
  val: LocalisedString | undefined,
  fallback = ""
): { fr: string; en: string } {
  if (!val) return { fr: fallback, en: fallback };
  if (typeof val === "string") return { fr: val, en: val };
  return {
    fr: val.fr || val.en || fallback,
    en: val.en || val.fr || fallback,
  };
}

/**
 * Normalizes any project input from data/projects.json:
 * - auto-assigns num ("01", "02", ...) if missing
 * - auto-assigns section ("project1", "project2", ...) if missing
 * - auto-alternates align ("left", "right", ...) if missing
 * - auto-resolves highlights from stack if missing
 * - converts string descriptions into bilingual objects { fr, en }
 */
export function normalizeProject(
  raw: RawProjectInput,
  index: number
): NormalizedProject {
  const num = raw.num || String(index + 1).padStart(2, "0");
  const section = raw.section || `project${index + 1}`;
  const align = raw.align || (index % 2 === 0 ? "left" : "right");
  const name = toLocalised(raw.name, `Projet ${num}`);
  const desc = toLocalised(raw.desc, "");
  const details = raw.details ? toLocalised(raw.details, "") : desc;
  const stack = Array.isArray(raw.stack) ? raw.stack : [];

  // Auto-resolve highlights from stack if not explicitly provided
  let highlights = raw.highlights;
  if (!highlights || highlights.length === 0) {
    highlights = stack
      .map((tech) => getSkillSlug(tech))
      .filter((slug): slug is string => Boolean(slug));
  }

  const badge = raw.badge ? toLocalised(raw.badge) : undefined;
  const media =
    raw.media && raw.media.length > 0
      ? raw.media
      : ["/projects/placeholder.jpg"];

  return {
    num,
    name,
    desc,
    details,
    stack,
    url: raw.url,
    github: raw.github,
    media,
    badge,
    highlights,
    align,
    section,
  };
}

export const PROJECTS: NormalizedProject[] = (
  rawProjectsData as RawProjectInput[]
).map(normalizeProject);

export function getProjectBySection(
  section: string
): NormalizedProject | undefined {
  return PROJECTS.find((p) => p.section === section);
}

export function getAllProjectSections(): string[] {
  return PROJECTS.map((p) => p.section);
}

