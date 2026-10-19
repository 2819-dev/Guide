import { randomBytes } from "crypto";

export function makeInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}
