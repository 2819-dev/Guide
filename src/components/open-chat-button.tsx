"use client";

/** Opens the live chat window (see SupportChatWidget). */
export function OpenChatButton({ label = "Chat with us" }: { label?: string }) {
  return (
    <button
      type="button"
      className="btn-primary"
      onClick={() => window.dispatchEvent(new Event("guide:open-chat"))}
    >
      {label}
    </button>
  );
}
