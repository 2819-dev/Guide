import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { resolveTractateAndDaf } from "@/lib/daf";
import { buildQuiz, scoreAnswers } from "@/lib/quiz";
import { requireProfile } from "@/lib/profile";
import { fetchDafText } from "@/lib/sefaria";
import { progress, quizSessions, studyNotes } from "@/lib/schema";
import { getFeaturedTractate, getTractate } from "@/lib/tractates";

const startSchema = z.object({
  dafId: z.string(),
  tractateSlug: z.string().optional(),
  mode: z.enum(["daf", "notes", "mixed"]).default("daf"),
  noteId: z.string().uuid().optional(),
});

const submitSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(z.number().int().nullable()),
});

export async function POST(request: Request) {
  const authz = await requireProfile(["customer", "rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const db = getDb();

    if ("quizId" in json) {
      const body = submitSchema.parse(json);
      const [session] = await db
        .select()
        .from(quizSessions)
        .where(
          and(
            eq(quizSessions.id, body.quizId),
            eq(quizSessions.profileId, authz.profile.id),
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
            eq(progress.profileId, authz.profile.id),
            eq(progress.tractateSlug, session.tractateSlug),
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
          profileId: authz.profile.id,
          tractateSlug: session.tractateSlug,
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
    const tractateSlug =
      body.tractateSlug ?? getFeaturedTractate().slug;
    if (!getTractate(tractateSlug)?.available) {
      return NextResponse.json({ error: "Unknown tractate" }, { status: 400 });
    }
    if (!resolveTractateAndDaf(tractateSlug, body.dafId)) {
      return NextResponse.json({ error: "Invalid daf" }, { status: 400 });
    }

    const dafText = await fetchDafText(body.dafId, tractateSlug);
    let notesContent: string | null = null;
    let noteId = body.noteId;

    if (body.mode !== "daf") {
      if (noteId) {
        const [note] = await db
          .select()
          .from(studyNotes)
          .where(
            and(
              eq(studyNotes.id, noteId),
              eq(studyNotes.profileId, authz.profile.id),
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
              eq(studyNotes.profileId, authz.profile.id),
              eq(studyNotes.tractateSlug, tractateSlug),
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
          { error: "Save study notes before starting a notes quiz." },
          { status: 400 },
        );
      }
    }

    const questions = buildQuiz({
      dafEnglish: dafText.english.length ? dafText.english : dafText.hebrew,
      notesContent,
      mode: body.mode,
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Not enough material yet for a quiz. Try another daf or longer notes." },
        { status: 422 },
      );
    }

    const [quiz] = await db
      .insert(quizSessions)
      .values({
        profileId: authz.profile.id,
        tractateSlug,
        dafId: body.dafId,
        mode: body.mode,
        noteId,
        questions,
      })
      .returning();

    const publicQuestions = questions.map(
      ({ correctIndex: _c, explanation: _e, ...rest }) => rest,
    );

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        tractateSlug: quiz.tractateSlug,
        dafId: quiz.dafId,
        mode: quiz.mode,
        questions: publicQuestions,
      },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid quiz request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Quiz failed" }, { status: 500 });
  }
}
