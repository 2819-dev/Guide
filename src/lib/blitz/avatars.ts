/**
 * Built-in Blitz critters (drawn in SVG by <BlitzAvatar>, no uploads).
 * Each critter mixes a body silhouette, a color, eyes and a mouth.
 */

export type AvatarBody = "round" | "squircle" | "ghost" | "drop" | "ears" | "star";
export type AvatarEyes = "dot" | "wide" | "sleepy" | "wink";
export type AvatarMouth = "smile" | "o" | "grin" | "tongue";

export type BlitzAvatar = {
  id: string;
  label: string;
  color: string;
  body: AvatarBody;
  eyes: AvatarEyes;
  mouth: AvatarMouth;
};

export const BLITZ_AVATARS: BlitzAvatar[] = [
  { id: "zip", label: "Zip", color: "#b6f03a", body: "round", eyes: "wide", mouth: "grin" },
  { id: "ember", label: "Ember", color: "#ff5a5f", body: "ears", eyes: "dot", mouth: "smile" },
  { id: "tide", label: "Tide", color: "#22d3ee", body: "drop", eyes: "sleepy", mouth: "o" },
  { id: "sunny", label: "Sunny", color: "#ffc93c", body: "star", eyes: "dot", mouth: "grin" },
  { id: "boo", label: "Boo", color: "#c4a5ff", body: "ghost", eyes: "wide", mouth: "o" },
  { id: "mint", label: "Mint", color: "#5ef2b8", body: "squircle", eyes: "wink", mouth: "tongue" },
  { id: "peach", label: "Peach", color: "#ffa07a", body: "round", eyes: "sleepy", mouth: "smile" },
  { id: "bubble", label: "Bubble", color: "#ff8fd1", body: "ghost", eyes: "dot", mouth: "grin" },
  { id: "frost", label: "Frost", color: "#9ae6ff", body: "ears", eyes: "wink", mouth: "o" },
  { id: "pip", label: "Pip", color: "#e9ff70", body: "drop", eyes: "wide", mouth: "smile" },
  { id: "plum", label: "Plum", color: "#a78bfa", body: "squircle", eyes: "dot", mouth: "grin" },
  { id: "coco", label: "Coco", color: "#f4b183", body: "star", eyes: "sleepy", mouth: "tongue" },
];

/** Avatar ids from before the redesign → closest critter. */
const LEGACY: Record<string, string> = {
  oak: "mint",
  sky: "tide",
  sun: "sunny",
  berry: "bubble",
  stone: "frost",
  leaf: "zip",
  coral: "ember",
  indigo: "plum",
};

export type BlitzAvatarId = string;

export const DEFAULT_AVATAR_ID = "zip";

export function avatarById(id: string | null | undefined): BlitzAvatar | null {
  if (!id) return null;
  const real = LEGACY[id] ?? id;
  return BLITZ_AVATARS.find((a) => a.id === real) ?? null;
}

/** Stable fallback critter for a player id / name. */
export function avatarFor(id: string | null | undefined, seed: string): BlitzAvatar {
  const found = avatarById(id);
  if (found) return found;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return BLITZ_AVATARS[h % BLITZ_AVATARS.length]!;
}

export function isAvatarId(id: string): boolean {
  return !!avatarById(id);
}
