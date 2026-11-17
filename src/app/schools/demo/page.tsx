import Link from "next/link";
import { SchoolDemo } from "@/components/school-demo";

export const runtime = "edge";

export const metadata = {
  title: "School demo · Guide",
  description:
    "An interactive demo of Guide for teachers, students, and school administrators. Best viewed on a computer or tablet.",
};

/** Interactive school demo. Narrow screens see a message to use a larger screen. */
export default function SchoolDemoPage() {
  return (
    <div className="portal-page">
      <div className="demo-narrow-gate content-band">
        <p className="eyebrow">For schools</p>
        <h1 className="display-feature mx-auto mt-2 max-w-[18ch]">
          Open the demo on a larger screen
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-muted">
          The interactive demo is designed for a computer or tablet. You can
          still book a meeting or apply for your school from here.
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
