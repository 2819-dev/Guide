import { redirect } from "next/navigation";
import { studyPath } from "@/lib/apps";

export const runtime = 'edge';

type Props = {
  params: Promise<{ tractate: string; daf: string }>;
};

/** Legacy /study/:tractate/:daf → first Guide app. */
export default async function StudyDafRedirect({ params }: Props) {
  const { tractate, daf } = await params;
  redirect(studyPath(tractate, daf));
}
