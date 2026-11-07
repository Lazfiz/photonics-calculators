// The JSON API (`/api/v1/<category>/<slug>`) and its OpenAPI description (`/openapi.json`), built from the registry
// and the calculator schemas in `src/schemas/`. Server-side only.
import { SITE_URL } from "../lib/site";
import { findSchema, schemas } from "../schemas";
import type { RunResult } from "../schemas/run";
import type { CalculatorSchema, ChoiceSpec, InputSpec } from "../schemas/types";
import { findCalculator, getCalculator, type Calculator } from "./index";
import { tierInfo } from "./tiers";

export const API_PREFIX = "/api/v1";

export const apiPath = (href: string) => `${API_PREFIX}${href}`;

/** The calculator and its schema, when the API can run the page at `href`. */
export function apiCalculator(href: string): { calculator: Calculator; schema: CalculatorSchema } | undefined {
  const calculator = findCalculator(href);
  const schema = findSchema(href);
  return calculator && schema ? { calculator, schema } : undefined;
}

function describeCalculator(calculator: Calculator) {
  return {
    title: calculator.title,
    url: `${SITE_URL}${calculator.href}`,
    tier: calculator.tier ?? null,
    tierLabel: tierInfo(calculator.tier).label,
    tierDefinition: tierInfo(calculator.tier).definition,
    modelNote: calculator.modelNote ?? null,
    references: calculator.references ?? [],
    ...(calculator.knownIssue ? { knownIssue: calculator.knownIssue } : {}),
  };
}

/** The 200 body: inputs and outputs keyed by the page's keys, in the page's units and in SI; choices as their values. */
export function apiResponse(calculator: Calculator, schema: CalculatorSchema, run: RunResult) {
  const choices = schema.choices ?? [];
  const query = new URLSearchParams([...choices, ...schema.inputs].map((input) => [input.key, String(run.inputs[input.key])]));
  return {
    calculator: describeCalculator(calculator),
    pageUrl: `${SITE_URL}${calculator.href}?${query}`,
    inputs: Object.fromEntries([
      ...choices.map((choice) => [choice.key, { label: choice.label, value: run.inputs[choice.key] }]),
      ...schema.inputs.map((input) => {
        const value = run.inputs[input.key] as number;
        return [input.key, { label: input.label, value, unit: input.unit, siValue: value * input.toSI, siUnit: input.siUnit }];
      }),
    ]),
    outputs: Object.fromEntries(schema.outputs.map((output) => [output.key, {
      label: output.label,
      value: run.outputs[output.key],
      unit: output.unit,
      siValue: run.si[output.key],
      siUnit: output.siUnit,
    }])),
    warnings: run.warnings,
  };
}

const unitText = (unit: string) => (unit ? ` (${unit})` : "");

function parameter(input: InputSpec) {
  return {
    name: input.key,
    in: "query",
    required: false,
    description: `${input.label}${unitText(input.unit)}.`,
    schema: { type: "number", minimum: input.min, maximum: input.max, default: input.default },
  };
}

function choiceParameter(choice: ChoiceSpec) {
  return {
    name: choice.key,
    in: "query",
    required: false,
    description: `${choice.label}: ${choice.options.map((option) => `${option.value} = ${option.label}`).join("; ")}.`,
    schema: { type: "string", enum: choice.options.map((option) => option.value), default: choice.default },
  };
}

const choiceValue = {
  type: "object",
  required: ["label", "value"],
  properties: { label: { type: "string" }, value: { type: "string", description: "The chosen option's value." } },
};

const quantity = {
  type: "object",
  required: ["label", "value", "unit", "siValue", "siUnit"],
  properties: {
    label: { type: "string" },
    value: { type: ["number", "null"], description: "In `unit`, the page's unit. null: no result (see warnings)." },
    unit: { type: "string", description: '"" for a pure number.' },
    siValue: { type: ["number", "null"] },
    siUnit: { type: "string" },
  },
};

/** OpenAPI 3.1 for every calculator with a schema. */
export function buildOpenApi() {
  const paths = Object.fromEntries(schemas.map((schema) => {
    const calculator = getCalculator(schema.href);
    const outputs = Object.fromEntries(schema.outputs.map((output) => [output.key, {
      $ref: "#/components/schemas/Quantity",
      description: `${output.label}${unitText(output.unit)}.`,
    }]));
    return [apiPath(schema.href), {
      get: {
        operationId: `${calculator.category}_${calculator.slug}`.replace(/-/g, "_"),
        summary: calculator.title,
        description: `${calculator.description} Model tier: ${tierInfo(calculator.tier).label}.` +
          (calculator.modelNote ? ` ${calculator.modelNote}` : ""),
        externalDocs: { url: `${SITE_URL}${calculator.href}` },
        parameters: [...(schema.choices ?? []).map(choiceParameter), ...schema.inputs.map(parameter)],
        responses: {
          200: {
            description: "Results at the given inputs; inputs left out take the page's defaults.",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/Result" },
                    { type: "object", properties: { outputs: { type: "object", properties: outputs, required: Object.keys(outputs) } } },
                  ],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadInput" },
          429: { $ref: "#/components/responses/TooMany" },
        },
      },
    }];
  }));
  const error = { content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } };
  return {
    openapi: "3.1.0",
    info: {
      title: "Photonics Calculators API",
      version: "1.0.0",
      description: "Runs the site's calculators with your inputs. Each query parameter is the page's URL key in the " +
        "page's unit, so a page URL's query works here too. Responses carry the model tier, the model's " +
        "assumptions and the references the model was checked against. Free, no key; about 60 requests per " +
        "minute per address.",
    },
    servers: [{ url: SITE_URL }],
    externalDocs: { url: `${SITE_URL}/about#verification` },
    paths,
    components: {
      schemas: {
        Quantity: quantity,
        Choice: choiceValue,
        Result: {
          type: "object",
          required: ["calculator", "pageUrl", "inputs", "outputs", "warnings"],
          properties: {
            calculator: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                tier: { type: ["string", "null"], enum: ["exact", "textbook", "illustrative", null] },
                tierLabel: { type: "string" },
                tierDefinition: { type: "string" },
                modelNote: { type: ["string", "null"] },
                references: {
                  type: "array",
                  items: { type: "object", properties: { citation: { type: "string" }, url: { type: "string" } } },
                },
                knownIssue: { type: "string", description: "An error found and not yet fixed." },
              },
            },
            pageUrl: { type: "string", description: "The page with these inputs." },
            inputs: {
              type: "object",
              additionalProperties: { oneOf: [{ $ref: "#/components/schemas/Quantity" }, { $ref: "#/components/schemas/Choice" }] },
            },
            outputs: { type: "object", additionalProperties: { $ref: "#/components/schemas/Quantity" } },
            warnings: { type: "array", items: { type: "string" } },
          },
        },
        Error: { type: "object", required: ["error"], properties: { error: { type: "string" } } },
      },
      responses: {
        BadInput: { description: "Unknown input, not a number, outside the page's range, or not one of the options.", ...error },
        TooMany: { description: "Rate limit; try again in a minute.", ...error },
      },
    },
  };
}
