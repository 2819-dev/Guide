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

  useEffect(() => {
    if (!signedIn) return;
    void fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dafId: text.daf.id }),
    });
  }, [text.daf.id, signedIn]);

  return (
    <div className="space-y-14">
      <GemaraReader text={text} />
      <NotesUpload
        dafId={text.daf.id}
        signedIn={signedIn}
        onNotesChange={(notes) => setHasNotes(notes.length > 0)}
      />
      <QuizPanel
        dafId={text.daf.id}
        hasNotes={hasNotes}
        signedIn={signedIn}
      />
    </div>
  );
}
