"use client";

import Image from "next/image";
import { FormEvent, useId, useState } from "react";
import { HOME_HERO_RELEASE_DATE, HOME_HERO_RELEASE_SRC } from "@/lib/brand";

/**
 * Clever cover right panel — Official Release art + working Notify Me.
 * Image includes baked type; hotspot + form provide a real capture.
 * Official Release hero image is locked — do not replace with a CSS-only panel.
 */
export function HeroReleasePanel() {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Try again.");
        return;
      }
      setStatus("done");
      setMessage(`You’re on the list for ${HOME_HERO_RELEASE_DATE}.`);
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div className="hero-visual-panel hero-visual-panel--release">
      <Image
        src={HOME_HERO_RELEASE_SRC}
        alt={`Guide Official Release ${HOME_HERO_RELEASE_DATE}`}
        fill
        className="hero-visual-panel__img"
        priority
        sizes="(max-width: 1024px) 92vw, 27.5rem"
      />

      {/* Hotspot over baked Notify Me — opens email capture */}
      {!open && status !== "done" ? (
        <button
          type="button"
          className="hero-notify-hotspot"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls={formId}
        >
          <span className="sr-only">Notify Me about Official Release</span>
        </button>
      ) : null}

      {(open || status === "done") && (
        <div
          className="hero-notify-card"
          id={formId}
          role="region"
          aria-label="Notify Me"
        >
          {status === "done" ? (
            <p className="hero-notify-card__done">{message}</p>
          ) : (
            <form className="hero-notify-form" onSubmit={onSubmit}>
              <label
                className="hero-notify-form__label"
                htmlFor={`${formId}-email`}
              >
                Email for release updates
              </label>
              <div className="hero-notify-form__row">
                <input
                  id={`${formId}-email`}
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  disabled={status === "loading"}
                  className="hero-notify-form__input"
                />
                <button
                  type="submit"
                  className="hero-notify-form__submit"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "…" : "Notify Me"}
                </button>
              </div>
              {status === "error" ? (
                <p className="hero-notify-form__error" role="alert">
                  {message}
                </p>
              ) : (
                <p className="hero-notify-form__hint">
                  Official Release · {HOME_HERO_RELEASE_DATE}
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
