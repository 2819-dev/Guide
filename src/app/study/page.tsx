import { TractatePicker } from "@/components/tractate-picker";

export const instant = false;

export const metadata = {
  title: "Choose a tractate",
};

export default function StudyIndexPage() {
  return (
    <div>
      <section className="bg-sky-soft">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
          <p className="hebrew text-lg text-forest-700">משניות · גמרא</p>
          <h1 className="display mt-2 text-4xl text-forest-950 sm:text-5xl">
            Choose a tractate
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">
            Guide is growing — pick a masechta that&apos;s open now, or peek at
            what&apos;s coming next. Bava Metzia is ready today.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <TractatePicker />
      </div>
    </div>
  );
}
