import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteChrome } from "@/components/site-chrome";
import { FIRST_APP_NAME } from "@/lib/apps";
import { isAmudSite } from "@/lib/site";
import "./globals.css";

export const runtime = 'edge';

/*
 * Fonts are bundled in src/fonts (SIL Open Font License) rather than fetched
 * from Google Fonts at build time, so a Google hiccup can't fail a deploy.
 */
const manrope = localFont({
  src: "../fonts/Manrope-latin-var.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

const frankRuhlLatin = localFont({
  src: "../fonts/FrankRuhlLibre-latin-var.woff2",
  variable: "--font-frank-ruhl-latin",
  weight: "300 900",
  display: "swap",
  // No metric fallback here, so Hebrew characters fall through to the
  // Hebrew file below instead of a system serif.
  adjustFontFallback: false,
});

const frankRuhlHebrew = localFont({
  src: "../fonts/FrankRuhlLibre-hebrew-var.woff2",
  variable: "--font-frank-ruhl-hebrew",
  weight: "300 900",
  display: "swap",
});

/** Licensed Gulfs Display — Guide wordmark only (not Amud). */
const gulfsDisplay = localFont({
  src: "../fonts/GulfsDisplay-Normal.ttf",
  variable: "--font-gulfs-display",
  display: "swap",
  weight: "400",
  style: "normal",
});

const amud = isAmudSite();

export const metadata: Metadata = amud
  ? {
      title: {
        default: FIRST_APP_NAME,
        template: `%s · ${FIRST_APP_NAME}`,
      },
      description:
        "Amud — Mishnayos and Gemara. Open a daf, Test Yourself, and keep your notes. For everyone.",
    }
  : {
      title: {
        default: "Guide",
        template: "%s · Guide",
      },
      description:
        "Guide — keep students engaged and classrooms well managed. Learning apps and class tools for schools.",
    };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${frankRuhlLatin.variable} ${frankRuhlHebrew.variable} ${gulfsDisplay.variable} h-full`}
    >
      <body className="site-shell flex min-h-full flex-col antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
