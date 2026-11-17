// R3 generic scan over all schemas: defaults, ranges, checks, validation probes.
import { schemas } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
import { calculators, categories } from "../../../../src/registry";
import { buildOpenApi } from "../../../../src/registry/api";
import { buildChecksJson } from "../../../../src/registry/checks";
import { buildLlmsTxt } from "../../../../src/registry/llms";

const out: string[] = [];
const say = (s: string) => out.push(s);
let checkFail = 0, checkTotal = 0;
const unitIssues: string[] = [];
const expectFactor: Record<string, [string, number][]> = {
  nm: [["m", 1e-9]], "µm": [["m", 1e-6]], um: [["m", 1e-6]], mm: [["m", 1e-3]], cm: [["m", 1e-2]], km: [["m", 1e3]],
  mW: [["W", 1e-3]], kW: [["W", 1e3]], "µW": [["W", 1e-6]], ns: [["s", 1e-9]], ps: [["s", 1e-12]], fs: [["s", 1e-15]],
  "µs": [["s", 1e-6]], ms: [["s", 1e-3]], mrad: [["rad", 1e-3]], "µrad": [["rad", 1e-6]], "°": [["rad", Math.PI / 180]],
  deg: [["rad", Math.PI / 180]], GHz: [["Hz", 1e9]], MHz: [["Hz", 1e6]], THz: [["Hz", 1e12]], kHz: [["Hz", 1e3]],
  "cm⁻¹": [["m⁻¹", 100]], "W/cm²": [["W/m²", 1e4]], "J/cm²": [["J/m²", 1e4]], "mW/cm²": [["W/m²", 10]],
  "mJ/cm²": [["J/m²", 10]], "mJ": [["J", 1e-3]], "µJ": [["J", 1e-6]], nJ: [["J", 1e-9]], "Gbps": [["bit/s", 1e9]],
  "Mbps": [["bit/s", 1e6]], "dB/km": [["dB/m", 1e-3]], "ps/(nm·km)": [["s/m²", 1e-6]], "ps/nm/km": [["s/m²", 1e-6]],
};
function checkUnit(where: string, unit: string, toSI: number, siUnit: string) {
  const exp = expectFactor[unit];
  if (exp) {
    for (const [su, f] of exp) {
      if (siUnit === su && Math.abs(toSI / f - 1) > 1e-9) unitIssues.push(`${where}: ${unit}→${siUnit} toSI=${toSI} (expected ${f})`);
    }
  }
  if (unit === siUnit && unit !== "" && toSI !== 1) unitIssues.push(`${where}: same unit ${unit} but toSI=${toSI}`);
  if (unit === "" && siUnit === "" && toSI !== 1) unitIssues.push(`${where}: unitless toSI=${toSI}`);
  if (unit && !siUnit && toSI !== 1) unitIssues.push(`${where}: unit ${unit} no siUnit, toSI=${toSI}`);
}
const silent: Record<string, string[]> = {};
const note = (k: string, v: string) => ((silent[k] ??= []).push(v));
for (const s of schemas) {
  const h = s.href;
  for (const i of s.inputs) {
    checkUnit(`${h} in ${i.key}`, i.unit, i.toSI, i.siUnit);
    if (i.min > i.max) note("min>max", `${h} ${i.key}`);
    if (i.default < i.min || i.default > i.max) note("default out of range", `${h} ${i.key} ${i.default} [${i.min},${i.max}]`);
    if (!Number.isFinite(i.min) || !Number.isFinite(i.max)) note("non-finite bound", `${h} ${i.key} [${i.min},${i.max}]`);
  }
  for (const o of s.outputs) checkUnit(`${h} out ${o.key}`, o.unit, o.toSI, o.siUnit);
  for (const c of s.choices ?? []) if (!c.options.some((o) => o.value === c.default)) note("choice default not an option", `${h} ${c.key}`);
  // defaults
  const p = parseInputs(s, new URLSearchParams());
  if (!p.ok) { note("defaults rejected", `${h}: ${p.error}`); continue; }
  let r;
  try { r = runSchema(s, p.values); } catch (e) { note("defaults throw", `${h}: ${(e as Error).message}`); continue; }
  for (const [k, v] of Object.entries(r.outputs)) if (v === null && r.warnings.length === 0) note("null at defaults w/o warning", `${h} ${k}`);
  // each choice option
  for (const c of s.choices ?? []) for (const o of c.options) {
    const q = parseInputs(s, new URLSearchParams({ [c.key]: o.value }));
    if (!q.ok) { note("choice option rejected", `${h} ${c.key}=${o.value}: ${q.error}`); continue; }
    try {
      const rr = runSchema(s, q.values);
      const nulls = Object.entries(rr.outputs).filter(([, v]) => v === null).map(([k]) => k);
      if (nulls.length && rr.warnings.length === 0) note("choice null w/o warning", `${h} ${c.key}=${o.value}: ${nulls.join(",")}`);
    } catch (e) { note("choice throws", `${h} ${c.key}=${o.value}: ${(e as Error).message}`); }
  }
  // extremes: each input at min and max alone
  for (const i of s.inputs) for (const v of [i.min, i.max]) {
    const q = parseInputs(s, new URLSearchParams({ [i.key]: String(v) }));
    if (!q.ok) continue;
    try {
      const rr = runSchema(s, q.values);
      const nulls = Object.entries(rr.outputs).filter(([, x]) => x === null).map(([k]) => k);
      if (nulls.length && rr.warnings.length === 0) note("edge null w/o warning", `${h} ${i.key}=${v}: ${nulls.join(",")}`);
    } catch (e) { note("edge throws (500)", `${h} ${i.key}=${v}: ${(e as Error).message.slice(0, 80)}`); }
  }
  // checks
  for (const c of s.checks) {
    checkTotal++;
    const params = new URLSearchParams(Object.entries(c.inputs).map(([k, v]) => [k, String(v)]));
    const q = parseInputs(s, params);
    if (!q.ok) { checkFail++; note("check rejected", `${h}: ${q.error}`); continue; }
    const rr = runSchema(s, q.values);
    for (const [k, e] of Object.entries(c.expect)) {
      const got = rr.outputs[k];
      const rel = got === null ? Infinity : Math.abs((got - (e as number)) / ((e as number) || 1));
      if (!(rel <= c.tolerance)) { checkFail++; note("check fails", `${h} ${k}: got ${got} expect ${e}`); }
    }
  }
  // validation probes on first numeric input
  const i0 = s.inputs[0];
  if (i0) {
    const probes: [string, string][] = [["below", String(i0.min - Math.abs(i0.min || 1))], ["above", String(i0.max + Math.abs(i0.max || 1))],
      ["NaN", "NaN"], ["Inf", "Infinity"], ["empty", ""], ["text", "abc"], ["units", "633nm"], ["hex", "0x10"], ["space", " 1 "]];
    for (const [name, val] of probes) {
      const q = parseInputs(s, new URLSearchParams({ [i0.key]: val }));
      if (q.ok && ["below", "above", "NaN", "Inf", "empty", "text", "units"].includes(name)) note(`probe ${name} accepted`, `${h} ${i0.key}=${val}`);
      if (q.ok && name === "hex") note("hex accepted", `${h}`);
    }
  }
}
say(`schemas ${schemas.length}, checks ${checkTotal}, failing ${checkFail}`);
for (const [k, v] of Object.entries(silent)) say(`${k} (${v.length}): ${v.slice(0, 40).join(" | ")}`);
say(`unit issues (${unitIssues.length}): ${unitIssues.filter((u) => !u.includes("unit % no siUnit")).slice(0, 60).join(" | ")}`);
// counts / descriptions
const oa = buildOpenApi();
const paths = Object.keys(oa.paths);
const hrefs = new Set(schemas.map((s) => "/api/v1" + s.href));
say(`openapi paths ${paths.length}, schema hrefs ${hrefs.size}, missing ${paths.filter((p) => !hrefs.has(p)).length}/${[...hrefs].filter((p) => !paths.includes(p)).length}`);
const dupHref = schemas.length - new Set(schemas.map((s) => s.href)).size;
say(`duplicate schema hrefs ${dupHref}`);
const ops = Object.values(oa.paths).map((p: any) => p.get.operationId);
say(`dup operationIds ${ops.length - new Set(ops).size}`);
const byCat: Record<string, number> = {};
for (const s of schemas) byCat[s.href.split("/")[1]] = (byCat[s.href.split("/")[1]] ?? 0) + 1;
say(`schemas by category ${JSON.stringify(byCat)}`);
const listed = calculators.filter((c) => !c.hidden);
say(`calculators ${calculators.length}, listed ${listed.length}, categories ${categories.length}`);
const llms = buildLlmsTxt();
say(`llms.txt bytes ${llms.length}; numbers: ${(llms.match(/\b\d{2,4}\b(?= (free|calculators|runnable|categories))/g) ?? []).join(",")}`);
say(`llms hosts: ${[...new Set(llms.match(/https?:\/\/[^/\s)]+/g) ?? [])].join(",")}`);
const oaStr = JSON.stringify(oa);
say(`openapi bytes ${oaStr.length}; hosts: ${[...new Set(oaStr.match(/https?:\/\/[^/\s)"]+/g) ?? [])].join(",")}`);
const cj = buildChecksJson() as any;
say(`checks.json keys ${Object.keys(cj).join(",")}; ${JSON.stringify(cj).slice(0, 300)}`);
console.log(out.join("\n"));
