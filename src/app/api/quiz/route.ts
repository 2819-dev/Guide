import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { parseDafId } from "@/lib/daf";
import { buildQuiz, scoreAnswers } from "@/lib/quiz";
import { fetchDafText } from "@/lib/sefaria";
import { getOrCreateLearner } from "@/lib/session";
import { progress, quizSessions, studyNotes } from "@/lib/schema";

const startSchema = z.object({
  dafId: z.string(),
  mode: z.enum(["daf", "notes", "mixed"]).default("daf"),
  noteId: z.string().uuid().optional(),
});

const submitSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(z.number().int().nullable()),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const learner = await getOrCreateLearner();
    const db = getDb();

    if ("quizId" in json) {
      const body = submitSchema.parse(json);
      const [session] = await db
        .select()
        .from(quizSessions)
        .where(
          and(
            eq(quizSessions.id, body.quizId),
            eq(quizSessions.learnerId, learner.id),
          ),
        )
        .limit(1);

      if (!session) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }

      const score = scoreAnswers(session.questions, body.answers);
      const [updated] = await db
        .update(quizSessions)
        .set({
          answers: body.answers,
          score,
          completedAt: new Date(),
        })
        .where(eq(quizSessions.id, session.id))
        .returning();

      const existing = await db
        .select()
        .from(progress)
        .where(
          and(
            eq(progress.learnerId, learner.id),
            eq(progress.dafId, session.dafId),
          ),
        )
        .limit(1);

      if (existing[0]) {
        await db
          .update(progress)
          .set({
            quizAttempts: existing[0].quizAttempts + 1,
            bestScore: Math.max(existing[0].bestScore ?? 0, score),
            lastVisitedAt: new Date(),
          })
          .where(eq(progress.id, existing[0].id));
      } else {
        await db.insert(progress).values({
          learnerId: learner.id,
          dafId: session.dafId,
          quizAttempts: 1,
          bestScore: score,
        });
      }

      return NextResponse.json({
        quiz: {
          id: updated.id,
          score,
          answers: updated.answers,
          questions: updated.questions,
        },
      });
    }

    const body = startSchema.parse(json);
    if (!parseDafId(body.dafId)) {
      return NextResponse.json({ error: "Invalid dafId" }, { status: 400 });
    }

    const dafText = await fetchDafText(body.dafId);
    let notesContent: string | null = null;
    let noteId: string | undefined = body.noteId;

    if (body.mode !== "daf") {
      if (noteId) {
        const [note] = await db
          .select()
          .from(studyNotes)
          .where(
            and(
              eq(studyNotes.id, noteId),
              eq(studyNotes.learnerId, learner.id),
            ),
          )
          .limit(1);
        notesContent = note?.content ?? null;
      } else {
        const [latest] = await db
          .select()
          .from(studyNotes)
          .where(
            and(
              eq(studyNotes.learnerId, learner.id),
              eq(studyNotes.dafId, body.dafId),
            ),
          )
          .orderBy(desc(studyNotes.createdAt))
          .limit(1);
        notesContent = latest?.content ?? null;
        noteId = latest?.id;
      }

      if (!notesContent) {
        return NextResponse.json(
          { error: "Upload study notes before starting a notes-based quiz." },
          { status: 400 },
        );
      }
    }

    const questions = buildQuiz({
      dafEnglish: dafText.english.length
        ? dafText.english
        : dafText.hebrew,
      notesContent,
      mode: body.mode,
    });

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "Not enough text yet to build a quiz. Try another daf or add longer notes.",
        },
        { status: 422 },
      );
    }

    const [quiz] = await db
      .insert(quizSessions)
      .values({
        learnerId: learner.id,
        dafId: body.dafId,
        mode: body.mode,
        noteId,
        questions,
      })
      .returning();

    // Public payload omits correctIndex until submit? Actually for self-study we can
    // keep correct answers server-side only for scoring — strip for client start.
    const publicQuestions = questions.map(
      ({ correctIndex: _c, explanation: _e, ...rest }) => rest,
    );

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        dafId: quiz.dafId,
        mode: quiz.mode,
        questions: publicQuestions,
      },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Quiz request failed" }, { status: 500 });
  }
}
