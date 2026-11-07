// The schemas' reference cases with the deployed model's value next to each expected one: the MCP tool `get_checks`
// and `/checks.json`. An agent can rerun a case with `run_calculator` or the JSON API and compare. Server-side only.
import { SITE_URL } from "../lib/site";
import { schemas } from "../schemas";
import { parseInputs, runSchema, type InputValues } from "../schemas/run";
import type { CalculatorSchema } from "../schemas/types";
import { apiPath } from "./api";
import { getCalculator } from "./index";

const asQuery = (inputs: InputValues) => new URLSearchParams(Object.entries(inputs).map(([k, v]) => [k, String(v)]));

/** Each reference case of a schema: its source, all inputs (defaults filled in) and expected vs. model outputs. */
export function schemaChecks(schema: CalculatorSchema) {
  return schema.checks.map((check) => {
    const parsed = parseInputs(schema, asQuery(check.inputs as InputValues));
    // tests/api-schemas.test.ts runs every check through parseInputs, so this only fires on an untested schema.
    if (!parsed.ok) throw new Error(`${schema.href}: a check's inputs are rejected: ${parsed.error}`);
    const run = runSchema(schema, parsed.values);
    const query = asQuery(run.inputs);
    return {
      source: check.source,
      basis: check.basis,
      tolerance: check.tolerance,
      inputs: Object.fromEntries([
        ...(schema.choices ?? []).map((choice) => [choice.key, { value: run.inputs[choice.key] }]),
        ...schema.inputs.map((input) => [input.key, { value: run.inputs[input.key], unit: input.unit }]),
      ]),
      outputs: Object.entries(check.expect as Record<string, number>).map(([key, expected]) => {
        const output = schema.outputs.find((o) => o.key === key);
        const model = run.outputs[key];
        const relativeDifference = model === null ? null : Math.abs(model / expected - 1);
        return {
          key,
          label: output?.label ?? key,
          unit: output?.unit ?? "",
          expected,
          model,
          relativeDifference,
          pass: relativeDifference !== null && relativeDifference <= check.tolerance,
        };
      }),
      pageUrl: `${SITE_URL}${schema.href}?${query}`,
      apiUrl: `${SITE_URL}${apiPath(schema.href)}?${query}`,
    };
  });
}

/** `/checks.json`: every runnable calculator's reference cases. */
export function buildChecksJson() {
  return {
    description: "Reference cases for each calculator the API can run: inputs in the page's units, the value the " +
      "source prints (basis \"printed\") or that was worked by hand from its equations (\"computed\"), and this " +
      "deployment's result. Rerun a case through apiUrl, or with your own calculation, and report a mismatch with " +
      `the form on the page or the MCP tool report_problem (${SITE_URL}/mcp).`,
    calculators: schemas.map((schema) => {
      const calculator = getCalculator(schema.href);
      return {
        slug: schema.href.slice(1),
        title: calculator.title,
        url: `${SITE_URL}${schema.href}`,
        checks: schemaChecks(schema),
      };
    }),
  };
}
