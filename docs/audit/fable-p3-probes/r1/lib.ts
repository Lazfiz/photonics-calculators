import { runSchema } from "../../../../src/schemas/run";
export function run(slug: string, over: Record<string, number | string> = {}) {
  const s = require(`../../../../src/schemas/wave-optics/${slug}`).default;
  const vals: Record<string, number | string> = {};
  for (const c of s.choices ?? []) vals[c.key] = c.default;
  for (const i of s.inputs) vals[i.key] = i.default;
  Object.assign(vals, over);
  return runSchema(s, vals);
}
export function cmp(tag: string, mine: number, mod: number | null | undefined) {
  const rel = mod == null ? NaN : Math.abs(mine - mod) / Math.max(Math.abs(mine), 1e-300);
  console.log(`${rel > 1e-3 || !Number.isFinite(rel) ? "!!" : "ok"} ${tag}: mine=${mine.toPrecision(6)} mod=${mod == null ? mod : (+mod).toPrecision(6)} rel=${rel.toExponential(1)}`);
}
export function show(tag: string, r: any, keys?: string[]) {
  const o = keys ? Object.fromEntries(keys.map((k) => [k, r.outputs[k]])) : r.outputs;
  console.log(tag, JSON.stringify(o, (_k, v) => (typeof v === "number" ? +v.toPrecision(5) : v)), r.warnings.map((w: string) => w.slice(0, 70)));
}
