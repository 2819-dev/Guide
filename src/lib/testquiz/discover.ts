/** Teacher Discover categories (Kahoot-like browse). */

export const TESTQUIZ_DISCOVER_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "science", label: "Science" },
  { id: "math", label: "Math" },
  { id: "ela", label: "ELA" },
  { id: "history", label: "History" },
  { id: "icebreaker", label: "Icebreakers" },
  { id: "check-in", label: "Check-ins" },
] as const;

export type TestQuizDiscoverCategory =
  (typeof TESTQUIZ_DISCOVER_CATEGORIES)[number]["id"];

export function isDiscoverCategory(v: string): v is TestQuizDiscoverCategory {
  return TESTQUIZ_DISCOVER_CATEGORIES.some((c) => c.id === v);
}

export function categoryLabel(id: string): string {
  return (
    TESTQUIZ_DISCOVER_CATEGORIES.find((c) => c.id === id)?.label ?? "General"
  );
}
