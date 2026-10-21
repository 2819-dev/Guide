import { redirect } from "next/navigation";
import { GuideBrandBanner } from "@/components/guide-brand-banner";
import { TractatePicker } from "@/components/tractate-picker";
import { FIRST_APP_NAME } from "@/lib/apps";
import { isGuideSite, publicAmudLearnBase } from "@/lib/site";

export const runtime = "edge";

export const metadata = {
  title: "Choose what to learn",
};

/** Public Amud learning index. On Guide, canonical is /amudsite/learn. */
export default function LearnIndexPage() {
  if (isGuideSite()) {
    redirect(publicAmudLearnBase());
  }

  return (
    <div>
      <GuideBrandBanner variant="strip" />
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <h1 className="display text-3xl text-forest-950 sm:text-4xl">
            Choose what to learn
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            {FIRST_APP_NAME} — pick a Gemara or Mishnah that is open today. Bava
            Metzia is available now.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <TractatePicker />
      </div>
    </div>
  );
}
