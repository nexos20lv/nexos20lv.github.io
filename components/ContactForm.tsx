"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

export default function ContactForm() {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      honeypot: formData.get("phone"), // Honeypot field
    };

    try {
      const subject = encodeURIComponent(`Portfolio contact: ${data.name}`);
      const body = encodeURIComponent(
        `Nom: ${data.name}\nEmail: ${data.email}\n\n${data.message}`
      );
      window.location.href = `mailto:contact@nexos20.dev?subject=${subject}&body=${body}`;
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
      setErrorMsg(lang === "fr" ? "Impossible d'ouvrir votre messagerie." : "Unable to open your email client.");
    }
  };

  return (
    <form suppressHydrationWarning onSubmit={handleSubmit} className="w-full max-w-md mt-8 space-y-4 pointer-events-auto">
      {/* Honeypot hidden field */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="phone">Phone</label>
        <input suppressHydrationWarning type="text" name="phone" id="phone" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="block text-xs font-medium text-ice-300 mb-1">
          {lang === "fr" ? "Nom" : "Name"}
        </label>
        <input suppressHydrationWarning           type="text"
          name="name"
          id="name"
          required
          className="w-full px-4 py-2 rounded-lg bg-ink-2/60 border border-ink-3 text-ice-50 placeholder-ice-400 focus:outline-none focus:border-ice-500 transition-colors"
          placeholder={lang === "fr" ? "Votre nom" : "Your name"}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-medium text-ice-300 mb-1">
          Email
        </label>
        <input suppressHydrationWarning           type="email"
          name="email"
          id="email"
          required
          className="w-full px-4 py-2 rounded-lg bg-ink-2/60 border border-ink-3 text-ice-50 placeholder-ice-400 focus:outline-none focus:border-ice-500 transition-colors"
          placeholder="contact@example.com"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-medium text-ice-300 mb-1">
          Message
        </label>
        <textarea suppressHydrationWarning           name="message"
          id="message"
          required
          rows={4}
          className="w-full px-4 py-2 rounded-lg bg-ink-2/60 border border-ink-3 text-ice-50 placeholder-ice-400 focus:outline-none focus:border-ice-500 transition-colors resize-none"
          placeholder={lang === "fr" ? "Comment puis-je vous aider ?" : "How can I help you?"}
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full frost-btn frost-btn--primary justify-center disabled:opacity-50"
      >
        {status === "loading" ? (lang === "fr" ? "Envoi..." : "Sending...") : (lang === "fr" ? "Envoyer le message" : "Send message")}
      </button>

      {status === "success" && (
        <p className="text-emerald-400 text-sm mt-2">
          {lang === "fr" ? "Message envoyé avec succès !" : "Message sent successfully!"}
        </p>
      )}
      {status === "error" && (
        <p className="text-red-400 text-sm mt-2">{errorMsg}</p>
      )}
    </form>
  );
}


