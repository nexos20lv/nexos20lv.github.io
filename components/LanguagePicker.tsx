"use client";

import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";

// Compact ES / EN segmented toggle, styled to match the season picker and
// the GitHub button in the header. The chosen language is persisted in
// localStorage via the provider.
export default function LanguagePicker({
  className = "",
}: {
  className?: string;
}) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full bg-ink-2/60 backdrop-blur-sm border border-ink-3 ${className}`}
      role="group"
      aria-label={t("picker.language")}
    >
      {LANGUAGES.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            data-cursor="hover"
            aria-pressed={active}
            className={`px-2.5 h-6 rounded-full text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 ${
              active
                ? "bg-ice-100 text-background"
                : "text-ice-300 hover:text-ice-50"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
