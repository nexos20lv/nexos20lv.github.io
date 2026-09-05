import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import FrozenBackground from "@/components/FrozenBackground";
import ScrollProgress from "@/components/ScrollProgress";
import MagneticTargets from "@/components/MagneticTargets";
import SeasonProvider, {
  SEASON_BOOT_SCRIPT,
} from "@/components/SeasonProvider";
import LanguageProvider, {
  LANG_BOOT_SCRIPT,
} from "@/components/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://btmpierre.me"),
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
  manifest: "/manifest.json",
  title: "Pierre · NeXoS_20 — Développeur Full-Stack",
  description: "Portfolio de Pierre (NeXoS_20) - Développeur Full-Stack. Applications web modernes, dashboards temps réel et outils systèmes.",
  authors: [{ name: "Pierre (NeXoS_20)" }],
  openGraph: {
    title: "Pierre · NeXoS_20 — Développeur Full-Stack",
    description: "Portfolio de Pierre (NeXoS_20) - Développeur Full-Stack. Next.js, React Three Fiber, WebSockets.",
    type: "website",
    locale: "fr_FR",
    url: "https://btmpierre.me",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pierre · NeXoS_20 — Développeur Full-Stack",
    description: "Portfolio de Pierre (NeXoS_20) - Développeur Full-Stack. Next.js, React Three Fiber, WebSockets.",
  },
};

export const viewport: Viewport = {
  themeColor: "#090514",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SEASON_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT_SCRIPT }} />
      </head>
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        <LanguageProvider>
          <SeasonProvider>
            <FrozenBackground />
            <ScrollProgress />
            {children}
            <CustomCursor />
            <MagneticTargets />
          </SeasonProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
