// The MCP server's tools (Phase 11b): find a calculator, run it, see its reference cases, report a problem. They wrap
// the JSON API's code (`src/registry/api.ts`, `src/schemas/run.ts`), so an agent gets the same numbers as the page.
// Server-side only.
import { parseReport, RateLimiter } from "../lib/report";
import { sendReport } from "../lib/report-send";
import type { SearchItem } from "../lib/search-index-types";
import { scoreItem, searchItems, searchTerms } from "../lib/site-search";
import { SITE_URL } from "../lib/site";
import { findSchema, schemas } from "../schemas";
import { parseInputs, runSchema } from "../schemas/run";
import type { CalculatorSchema } from "../schemas/types";
import { apiResponse } from "../registry/api";
import { schemaChecks } from "../registry/checks";
import { calculators, findCalculator, type Calculator } from "../registry";
import { REPO_URL } from "../registry/llms";
import { buildSearchIndex } from "../registry/search";
import { tierInfo } from "../registry/tiers";

/** Who is calling: the rate-limit key, and the site that took the request (for report links). */
export interface ToolContext {
  ip: string;
  origin: string;
}

export type ToolResult = { ok: true; data: Record<string, unknown> } | { ok: false; error: string };

export interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: Record<string, boolean | string>;
  call(args: Record<string, unknown>, ctx: ToolContext): ToolResult | Promise<ToolResult>;
}

const fail = (error: string): ToolResult => ({ ok: false, error });

const SLUG = {
  type: "string",
  description: 'The calculator\'s "<category>/<slug>" from find_calculator, e.g. "wave-optics/gaussian-beam". ' +
    "A page URL works too.",
};

/** A calculator from `<category>/<slug>`, `/<category>/<slug>`, a page or API URL, or a slug that is unique. */
export function resolveCalculator(raw: unknown): { calculator: Calculator } | { error: string } {
  if (typeof raw !== "string" || raw.trim() === "") return { error: 'slug must be a string like "wave-optics/gaussian-beam".' };
  const path = raw.trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/[?#].*$/, "")
    .replace(/^\/?api\/v1(?=\/)/, "")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
  const calculator = path.includes("/")
    ? findCalculator(`/${path}`)
    : (() => {
      const matches = calculators.filter((c) => c.slug === path);
      return matches.length === 1 ? matches[0] : undefined;
    })();
  return calculator
    ? { calculator }
    : { error: `No calculator "${raw}". Use find_calculator to get its "<category>/<slug>".` };
}

function runnable(raw: unknown): { calculator: Calculator; schema: CalculatorSchema } | { error: string } {
  const found = resolveCalculator(raw);
  if ("error" in found) return found;
  const schema = findSchema(found.calculator.href);
  if (!schema) {
    return {
      error: `${found.calculator.title} can't be run here yet: only ${schemas.length} calculators have a ` +
        `machine-readable schema so far (find_calculator marks them runnable). Its page: ${SITE_URL}${found.calculator.href}`,
    };
  }
  return { calculator: found.calculator, schema };
}

/** Inputs, choices and outputs of a schema, as an agent needs them to call `run_calculator`. */
export function describeSchema(schema: CalculatorSchema) {
  return {
    inputs: schema.inputs.map((input) => ({
      key: input.key, label: input.label, unit: input.unit, default: input.default, min: input.min, max: input.max,
    })),
    choices: (schema.choices ?? []).map((choice) => ({
      key: choice.key, label: choice.label, options: choice.options, default: choice.default,
    })),
    outputs: schema.outputs.map((output) => ({ key: output.key, label: output.label, unit: output.unit })),
  };
}

// Words a question carries that say nothing about which calculator it wants.
const FILLER = new Set([
  "a", "an", "and", "at", "by", "calculate", "calculation", "calculator", "compute", "find", "for", "from", "how",
  "i", "in", "is", "of", "on", "or", "the", "to", "what", "with",
]);

let pages: SearchItem[] | undefined;

/** Calculators for a free-text query: the site search first (every word matches), then pages that match most words. */
export function findCalculators(query: string, limit: number): SearchItem[] {
  pages ??= buildSearchIndex().filter((item) => item.kind === "page" && item.href !== "/about");
  const strict = searchItems(pages, query, limit);
  if (strict.length >= limit) return strict;
  const terms = searchTerms(query).filter((term) => !FILLER.has(term));
  const seen = new Set(strict.map((item) => item.href));
  const loose = pages
    .filter((item) => !seen.has(item.href))
    .map((item) => {
      const scores = terms.map((term) => scoreItem(item, [term]));
      return { item, matched: scores.filter((s) => s > 0).length, score: scores.reduce((a, b) => a + b, 0) };
    })
    .filter((entry) => entry.matched > 0)
    .sort((a, b) => b.matched - a.matched || b.score - a.score);
  return [...strict, ...loose.slice(0, limit - strict.length).map((entry) => entry.item)];
}

const findCalculator_: Tool = {
  name: "find_calculator",
  title: "Find a calculator",
  description: "Searches the site's optics and photonics calculators (laser safety, fiber optics, thin films, imaging, " +
    "spectroscopy, detectors, materials, wave optics, polarization, free-space comms) by topic or quantity. Each result " +
    "has its slug, page URL and model tier; results marked runnable list the inputs (page units, ranges, defaults) and " +
    "outputs that run_calculator takes and returns.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: 'What to compute, e.g. "gaussian beam radius" or "laser eye MPE".' },
      limit: { type: "integer", minimum: 1, maximum: 25, default: 8, description: "Most results to return." },
    },
    required: ["query"],
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  call(args) {
    if (typeof args.query !== "string" || args.query.trim() === "") return fail("query must be a non-empty string.");
    const limit = args.limit === undefined ? 8 : Number(args.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 25) return fail("limit must be an integer from 1 to 25.");
    const results = findCalculators(args.query, limit).map((item) => {
      const calculator = findCalculator(item.href);
      const schema = findSchema(item.href);
      return {
        slug: item.href.slice(1),
        title: item.title,
        description: item.description,
        url: `${SITE_URL}${item.href}`,
        tier: tierInfo(calculator?.tier).label,
        runnable: schema !== undefined,
        ...(schema ? describeSchema(schema) : {}),
      };
    });
    return {
      ok: true,
      data: {
        results,
        ...(results.length === 0 ? { note: "Nothing matched; try fewer or other words (a quantity or an effect)." } : {}),
      },
    };
  },
};

const runCalculator: Tool = {
  name: "run_calculator",
  title: "Run a calculator",
  description: "Runs a calculator with your inputs, through the same physics code as its page. Inputs use the page's " +
    "keys and units (find_calculator lists them); inputs left out take the page's defaults, and a value outside the " +
    "page's range is rejected with the reason. The result gives every input and output in the page's units and in " +
    "SI, the model tier, the model's assumptions, its references and a link to the page with these inputs. Please " +
    "check results that matter against the references or your own calculation, and use report_problem if they disagree.",
  inputSchema: {
    type: "object",
    properties: {
      slug: SLUG,
      inputs: {
        type: "object",
        description: 'Input key → value in the page\'s unit (a number), or a choice\'s option value (a string), e.g. ' +
          '{"wavelength": 1064, "waist": 500, "z": 100}.',
        additionalProperties: { type: ["number", "string"] },
      },
    },
    required: ["slug"],
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  call(args) {
    const found = runnable(args.slug);
    if ("error" in found) return fail(found.error);
    const inputs = args.inputs ?? {};
    if (typeof inputs !== "object" || inputs === null || Array.isArray(inputs)) {
      return fail("inputs must be an object of input key → value.");
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value !== "number" && typeof value !== "string") return fail(`Input "${key}" must be a number or a string.`);
      params.set(key, String(value));
    }
    const parsed = parseInputs(found.schema, params);
    if (!parsed.ok) return fail(parsed.error);
    return { ok: true, data: apiResponse(found.calculator, found.schema, runSchema(found.schema, parsed.values)) };
  },
};

const getChecks: Tool = {
  name: "get_checks",
  title: "Reference cases of a calculator",
  description: "Lists a runnable calculator's reference cases: the inputs, the value a published source prints " +
    "(basis \"printed\") or that was worked by hand from its equations (\"computed\"), the accepted tolerance, and " +
    "what this deployment computes. Use it to see what the model was checked against before relying on it.",
  inputSchema: { type: "object", properties: { slug: SLUG }, required: ["slug"] },
  annotations: { readOnlyHint: true, openWorldHint: false },
  call(args) {
    const found = runnable(args.slug);
    if ("error" in found) return fail(found.error);
    const { calculator, schema } = found;
    return {
      ok: true,
      data: {
        slug: calculator.href.slice(1),
        title: calculator.title,
        url: `${SITE_URL}${calculator.href}`,
        tier: tierInfo(calculator.tier).label,
        references: calculator.references ?? [],
        checks: schemaChecks(schema),
      },
    };
  },
};

// The form's limit: five reports per IP per ten minutes, per server instance.
const reportLimiter = new RateLimiter(5, 10 * 60 * 1000);

const reportProblem: Tool = {
  name: "report_problem",
  title: "Report a problem",
  description: "Emails the site's maintainer about a calculator that looks wrong: a result that disagrees with a " +
    "reference or an independent calculation, a unit, a range, or a missing caveat. Say what you expected, why " +
    "(a source or your calculation) and what the calculator gave. Use slug \"about\" for the site in general. " +
    "Don't include personal data; contact is optional and only used to reply.",
  inputSchema: {
    type: "object",
    properties: {
      slug: SLUG,
      message: { type: "string", minLength: 10, maxLength: 4000, description: "What is wrong and why you think so." },
      inputs: {
        type: "object",
        description: "The inputs that show the problem, as given to run_calculator.",
        additionalProperties: { type: ["number", "string"] },
      },
      contact: { type: "string", description: "Optional email address for a reply." },
    },
    required: ["slug", "message"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  async call(args, ctx) {
    const href = args.slug === "about" ? "/about" : (() => {
      const found = resolveCalculator(args.slug);
      return "error" in found ? undefined : found.calculator.href;
    })();
    if (!href) return fail(`No calculator "${String(args.slug)}". Use find_calculator to get its "<category>/<slug>".`);
    const inputs = args.inputs ?? {};
    if (typeof inputs !== "object" || inputs === null || Array.isArray(inputs)) {
      return fail("inputs must be an object of input key → value.");
    }
    const query = new URLSearchParams(Object.entries(inputs).map(([k, v]) => [k, String(v)])).toString();
    const parsed = parseReport(
      JSON.stringify({ href, query, message: args.message ?? "", contact: args.contact ?? "", website: "" }),
      () => true,
    );
    if (!parsed.ok) return fail(parsed.spam ? "The report was rejected." : parsed.error);
    if (!reportLimiter.allow(ctx.ip)) return fail("Too many reports from this address; please try again later.");
    const sent = await sendReport(parsed.report, ctx.origin, "mcp");
    if (!sent.ok) {
      return fail(sent.error === "not-configured"
        ? `Reports can't be sent from this deployment. Please use the form at ${SITE_URL}${href} or open an issue at ${REPO_URL}/issues.`
        : `The report couldn't be sent just now. Please try again later or use the form at ${SITE_URL}${href}.`);
    }
    return { ok: true, data: { sent: true, page: `${SITE_URL}${href}`, note: "Thank you; the report was emailed to the site's maintainer." } };
  },
};

export const tools: readonly Tool[] = [findCalculator_, runCalculator, getChecks, reportProblem];
