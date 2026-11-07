// Sends a checked report through Resend: the "Report a problem" form (`/api/report`) and the MCP server's
// `report_problem` tool. Server-side only: it reads the Resend key from the Vercel env.
import { reportEmail, type Report, type ReportSource } from "./report";

export type SendResult = { ok: true } | { ok: false; error: "not-configured" | "send-failed" };

/** Whether the Resend key and the recipient are set (`RESEND_API_KEY`, `REPORT_TO_EMAIL`). */
export const reportsConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.REPORT_TO_EMAIL);

/** Emails one report. `origin` is the site that took it. */
export async function sendReport(report: Report, origin: string, source: ReportSource): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_TO_EMAIL;
  if (!apiKey || !to) return { ok: false, error: "not-configured" };

  const email = reportEmail(report, origin, process.env.VERCEL_GIT_COMMIT_SHA, source);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.REPORT_FROM_EMAIL || "Photonics Calculators <onboarding@resend.dev>",
        to: [to],
        subject: email.subject,
        text: email.text,
        ...(report.contact ? { reply_to: report.contact } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`report: Resend answered ${res.status}`);
      return { ok: false, error: "send-failed" };
    }
  } catch (err) {
    console.error("report: Resend request failed", err);
    return { ok: false, error: "send-failed" };
  }
  return { ok: true };
}
