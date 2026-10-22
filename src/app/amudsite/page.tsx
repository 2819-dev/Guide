import type { Metadata } from "next";
import { AmudHomePage } from "@/components/amud-home";
import { FIRST_APP_NAME } from "@/lib/apps";

export const runtime = "edge";

export const metadata: Metadata = {
  title: { absolute: FIRST_APP_NAME },
};

/** Public Amud site on the Guide host: https://guidelearning.org/amudsite */
export default function AmudSiteHomePage() {
  return <AmudHomePage />;
}
