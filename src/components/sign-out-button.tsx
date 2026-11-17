"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="rounded-[10px] border border-line bg-white px-3 py-2 text-sm font-semibold text-forest-800 transition hover:bg-forest-100 disabled:opacity-60"
      onClick={async () => {
        setBusy(true);
        try {
          await authClient.signOut();
        } finally {
          // Full page load so no signed-in state lingers anywhere on screen.
          window.location.assign("/");
        }
      }}
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
