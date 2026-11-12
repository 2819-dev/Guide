/** 6-digit Kahoot-style PIN (digits only, no leading zeros collapsed). */

export function generateGamePin(): string {
  const n = globalThis.crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return String(n).padStart(6, "0");
}

export function normalizePin(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
