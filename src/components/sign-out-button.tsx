"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-forest-800 transition hover:bg-forest-100"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
