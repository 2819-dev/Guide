import type { Metadata } from "next";
import localFont from "next/font/local";
import { Manrope, Frank_Ruhl_Libre } from "next/font/google";
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
        "Guide — the access platform for schools. Portals, learning apps, and classroom tools.",
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
