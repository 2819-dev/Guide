/** Built-in avatar ids when teacher allows avatars (no uploads in v1). */

export const TESTQUIZ_AVATARS = [
  { id: "oak", label: "Oak", color: "#2d6647" },
  { id: "sky", label: "Sky", color: "#3d7ea6" },
  { id: "sun", label: "Sun", color: "#d4a017" },
  { id: "berry", label: "Berry", color: "#a33b5c" },
  { id: "stone", label: "Stone", color: "#5c6670" },
  { id: "leaf", label: "Leaf", color: "#5a9a76" },
  { id: "coral", label: "Coral", color: "#c45c48" },
  { id: "indigo", label: "Indigo", color: "#3f4f8a" },
] as const;

export type TestQuizAvatarId = (typeof TESTQUIZ_AVATARS)[number]["id"];

export function avatarById(id: string | null | undefined) {
  return TESTQUIZ_AVATARS.find((a) => a.id === id) ?? null;
}
