import { clientIp, parseReport, RateLimiter, reportEmail } from "../../../lib/report";
import { findCalculator } from "../../../registry";

/** Pages that take reports: every calculator, plus About for general ones. */
const knownHref = (href: string) => href === "/about" || findCalculator(href) !== undefined;

// Five reports per IP per ten minutes, per server instance.
const limiter = new RateLimiter(5, 10 * 60 * 1000);

/**
 * Emails a "Report a problem" form through Resend. The key and the recipient come from the Vercel env
 * (`RESEND_API_KEY`, `REPORT_TO_EMAIL`); without them the route answers 503 and the form shows its fallback.
 */
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_TO_EMAIL;
  if (!apiKey || !to) return Response.json({ error: "not-configured" }, { status: 503 });

  if (!limiter.allow(clientIp(request))) {
    return Response.json({ error: "Too many reports from this address; please try again later." }, { status: 429 });
  }

  const parsed = parseReport(await request.text(), knownHref);
  if (!parsed.ok) {
    // A bot that filled the honeypot gets the same answer as a person, and no email goes out.
    return parsed.spam ? Response.json({ ok: true }) : Response.json({ error: parsed.error }, { status: 400 });
  }

  const { report } = parsed;
  const email = reportEmail(report, new URL(request.url).origin, process.env.VERCEL_GIT_COMMIT_SHA);
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
      return Response.json({ error: "send-failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("report: Resend request failed", err);
    return Response.json({ error: "send-failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
