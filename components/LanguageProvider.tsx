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
  DEFAULT_LANG,
  LANGUAGES,
  translate,
  type Lang,
} from "@/lib/i18n";

type LanguageCtx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (path: string) => string;
};

const Ctx = createContext<LanguageCtx | null>(null);

const STORAGE_KEY = "portfolio-lang";

// Inlined in <head> before hydration so the document lang attribute matches
// the user's stored preference (avoids FOUC and wrong screen-reader lang).
export const LANG_BOOT_SCRIPT = `(function(){try{var l=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});var ok=${JSON.stringify(LANGUAGES)};if(l&&ok.indexOf(l)>-1){document.documentElement.lang=l;}}catch(e){}})();`;

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    // Sync React state with whatever the boot script already applied to the
    // <html> element. No-op if the boot script didn't find a stored pref.
    const domLang = document.documentElement.lang;
    if (
      (domLang === "fr" || domLang === "en") &&
      domLang !== lang
    ) {
      setLangState(domLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore â€” state still updates in-memory.
    }
  }, []);

  const t = useCallback((path: string) => translate(path, lang), [lang]);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLanguage(): LanguageCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback outside the provider: default language, no-op setter.
    return {
      lang: DEFAULT_LANG,
      setLang: () => {},
      t: (path) => translate(path, DEFAULT_LANG),
    };
  }
  return ctx;
}

