import { readdirSync } from "node:fs";
import { run } from "./lib";
for (const f of readdirSync("src/schemas/wave-optics")) { const slug = f.replace(/\.ts$/, ""); const s = require(`../../../../src/schemas/wave-optics/${slug}`).default;
  const base = run(slug); const issues: string[] = [];
  const cases: Record<string, number | string>[] = [];
  for (const i of s.inputs) { cases.push({ [i.key]: i.min }, { [i.key]: i.max }); }
  for (const c of s.choices ?? []) for (const o of c.options) cases.push({ [c.key]: o.value });
  for (const ov of cases) { let r; try { r = run(slug, ov); } catch (e: any) { issues.push(`${JSON.stringify(ov)} THROW ${String(e.message).slice(0, 60)}`); continue; }
    for (const [k, v] of Object.entries(r.outputs)) { const b = base.outputs[k] as number | null;
      if (v !== null && !Number.isFinite(v as number)) issues.push(`${JSON.stringify(ov)} ${k}=${v}`);
      else if (v !== null && b !== null && b > 0 && (v as number) < 0 && !/edge|detun|residual|shift|phase|lower|upper|position|gdd|delay/i.test(k)) issues.push(`${JSON.stringify(ov)} ${k}=${(v as number).toPrecision(3)}<0 (no warn=${r.warnings.length === 0})`); } }
  if (issues.length) console.log(`## ${slug}: ` + issues.slice(0, 6).join(" | ") + (issues.length > 6 ? ` (+${issues.length - 6})` : "")); }
