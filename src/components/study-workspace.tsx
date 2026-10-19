"use client";

import { useEffect, useState } from "react";
import { GemaraReader } from "@/components/gemara-reader";
import { NotesUpload } from "@/components/notes-upload";
import { QuizPanel } from "@/components/quiz-panel";
import type { DafText } from "@/lib/sefaria";

type Props = {
  text: DafText;
  signedIn: boolean;
};

export function StudyWorkspace({ text, signedIn }: Props) {
  const [hasNotes, setHasNotes] = useState(false);
  const tractateSlug = text.daf.tractateSlug;
  const dafId = text.daf.id;

  useEffect(() => {
    if (!signedIn) return;
    void fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dafId, tractateSlug }),
    });
  }, [dafId, tractateSlug, signedIn]);

  return (
    <div className="space-y-14">
      <GemaraReader text={text} />
      <NotesUpload
        dafId={dafId}
        tractateSlug={tractateSlug}
        signedIn={signedIn}
        onNotesChange={(notes) => setHasNotes(notes.length > 0)}
      />
      <QuizPanel
        dafId={dafId}
        tractateSlug={tractateSlug}
        hasNotes={hasNotes}
        signedIn={signedIn}
      />
    </div>
  );
}
