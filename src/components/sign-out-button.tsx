"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="portal-signout"
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
