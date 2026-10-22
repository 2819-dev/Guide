"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-[10px] border border-line bg-white px-3 py-2 text-sm font-semibold text-forest-800 transition hover:bg-forest-100"
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
