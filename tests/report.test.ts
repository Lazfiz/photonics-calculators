import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReport, RateLimiter, REPORT_LIMITS, reportEmail } from "../src/lib/report";
import { POST } from "../src/app/api/report/route";

const HREF = "/materials/acousto-optic";
const known = (href: string) => href === HREF;
const body = (fields: Record<string, unknown>) =>
  JSON.stringify({ href: HREF, query: "lambda=633", message: "The figure of merit looks off.", contact: "", website: "", ...fields });

test("report: a valid body parses, trimmed, with the leading ? dropped", () => {
  const parsed = parseReport(body({ query: "?lambda=633", message: "  The figure of merit looks off.  " }), known);
  assert.deepEqual(parsed, {
    ok: true,
    report: { href: HREF, query: "lambda=633", message: "The figure of merit looks off.", contact: "" },
  });
});

test("report: a filled honeypot is spam, not an error", () => {
  assert.deepEqual(parseReport(body({ website: "http://spam.example" }), known), { ok: false, spam: true });
});

test("report: rejects unknown pages, bad JSON, and lengths outside the caps", () => {
  const rejected = (raw: string) => {
    const parsed = parseReport(raw, known);
    return !parsed.ok && !parsed.spam;
  };
  assert.ok(rejected(body({ href: "/materials/no-such-page" })));
  assert.ok(rejected(body({ href: "https://evil.example/" })));
  assert.ok(rejected("not json"));
  assert.ok(rejected("[1, 2]"));
  assert.ok(rejected(body({ message: "too short" })));
  assert.ok(rejected(body({ message: "x".repeat(REPORT_LIMITS.maxMessage + 1) })));
  assert.ok(rejected(body({ query: "a".repeat(REPORT_LIMITS.maxQuery + 1) })));
  assert.ok(rejected(body({ contact: "not an address" })));
  assert.ok(rejected("x".repeat(REPORT_LIMITS.maxBody + 1)));
  // Exactly at the caps still passes.
  assert.ok(!rejected(body({ message: "x".repeat(REPORT_LIMITS.minMessage) })));
  assert.ok(!rejected(body({ message: "x".repeat(REPORT_LIMITS.maxMessage), contact: "a@b.org" })));
});

test("report: the email names the page with its inputs, the commit and the reply address", () => {
  const email = reportEmail(
    { href: HREF, query: "lambda=633", message: "The figure of merit looks off.", contact: "a@b.org" },
    "https://photonicscalculators.com",
    "abc1234",
  );
  assert.equal(email.subject, `Problem report: ${HREF}`);
  assert.equal(
    email.text,
    [
      `Page: https://photonicscalculators.com${HREF}?lambda=633`,
      "Source: form",
      "Commit: abc1234",
      "Reply to: a@b.org",
      "",
      "The figure of merit looks off.",
    ].join("\n"),
  );
  const bare = reportEmail({ href: HREF, query: "", message: "m", contact: "" }, "http://localhost:3300", undefined);
  assert.match(bare.text, /^Page: http:\/\/localhost:3300\/materials\/acousto-optic\nSource: form\nCommit: unknown/);
  const agent = reportEmail({ href: HREF, query: "", message: "m", contact: "" }, "https://x.org", "abc1234", "mcp");
  assert.equal(agent.subject, `Problem report (MCP): ${HREF}`);
  assert.match(agent.text, /\nSource: mcp\n/);
});

test("report: the rate limiter allows `limit` hits per window per key", () => {
  const limiter = new RateLimiter(2, 1000);
  assert.deepEqual([limiter.allow("a", 0), limiter.allow("a", 10), limiter.allow("a", 20)], [true, true, false]);
  assert.equal(limiter.allow("b", 20), true);
  assert.equal(limiter.allow("a", 1000), true);
});

const request = (raw: string, ip: string) =>
  new Request("https://photonicscalculators.com/api/report", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `${ip}, 10.0.0.1` },
    body: raw,
  });

/** Runs `fn` with the Resend env set and `fetch` replaced; returns the calls made to it. */
async function withResend(response: Response | Error, fn: () => Promise<void>) {
  const saved = { fetch: globalThis.fetch, key: process.env.RESEND_API_KEY, to: process.env.REPORT_TO_EMAIL };
  const calls: { url: string; init: RequestInit }[] = [];
  process.env.RESEND_API_KEY = "re_test";
  process.env.REPORT_TO_EMAIL = "owner@example.org";
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (response instanceof Error) throw response;
    return response;
  }) as typeof fetch;
  try {
    await fn();
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.key === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = saved.key;
    if (saved.to === undefined) delete process.env.REPORT_TO_EMAIL;
    else process.env.REPORT_TO_EMAIL = saved.to;
  }
  return calls;
}

test("report route: 503 without the Resend env, so the form shows its fallback", async () => {
  const saved = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const res = await POST(request(body({}), "192.0.2.1"));
  if (saved !== undefined) process.env.RESEND_API_KEY = saved;
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: "not-configured" });
});

test("report route: sends one email through Resend with a reply-to", async () => {
  const calls = await withResend(new Response("{}", { status: 200 }), async () => {
    const res = await POST(request(body({ contact: "a@b.org" }), "192.0.2.2"));
    assert.equal(res.status, 200);
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer re_test");
  const sent = JSON.parse(calls[0].init.body as string);
  assert.deepEqual(sent.to, ["owner@example.org"]);
  assert.equal(sent.reply_to, "a@b.org");
  assert.equal(sent.subject, `Problem report: ${HREF}`);
  assert.match(sent.text, /^Page: https:\/\/photonicscalculators\.com\/materials\/acousto-optic\?lambda=633\n/);
});

test("report route: honeypot answers ok without sending; bad input is a 400", async () => {
  const calls = await withResend(new Response("{}", { status: 200 }), async () => {
    assert.equal((await POST(request(body({ website: "x" }), "192.0.2.3"))).status, 200);
    assert.equal((await POST(request(body({ href: "/nope/nope" }), "192.0.2.3"))).status, 400);
  });
  assert.equal(calls.length, 0);
});

test("report route: a Resend failure is a 502; the sixth report in the window is a 429", async () => {
  await withResend(new Response("{}", { status: 500 }), async () => {
    assert.equal((await POST(request(body({}), "192.0.2.4"))).status, 502);
  });
  await withResend(new Error("network down"), async () => {
    assert.equal((await POST(request(body({}), "192.0.2.5"))).status, 502);
  });
  await withResend(new Response("{}", { status: 200 }), async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await POST(request(body({}), "192.0.2.6"))).status);
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  });
});
