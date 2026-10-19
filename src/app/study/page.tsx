import { DafPicker } from "@/components/daf-picker";

export const instant = false;

export const metadata = {
  title: "Choose a daf",
};

export default function StudyIndexPage() {
  return (
    <div>
      <section className="bg-sky-soft">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
          <p className="hebrew text-lg text-forest-700">בבא מציעא</p>
          <h1 className="display mt-2 text-4xl text-forest-950 sm:text-5xl">
            Choose a daf
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">
            Open any page of Bava Metzia. אלו מציאות begins at דף כ״א ע״א — a
            strong place to start that sugya.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <DafPicker />
      </div>
    </div>
  );
}
