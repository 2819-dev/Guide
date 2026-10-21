import { redirect } from "next/navigation";
import { FIRST_APP_SLUG, studyPath } from "@/lib/apps";
import { parseDafId } from "@/lib/daf";
import { getFeaturedTractate } from "@/lib/tractates";

export const runtime = 'edge';

type Props = {
  params: Promise<{ tractate: string }>;
};

/** Legacy /study/:tractate → /apps/amud/... */
export default async function StudyTractateRedirect({ params }: Props) {
  const { tractate: slug } = await params;
  const featured = getFeaturedTractate();
  if (parseDafId(slug, featured)) {
    redirect(studyPath(featured.slug, slug));
  }
  redirect(`/apps/${FIRST_APP_SLUG}/${slug}`);
}
