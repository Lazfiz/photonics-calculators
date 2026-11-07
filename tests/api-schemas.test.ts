import { test } from "node:test";
import assert from "node:assert/strict";
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
  const outputs = op.responses[200].content["application/json"].schema.allOf[1].properties?.outputs.required;
  assert.deepEqual(outputs, ["peakWavelength", "peakSpectralRadiance", "exitance", "radiance", "bandFraction"]);
  const nohd = doc.paths[apiPath("/laser-safety/nohd")].get.parameters;
  assert.deepEqual(nohd.slice(0, 2).map((p) => p.schema), [
    { type: "string", enum: ["1/e2", "1/e"], default: "1/e2" },
    { type: "string", enum: ["linear", "gaussian"], default: "linear" },
  ]);
});
