import Link from "next/link";
import { GuideWordmark } from "@/components/guide-logo";

/**
 * Footer — contact strip, four link columns, legal bar.
 * Guide school language only (no Clever trademarks).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="content-band site-footer-upper">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <GuideWordmark href="/" size="md" />
          <p className="text-sm text-ink-muted">
            Engaged students. Well-managed classrooms.
          </p>
        </div>

        <p className="site-footer-follow">
          Contact ·{" "}
          <a href="mailto:hello@guidelearning.org">hello@guidelearning.org</a>
        </p>

        <div className="site-footer-cols">
          <FooterCol
            head="Schools"
            links={[
              { href: "/education", label: "For schools" },
              { href: "/education#apply", label: "Apply for your school" },
              { href: "/schools/demo", label: "See a demo" },
              { href: "/schools/meeting", label: "Book a meeting" },
              { href: "/auth/sign-in?as=educator", label: "Teacher log in" },
            ]}
          />
          <FooterCol
            head="Students"
            links={[
              { href: "/auth/sign-in?as=student", label: "Student log in" },
              { href: "/apps", label: "App library" },
            ]}
          />
          <FooterCol
            head="Developers"
            links={[
              { href: "/developers/apply", label: "Partner with Guide" },
              { href: "/auth/sign-in?as=developer", label: "Partner log in" },
            ]}
          />
          <FooterCol
            head="Guide"
            links={[
              { href: "/#what", label: "What is Guide?" },
              { href: "mailto:hello@guidelearning.org", label: "Contact us" },
              { href: "/auth/sign-in?as=official", label: "Guide Official" },
            ]}
          />
        </div>
      </div>

      <div className="site-footer-legal">
        <div className="content-band site-footer-legal__inner">
          <p>Copyright © 2026 Guide</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <a href="mailto:hello@guidelearning.org">Accessibility</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  head,
  links,
}: {
  head: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="site-footer-col-head">{head}</p>
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            {l.href.startsWith("mailto:") ? (
              <a href={l.href} className="site-footer-link">
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="site-footer-link">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
