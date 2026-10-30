/**
 * Consumer-facing portal CTA for Teacher / School Administrator.
 * Never “locked” / ops language.
 */
export function educatorPortalLabel(opts: {
  kind?: "teacher" | "school" | null;
  contactRole?: string | null;
}): "Teacher Portal" | "School Administrator Portal" {
  if (opts.kind === "teacher") return "Teacher Portal";
  const role = (opts.contactRole ?? "").toLowerCase();
  if (role.includes("teacher")) return "Teacher Portal";
  return "School Administrator Portal";
}
