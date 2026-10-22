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

function shell(inner: string): string {
  const banner = `${guidePublicUrl()}/brand/guide-banner.jpg`;
  return `<!DOCTYPE html><html><body style="margin:0;background:#eef3f0;font-family:Georgia,serif;color:#152A20">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #d5e0d9;border-radius:4px;overflow:hidden">
<tr><td><img src="${banner}" alt="Guide" width="560" style="display:block;width:100%;height:auto;border:0" /></td></tr>
<tr><td style="padding:28px 32px;font-size:16px;line-height:1.65">${inner}</td></tr>
<tr><td style="background:#152A20;padding:18px 32px;font-family:system-ui,sans-serif;font-size:13px;color:#c5d4cb">
Guide · <a href="${guidePublicUrl()}" style="color:#c5d4cb">${guidePublicUrl().replace(/^https?:\/\//, "")}</a>
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
      <p style="margin:0 0 18px"><a href="${guidePublicUrl()}/auth/sign-in" style="display:inline-block;background:#1c3d2e;color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Log in to Guide</a></p>
      <p style="margin:0;color:#5a6b62;font-size:14px">If you did not expect this email, you can ignore it.</p>
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
      <p style="margin:0 0 14px"><strong>${escapeHtml(opts.schoolName)}</strong> invited you to Guide — keep students engaged and classrooms well managed with classes, apps, and tools in one place.</p>
      <p style="margin:0 0 14px">Create your password with the button below. Teachers log in only; there is no public teacher signup. After setup, open your portal to manage classes and add apps.</p>
      <p style="margin:0 0 18px"><a href="${escapeHtml(opts.inviteUrl)}" style="display:inline-block;background:#1c3d2e;color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Set up your account</a></p>
      <p style="margin:0;color:#5a6b62;font-size:14px">This link expires in 14 days. Already set up? <a href="${guidePublicUrl()}/auth/sign-in?as=educator" style="color:#1c3d2e;font-weight:600">Teacher log in</a>.</p>
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
      <p style="margin:0 0 18px"><a href="${guidePublicUrl()}" style="display:inline-block;background:#1c3d2e;color:#fff;text-decoration:none;padding:12px 22px;font-family:system-ui,sans-serif;font-weight:600;border-radius:8px">Visit Guide</a></p>
      <p style="margin:0;color:#5a6b62;font-size:14px">If you did not request this, you can ignore this message.</p>
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
