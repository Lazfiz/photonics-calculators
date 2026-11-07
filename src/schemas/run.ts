// Runs a calculator schema: query parameters in the page's units → SI → compute → results in the page's units.
import type { CalculatorSchema, SchemaInputs } from "./types";

/** Numbers in the page's units, choices as their option values. */
export type InputValues = Record<string, number | string>;

export type ParsedInputs = { ok: true; values: InputValues } | { ok: false; error: string };

export interface RunResult {
  /** Every input, in the page's units, defaults filled in. */
  inputs: InputValues;
  /** In the page's units; null when the model has no result (a warning says why). */
  outputs: Record<string, number | null>;
  si: Record<string, number | null>;
  warnings: string[];
}

const withUnit = (value: number, unit: string) => (unit ? `${value} ${unit}` : `${value}`);

function toSI(schema: CalculatorSchema, values: InputValues): SchemaInputs {
  const si: InputValues = Object.fromEntries((schema.choices ?? []).map((choice) => [choice.key, values[choice.key]]));
  for (const input of schema.inputs) si[input.key] = (values[input.key] as number) * input.toSI;
  return si as SchemaInputs;
}

/** Reads the inputs from a query string. Missing keys take the page's defaults; anything else wrong is an error. */
export function parseInputs(schema: CalculatorSchema, params: URLSearchParams): ParsedInputs {
  const known = new Map(schema.inputs.map((input) => [input.key, input]));
  const choices = new Map((schema.choices ?? []).map((choice) => [choice.key, choice]));
  const values: InputValues = {};
  for (const key of new Set(params.keys())) {
    const input = known.get(key);
    const choice = choices.get(key);
    if (!input && !choice) {
      return { ok: false, error: `Unknown input "${key}". Inputs: ${[...choices.keys(), ...known.keys()].join(", ")}.` };
    }
    const raw = params.getAll(key);
    if (raw.length > 1) return { ok: false, error: `Input "${key}" is given ${raw.length} times.` };
    if (choice) {
      const allowed = choice.options.map((option) => option.value);
      if (!allowed.includes(raw[0])) {
        return { ok: false, error: `${choice.label} (${key}) must be one of ${allowed.join(", ")}, not "${raw[0]}".` };
      }
      values[key] = raw[0];
      continue;
    }
    if (!input) continue;
    const value = raw[0].trim() === "" ? NaN : Number(raw[0]);
    if (!Number.isFinite(value)) return { ok: false, error: `Input "${key}" must be a finite number, not "${raw[0]}".` };
    if (value < input.min || value > input.max) {
      return {
        ok: false,
        error: `${input.label} (${key}) = ${withUnit(value, input.unit)} is outside ` +
          `${input.min} to ${withUnit(input.max, input.unit)}.`,
      };
    }
    values[key] = value;
  }
  for (const choice of schema.choices ?? []) values[choice.key] ??= choice.default;
  for (const input of schema.inputs) values[input.key] ??= input.default;
  const reason = schema.validate?.(toSI(schema, values));
  return reason ? { ok: false, error: reason } : { ok: true, values };
}

/** Computes the outputs for parsed inputs (page units). */
export function runSchema(schema: CalculatorSchema, values: InputValues): RunResult {
  const result = schema.compute(toSI(schema, values));
  const outputs: Record<string, number | null> = {};
  const si: Record<string, number | null> = {};
  for (const output of schema.outputs) {
    const value = result.values[output.key];
    const finite = Number.isFinite(value);
    si[output.key] = finite ? value : null;
    outputs[output.key] = finite ? value / output.toSI : null;
  }
  return { inputs: { ...values }, outputs, si, warnings: result.warnings ?? [] };
}
