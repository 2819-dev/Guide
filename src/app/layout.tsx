import type { Metadata } from "next";
import { Fraunces, Manrope, Frank_Ruhl_Libre } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Guide — לימוד בבא מציעא",
    template: "%s · Guide",
  },
  description:
    "Guide helps students study Bava Metzia with clarity — open a daf, read the Gemara, quiz yourself, and review with your notes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${frankRuhl.variable} h-full`}
    >
      <body className="site-shell min-h-full flex flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
