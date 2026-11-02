"use client";

import type { ReactNode } from "react";

/** Shared Clever-density messages chrome for student + teacher portals. */
export function MessagesInbox({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="msg-inbox">
      <aside className="msg-inbox__side">{sidebar}</aside>
      <section className="msg-inbox__main">{children}</section>
    </div>
  );
}

export function MessagesThreadButton({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "msg-thread msg-thread--active"
          : "msg-thread"
      }
    >
      <span className="msg-thread__title">{title}</span>
      <span className="msg-thread__sub">{subtitle}</span>
    </button>
  );
}

export function MessagesBubble({
  name,
  when,
  body,
}: {
  name: string;
  when: string;
  body: string;
}) {
  return (
    <li className="msg-bubble">
      <p className="msg-bubble__meta">
        <span className="msg-bubble__name">{name}</span>
        <span className="msg-bubble__when">{when}</span>
      </p>
      <p className="msg-bubble__body">{body}</p>
    </li>
  );
}
