export type SeasonId = "purple";

export type SeasonPalette = {
  id: SeasonId;
  label: string;
  accent: string;
  keyboardBase: string;
  particle: string;
  particleHalo: string;
};

export const SEASONS: SeasonPalette[] = [
  {
    id: "purple",
    label: "Purple",
    accent: "#8b5cf6",
    keyboardBase: "#7c3aed",
    particle: "rgba(196, 181, 253, 0.72)",
    particleHalo: "rgba(167, 139, 250, 0.2)",
  }
];

export const DEFAULT_SEASON: SeasonId = "purple";

export function getPalette(id: SeasonId): SeasonPalette {
  return SEASONS[0];
}

