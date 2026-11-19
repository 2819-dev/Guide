import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteChrome } from "@/components/site-chrome";
import { guidePublicUrl } from "@/lib/site";
import "./globals.css";
import "../styles/polish-public.css";
import "../styles/polish-portal.css";

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

/** Licensed Gulfs Display, used for the Guide wordmark only. */
const gulfsDisplay = localFont({
  src: "../fonts/GulfsDisplay-Normal.ttf",
  variable: "--font-gulfs-display",
  display: "swap",
  weight: "400",
  style: "normal",
});

const SITE_DESCRIPTION =
  "Guide gives schools one login for every learning app, with classes and rosters managed in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(guidePublicUrl()),
  title: {
    default: "Guide · One login for every app your school uses",
    template: "%s · Guide",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Guide",
  openGraph: {
    type: "website",
    siteName: "Guide",
    title: "Guide · One login for every app your school uses",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Guide: one login for every app your school uses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guide · One login for every app your school uses",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  // Set GOOGLE_SITE_VERIFICATION in Cloudflare Pages to verify with Google
  // Search Console by HTML tag (not needed when verifying through DNS).
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${gulfsDisplay.variable} h-full`}
    >
      <body className="site-shell flex min-h-full flex-col antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
