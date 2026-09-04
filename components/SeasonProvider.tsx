"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SEASON,
  SEASONS,
  getPalette,
  type SeasonId,
  type SeasonPalette,
} from "@/lib/seasons";

type SeasonCtx = {
  id: SeasonId;
  palette: SeasonPalette;
  setSeason: (id: SeasonId) => void;
};

const Ctx = createContext<SeasonCtx | null>(null);

export const SEASON_BOOT_SCRIPT = ``;

export default function SeasonProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<SeasonId>(DEFAULT_SEASON);

  const setSeason = useCallback((next: SeasonId) => {
    // No-op since we only have one season now
  }, []);

  const palette = getPalette(id);

  return (
    <Ctx.Provider value={{ id, palette, setSeason }}>{children}</Ctx.Provider>
  );
}

export function useSeason(): SeasonCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      id: DEFAULT_SEASON,
      palette: getPalette(DEFAULT_SEASON),
      setSeason: () => {},
    };
  }
  return ctx;
}

