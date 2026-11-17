// PR #292 verify probe. Run on BOTH trees and diff the two files: npx tsx docs/audit/fable-verify-probes/pr292/allruns.ts out.json
// Every run of the sweep (defaults, each input at min and max, each choice option): outputs, warnings, reasons.
import { writeFileSync } from "node:fs";
import { schemas } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
const out: Record<string, unknown> = {};
for (const s of schemas) {
  const cases: Record<string, number | string>[] = [{}];
  for (const i of s.inputs) cases.push({ [i.key]: i.min }, { [i.key]: i.max });
  for (const c of s.choices ?? []) for (const o of c.options) cases.push({ [c.key]: o.value });
  for (const c of cases) {
    const p = parseInputs(s, new URLSearchParams(Object.entries(c).map(([k, v]) => [k, String(v)])));
    const key = `${s.href} ${JSON.stringify(c)}`;
    if (!p.ok) { out[key] = { error: p.error }; continue; }
    const r = runSchema(s, p.values) as unknown as { outputs: unknown; warnings: string[]; reasons?: unknown };
    out[key] = { outputs: r.outputs, warnings: r.warnings, reasons: r.reasons ?? {} };
  }
}
writeFileSync(process.argv[2], JSON.stringify(out));
