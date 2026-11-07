// Machine-readable calculators (Phase 11): the inputs, outputs and reference checks of a page, so that
// `/api/v1/<category>/<slug>` can run it and `/openapi.json` can describe it. No registry imports here: page
// clients may import a schema later, and `tests/registry.test.ts` keeps the registry out of client code.

/** A number the page reads from its URL query. The API takes the same key, in the same unit. */
export interface InputSpec<K extends string = string> {
  /** The page's `useURLState` key. */
  key: K;
  label: string;
  /** The unit the page shows and the query uses ("nm", "µm"); "" for a pure number. */
  unit: string;
  /** SI value = value × toSI. */
  toSI: number;
  /** "" for a pure number. */
  siUnit: string;
  /** The page's default. */
  default: number;
  /** The page's input range; the API answers 400 outside it. */
  min: number;
  max: number;
}

/** A result the page shows, in the page's unit. */
export interface OutputSpec<K extends string = string> {
  key: K;
  label: string;
  unit: string;
  /** SI value = value × toSI. */
  toSI: number;
  siUnit: string;
}

/**
 * A reference case that `tests/api-schemas.test.ts` runs through the API code path and `/checks.json` will
 * publish. Inputs left out take their defaults; values are in the page's units.
 */
export interface ReferenceCheck<I extends string = string, O extends string = string> {
  /** Citation (authors, year, title, venue, equation or table), as in the registry's references. */
  source: string;
  /** "printed": the source prints the expected value. "computed": worked by hand from the source's equations. */
  basis: "printed" | "computed";
  inputs: Partial<Record<I, number>>;
  expect: Partial<Record<O, number>>;
  /** Largest relative difference accepted; it covers the rounding of a printed value. */
  tolerance: number;
}

export interface ComputeResult<O extends string = string> {
  /** SI values. A non-finite value means "no result" and goes out as null; add a warning that says why. */
  values: Record<O, number>;
  warnings?: string[];
}

export interface CalculatorSchema<I extends string = string, O extends string = string> {
  /** `/<category>/<slug>`, the registry href. */
  href: string;
  inputs: readonly InputSpec<I>[];
  outputs: readonly OutputSpec<O>[];
  /** Rejects input combinations the ranges can't express; returns the reason. */
  validate?(si: Record<NoInfer<I>, number>): string | undefined;
  /** SI in, SI out, through the same `src/physics/` functions the page calls. */
  compute(si: Record<NoInfer<I>, number>): ComputeResult<NoInfer<O>>;
  /** 1–3 reference cases. */
  checks: readonly ReferenceCheck<NoInfer<I>, NoInfer<O>>[];
}

/** Infers the input and output keys, so a typo in `compute` or `checks` fails tsc. */
export function defineSchema<I extends string, O extends string>(schema: CalculatorSchema<I, O>): CalculatorSchema {
  return schema as unknown as CalculatorSchema;
}
