import { TractatePicker } from "@/components/tractate-picker";

export const instant = false;

export const metadata = {
  title: "Choose a tractate",
};

export default function StudyIndexPage() {
  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <h1 className="display text-3xl text-forest-950 sm:text-4xl">
            Choose a tractate
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            Pick a masechta that is open for Mishnayos and Gemara, or see what
            is coming next. Bava Metzia is available today.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <TractatePicker />
      </div>
    </div>
  );
}
