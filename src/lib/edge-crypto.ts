/** Web Crypto helpers safe for Next.js Edge / Cloudflare Pages. */

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto subtle is unavailable in this runtime");
  }
  return subtle;
}

export function randomBytes(size: number): Uint8Array {
  const out = new Uint8Array(size);
  globalThis.crypto.getRandomValues(out);
  return out;
}

export function randomUUID(): string {
  return globalThis.crypto.randomUUID();
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await getSubtle().digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Sync SHA-256 hex via a tiny pure fallback when SubtleCrypto is async-only. */
export function sha256HexSync(input: string): string {
  // Edge runtimes expose SubtleCrypto only as async; for badge display IDs we
  // use a deterministic FNV-1a + hex fold that is not a security boundary.
  // Callers that need cryptographic hashes should use sha256Hex().
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ (c + i), 0x01000193);
  }
  const a = (h1 >>> 0).toString(16).padStart(8, "0");
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${a}${b}`;
}
