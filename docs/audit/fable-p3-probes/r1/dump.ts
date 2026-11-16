import { readdirSync } from "node:fs";
import { runSchema } from "../../../../src/schemas/run";
const dir = "src/schemas/wave-optics";
const only = process.argv.slice(2);
(async () => { for (const f of readdirSync(dir)) {
  const slug = f.replace(/\.ts$/, "");
  if (only.length && !only.includes(slug)) continue;
  const s = (await import(`../../../../${dir}/${f}`)).default;
  const vals: Record<string, number|string> = {};
  for (const c of s.choices ?? []) vals[c.key] = c.default;
  for (const i of s.inputs) vals[i.key] = i.default;
  const r = runSchema(s, vals);
  console.log(`## ${slug} | ` + (s.choices??[]).map((c:any)=>`${c.key}=${c.default}[${c.options.map((o:any)=>o.value).join("/")}]`).join(" ") + " " + s.inputs.map((i:any)=>`${i.key}=${i.default}${i.unit}`).join(" "));
  console.log("   -> " + s.outputs.map((o:any)=>`${o.key}=${r.outputs[o.key]===null?"null":Number(r.outputs[o.key]).toPrecision(6)}${o.unit}`).join(" ") + (r.warnings.length?` W:${r.warnings.length}`:""));
}
})();
