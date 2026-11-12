import { NextResponse } from "next/server";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { getEntitlement } from "@/lib/testquiz/entitlements";
import { getGame, listGamesForHost } from "@/lib/testquiz/store";

export const runtime = "edge";

/** Basic reports: recent games + optional game detail. */
export async function GET(request: Request) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }

  const entitlement = await getEntitlement(authz.profile.id);
  const url = new URL(request.url);
  const gameId = url.searchParams.get("gameId");

  if (gameId) {
    const game = await getGame(gameId);
    if (!game || game.hostProfileId !== authz.profile.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const players = game.players
      .filter((p) => !p.kicked)
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        rank: i + 1,
        name: game.settings.allowNicknames
          ? p.nickname || p.displayName
          : p.displayName,
        score: p.score,
        correctCount: game.answers.filter(
          (a) => a.playerId === p.id && a.correct === true,
        ).length,
      }));

    const byQuestion = entitlement.plan.advancedReports
      ? game.questions.map((q) => {
          const answers = game.answers.filter((a) => a.questionId === q.id);
          const graded = answers.filter((a) => a.correct !== null);
          const correct = graded.filter((a) => a.correct).length;
          return {
            questionId: q.id,
            prompt: q.prompt,
            type: q.type,
            responses: answers.length,
            accuracy:
              graded.length === 0
                ? null
                : Math.round((correct / graded.length) * 100),
          };
        })
      : undefined;

    return NextResponse.json({
      game: {
        id: game.id,
        pin: game.pin,
        title: game.quizTitle,
        phase: game.phase,
        createdAt: game.createdAt,
      },
      players,
      byQuestion,
      canExport: entitlement.plan.reportsExport,
    });
  }

  const games = await listGamesForHost(authz.profile.id, 50);
  return NextResponse.json({
    games,
    plan: entitlement.plan,
    canExport: entitlement.plan.reportsExport,
  });
}
