import { randomBytes } from "@/lib/edge-crypto";

export function makeInviteCode(): string {
  return Array.from(randomBytes(4))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
