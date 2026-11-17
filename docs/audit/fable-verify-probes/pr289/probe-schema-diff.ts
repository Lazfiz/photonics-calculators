// PR #289 regression sweep.  Run on BOTH origin/main (0cdf269) and the PR head (0199310) (or the trial merge), redirect
// each to a file and diff them.  Every laser-safety schema at its defaults and with each input at min and max (one at a
// time), each choice at every option.  Output: one line per run, `href | query | outputs | warnings` (errors too).
// No reference: this is a before/after comparison.
import { schemas } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
const fmt = (v: unknown) => (typeof v === "number" ? (Number.isFinite(v) ? Number(v.toPrecision(10)) : String(v)) : v);
for (const s of schemas.filter((x) => x.href.startsWith("/laser-safety/") || x.href.includes("eye-safety"))) {
  const cases: Record<string, string | number>[] = [{}];
  for (const i of s.inputs) { cases.push({ [i.key]: i.min }, { [i.key]: i.max }); }
  for (const c of s.choices ?? []) for (const o of c.options) cases.push({ [c.key]: o.value });
  for (const q of cases) {
    const p = parseInputs(s, new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])));
    let out: string;
    if (!p.ok) out = `ERROR ${p.error}`;
    else {
      try { const r = runSchema(s, p.values) as unknown as { outputs?: Record<string, unknown>; warnings?: string[]; error?: string };
        out = JSON.stringify(Object.fromEntries(Object.entries(r.outputs ?? {}).map(([k, v]) => [k, fmt(v)]))) + " | " + JSON.stringify(r.warnings ?? r.error ?? []); }
      catch (e) { out = `THROW ${(e as Error).message}`; }
    }
    console.log(`${s.href} | ${JSON.stringify(q)} | ${out}`);
  }
}
