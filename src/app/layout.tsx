import type { Metadata } from "next";
import { Manrope, Frank_Ruhl_Libre } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

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
    default: "Guide",
    template: "%s · Guide",
  },
  description:
    "The calm place for Mishnayos and Gemara — open a daf, Test Yourself, and keep your notes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${frankRuhl.variable} h-full`}
    >
      <body className="site-shell flex min-h-full flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
