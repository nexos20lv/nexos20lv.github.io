import {
  siJavascript,
  siTypescript,
  siNodedotjs,
  siReact,
  siNextdotjs,
  siTailwindcss,
  siPython,
  siGodotengine,
  siElectron,
  siWebrtc,
  siHtml5,
  siCss,
  siGit,
  siDocker,
  siArduino,
} from "simple-icons";

export type SkillIcon = {
  title: string;
  slug: string;
  path: string;
  hex: string;
};

export const SKILLS_GRID: readonly (readonly SkillIcon[])[] = [
  [siJavascript, siTypescript, siHtml5, siCss, siTailwindcss],
  [siPython, siGodotengine, siReact, siNextdotjs, siNodedotjs],
  [siElectron, siWebrtc, siArduino, siDocker, siGit],
] as const;

export const SKILLS_FLAT: readonly SkillIcon[] = SKILLS_GRID.flat();
