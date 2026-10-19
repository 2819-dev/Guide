import { DafPicker } from "@/components/daf-picker";

export const instant = false;

export const metadata = {
  title: "Choose a daf",
};

export default function StudyIndexPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="hebrew text-lg text-forest-600">בבא מציעא</p>
        <h1 className="display mt-2 text-4xl font-semibold text-forest-950 sm:text-5xl">
          Choose a daf
        </h1>
        <p className="mt-3 text-lg text-ink-soft">
          Open any page of Bava Metzia. אלו מציאות begins at 21a — a good place
          to start if you&apos;re learning that sugya.
        </p>
      </header>
      <DafPicker />
    </div>
  );
}
