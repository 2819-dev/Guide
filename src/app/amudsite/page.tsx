import { AmudHomePage } from "@/components/amud-home";
import { FIRST_APP_NAME } from "@/lib/apps";

export const runtime = "edge";

export const metadata = {
  title: {
    default: FIRST_APP_NAME,
    template: `%s · ${FIRST_APP_NAME}`,
  },
  description:
    "Amud — Mishnayos and Gemara. Open a daf, Test Yourself, and keep your notes. For everyone.",
};

/** Public Amud site on the Guide host: https://guidelearning.org/amudsite */
export default function AmudSiteHomePage() {
  return <AmudHomePage />;
}
