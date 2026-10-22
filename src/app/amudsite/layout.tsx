import type { Metadata } from "next";
import { FIRST_APP_NAME } from "@/lib/apps";

export const runtime = "edge";

export const metadata: Metadata = {
  title: {
    default: FIRST_APP_NAME,
    template: `%s · ${FIRST_APP_NAME}`,
  },
  description:
    "Amud — Mishnayos and Gemara. Open a daf, Test Yourself, and keep your notes. For everyone.",
};

/** Nested layout so /amudsite* titles use Amud, not Guide. */
export default function AmudSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
