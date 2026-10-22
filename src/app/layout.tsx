import type { Metadata } from "next";
import { Manrope, Frank_Ruhl_Libre, Gilda_Display } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { FIRST_APP_NAME } from "@/lib/apps";
import { isAmudSite } from "@/lib/site";
import "./globals.css";

export const runtime = 'edge';

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700"],
});

/**
 * Gulfs Display (Studio Sun / MyFonts) is commercial — not on Google Fonts.
 * Closest free webfont by name: Gilda Display. Used only for Guide wordmark.
 */
const gulfsDisplay = Gilda_Display({
  variable: "--font-gulfs-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
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
        "Guide — the identity platform for schools. Portals, learning apps, and classroom tools.",
    };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${frankRuhl.variable} ${gulfsDisplay.variable} h-full`}
    >
      <body className="site-shell flex min-h-full flex-col antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
