import Link from "next/link";
import { SchoolDemo } from "@/components/school-demo";

export const runtime = "edge";

export const metadata = {
  title: "School demo · Guide",
  description:
    "Interactive desktop and iPad demo — try Guide as a teacher, student, or school administrator.",
};

/** Interactive school demo. Narrow phones get a visit-on-desktop message. */
export default function SchoolDemoPage() {
  return (
    <div className="portal-page">
      <div className="demo-narrow-gate content-band">
        <p className="eyebrow">For schools</p>
        <h1 className="display-feature mx-auto mt-2 max-w-[18ch]">
          View the demo on desktop or iPad
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-muted">
          This walkthrough lets you try teacher, student, and school
          administrator portals on a larger screen. Open Guide on a desktop or
          iPad to explore the demo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/schools/meeting" className="btn-primary">
            Book a meeting
          </Link>
          <Link href="/education#apply" className="btn-secondary">
            Apply for your school
          </Link>
        </div>
      </div>

      <SchoolDemo />
    </div>
  );
}
