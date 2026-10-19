import { DafPicker } from "@/components/daf-picker";
import { getDb } from "@/lib/db";
import { getOrCreateLearner } from "@/lib/session";
import { progress } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const instant = false;

export const metadata = {
  title: "Choose a daf",
};

export default async function StudyIndexPage() {
  let visitedIds: string[] = [];
  try {
    const learner = await getOrCreateLearner();
    const db = getDb();
    const rows = await db
      .select({ dafId: progress.dafId })
      .from(progress)
      .where(eq(progress.learnerId, learner.id));
    visitedIds = rows.map((r) => r.dafId);
  } catch {
    visitedIds = [];
  }

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
      <DafPicker visitedIds={visitedIds} />
    </div>
  );
}
