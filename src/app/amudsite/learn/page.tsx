import Link from "next/link";
import { TractatePicker } from "@/components/tractate-picker";
import { FIRST_APP_NAME } from "@/lib/apps";
import { publicAmudHomePath, publicAmudLearnBase } from "@/lib/site";

export const runtime = "edge";

export const metadata = {
  title: "Choose what to learn",
};

/** Public Amud learning index under /amudsite/learn */
export default function AmudSiteLearnIndexPage() {
  const learnBase = publicAmudLearnBase();
  const home = publicAmudHomePath();

  return (
    <div className="portal-page">
      <div className="content-band portal-page__inner">
        <header className="portal-hero !border-0 !pb-2">
          <p className="portal-eyebrow">{FIRST_APP_NAME}</p>
          <h1 className="display-feature mt-1">Choose what to learn</h1>
          <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
            Pick a Gemara or Mishnah that is open today. Open a daf, then Test
            Yourself — Bava Metzia is available now.
          </p>
          <p className="mt-3 text-sm font-semibold text-forest-800">
            <Link href={home}>← {FIRST_APP_NAME}</Link>
          </p>
        </header>

        <div className="mt-6">
          <TractatePicker learnBase={learnBase} />
        </div>
      </div>
    </div>
  );
}
