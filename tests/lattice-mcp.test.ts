// Lattice's MCP server at /lattice/mcp (lattice-sim docs/mcp-route.md; owner decisions A3, A4, B16): the route file
// against the vendored bundle in vendor/lattice-mcp, Request in and Response out, as Next calls it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { GET, OPTIONS, POST, dynamic, maxDuration, runtime } from "../src/app/lattice/mcp/route";

const URL_LATTICE = "https://photonicscalculators.com/lattice/mcp";
const VENDOR = join(process.cwd(), "vendor", "lattice-mcp");

let nextIp = 1;
/** A fresh address per call: the bundle's rate limiters live in the module. */
async function rpc(method: string, params?: Record<string, unknown>) {
  const res = await POST(new Request(URL_LATTICE, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${nextIp++ % 250}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: 3, method, ...(params ? { params } : {}) }),
  }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.jsonrpc, "2.0");
  assert.equal(body.id, 3);
  return body;
}

async function call(name: string, args: Record<string, unknown>) {
  const { result } = await rpc("tools/call", { name, arguments: args });
  return result as { content: { type: string; text: string }[]; structuredContent: Record<string, unknown>; isError?: boolean };
}

test("Lattice MCP: the vendored bundle matches its manifest", () => {
  const manifest = JSON.parse(readFileSync(join(VENDOR, "MANIFEST.json"), "utf8")) as { commit: string; files: Record<string, string> };
  assert.match(manifest.commit, /^[0-9a-f]{40}$/);
  assert.deepEqual(Object.keys(manifest.files).sort(), ["lattice-mcp-worker.mjs", "lattice-mcp.mjs", "lattice_kernel_bg.wasm"]);
  for (const [file, sha] of Object.entries(manifest.files)) {
    assert.equal(createHash("sha256").update(readFileSync(join(VENDOR, file))).digest("hex"), sha, file);
  }
});

test("Lattice MCP: Node runtime with 60 s; initialize and tools/list round trip; GET 405, OPTIONS 204", async () => {
  assert.equal(runtime, "nodejs");
  assert.equal(maxDuration, 60);
  assert.equal(dynamic, "force-dynamic");
  const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
  assert.equal(init.result.serverInfo.name, "lattice");
  assert.equal(init.result.protocolVersion, "2025-06-18");
  const names = ((await rpc("tools/list")).result.tools as { name: string }[]).map((t) => t.name);
  assert.equal(names.length, 12);
  for (const name of ["bands", "gap_map", "slab_transmission", "get_validation_report", "report_problem"]) assert.ok(names.includes(name), name);
  assert.equal((await GET(new Request(URL_LATTICE))).status, 405);
  assert.equal((await OPTIONS(new Request(URL_LATTICE, { method: "OPTIONS" }))).status, 204);
});

test("Lattice MCP: bands on the WASM kernel gives the Joannopoulos rod-lattice TM values (SPEC §3.1)", async () => {
  // The same call and values as lattice-sim's apps/mcp/test/route.test.ts: TM band 1 at X and M, to 5 digits.
  const result = await call("bands", {
    lattice: "square", radius_over_a: 0.2, eps_in: 8.9, eps_out: 1,
    plane_wave_order: 7, polarisation: "TM", n_bands: 2, k_points: [[0.5, 0], [0.5, 0.5]],
  });
  assert.notEqual(result.isError, true, result.content[0].text);
  assert.equal(result.structuredContent.kernel, "wasm");
  const tm = (result.structuredContent.bands_a_over_lambda as { TM: number[][] }).TM;
  assert.deepEqual(tm.map((row) => row[0]), [0.27472, 0.32242]);
});

test("Lattice MCP: slab_transmission takes cut GK on hexagonal rows (lattice-sim v1.2)", async () => {
  // The same call and values as lattice-sim's apps/mcp/test/tools.test.ts: 8 hexagonal rows of rods cut along Γ–K,
  // opaque inside the band the plane-wave solver marks forbidden.
  const slab = ((await rpc("tools/list")).result.tools as { name: string; inputSchema: { properties: Record<string, { enum?: string[] }> } }[])
    .find((t) => t.name === "slab_transmission");
  assert.deepEqual(slab?.inputSchema.properties.cut.enum, ["GM", "GK"]);
  const result = await call("slab_transmission", {
    lattice: "hex", cut: "GK", radius_over_a: 0.2, eps_in: 8.9, eps_out: 1,
    omega_min_a_over_lambda: 0.37, omega_max_a_over_lambda: 0.42, omega_points: 8,
  });
  assert.notEqual(result.isError, true, result.content[0].text);
  assert.equal((result.structuredContent.request as { cut?: string }).cut, "GK");
  const spectrum = (result.structuredContent.spectra as { T: number[]; pwe_forbidden_a_over_lambda: number[][] }[])[0];
  assert.ok(spectrum.T.every((t) => t < 1e-3), JSON.stringify(spectrum.T));
  assert.deepEqual(spectrum.pwe_forbidden_a_over_lambda, [[0.37, 0.42]]);
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

test("Lattice MCP report_problem: emails through the site's sender, source lattice-mcp", async () => {
  const sent = await withResend(async () => {
    const result = await call("report_problem", {
      tool: "bands",
      message: "A test report from photonics-calculators' Lattice route test.",
      permalink: "https://lattice.photonicscalculators.com/?s=abc",
    });
    assert.notEqual(result.isError, true, result.content[0].text);
    assert.equal(result.structuredContent.sent, true);
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "Problem report (Lattice MCP): /lattice/mcp");
  assert.deepEqual(sent[0].to, ["owner@example.org"]);
  assert.match(sent[0].text as string, /^Page: https:\/\/photonicscalculators\.com\/lattice\/mcp\?s=abc\nSource: lattice-mcp\n/);
  assert.match(sent[0].text as string, /Lattice MCP, tool bands:\nA test report/);
});
