// PR #292 verify probe. Run on EITHER tree (main or PR head): npx tsx docs/audit/fable-verify-probes/pr292/sweep.ts [outfile.json]
// Reference: PR body claim "1553 partially null outputs, only 150 named in a warning; backlog 447 pairs / 128 schemas".
// Counting: a "run" = defaults, or one input alone at its min or max (optionally: one choice at each option). Runs that
// parseInputs rejects are skipped. A run is "partial" when 0 < nulls < outputs. One count per (schema, run, null output).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { schemas } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";

const q = (o: Record<string, number | string>) => new URLSearchParams(Object.entries(o).map(([k, v]) => [k, String(v)]));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9α-ωµ]+/g, " ").trim();
type Row = { href: string; run: string; out: string; label: string; warnings: string[]; reason?: string; allNull: boolean };
const rows: Row[] = [];
let runs = 0, rejected = 0;
for (const withChoices of [false, true]) {
  for (const s of schemas) {
    const cases: Record<string, number | string>[] = withChoices ? [] : [{}];
    if (!withChoices) for (const i of s.inputs) cases.push({ [i.key]: i.min }, { [i.key]: i.max });
    else for (const c of s.choices ?? []) for (const o of c.options) cases.push({ [c.key]: o.value });
    for (const c of cases) {
      const p = parseInputs(s, q(c));
      if (!p.ok) { rejected++; continue; }
      runs++;
      const r = runSchema(s, p.values) as ReturnType<typeof runSchema> & { reasons?: Record<string, string> };
      const nulls = s.outputs.filter((o) => r.outputs[o.key] === null);
      for (const o of nulls) rows.push({ href: s.href, run: (withChoices ? "choice:" : "") + JSON.stringify(c), out: o.key, label: o.label,
        warnings: r.warnings, reason: r.reasons?.[o.key], allNull: nulls.length === s.outputs.length });
      // leaks: reasons for non-null outputs; duplicate warnings
      for (const k of Object.keys(r.reasons ?? {})) if (r.outputs[k] !== null) console.log("LEAK reason on non-null", s.href, JSON.stringify(c), k);
      if (new Set(r.warnings).size !== r.warnings.length) console.log("DUP warning", s.href, JSON.stringify(c));
    }
  }
}
const named = (r: Row) => r.warnings.some((w) => norm(w).includes(norm(r.label)) || w.includes(r.out));
for (const label of ["inputs only (defaults + min + max)", "choices only"]) {
  const sel = rows.filter((r) => r.run.startsWith("choice:") === (label === "choices only"));
  const part = sel.filter((r) => !r.allNull);
  console.log(`== ${label}`);
  console.log(" null outputs (all):", sel.length, " in all-null runs:", sel.length - part.length, " partial:", part.length);
  console.log(" partial with NO warnings at all:", part.filter((r) => r.warnings.length === 0).length);
  console.log(" partial, a warning contains the output's label or key:", part.filter(named).length);
  console.log(" partial with own reason:", part.filter((r) => r.reason).length);
  const miss = part.filter((r) => !r.reason);
  console.log(" partial without reason: triples", miss.length, " unique href+output", new Set(miss.map((r) => r.href + " " + r.out)).size,
    " schemas", new Set(miss.map((r) => r.href)).size);
}
const missAll = new Set(rows.filter((r) => !r.allNull && !r.reason).map((r) => `${r.href} ${r.out}`));
console.log("union (inputs+choices) unique href+output without reason:", missAll.size, "schemas", new Set([...missAll].map((k) => k.split(" ")[0])).size);
console.log("schemas", schemas.length, "runs", runs, "rejected", rejected);
const pf = "tests/null-reasons-pending.json";
if (existsSync(pf)) {
  const pending: string[] = JSON.parse(readFileSync(pf, "utf8"));
  console.log("pending entries", pending.length, "unique", new Set(pending).size, "schemas", new Set(pending.map((k) => k.split(" ")[0])).size,
    "sorted", JSON.stringify([...pending].sort()) === JSON.stringify(pending));
  console.log(" pending not in my miss set:", pending.filter((k) => !missAll.has(k)).length, " my miss not pending:", [...missAll].filter((k) => !pending.includes(k)).length);
}
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(rows.map(({ href, run, out, warnings, reason, allNull }) => ({ href, run, out, warnings, reason, allNull })), null, 0));
