"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
};

export function DeveloperApplyForm({
  defaultName = "",
  defaultEmail = "",
}: Props) {
  const [contactName, setContactName] = useState(defaultName);
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [organization, setOrganization] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [appName, setAppName] = useState("");
  const [appAbout, setAppAbout] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="portal-panel">
        <div className="portal-empty !border-0 !bg-transparent !p-0 !shadow-none">
          <p className="portal-empty__title">Application received</p>
          <p className="portal-empty__body">
            Guide Official will verify your application. When approved, partner
            log in unlocks the developer portal so you can manage apps schools
            add to class.
          </p>
        </div>
        <p className="mt-5">
          <Link
            href="/auth/sign-in?as=developer"
            className="btn-primary inline-flex"
          >
            Partner log in
          </Link>
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/developers/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          contactEmail,
          organization,
          websiteUrl,
          appName,
          appAbout,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="portal-panel space-y-5">
      <div>
        <p className="portal-eyebrow">For developers</p>
        <h2 className="display-feature mt-1">Apply as a developer</h2>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
          Verified partners only — not a public marketplace. Share your
          organization, website, and app details. Guide Official reviews each
          application.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-forest-900">
          Your name
          <input
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Work email
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Organization
          <input
            required
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Website
          <input
            required
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="field mt-1.5"
            placeholder="https://"
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-forest-900">
        App name
        <input
          required
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          className="field mt-1.5"
        />
      </label>

      <label className="block text-sm font-semibold text-forest-900">
        About the app
        <textarea
          required
          value={appAbout}
          onChange={(e) => setAppAbout(e.target.value)}
          className="field mt-1.5 min-h-[140px]"
          minLength={20}
          placeholder="What schools get, who it is for, and how it fits classroom use."
        />
      </label>

      {error ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
