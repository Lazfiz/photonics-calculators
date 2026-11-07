/**
 * "Report a problem": the limits shared by the form and the route handler, and the server-side checks.
 * No registry import here: the client form reads the limits, and the route passes its own href check.
 */

export const REPORT_LIMITS = {
  /** Shortest useful message, in characters. */
  minMessage: 10,
  maxMessage: 4000,
  maxContact: 200,
  maxQuery: 2000,
  /** Whole request body, in characters. */
  maxBody: 8000,
} as const;

/** What the form posts. `website` is the honeypot: hidden from people, filled by bots. */
export interface ReportInput {
  href: string;
  query: string;
  message: string;
  contact: string;
  website: string;
}

export interface Report {
  href: string;
  query: string;
  message: string;
  /** A reply address, or "" when the reporter left none. */
  contact: string;
}

export type ParsedReport =
  | { ok: true; report: Report }
  | { ok: false; spam: true }
  | { ok: false; spam: false; error: string };

const HREF_PATTERN = /^\/[a-z0-9-]+(\/[a-z0-9-]+)?$/;
const EMAIL_PATTERN = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

function field(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

/**
 * Checks a posted body. `knownHref` says whether the href names a page that takes reports. A filled
 * honeypot is flagged as spam, so the caller can answer as if it were sent.
 */
export function parseReport(raw: string, knownHref: (href: string) => boolean): ParsedReport {
  if (raw.length > REPORT_LIMITS.maxBody) return { ok: false, spam: false, error: "The report is too long." };
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, spam: false, error: "The report isn't valid JSON." };
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, spam: false, error: "The report isn't valid JSON." };
  }
  const input = body as Record<string, unknown>;
  if (field(input, "website") !== "") return { ok: false, spam: true };

  const href = field(input, "href");
  if (!HREF_PATTERN.test(href) || !knownHref(href)) return { ok: false, spam: false, error: "Unknown page." };
  const query = field(input, "query").replace(/^\?/, "");
  if (query.length > REPORT_LIMITS.maxQuery) return { ok: false, spam: false, error: "The page inputs are too long." };
  const message = field(input, "message").trim();
  if (message.length < REPORT_LIMITS.minMessage) {
    return { ok: false, spam: false, error: `Please describe the problem in at least ${REPORT_LIMITS.minMessage} characters.` };
  }
  if (message.length > REPORT_LIMITS.maxMessage) {
    return { ok: false, spam: false, error: `Please keep the message under ${REPORT_LIMITS.maxMessage} characters.` };
  }
  const contact = field(input, "contact").trim();
  if (contact.length > REPORT_LIMITS.maxContact || (contact !== "" && !EMAIL_PATTERN.test(contact))) {
    return { ok: false, spam: false, error: "The reply address isn't a valid email address." };
  }
  return { ok: true, report: { href, query, message, contact } };
}

/** Where a report came from: the page's form, or an AI agent through the MCP server's `report_problem`. */
export type ReportSource = "form" | "mcp";

/** The plain-text email for one report. `origin` is the site that served the form. */
export function reportEmail(report: Report, origin: string, sha: string | undefined, source: ReportSource = "form") {
  const url = `${origin}${report.href}${report.query ? `?${report.query}` : ""}`;
  return {
    subject: `Problem report${source === "mcp" ? " (MCP)" : ""}: ${report.href}`,
    text: [
      `Page: ${url}`,
      `Source: ${source}`,
      `Commit: ${sha ?? "unknown (not a Vercel build)"}`,
      `Reply to: ${report.contact || "(none given)"}`,
      "",
      report.message,
    ].join("\n"),
  };
}

/**
 * A fixed-window limit per key (the client IP). It lives in one server instance's memory, so it is
 * best-effort: it stops a script hammering the form, not a distributed flood.
 */
export class RateLimiter {
  private hits = new Map<string, { start: number; count: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Counts one request; false once `key` has used up its window. */
  allow(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key);
    if (!entry || now - entry.start >= this.windowMs) {
      // Drop expired keys now and then, so the map can't grow without bound.
      if (this.hits.size > 1000) {
        for (const [k, e] of this.hits) if (now - e.start >= this.windowMs) this.hits.delete(k);
      }
      this.hits.set(key, { start: now, count: 1 });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }
}

/** The rate-limit key: the first x-forwarded-for address (Vercel sets it), else x-real-ip. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}
