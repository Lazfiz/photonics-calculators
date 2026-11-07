import { test } from "node:test";
import assert from "node:assert/strict";

import { GET as checksJson } from "../src/app/checks.json/route";
import { GET, OPTIONS, POST } from "../src/app/mcp/route";
import { buildLlmsTxt } from "../src/registry/llms";
import { schemas } from "../src/schemas";
import { findSchema } from "../src/schemas";
import { parseInputs, runSchema } from "../src/schemas/run";
import { PROTOCOL_VERSIONS } from "../src/mcp/server";

const URL_MCP = "https://photonicscalculators.com/mcp";

let nextIp = 1;
/** A fresh address per call: the route's rate limiter lives in the module. */
function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(new Request(URL_MCP, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "x-forwarded-for": `198.51.100.${nextIp++ % 250}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));
}

async function rpc(method: string, params?: Record<string, unknown>) {
  const res = await post({ jsonrpc: "2.0", id: 7, method, ...(params ? { params } : {}) });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /application\/json/);
  const body = await res.json();
  assert.equal(body.jsonrpc, "2.0");
  assert.equal(body.id, 7);
  return body;
}

async function call(name: string, args: Record<string, unknown>) {
  const { result } = await rpc("tools/call", { name, arguments: args });
  return result as { content: { type: string; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };
}

test("MCP: initialize agrees on the client's protocol version, or offers the newest", async () => {
  const init = (protocolVersion: string) => rpc("initialize", {
    protocolVersion, capabilities: {}, clientInfo: { name: "test", version: "0" },
  });
  const { result } = await init("2025-06-18");
  assert.equal(result.protocolVersion, "2025-06-18");
  assert.deepEqual(result.capabilities, { tools: { listChanged: false } });
  assert.equal(result.serverInfo.name, "photonics-calculators");
  assert.match(result.instructions, /report_problem/);
  assert.equal((await init("2099-01-01")).result.protocolVersion, PROTOCOL_VERSIONS[0]);
  assert.deepEqual((await rpc("ping")).result, {});
});

test("MCP: notifications get 202; bad JSON, unknown methods and versions get JSON-RPC errors", async () => {
  const note = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(note.status, 202);
  assert.equal(await note.text(), "");
  const parse = await post("{nope");
  assert.equal(parse.status, 400);
  assert.equal((await parse.json()).error.code, -32700);
  assert.equal((await rpc("resources/list")).error.code, -32601);
  assert.equal((await rpc("tools/call", { name: "nope" })).error.code, -32602);
  const version = await post({ jsonrpc: "2.0", id: 1, method: "ping" }, { "mcp-protocol-version": "1999-01-01" });
  assert.equal(version.status, 400);
  const batch = await post([{ jsonrpc: "2.0", id: 1, method: "ping" }, { jsonrpc: "2.0", method: "notifications/initialized" }]);
  assert.deepEqual(await batch.json(), [{ jsonrpc: "2.0", id: 1, result: {} }]);
  assert.equal(GET().status, 405);
  assert.equal(OPTIONS().headers.get("access-control-allow-origin"), "*");
});

test("MCP: tools/list names the four tools with object input schemas", async () => {
  const { result } = await rpc("tools/list");
  assert.deepEqual(result.tools.map((t: { name: string }) => t.name),
    ["find_calculator", "run_calculator", "get_checks", "report_problem"]);
  for (const tool of result.tools) {
    assert.equal(tool.inputSchema.type, "object", tool.name);
    assert.ok(tool.description.length > 80, tool.name);
  }
});

test("MCP find_calculator: the site search first, then pages matching most words of a question", async () => {
  const beam = await call("find_calculator", { query: "gaussian beam", limit: 3 });
  const results = beam.structuredContent?.results as { slug: string; runnable: boolean; inputs?: { key: string }[] }[];
  assert.equal(results[0].slug, "wave-optics/gaussian-beam");
  assert.equal(results[0].runnable, true);
  assert.ok(results[0].inputs?.some((input) => input.key === "wavelength"));
  assert.equal(JSON.parse(beam.content[0].text).results[0].slug, "wave-optics/gaussian-beam");
  const question = await call("find_calculator", { query: "how do I calculate the maximum permissible exposure for my laser" });
  const slugs = (question.structuredContent?.results as { slug: string }[]).map((r) => r.slug);
  assert.ok(slugs.includes("laser-safety/mpe"), slugs.join(", "));
  assert.equal((await call("find_calculator", { query: "" })).isError, true);
  assert.equal((await call("find_calculator", { query: "beam", limit: 99 })).isError, true);
});

test("MCP run_calculator: the API's numbers for the inputs given; errors say why", async () => {
  const inputs = { wavelength: 1064, waist: 500, z: 100 };
  const run = await call("run_calculator", { slug: "wave-optics/gaussian-beam", inputs });
  assert.equal(run.isError, undefined);
  const schema = findSchema("/wave-optics/gaussian-beam")!;
  const parsed = parseInputs(schema, new URLSearchParams(Object.entries(inputs).map(([k, v]) => [k, String(v)])));
  assert.ok(parsed.ok);
  const direct = runSchema(schema, parsed.values);
  const outputs = run.structuredContent?.outputs as Record<string, { value: number | null }>;
  for (const [key, value] of Object.entries(direct.outputs)) assert.equal(outputs[key].value, value, key);
  assert.match(run.structuredContent?.pageUrl as string, /\/wave-optics\/gaussian-beam\?.*wavelength=1064/);

  // A page URL and a bare slug name the same calculator; a choice takes its option value.
  const byUrl = await call("run_calculator", { slug: "https://photonicscalculators.com/wave-optics/gaussian-beam?x=1", inputs });
  assert.deepEqual(byUrl.structuredContent?.outputs, run.structuredContent?.outputs);
  const solved = await call("run_calculator", { slug: "lambert-beer-law", inputs: { solve: "c", absorbance: 1 } });
  assert.equal(solved.isError, undefined, solved.content[0].text);

  const range = await call("run_calculator", { slug: "wave-optics/gaussian-beam", inputs: { wavelength: -5 } });
  assert.equal(range.isError, true);
  assert.match(range.content[0].text, /wavelength/);
  assert.match((await call("run_calculator", { slug: "nope/nope" })).content[0].text, /find_calculator/);
  const notYet = await call("run_calculator", { slug: "materials/acousto-optic" });
  assert.equal(notYet.isError, true);
  assert.match(notYet.content[0].text, /can't be run here yet/);
});

test("MCP get_checks and /checks.json: every reference case passes on this build", async () => {
  const checks = await call("get_checks", { slug: "imaging/tirf" });
  const cases = checks.structuredContent?.checks as { outputs: { pass: boolean }[]; apiUrl: string }[];
  assert.ok(cases.length >= 1);
  assert.ok(cases.every((c) => c.outputs.every((o) => o.pass)));
  assert.match(cases[0].apiUrl, /^https:\/\/photonicscalculators\.com\/api\/v1\/imaging\/tirf\?/);

  const all = await checksJson().json();
  assert.equal(all.calculators.length, schemas.length);
  for (const calculator of all.calculators) {
    for (const check of calculator.checks) {
      for (const output of check.outputs) assert.ok(output.pass, `${calculator.slug} ${output.key}: ${output.model} vs ${output.expected}`);
    }
  }
});

/** Runs `fn` with the Resend env set and `fetch` replaced; returns the bodies posted to it. */
async function withResend(fn: () => Promise<void>) {
  const saved = { fetch: globalThis.fetch, key: process.env.RESEND_API_KEY, to: process.env.REPORT_TO_EMAIL };
  const sent: Record<string, unknown>[] = [];
  process.env.RESEND_API_KEY = "re_test";
  process.env.REPORT_TO_EMAIL = "owner@example.org";
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    sent.push(JSON.parse(init.body as string));
    return new Response("{}", { status: 200 });
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
  return sent;
}

test("MCP report_problem: emails through the form's path, tagged as MCP", async () => {
  const sent = await withResend(async () => {
    const ok = await call("report_problem", {
      slug: "wave-optics/gaussian-beam",
      message: "The Rayleigh range disagrees with Siegman eq. 17.8 by 2x.",
      inputs: { wavelength: 1064, waist: 500 },
    });
    assert.equal(ok.isError, undefined, ok.content[0].text);
    assert.equal((await call("report_problem", { slug: "wave-optics/gaussian-beam", message: "short" })).isError, true);
    assert.equal((await call("report_problem", { slug: "nope/nope", message: "long enough message" })).isError, true);
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "Problem report (MCP): /wave-optics/gaussian-beam");
  assert.match(sent[0].text as string, /^Page: https:\/\/photonicscalculators\.com\/wave-optics\/gaussian-beam\?wavelength=1064&waist=500\nSource: mcp\n/);

  const saved = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const off = await call("report_problem", { slug: "about", message: "A general note about the site." });
  if (saved !== undefined) process.env.RESEND_API_KEY = saved;
  assert.equal(off.isError, true);
  assert.match(off.content[0].text, /form at https:\/\/photonicscalculators\.com\/about/);
});

test("llms.txt points agents to the MCP server and /checks.json", () => {
  const text = buildLlmsTxt();
  assert.match(text, /https:\/\/photonicscalculators\.com\/mcp/);
  assert.match(text, /https:\/\/photonicscalculators\.com\/checks\.json/);
});
