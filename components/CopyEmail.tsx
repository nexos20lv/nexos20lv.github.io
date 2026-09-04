"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type Props = {
  email: string;
  className?: string;
  children: React.ReactNode;
};

// Click → copy to clipboard + show a small toast. If the Clipboard API is
// unavailable (rare; older Safari without HTTPS) we fall back to mailto so
// the user still gets somewhere useful.
export default function CopyEmail({ email, className, children }: Props) {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setShow(true);
      window.setTimeout(() => setShow(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        data-cursor="hover"
        className={className}
        aria-label={`${t("contact.copyEmail")} ${email}`}
      >
        {children}
      </button>
      <div className="toast" data-show={show} role="status" aria-live="polite">
        {t("contact.emailToast")} · {email}
      </div>
    </>
  );
}
