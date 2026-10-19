import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Frank_Ruhl_Libre } from "next/font/google";
import { SessionBootstrap } from "@/components/session-bootstrap";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Guide — Bava Metzia study",
    template: "%s · Guide",
  },
  description:
    "Study Bava Metzia with Guide: open a daf, read the Gemara, and quiz yourself — including from your own notes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSans.variable} ${frankRuhl.variable} h-full`}
    >
      <body className="site-shell min-h-full flex flex-col antialiased">
        <SessionBootstrap />
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
