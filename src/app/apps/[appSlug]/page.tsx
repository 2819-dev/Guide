import { notFound } from "next/navigation";
import { TractatePicker } from "@/components/tractate-picker";
import { FIRST_APP_SLUG, getApp } from "@/lib/apps";

export const runtime = 'edge';

type Props = {
  params: Promise<{ appSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { appSlug } = await params;
  const app = getApp(appSlug);
  if (!app) return { title: "App" };
  return { title: app.name };
}

export default async function AppHomePage({ params }: Props) {
  const { appSlug } = await params;
  const app = getApp(appSlug);
  if (!app) notFound();

  // First app = Mishnayos/Gemara learning surface
  if (appSlug !== FIRST_APP_SLUG) notFound();

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <h1 className="display text-3xl text-forest-950 sm:text-4xl">
            Choose what to learn
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            Pick a Gemara or Mishnah that is open today, or see what is coming
            next. Bava Metzia is available now.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <TractatePicker />
      </div>
    </div>
  );
}
