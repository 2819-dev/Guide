"use client";

import { useState } from "react";

/** Official-only: permanently delete a test/spam entry after confirming. */
export function AdminDeleteButton({
  url,
  what,
  onDeleted,
}: {
  /** DELETE endpoint including the id, e.g. /api/meetings?id=… */
  url: string;
  /** Shown in the confirm prompt, e.g. "this meeting request" */
  what: string;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete ${what}? This can’t be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn’t delete.");
      onDeleted();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Couldn’t delete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void remove()}
      disabled={busy}
      className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-50"
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
