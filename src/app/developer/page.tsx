import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import {
  getDeveloperStatus,
  hasDeveloperAccess,
  listDeveloperOwnedApps,
} from "@/lib/developer-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Developer portal" };

export default async function DeveloperPortalPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=developer");

  const ok = await hasDeveloperAccess(authz.profile);
  if (!ok) {
    const status = await getDeveloperStatus(authz.profile.id);
    if (status.status === "pending") redirect("/developers/apply");
    if (status.status === "rejected") redirect("/developers/apply");
    redirect("/developers/apply");
  }

  const apps = await listDeveloperOwnedApps(authz.profile.id);

  return (
    <PortalShell
      eyebrow="Developer portal"
      title={`Hi, ${authz.profile.displayName}`}
      subtitle="Your verified apps are in the center. Use tabs to manage apps and docs."
      chips={[
        { href: "#apps", label: "My apps", active: true },
        { href: "#manage", label: "Manage apps" },
        { href: "#docs", label: "Docs" },
      ]}
    >
      <section id="apps">
        <h2 className="portal-section-title">My apps</h2>
        {apps.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty__title">No apps yet</p>
            <p className="portal-empty__body">
              When Guide Official approves your application, your app appears
              here.
            </p>
          </div>
        ) : (
          <ul className="portal-apps-grid">
            {apps.map((app) => (
              <li key={app.id}>
                <div className="portal-app-tile">
                  <span className="portal-app-tile__mark" aria-hidden>
                    {app.name.slice(0, 1)}
                  </span>
                  <span className="portal-app-tile__name">{app.name}</span>
                  <span className="portal-app-tile__tag">
                    {app.status === "active" ? "Active" : app.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="manage" className="mt-2">
        <h2 className="portal-section-title">Manage apps</h2>
        <div className="portal-panel">
          <p className="text-[0.95rem] leading-relaxed text-ink-muted">
            Update listing details with Guide Official for now. School-facing
            installs stay curated — this is not a public marketplace.
          </p>
          {apps.map((app) => (
            <div
              key={app.id}
              className="mt-4 border-t border-line pt-4 first:mt-0 first:border-0 first:pt-0"
            >
              <p className="font-semibold text-forest-950">{app.name}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Slug · {app.slug}
                {app.websiteUrl ? (
                  <>
                    {" · "}
                    <a
                      href={app.websiteUrl}
                      className="font-semibold text-forest-800"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Website
                    </a>
                  </>
                ) : null}
              </p>
              {app.about ? (
                <p className="mt-2 text-sm leading-relaxed text-forest-950">
                  {app.about}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section id="docs">
        <h2 className="portal-section-title">Docs</h2>
        <div className="portal-panel space-y-2 text-[0.95rem] leading-relaxed text-ink-muted">
          <p>
            Guide hosts verified partner apps for schools. Students and teachers
            open apps from their portals after a school installs them.
          </p>
          <p>
            Questions for Official:{" "}
            <a
              href="mailto:hello@guidelearning.org"
              className="font-semibold text-forest-800"
            >
              hello@guidelearning.org
            </a>
          </p>
          <p>
            <Link href="/" className="font-semibold text-forest-800">
              ← Back to Guide
            </Link>
          </p>
        </div>
      </section>
    </PortalShell>
  );
}
