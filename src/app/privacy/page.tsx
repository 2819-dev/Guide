import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Guide collects, uses, and protects information about students, teachers, and schools.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective="November 16, 2026"
      intro={
        <p>
          Guide is a school platform. Students, teachers, and school
          administrators use it to run classes and open learning apps. We
          collect only what we need to provide that service, we never sell
          personal information, and we never use student information for
          advertising.
        </p>
      }
    >
      <h2>Summary</h2>
      <ul>
        <li>We do not sell personal information.</li>
        <li>We do not show ads, and we do not use student data to target ads or build advertising profiles.</li>
        <li>We do not use third-party analytics or tracking cookies.</li>
        <li>Schools control their students’ information and can ask us to delete it at any time.</li>
      </ul>

      <h2>Who this policy covers</h2>
      <p>
        This policy covers guidelearning.org and the Guide portals for
        students, teachers, school administrators, developers, and Guide
        Officials. Apps that run on their own sites (for example,
        Arcade Education) have their own privacy policies.
      </p>

      <h2>Information we collect</h2>
      <h3>Account information</h3>
      <p>
        Name, email address, password (stored only as a secure hash by our
        authentication provider), role (student, teacher, school
        administrator, developer, or Guide Official), and the school you
        belong to.
      </p>
      <h3>Class information</h3>
      <p>
        The classes a teacher creates, class invite codes, which students
        joined which class, and which apps a teacher added to a class.
      </p>
      <h3>Learning activity</h3>
      <p>
        Activity inside Guide’s own apps that teachers use to follow
        progress. For example: Blitz games, answers, and scores; Amud pages
        opened, quiz results, and notes a student saves.
      </p>
      <h3>Messages and requests</h3>
      <p>
        Messages between students and teachers, suggestions, and support
        requests you send us.
      </p>
      <h3>School and developer applications</h3>
      <p>
        When a school administrator applies for a school, or a developer
        applies to publish an app on Guide, we collect the contact details and answers in that
        application. Meeting requests include the contact details you enter.
      </p>
      <h3>Technical information</h3>
      <p>
        Our hosting provider processes standard request data (such as IP
        address and browser type) to deliver the site and protect it from
        abuse. We use only the cookies needed to keep you signed in.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To create and secure accounts and sign you in.</li>
        <li>To run classes: show students their apps, and show teachers their classes and progress.</li>
        <li>To send service emails, such as teacher invites and account notices.</li>
        <li>To review school and developer applications.</li>
        <li>To answer support requests and keep Guide safe and working.</li>
      </ul>
      <p>
        We do not use student information for advertising, to build profiles
        unrelated to school, or for any purpose other than providing Guide to
        the school.
      </p>

      <h2>Students and schools</h2>
      <p>
        When a school uses Guide, the school decides who gets an account and
        what their students use it for. We process student information on the
        school’s behalf and under its direction. For schools in the United
        States, this means we act as a “school official” with a legitimate
        educational interest under FERPA, and the school’s student records stay
        under the school’s control.
      </p>
      <p>
        Guide is meant for students under 13 only when their school has
        enrolled them. In that case, the school provides consent on behalf of
        parents for the educational use of Guide, as allowed under COPPA.
        Parents can contact their school, or us, to review their child’s
        information or ask for it to be deleted.
      </p>

      <h2>Who we share information with</h2>
      <p>We share information only in these cases:</p>
      <ul>
        <li>
          <strong>Inside your school.</strong> Teachers and administrators see
          the students in their classes and their class activity. Students see
          their own information and their teachers’ names.
        </li>
        <li>
          <strong>Apps your teacher adds.</strong> When a student opens an app
          hosted on another site, Guide signs them in by sharing the minimum
          needed: their name, role, and school.
        </li>
        <li>
          <strong>Service providers</strong> who run Guide for us and may only
          use the information to do so: Cloudflare (hosting), Neon (database
          and sign-in), and Resend (email).
        </li>
        <li>
          <strong>Legal reasons.</strong> If the law requires it, or to
          protect the safety of students or others.
        </li>
      </ul>

      <h2>How long we keep information</h2>
      <p>
        We keep information while an account or school is active. When a
        school stops using Guide, or asks us to delete its data, we delete
        student information within 60 days, except where the law requires us
        to keep it longer.
      </p>

      <h2>Your choices</h2>
      <p>
        You can view your account information on the Account page in your
        portal.
        Students and parents can also ask their school. To get a copy
        of your information, correct it, or delete it, email{" "}
        <a href="mailto:hello@guidelearning.org">hello@guidelearning.org</a>.
        For student accounts, we may confirm the request with the school.
      </p>

      <h2>Security</h2>
      <p>
        All traffic to Guide is encrypted (HTTPS). Passwords are never stored
        in plain text. Access to student information is limited to the people
        who need it, and Guide Officials review every school and developer
        before they get access. No system is perfectly secure; if a breach ever
        affects your information, we will notify the affected schools and users
        as the law requires.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we make a material change, we will update the date at the top and
        tell schools before the change takes effect. We will not make a change
        that lets us use student information in a new way without the
        school’s permission.
      </p>
    </LegalPage>
  );
}
