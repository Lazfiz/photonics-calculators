// Runs a calculator schema: query parameters in the page's units → SI → compute → results in the page's units.
import type { CalculatorSchema } from "./types";

export type ParsedInputs = { ok: true; values: Record<string, number> } | { ok: false; error: string };

export interface RunResult {
  /** Every input, in the page's units, defaults filled in. */
  inputs: Record<string, number>;
  /** In the page's units; null when the model has no result (a warning says why). */
  outputs: Record<string, number | null>;
  si: Record<string, number | null>;
  warnings: string[];
}

const withUnit = (value: number, unit: string) => (unit ? `${value} ${unit}` : `${value}`);

function toSI(schema: CalculatorSchema, values: Record<string, number>): Record<string, number> {
  return Object.fromEntries(schema.inputs.map((input) => [input.key, values[input.key] * input.toSI]));
}

/** Reads the inputs from a query string. Missing keys take the page's defaults; anything else wrong is an error. */
export function parseInputs(schema: CalculatorSchema, params: URLSearchParams): ParsedInputs {
  const known = new Map(schema.inputs.map((input) => [input.key, input]));
  const values: Record<string, number> = {};
  for (const key of new Set(params.keys())) {
    const input = known.get(key);
    if (!input) {
      return { ok: false, error: `Unknown input "${key}". Inputs: ${[...known.keys()].join(", ")}.` };
    }
    const raw = params.getAll(key);
    if (raw.length > 1) return { ok: false, error: `Input "${key}" is given ${raw.length} times.` };
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
  for (const input of schema.inputs) values[input.key] ??= input.default;
  const reason = schema.validate?.(toSI(schema, values));
  return reason ? { ok: false, error: reason } : { ok: true, values };
}

/** Computes the outputs for parsed inputs (page units). */
export function runSchema(schema: CalculatorSchema, values: Record<string, number>): RunResult {
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
