import { schemas } from "../../../../src/schemas/index";
import { runSchema, parseInputs } from "../../../../src/schemas/run";
const cat = process.argv[2]; const only = process.argv[3];
for (const s of schemas as any[]) {
  const href: string = s.href ?? s.slug ?? "";
  if (!href.includes(`/${cat}/`)) continue;
  if (only && !only.split(",").some((o) => href.endsWith("/" + o))) continue;
  const p = parseInputs(s, new URLSearchParams(process.argv[4] ?? ""));
  if (!p.ok) { console.log(href, p.error); continue; }
  const r = runSchema(s, p.values);
  const fmt = (o: any) => Object.entries(o).map(([k, v]) => `${k}=${typeof v === "number" ? +v.toPrecision(6) : v}`).join(" ");
  console.log(`## ${href.split("/").pop()} | IN ${fmt(r.inputs)}\n   OUT ${fmt(r.outputs)}${r.warnings.length ? " | W " + r.warnings.join(";").slice(0, 120) : ""}`);
}
