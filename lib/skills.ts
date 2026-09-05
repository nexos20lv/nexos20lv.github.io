import {
  siJavascript,
  siTypescript,
  siNodedotjs,
  siReact,
  siNextdotjs,
  siTailwindcss,
  siPython,
  siElectron,
  siWebrtc,
  siHtml5,
  siCss,
  siRaspberrypi,
  siHomeassistant,
  siExpress,
  siPm2,
} from "simple-icons";

export type SkillIcon = {
  title: string;
  slug: string;
  path: string;
  hex: string;
};

export const SKILLS_GRID: readonly (readonly SkillIcon[])[] = [
  [siJavascript, siTypescript, siHtml5, siCss, siTailwindcss],
  [siReact, siNextdotjs, siNodedotjs, siExpress, siPm2],
  [siPython, siRaspberrypi, siElectron, siHomeassistant, siWebrtc],
] as const;

export const SKILLS_FLAT: readonly SkillIcon[] = SKILLS_GRID.flat();
