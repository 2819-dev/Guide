import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms of Service",
  description: "The terms for using Guide, the school platform at guidelearning.org.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      effective="November 16, 2026"
      intro={
        <p>
          These terms apply to everyone who uses Guide at guidelearning.org:
          students, teachers, school administrators, developers, and
          visitors. By using Guide, you agree to these terms. If you use Guide
          through your school, your school may also have its own rules for
          using it.
        </p>
      }
    >
      <h2>What Guide is</h2>
      <p>
        Guide is a school platform. Schools apply to use it, and the Guide
        team (Guide Officials) reviews each school. School administrators
        invite teachers, teachers create classes and add learning apps, and
        students log in to use those apps for class.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>Give accurate information when you create an account or apply.</li>
        <li>Keep your password private. You are responsible for activity on your account.</li>
        <li>
          Tell us right away at{" "}
          <a href="mailto:hello@guidelearning.org">hello@guidelearning.org</a>{" "}
          if you think someone else is using your account.
        </li>
        <li>
          Students should use Guide only through their school. Students under
          13 must be enrolled by their school.
        </li>
      </ul>

      <h2>Schools and administrators</h2>
      <p>
        If you apply on behalf of a school, you confirm that you are
        authorized to act for that school. Your school is responsible for deciding who gets access,
        for getting any consent its rules or local law require before students
        use Guide, and for how its staff use Guide. Guide may approve or decline
        any application.
      </p>

      <h2>Acceptable use</h2>
      <p>When you use Guide, you must not:</p>
      <ul>
        <li>Harass, bully, threaten, or harm anyone, or post hateful or inappropriate content.</li>
        <li>Share someone else’s personal information without permission.</li>
        <li>Try to access accounts, classes, or data that are not yours.</li>
        <li>Disrupt, overload, or probe Guide’s systems, or bypass its security.</li>
        <li>Use Guide to advertise, spam, or collect information about other users.</li>
        <li>Break the law or your school’s rules.</li>
      </ul>
      <p>
        We may remove content or suspend accounts that break these rules, and
        we may notify the school when a student or staff account is involved.
      </p>

      <h2>Your content</h2>
      <p>
        You keep ownership of what you create in Guide, such as quizzes,
        notes, and messages. You allow us to store, display, and process it
        only to provide Guide to you and your school. If you choose to publish a
        quiz to Blitz Discover, other teachers can view and copy it.
      </p>

      <h2>Apps and developers</h2>
      <p>
        Some apps on Guide are made by Guide and some by approved developers.
        Apps hosted on another site have their own terms. Developers must
        protect any student information they receive, use it only to provide
        their app to the school, and follow the terms of their approval. We
        may remove an app at any time.
      </p>

      <h2>Privacy</h2>
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains what
        information we collect and how we protect it, including student
        information.
      </p>

      <h2>Guide’s content</h2>
      <p>
        The Guide name, logo, design, and software belong to Guide. You may
        not copy or reuse them except as needed to use Guide.
      </p>

      <h2>Changes and availability</h2>
      <p>
        We continue to improve Guide, so features may change. We work to keep
        Guide available, but we cannot guarantee that it will never be
        interrupted. If we change these terms in a meaningful way, we will
        update the date at the top of this page and notify schools.
      </p>

      <h2>Ending use</h2>
      <p>
        You can stop using Guide at any time. A school can ask us to close its
        accounts and delete its data. We may suspend or close accounts that
        break these terms.
      </p>

      <h2>Disclaimers and limits</h2>
      <p>
        Guide is provided “as is.” To the extent the law allows, Guide is not
        liable for indirect or consequential damages, or for losses caused by
        apps or sites we do not operate. Nothing in these terms limits rights
        you have under the law that cannot be limited.
      </p>

    </LegalPage>
  );
}
