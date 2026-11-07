// tests/api-schemas.test.ts's per-schema assertions for schema files not yet in src/schemas/index.ts, so parallel
// agents can check their own files without seeing each other's half-written ones.
//   npx tsx scripts/check-schema.ts src/schemas/<category>/<slug>.ts …   # prints failures, then ALL PASS or N FAILURES
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { findCalculator } from "../src/registry/index";
import { parseInputs, runSchema } from "../src/schemas/run";
import type { CalculatorSchema } from "../src/schemas/types";
import { pageDefaults } from "./page-defaults";

let failures = 0;
const fail = (message: string) => {
  failures++;
  console.log(`FAIL ${message}`);
};
const unique = (keys: string[]) => new Set(keys).size === keys.length;
const query = (inputs: Record<string, number | string>) =>
  new URLSearchParams(Object.entries(inputs).map(([k, v]) => [k, String(v)]));

async function check(schema: CalculatorSchema) {
  const h = schema.href;
  const run = (inputs: Record<string, number | string>) => {
    const parsed = parseInputs(schema, query(inputs));
    if (!parsed.ok) {
      fail(`${h}: ${parsed.error}`);
      return null;
    }
    return runSchema(schema, parsed.values);
  };
  if (!findCalculator(h)) fail(`${h} is not in the registry`);
  const choices = schema.choices ?? [];
  if (!unique([...choices, ...schema.inputs].map((i) => i.key)) || !unique(schema.outputs.map((o) => o.key))) {
    fail(`${h}: duplicate keys`);
  }
  for (const choice of choices) {
    const values = choice.options.map((o) => o.value);
    if (!(values.length >= 2 && unique(values) && values.includes(choice.default))) fail(`${h} ${choice.key}`);
  }
  for (const input of schema.inputs) {
    if (!(input.min < input.max && input.default >= input.min && input.default <= input.max)) fail(`${h} ${input.key} range`);
    if (!(input.toSI > 0)) fail(`${h} ${input.key} toSI`);
  }
  for (const output of schema.outputs) if (!(output.toSI > 0)) fail(`${h} ${output.key} toSI`);
  if (!(schema.checks.length >= 1 && schema.checks.length <= 3)) fail(`${h}: 1–3 checks`);

  const defaults = await pageDefaults(h);
  const inputs = [...choices, ...schema.inputs];
  const pageKeys = [...defaults.keys()].sort().join(", ");
  const schemaKeys = inputs.map((i) => i.key).sort().join(", ");
  if (pageKeys !== schemaKeys) fail(`${h} keys: page [${pageKeys}], schema [${schemaKeys}]`);
  for (const input of inputs) {
    if (input.default !== defaults.get(input.key)) fail(`${h} ${input.key}: default ${input.default}, page ${defaults.get(input.key)}`);
  }

  const atDefaults = run({});
  if (atDefaults) {
    for (const [key, value] of Object.entries(atDefaults.outputs)) {
      if (!Number.isFinite(value) && !(value === null && atDefaults.warnings.length > 0)) fail(`${h} ${key} = ${value} at the defaults, without a warning`);
    }
  }
  for (const c of schema.checks) {
    if (!(c.source.length > 20 && c.tolerance > 0 && c.tolerance <= 0.01)) fail(`${h}: source or tolerance of "${c.source}"`);
    const result = run(c.inputs as Record<string, number | string>);
    if (!result) continue;
    for (const [key, expected] of Object.entries(c.expect) as [string, number][]) {
      if (expected === 0) {
        fail(`${h} ${key}: a relative check needs a nonzero value`);
        continue;
      }
      const actual = result.outputs[key];
      if (actual === null || actual === undefined || !(Math.abs(actual / expected - 1) <= c.tolerance)) fail(`${h} ${key}: ${actual} vs ${expected}`);
    }
  }
}

async function main() {
  for (const file of process.argv.slice(2)) {
    const mod = (await import(pathToFileURL(resolve(file)).href)) as { default: CalculatorSchema | { default: CalculatorSchema } };
    await check("href" in mod.default ? mod.default : mod.default.default);
  }
  console.log(failures ? `${failures} FAILURES` : "ALL PASS");
  process.exitCode = failures ? 1 : 0;
}

void main();
