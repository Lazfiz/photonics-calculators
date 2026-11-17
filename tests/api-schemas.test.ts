import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";

import { GET } from "../src/app/api/v1/[category]/[slug]/route";
import { findCalculator } from "../src/registry";
import { apiPath, buildOpenApi } from "../src/registry/api";
import { schemas } from "../src/schemas";
import { parseInputs, runSchema } from "../src/schemas/run";
import type { CalculatorSchema } from "../src/schemas/types";
import { pageDefaults } from "../scripts/page-defaults";

const ORIGIN = "https://photonicscalculators.com";

const query = (inputs: Record<string, number | string>) =>
  new URLSearchParams(Object.entries(inputs).map(([k, v]) => [k, String(v)]));

function run(schema: CalculatorSchema, inputs: Record<string, number | string>) {
  const parsed = parseInputs(schema, query(inputs));
  assert.ok(parsed.ok, `${schema.href}: ${!parsed.ok && parsed.error}`);
  return runSchema(schema, parsed.values);
}

const unique = (keys: string[]) => new Set(keys).size === keys.length;

test("API schemas: each names a registry page and has well-formed inputs, outputs and checks", () => {
  assert.ok(unique(schemas.map((s) => s.href)), "one schema per page");
  for (const schema of schemas) {
    const calculator = findCalculator(schema.href);
    assert.ok(calculator, `${schema.href} is not in the registry`);
    const choices = schema.choices ?? [];
    assert.ok(unique([...choices, ...schema.inputs].map((i) => i.key)) && unique(schema.outputs.map((o) => o.key)), schema.href);
    for (const choice of choices) {
      const values = choice.options.map((o) => o.value);
      assert.ok(values.length >= 2 && unique(values) && values.includes(choice.default), `${schema.href} ${choice.key}`);
    }
    for (const input of schema.inputs) {
      assert.ok(input.min < input.max && input.default >= input.min && input.default <= input.max, `${schema.href} ${input.key}`);
      assert.ok(input.toSI > 0, `${schema.href} ${input.key} toSI`);
    }
    for (const output of schema.outputs) assert.ok(output.toSI > 0, `${schema.href} ${output.key} toSI`);
    assert.ok(schema.checks.length >= 1 && schema.checks.length <= 3, `${schema.href}: 1–3 checks`);
  }
});

test("API schemas: input keys and defaults match the page's useURLState calls", async () => {
  for (const schema of schemas) {
    // A numeric default is an input; a string one is a choice.
    const defaults = await pageDefaults(schema.href);
    const inputs = [...(schema.choices ?? []), ...schema.inputs];
    assert.deepEqual([...defaults.keys()].sort(), inputs.map((i) => i.key).sort(), `${schema.href} keys`);
    for (const input of inputs) assert.equal(input.default, defaults.get(input.key), `${schema.href} ${input.key}`);
  }
});

test("API schemas: every output is a number at the page's defaults, or null with a warning that says why", () => {
  for (const schema of schemas) {
    const result = run(schema, {});
    for (const [key, value] of Object.entries(result.outputs)) {
      assert.ok(Number.isFinite(value) || (value === null && result.warnings.length > 0), `${schema.href} ${key}`);
    }
  }
});

test("API schemas: each input at its min and max gives numbers, or null with a warning that says why (review 2026-11 P3-W1)", () => {
  // Every failure is listed, not just the first (recheck 2026-11-16).
  const failures: string[] = [];
  for (const schema of schemas) {
    for (const input of schema.inputs) {
      for (const value of [input.min, input.max]) {
        // An input alone at a bound may break a rule between inputs; that is a 400 with a reason, tested elsewhere.
        const parsed = parseInputs(schema, query({ [input.key]: value }));
        if (!parsed.ok) continue;
        const result = runSchema(schema, parsed.values);
        for (const [key, out] of Object.entries(result.outputs)) {
          if (!(Number.isFinite(out) || (out === null && result.warnings.length > 0))) {
            failures.push(`${schema.href} ${input.key}=${value} ${key}`);
          }
        }
        // No warning twice (verification 2026-11 M12: dual-band-ar at nSub = 1 gave the band-edge warning twice).
        assert.equal(new Set(result.warnings).size, result.warnings.length, `${schema.href} ${input.key}=${value}: ${result.warnings.join(" | ")}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

/**
 * The runs swept for null reasons: the defaults, each input alone at its min and at its max, and each choice option.
 * For each "<href> <output>", the number of these runs in which that output is null with no reason of its own
 * (verification 2026-11 W5: counted per run, so an output already in the backlog cannot gain a new unexplained null
 * unnoticed). A run in which every output is null is not counted: it failed as a whole, and the min/max test above
 * requires a warning for it.
 */
function nullsWithoutReason() {
  const missing = new Map<string, number>();
  for (const schema of schemas) {
    const cases: Record<string, number | string>[] = [{}];
    for (const input of schema.inputs) cases.push({ [input.key]: input.min }, { [input.key]: input.max });
    for (const choice of schema.choices ?? []) for (const option of choice.options) cases.push({ [choice.key]: option.value });
    for (const inputs of cases) {
      const parsed = parseInputs(schema, query(inputs));
      if (!parsed.ok) continue;
      const result = runSchema(schema, parsed.values);
      const nulls = schema.outputs.filter((o) => result.outputs[o.key] === null);
      if (nulls.length === schema.outputs.length) continue;
      for (const output of nulls) {
        if (result.reasons[output.key]) continue;
        const key = `${schema.href} ${output.key}`;
        missing.set(key, (missing.get(key) ?? 0) + 1);
      }
    }
  }
  return missing;
}

test("API schemas: a null output names its own warning (reasons); the per-run backlog may only shrink (recheck 2026-11-16)", () => {
  // tests/null-reasons-pending.json: "<href> <output>" → runs (of those swept above) where it is null with no reason.
  const pending = new Map(Object.entries(JSON.parse(readFileSync("tests/null-reasons-pending.json", "utf8")) as Record<string, number>));
  const missing = nullsWithoutReason();
  const grown = [...missing].filter(([k, n]) => n > (pending.get(k) ?? 0)).map(([k, n]) => `${k}: ${pending.get(k) ?? 0} → ${n}`);
  assert.deepEqual(grown.sort(), [], "null without a reason in more runs than the backlog allows: add it to `reasons` in compute");
  const shrunk = [...pending].filter(([k, n]) => (missing.get(k) ?? 0) < n).map(([k, n]) => `${k}: ${n} → ${missing.get(k) ?? 0}`);
  assert.deepEqual(shrunk.sort(), [], "fewer runs without a reason: lower (or remove) the count in tests/null-reasons-pending.json");
  const tirf = run(schemas.find((s) => s.href === "/imaging/tirf")!, { theta: 0 });
  assert.equal(tirf.outputs.depth, null);
  assert.match(tirf.reasons.depth, /critical angle/);
  assert.ok(tirf.warnings.includes(tirf.reasons.depth));
  assert.equal(tirf.reasons.criticalAngle, undefined);
});

test("API schemas: the reference checks hold", () => {
  for (const schema of schemas) {
    for (const check of schema.checks) {
      assert.ok(check.source.length > 20 && check.tolerance > 0 && check.tolerance <= 0.01, `${schema.href}: ${check.source}`);
      const result = run(schema, check.inputs as Record<string, number | string>);
      for (const [key, expected] of Object.entries(check.expect) as [string, number][]) {
        assert.ok(expected !== 0, `${schema.href} ${key}: a relative check needs a nonzero value`);
        const actual = result.outputs[key];
        assert.ok(actual !== null && Math.abs(actual / expected - 1) <= check.tolerance,
          `${schema.href} ${key}: ${actual} vs ${expected} (${check.source})`);
      }
    }
  }
});

test("API inputs: unknown, repeated, non-numeric and out-of-range values are rejected with a reason", () => {
  const beam = schemas.find((s) => s.href === "/wave-optics/gaussian-beam")!;
  const error = (q: string) => {
    const parsed = parseInputs(beam, new URLSearchParams(q));
    return parsed.ok ? "" : parsed.error;
  };
  assert.match(error("wavelenght=1064"), /Unknown input "wavelenght"\. Inputs: wavelength, waist, z\./);
  assert.match(error("z=1&z=2"), /given 2 times/);
  assert.match(error("waist=abc"), /finite number/);
  assert.match(error("waist="), /finite number/);
  // Decimal notation only (review 2026-11 P3-M7): Number() alone takes hex, binary, octal and "Infinity".
  for (const q of ["waist=0x10", "waist=0b1", "waist=0o7", "waist=Infinity", "waist=1e", "waist=1_000", "waist=."]) {
    assert.match(error(q), /finite number in decimal notation/, q);
  }
  for (const q of ["waist=16", "waist=+16", "waist=16.", "waist=.5e2", "waist=1.6e1", "waist=1E%2B1", "waist=%2016%20"]) {
    assert.equal(error(q), "", q);
  }
  assert.match(error("wavelength=150"), /= 150 nm is outside 200 to 11000 nm/);
  // The range is inclusive, and unset inputs take the page's defaults.
  assert.equal(error("wavelength=200&waist=10000"), "");
  const lambert = schemas.find((s) => s.href === "/spectroscopy/lambert-beer-law")!;
  const solve = (q: string) => {
    const parsed = parseInputs(lambert, new URLSearchParams(q));
    return parsed.ok ? parsed.values.solve : parsed.error;
  };
  assert.equal(solve(""), "A");
  assert.equal(solve("solve=eps"), "eps");
  assert.equal(solve("solve=E"), 'Solve for (solve) must be one of A, c, eps, not "E".');
  assert.match(String(solve("solve=A&solve=c")), /given 2 times/);
  assert.match(String(solve("nope=1")), /Inputs: solve, concentration,/);
  const blackbody = schemas.find((s) => s.href === "/spectroscopy/blackbody")!;
  const swapped = parseInputs(blackbody, new URLSearchParams("bandFromNm=800&bandToNm=400"));
  assert.ok(!swapped.ok && /bandToNm must be larger/.test(swapped.error));
});

test("API results: a null value comes with a warning (R at the waist, TIR in the AR film)", () => {
  const beam = schemas.find((s) => s.href === "/wave-optics/gaussian-beam")!;
  const atWaist = run(beam, { z: 0 });
  assert.equal(atWaist.outputs.wavefrontRadius, null);
  assert.equal(atWaist.outputs.beamRadius, 10);
  assert.match(atWaist.warnings.join(" "), /infinite/);
  // A 1 µm waist at 1550 nm diverges by 0.49 rad: past the paraxial limit.
  assert.match(run(beam, { waist: 1 }).warnings.join(" "), /paraxial/);
  // 1.6 → 1.38 at 75°: sin θ₁ = 1.6 sin 75° / 1.38 = 1.12 > 1.
  const ar = schemas.find((s) => s.href === "/thin-film/single-ar")!;
  const tir = run(ar, { nIncident: 1.6, angle: 75 });
  assert.equal(tir.outputs.quarterWaveThickness, null);
  assert.equal(tir.outputs.filmAngle, null);
  assert.ok(tir.outputs.reflectance !== null && tir.warnings.length === 1);
  // ε = 0 leaves no concentration that gives A; φ = 0 never spreads the beam.
  const lambert = schemas.find((s) => s.href === "/spectroscopy/lambert-beer-law")!;
  const noC = run(lambert, { solve: "c", extinctionCoeff: 0 });
  assert.equal(noC.outputs.concentration, null);
  assert.match(noC.warnings.join(" "), /no concentration/);
  const nohd = schemas.find((s) => s.href === "/laser-safety/nohd")!;
  const collimated = run(nohd, { divergence: 0 });
  assert.equal(collimated.outputs.nohd, null);
  assert.match(collimated.warnings.join(" "), /doesn't spread/);
  // A 1/e diameter is 1/√2 of the 1/e² one: the same beam both ways.
  const od = schemas.find((s) => s.href === "/laser-safety/optical-density")!;
  const odOneOverE = run(od, { beamDiam: 2, beamDefinition: "1/e" }).outputs.od!;
  assert.ok(Math.abs(odOneOverE / run(od, { beamDiam: 2 * Math.SQRT2 }).outputs.od! - 1) < 1e-12);
});

test("GET /api/v1/<category>/<slug>: 200 with units, tier and page URL; 400 and 404 with the reason", async () => {
  const get = (path: string, ip: string) =>
    GET(new NextRequest(`${ORIGIN}${path}`, { headers: { "x-forwarded-for": ip } }), {
      params: Promise.resolve({ category: path.split("/")[3], slug: path.split("/")[4].split("?")[0] }),
    });
  const ok = await get("/api/v1/wave-optics/gaussian-beam?wavelength=1064&waist=500&z=100", "192.0.2.10");
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("access-control-allow-origin"), "*");
  const body = await ok.json();
  assert.equal(body.calculator.tier, "textbook");
  assert.ok(body.calculator.references.length > 0);
  assert.equal(body.pageUrl, `${ORIGIN}/wave-optics/gaussian-beam?wavelength=1064&waist=500&z=100`);
  assert.deepEqual(body.inputs.waist, { label: "Beam waist radius w₀ (1/e²)", value: 500, unit: "µm", siValue: 5e-4, siUnit: "m" });
  assert.equal(body.outputs.beamRadius.unit, "µm");
  assert.ok(Math.abs(body.outputs.beamRadius.value / 504.5673516 - 1) < 1e-9);
  assert.ok(Math.abs(body.outputs.beamRadius.siValue / 5.045673516e-4 - 1) < 1e-9);

  const choice = await (await get("/api/v1/spectroscopy/lambert-beer-law?solve=c&absorbance=1", "192.0.2.10")).json();
  assert.deepEqual(choice.inputs.solve, { label: "Solve for", value: "c" });
  assert.match(choice.pageUrl, /lambert-beer-law\?solve=c&concentration=/);
  assert.ok(Math.abs(choice.outputs.concentration.value / 2e-5 - 1) < 1e-12);

  const bad = await get("/api/v1/wave-optics/gaussian-beam?waist=0", "192.0.2.10");
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /outside 1 to 10000 µm/);
  assert.equal((await get("/api/v1/wave-optics/no-such-page", "192.0.2.10")).status, 404);

  // A null output carries its own `reason`, the warning that says why (verification 2026-11 W6); a finite one has none.
  const tirf = await (await get("/api/v1/imaging/tirf?theta=0", "192.0.2.10")).json();
  assert.equal(tirf.outputs.depth.value, null);
  assert.match(tirf.outputs.depth.reason, /critical angle/);
  assert.ok(tirf.warnings.includes(tirf.outputs.depth.reason));
  assert.ok(Number.isFinite(tirf.outputs.criticalAngle.value));
  assert.ok(!("reason" in tirf.outputs.criticalAngle));
  assert.ok(!("reason" in body.outputs.beamRadius));

  const statuses: number[] = [];
  for (let i = 0; i < 61; i++) statuses.push((await get("/api/v1/imaging/airy-disk", "192.0.2.11")).status);
  assert.equal(statuses.filter((s) => s === 200).length, 60);
  assert.equal(statuses[60], 429);
});

test("/openapi.json describes every schema's parameters and outputs", () => {
  const doc = buildOpenApi();
  assert.equal(doc.openapi, "3.1.0");
  assert.deepEqual(Object.keys(doc.paths).sort(), schemas.map((s) => apiPath(s.href)).sort());
  const op = doc.paths[apiPath("/spectroscopy/blackbody")].get;
  assert.equal(op.operationId, "spectroscopy_blackbody");
  assert.deepEqual(op.parameters.find((p) => p.name === "temperature")?.schema,
    { type: "number", minimum: 100, maximum: 40000, default: 5778 });
  // The handler's 404 for an unknown calculator is documented (review 2026-11 P3-M9).
  assert.deepEqual(Object.keys(op.responses).sort(), ["200", "400", "404", "429"]);
  const outputs = op.responses[200].content["application/json"].schema.allOf[1].properties?.outputs.required;
  assert.deepEqual(outputs, ["peakWavelength", "peakSpectralRadiance", "exitance", "radiance", "bandFraction"]);
  // `reason` is documented on Quantity as an optional string (verification 2026-11 W6).
  const quantity = doc.components.schemas.Quantity;
  assert.equal(quantity.properties.reason.type, "string");
  assert.match(quantity.properties.reason.description, /null/);
  assert.ok(!quantity.required.includes("reason"));
  const nohd = doc.paths[apiPath("/laser-safety/nohd")].get.parameters;
  assert.deepEqual(nohd.slice(0, 2).map((p) => p.schema), [
    { type: "string", enum: ["1/e2", "1/e"], default: "1/e2" },
    { type: "string", enum: ["gaussian", "linear"], default: "gaussian" },
  ]);
});

test("GET /api/v1: a cacheable answer carries only the shared RateLimit-Policy; the 429 the counters and Retry-After", async () => {
  const get = (ip: string, query = "") =>
    GET(new NextRequest(`${ORIGIN}/api/v1/imaging/airy-disk${query}`, { headers: { "x-forwarded-for": ip } }), {
      params: Promise.resolve({ category: "imaging", slug: "airy-disk" }),
    });
  const first = await get("192.0.2.30");
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("ratelimit-policy"), "60;w=60");
  // One client's counters must not be cached by the CDN and served to others (200, 400 and 404 are all cacheable).
  for (const name of ["ratelimit-limit", "ratelimit-remaining", "ratelimit-reset", "retry-after"]) {
    assert.equal(first.headers.get(name), null, name);
  }
  const bad = await get("192.0.2.30", "?wavelength=abc");
  assert.equal(bad.status, 400);
  assert.equal(bad.headers.get("ratelimit-remaining"), null);
  // A browser script on another origin may read them.
  assert.match(first.headers.get("access-control-expose-headers") ?? "", /RateLimit-Policy.*Retry-After/);
  let last = first;
  for (let i = 0; i < 59; i++) last = await get("192.0.2.30");
  assert.equal(last.status, 429);
  assert.match(last.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(last.headers.get("ratelimit-limit"), "60");
  assert.equal(last.headers.get("ratelimit-remaining"), "0");
  const reset = Number(last.headers.get("ratelimit-reset"));
  assert.ok(reset >= 1 && reset <= 60, String(reset));
  assert.equal(last.headers.get("retry-after"), last.headers.get("ratelimit-reset"));

  const doc = buildOpenApi();
  const params = doc.paths[apiPath("/spectroscopy/blackbody")].get.parameters;
  assert.equal(params.find((p) => p.name === "temperature")?.example, 5778);
  for (const op of Object.values(doc.paths)) {
    for (const p of op.get.parameters) assert.equal(p.example, p.schema.default, p.name);
  }
});
