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

export const metadata = { title: "Developer portal · Guide" };

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
      eyebrow="Developer"
      title={`Hi, ${authz.profile.displayName}`}
      subtitle="Your verified apps sit in the center. Manage listings and docs from the tabs above — so schools can keep students engaged."
      chips={[
        { href: "#apps", label: "My apps", active: true },
        { href: "#manage", label: "Manage apps" },
        { href: "#docs", label: "Docs" },
      ]}
      accountName={authz.profile.displayName}
    >
      <section id="apps">
        <h2 className="portal-section-title">My apps</h2>
        <p className="-mt-2 mb-4 text-sm text-ink-muted">
          Apps teachers can add to a class after Official approval.
        </p>
        {apps.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty__title">No apps listed yet</p>
            <p className="portal-empty__body">
              When Guide Official finishes setup, your app appears here for
              schools to add to class.
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
        <p className="-mt-2 mb-4 text-sm text-ink-muted">
          Listing details stay curated with Official after approval.
        </p>
        {apps.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty__title">Nothing to manage yet</p>
            <p className="portal-empty__body">
              After your first app is listed, update website and about copy here
              with Guide Official.
            </p>
          </div>
        ) : (
          <div className="portal-panel space-y-0">
            {apps.map((app) => (
              <div
                key={app.id}
                className="border-t border-line py-4 first:border-0 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-forest-950">{app.name}</p>
                  <span
                    className={`status-chip status-chip--${
                      app.status === "active" ? "approved" : "pending"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
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
        )}
      </section>

      <section id="docs">
        <h2 className="portal-section-title">Docs</h2>
        <p className="-mt-2 mb-4 text-sm text-ink-muted">
          How partner apps reach classrooms on Guide.
        </p>
        <div className="portal-panel space-y-3 text-[0.95rem] leading-relaxed text-ink-muted">
          <p>
            Guide hosts verified partner apps for schools. Teachers add an app
            to a class; students open it from My apps — so learning stays
            engaging and classrooms stay organized.
          </p>
          <p>
            Installs stay school-curated. There is no public open marketplace.
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
          <p className="pt-1">
            <Link href="/" className="font-semibold text-forest-800">
              ← Back to Guide
            </Link>
          </p>
        </div>
      </section>
    </PortalShell>
  );
}
