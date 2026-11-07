import { clientIp, parseReport, RateLimiter } from "../../../lib/report";
import { reportsConfigured, sendReport } from "../../../lib/report-send";
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
  if (!reportsConfigured()) return Response.json({ error: "not-configured" }, { status: 503 });

  if (!limiter.allow(clientIp(request))) {
    return Response.json({ error: "Too many reports from this address; please try again later." }, { status: 429 });
  }

  const parsed = parseReport(await request.text(), knownHref);
  if (!parsed.ok) {
    // A bot that filled the honeypot gets the same answer as a person, and no email goes out.
    return parsed.spam ? Response.json({ ok: true }) : Response.json({ error: parsed.error }, { status: 400 });
  }

  const sent = await sendReport(parsed.report, new URL(request.url).origin, "form");
  if (!sent.ok) return Response.json({ error: sent.error }, { status: sent.error === "not-configured" ? 503 : 502 });
  return Response.json({ ok: true });
}
