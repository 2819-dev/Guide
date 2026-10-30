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
const EMAIL_PRIMARY = "#4a8f6c";
const EMAIL_FOOTER = "#3d7a5c";

function shell(inner: string): string {
  const banner = `${guidePublicUrl()}/brand/guide-banner.jpg`;
  return `<!DOCTYPE html><html><body style="margin:0;background:${EMAIL_SKY};font-family:Georgia,serif;color:${EMAIL_INK}">
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
      <p style="margin:0 0 14px;font-weight:600">Dear ${escapeHtml(first)},</p>
      <p style="margin:0 0 14px">Welcome to Guide — for engaged students and well-managed classrooms.
      Sign in anytime to open your apps and classroom tools.</p>
      <p style="margin:0 0 18px"><a href="${guidePublicUrl()}/auth/sign-in" style="display:inline-block;background:${EMAIL_PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Log in to Guide</a></p>
      <p style="margin:0;color:${EMAIL_MUTED};font-size:14px">If you did not expect this email, you can ignore it.</p>
    `),
    text: `Welcome to Guide\n\nLog in: ${guidePublicUrl()}/auth/sign-in`,
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
      <p style="margin:0 0 14px;font-weight:600">Dear Teacher,</p>
      <p style="margin:0 0 14px"><strong>${escapeHtml(opts.schoolName)}</strong> invited you to Guide — one calm place for classes, learning apps, and classroom tools.</p>
      <p style="margin:0 0 14px">Create your password with the button below. After setup, open your Teacher Portal to manage classes and add apps.</p>
      <p style="margin:0 0 18px"><a href="${escapeHtml(opts.inviteUrl)}" style="display:inline-block;background:${EMAIL_PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Set up your account</a></p>
      <p style="margin:0;color:${EMAIL_MUTED};font-size:14px">This link expires in 14 days. Already set up? <a href="${guidePublicUrl()}/auth/sign-in?as=educator" style="color:${EMAIL_PRIMARY};font-weight:600">Admin</a>.</p>
    `),
    text: `Dear Teacher,\n\n${opts.schoolName} invited you to Guide.\nSet up: ${opts.inviteUrl}\nTeacher log in: ${guidePublicUrl()}/auth/sign-in?as=educator`,
  });
}

/** Confirm Official Release notify signup. */
export async function sendReleaseNotifyEmail(opts: {
  to: string;
  releaseDate: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: opts.to,
    subject: `Guide Official Release · ${opts.releaseDate}`,
    html: shell(`
      <p style="margin:0 0 14px;font-weight:600">You’re on the list.</p>
      <p style="margin:0 0 14px">We’ll email you when Guide’s Official Release goes live on
      <strong>${escapeHtml(opts.releaseDate)}</strong>.</p>
      <p style="margin:0 0 18px"><a href="${guidePublicUrl()}" style="display:inline-block;background:${EMAIL_PRIMARY};color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Visit Guide</a></p>
      <p style="margin:0;color:${EMAIL_MUTED};font-size:14px">If you did not request this, you can ignore this message.</p>
    `),
    text: `You’re on the list for Guide Official Release · ${opts.releaseDate}\n\n${guidePublicUrl()}`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
