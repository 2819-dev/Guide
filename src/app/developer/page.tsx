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

function appStatusLabel(status: string): string {
  if (status === "active") return "Live";
  if (status === "pending") return "In review";
  if (status === "paused" || status === "inactive") return "Paused";
  return "Not live";
}

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
      title={`Welcome, ${authz.profile.displayName}`}
      subtitle="See your apps on Guide and how schools add them to classes."
      chips={[
        { href: "#apps", label: "My apps", active: true },
        { href: "#manage", label: "App details" },
        { href: "#docs", label: "How it works" },
      ]}
      accountName={authz.profile.displayName}
    >
      <section id="apps">
        <h2 className="portal-section-title">My apps</h2>
        <p className="portal-section-lede mb-4">
          Approved apps that teachers can add to their classes.
        </p>
        {apps.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty__title">No apps yet</p>
            <p className="portal-empty__body">
              Your app appears here once a Guide Official finishes setting up
              its listing.
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
                    {appStatusLabel(app.status)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="manage">
        <h2 className="portal-section-title">App details</h2>
        <p className="portal-section-lede mb-4">
          To change a listing, email the Guide team. A Guide Official reviews
          every update.
        </p>
        {apps.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty__title">No app details yet</p>
            <p className="portal-empty__body">
              Listing details for your apps will appear here.
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
                    {appStatusLabel(app.status)}
                  </span>
                </div>
                {app.websiteUrl ? (
                  <p className="mt-1 text-sm">
                    <a
                      href={app.websiteUrl}
                      className="font-semibold text-forest-800 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit website
                    </a>
                  </p>
                ) : null}
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
        <h2 className="portal-section-title">How it works</h2>
        <p className="portal-section-lede mb-4">
          How approved apps reach classrooms on Guide.
        </p>
        <div className="portal-panel space-y-3 text-[0.9375rem] leading-relaxed text-ink-muted">
          <ol className="list-decimal space-y-2 pl-5">
            <li>A Guide Official reviews and approves your app.</li>
            <li>Teachers add your app to the classes that need it.</li>
            <li>Students open it from My apps in their student portal.</li>
          </ol>
          <p>
            Questions about your listing? Email{" "}
            <a
              href="mailto:hello@guidelearning.org"
              className="font-semibold text-forest-800 hover:underline"
            >
              hello@guidelearning.org
            </a>
            .
          </p>
          <p className="pt-1">
            <Link href="/" className="font-semibold text-forest-800 hover:underline">
              Back to Guide home
            </Link>
          </p>
        </div>
      </section>
    </PortalShell>
  );
}
