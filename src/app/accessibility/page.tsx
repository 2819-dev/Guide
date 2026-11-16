import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Guide's commitment to accessibility for students, teachers, and families.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibility"
      effective="November 16, 2026"
      intro={
        <p>
          Every student should be able to use Guide. We design and build Guide
          to work for people who use keyboards, screen readers, zoom, high
          contrast, and other assistive technology, and we keep improving it.
        </p>
      }
    >
      <h2>Our goal</h2>
      <p>
        We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at
        Level AA across Guide, including the student, teacher, and school
        administrator portals.
      </p>

      <h2>What we do today</h2>
      <ul>
        <li>
          We test public pages, in both light and dark mode, with automated
          WCAG 2.1 AA checks before we release changes.
        </li>
        <li>Text and buttons meet AA color-contrast levels.</li>
        <li>
          Pages work with a keyboard alone, and focused items have a visible
          outline.
        </li>
        <li>Guide follows your device’s light or dark mode setting.</li>
        <li>
          Pages adapt to phones, tablets, Chromebooks, and browser zoom up to
          200% without losing content.
        </li>
        <li>
          Pictures that carry meaning have text descriptions; decorative ones
          are hidden from screen readers.
        </li>
        <li>
          In TestQuiz, teachers choose each question’s time limit, so they can
          give students more time when they need it.
        </li>
      </ul>

      <h2>Known limitations</h2>
      <p>We’re open about where Guide still falls short:</p>
      <ul>
        <li>
          Guide hasn’t had an independent accessibility audit yet. We plan to
          get one.
        </li>
        <li>
          Signed-in portals and live TestQuiz games haven’t been fully tested
          with every screen reader. Fast-moving live games can be harder to
          follow with assistive technology.
        </li>
        <li>
          Apps made by partners and hosted on their own sites, such as Arcade
          Education, are responsible for their own accessibility.
        </li>
      </ul>

      <h2>Tell us about a barrier</h2>
      <p>
        If something in Guide is hard or impossible for you to use, please tell
        us. Email{" "}
        <a href="mailto:hello@guidelearning.org">hello@guidelearning.org</a>{" "}
        with the page you were on, what you were trying to do, and the device
        or assistive technology you use. We read every message, and we’ll help
        you get what you need another way while we fix it.
      </p>
      <p>
        Schools can also contact us to request information about Guide’s
        accessibility for their own review.
      </p>
    </LegalPage>
  );
}
