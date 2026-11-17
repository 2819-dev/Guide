import { guidePublicUrl } from "@/lib/site";

/** Locked From for all transactional Guide mail (welcome + teacher invites). */
export const GUIDE_FROM_EMAIL = "Guide <noreply@guidelearning.org>";

export type SendEmailResult =
  | { ok: true; id?: string; stubbed?: boolean; from?: string }
  | { ok: false; error: string; stubbed?: boolean; from?: string };

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Low-level send via Resend HTTP API — stubs when RESEND_API_KEY is missing. */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const from = GUIDE_FROM_EMAIL;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.info(
      "[email] RESEND_API_KEY missing — stubbed send from",
      from,
      ":",
      opts.subject,
      "→",
      opts.to,
    );
    return { ok: true, stubbed: true, from };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        error: data.message || `Resend HTTP ${res.status}`,
        from,
      };
    }
    return { ok: true, id: data.id, from };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Send failed",
      from,
    };
  }
}

/** Soft mint-forest email chrome (inline hex — email clients ignore CSS vars). */
const EMAIL_INK = "#243530";
const EMAIL_MUTED = "#5f7268";
const EMAIL_LINE = "#e4efe8";
const EMAIL_SKY = "#f6fbf8";
const EMAIL_PRIMARY = "#367553";
const EMAIL_FOOTER = "#3d7a5c";

function shell(inner: string): string {
  const banner = `${guidePublicUrl()}/brand/guide-banner.jpg`;
  return `<!DOCTYPE html><html><body style="margin:0;background:${EMAIL_SKY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${EMAIL_INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid ${EMAIL_LINE};border-radius:10px;overflow:hidden">
<tr><td><img src="${banner}" alt="Guide" width="560" style="display:block;width:100%;height:auto;border:0" /></td></tr>
<tr><td style="padding:28px 32px;font-size:16px;line-height:1.65">${inner}</td></tr>
<tr><td style="background:${EMAIL_FOOTER};padding:18px 32px;font-family:system-ui,sans-serif;font-size:13px;color:#eef8f2">
Guide · <a href="${guidePublicUrl()}" style="color:#eef8f2">${guidePublicUrl().replace(/^https?:\/\//, "")}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
}): Promise<SendEmailResult> {
  const first = opts.name.trim().split(/\s+/)[0] || "there";
  return sendEmail({
    to: opts.to,
    subject: "Welcome to Guide",
    html: shell(`
      <p style="margin:0 0 14px">Hello ${escapeHtml(first)},</p>
      <p style="margin:0 0 14px">Welcome to Guide. Your school's classes and learning apps are now in one place.
      Log in at any time to get started.</p>
      <p style="margin:0 0 18px"><a href="${guidePublicUrl()}/auth/sign-in" style="display:inline-block;background:${EMAIL_PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Log in to Guide</a></p>
      <p style="margin:0;color:${EMAIL_MUTED};font-size:14px">If you did not expect this email, you can ignore it.</p>
    `),
    text: `Welcome to Guide\n\nLog in: ${guidePublicUrl()}/auth/sign-in`,
  });
}

/** Tell a school administrator their application was reviewed. */
export async function sendSchoolDecisionEmail(opts: {
  to: string;
  name: string;
  schoolName: string;
  approved: boolean;
}): Promise<SendEmailResult> {
  const portal = `${guidePublicUrl()}/education/panel`;
  const first = opts.name.split(/\s+/)[0] || "there";
  if (opts.approved) {
    return sendEmail({
      to: opts.to,
      subject: `${opts.schoolName} is approved on Guide`,
      html: shell(`
        <p style="margin:0 0 14px">Hello ${escapeHtml(first)},</p>
        <p style="margin:0 0 14px"><strong>${escapeHtml(opts.schoolName)}</strong> has been approved on Guide.
        You can now create classes, add students, invite teachers, and add apps from your school portal.</p>
        <p style="margin:0 0 18px"><a href="${portal}" style="display:inline-block;background:${EMAIL_PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Open your school portal</a></p>
      `),
      text: `${opts.schoolName} is approved on Guide. Open your school portal: ${portal}`,
    });
  }
  return sendEmail({
    to: opts.to,
    subject: `Update on your Guide application for ${opts.schoolName}`,
    html: shell(`
      <p style="margin:0 0 14px">Hello ${escapeHtml(first)},</p>
      <p style="margin:0 0 14px">We were not able to approve <strong>${escapeHtml(opts.schoolName)}</strong> at this time.
      You can update your application from your portal, or contact hello@guidelearning.org with any questions.</p>
      <p style="margin:0 0 18px"><a href="${portal}" style="display:inline-block;background:${EMAIL_PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Open your portal</a></p>
    `),
    text: `We were not able to approve ${opts.schoolName} at this time. Open your portal: ${portal}`,
  });
}

/** Tell a teacher a student asked for password help. */
export async function sendPasswordHelpEmail(opts: {
  to: string;
  teacherName: string;
  studentName: string;
  username: string;
}): Promise<SendEmailResult> {
  const portal = `${guidePublicUrl()}/education/panel#password-help`;
  return sendEmail({
    to: opts.to,
    subject: `${opts.studentName} needs a new Guide password`,
    html: shell(`
      <p style="margin:0 0 14px">Hello ${escapeHtml(opts.teacherName)},</p>
      <p style="margin:0 0 14px"><strong>${escapeHtml(opts.studentName)}</strong>
      (username <strong>${escapeHtml(opts.username)}</strong>) forgot their password
      and asked for help.</p>
      <p style="margin:0 0 18px"><a href="${portal}" style="display:inline-block;background:${EMAIL_PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Set a new password</a></p>
      <p style="margin:0;color:${EMAIL_MUTED};font-size:14px">You’re getting this because the student is in one of your classes.</p>
    `),
    text: `${opts.studentName} (username ${opts.username}) forgot their Guide password. Set a new one: ${portal}`,
  });
}

export async function sendTeacherInviteEmail(opts: {
  to: string;
  schoolName: string;
  inviteUrl: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: opts.to,
    subject: `You're invited to Guide · ${opts.schoolName}`,
    html: shell(`
      <p style="margin:0 0 14px">Hello,</p>
      <p style="margin:0 0 14px"><strong>${escapeHtml(opts.schoolName)}</strong> has invited you to join Guide, where your school's classes and learning apps are in one place.</p>
      <p style="margin:0 0 14px">Set up your account to get started. You can then manage your classes and apps from the teacher portal.</p>
      <p style="margin:0 0 18px"><a href="${escapeHtml(opts.inviteUrl)}" style="display:inline-block;background:${EMAIL_PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Set up your account</a></p>
      <p style="margin:0;color:${EMAIL_MUTED};font-size:14px">This link expires in 14 days. Already set up? <a href="${guidePublicUrl()}/auth/sign-in?as=educator" style="color:${EMAIL_PRIMARY};font-weight:600">Log in</a>.</p>
    `),
    text: `Hello,\n\n${opts.schoolName} has invited you to join Guide.\nSet up: ${opts.inviteUrl}\nTeacher log in: ${guidePublicUrl()}/auth/sign-in?as=educator`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Tell Guide Officials a live chat is waiting for a person. */
export async function sendChatHandoffEmail(opts: {
  to: string[];
  visitor: string;
  reason: string;
  preview: string;
}): Promise<SendEmailResult> {
  const panel = `${guidePublicUrl()}/admin#live-chat`;
  return sendEmail({
    to: opts.to,
    subject: `Live chat: ${opts.visitor} is waiting for a team member`,
    html: shell(`
      <p style="margin:0 0 14px"><strong>${escapeHtml(opts.visitor)}</strong> requested a member of the Guide team in live chat.</p>
      <p style="margin:0 0 14px">${escapeHtml(opts.reason)}</p>
      <p style="margin:0 0 18px;color:${EMAIL_MUTED};font-size:14px">Last message: “${escapeHtml(opts.preview)}”</p>
      <p style="margin:0"><a href="${panel}" style="display:inline-block;background:${EMAIL_PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Open live chat</a></p>
    `),
    text: `${opts.visitor} is waiting in Guide live chat. ${opts.reason} Open: ${panel}`,
  });
}
