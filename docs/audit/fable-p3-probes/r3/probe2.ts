import { NextRequest } from "next/server";
import { GET } from "../../../../src/app/api/v1/[category]/[slug]/route";
import { POST, OPTIONS, GET as MGET } from "../../../../src/app/mcp/route";
import { buildChecksJson } from "../../../../src/registry/checks";
import { buildOpenApi } from "../../../../src/registry/api";

async function api(path: string, qs: string, ip = "1.1.1.1") {
  const req = new NextRequest(`https://photonicscalculators.com/api/v1/${path}?${qs}`, { headers: { "x-forwarded-for": ip } });
  const [category, slug] = path.split("/");
  const res = await GET(req, { params: Promise.resolve({ category, slug }) });
  const t = await res.text();
  return `${res.status} ${t.slice(0, 260)}`;
}
const out = (s: string) => console.log(s.replace(/\s+/g, " ").slice(0, 420));
async function mcpPost(body: unknown, ip = "2.2.2.2", headers: Record<string, string> = {}) {
  const res = await POST(new Request("https://photonicscalculators.com/mcp", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": ip, ...headers } }));
  return { status: res.status, text: await res.text() };
}
(async () => {
  out("dupkey " + await api("wave-optics/gaussian-beam", "wavelength=633&wavelength=1064"));
  out("exp " + await api("wave-optics/gaussian-beam", "waist=1e1"));
  out("units " + await api("wave-optics/gaussian-beam", "wavelength=633nm"));
  out("hex " + await api("wave-optics/gaussian-beam", "waist=0x10"));
  out("unknown " + await api("wave-optics/gaussian-beam", "foo=1"));
  out("badchoice " + await api("laser-safety/nohd", "beamGrowth=parabolic"));
  out("404 " + await api("detectors/photodiode", ""));
  out("bigdiv " + await api("wave-optics/gaussian-beam", "wavelength=11000&waist=1"));
  out("glp div0 " + await api("laser-safety/green-laser-pointer", "divergence=0"));
  out("ufast div0 " + await api("laser-safety/ultrafast-laser-safety", "divergence=0"));
  out("specCal pitch100 " + await api("spectroscopy/spectral-calibration", "pixelPitch=100"));
  out("expdur P1e12 " + await api("laser-safety/exposure-duration", "power=1000000000000"));
  out("class 180 " + await api("laser-safety/classification", "wavelength=180"));
  out("coldmirror pairs1 " + await api("thin-film/cold-mirror", "pairs=1"));
  out("antifog -25 " + await api("thin-film/anti-fog", "waterTemp=-25"));
  // rate limit
  let last = "";
  for (let i = 0; i < 62; i++) last = await api("imaging/airy-disk", "", "7.7.7.7");
  out("62nd " + last);
  // MCP
  const init = await mcpPost({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
  out("init " + init.status + " " + init.text);
  const list = await mcpPost({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  const tl = JSON.parse(list.text).result.tools; out("tools " + tl.map((t: any) => t.name + ":" + Object.keys(t.inputSchema.properties).join("/")).join(" "));
  out("unknownTool " + (await mcpPost({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "nope" } })).text);
  out("unknownMethod " + (await mcpPost({ jsonrpc: "2.0", id: 4, method: "resources/list" })).text);
  out("notif " + (await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized" })).status);
  out("idNull " + (await mcpPost({ jsonrpc: "2.0", id: null, method: "ping" })).text);
  out("run NaN " + (await mcpPost({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "run_calculator", arguments: { slug: "imaging/airy-disk", inputs: { na: "NaN" } } } })).text);
  out("run bool " + (await mcpPost({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "run_calculator", arguments: { slug: "imaging/airy-disk", inputs: { na: true } } } })).text);
  out("run 1e-7 " + (await mcpPost({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "run_calculator", arguments: { slug: "wave-optics/gaussian-beam", inputs: { z: 1e-7 } } } })).text.slice(0, 120));
  out("run nonrunnable " + (await mcpPost({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "run_calculator", arguments: { slug: "detectors/photodiode-responsivity" } } })).text);
  out("badVersion " + JSON.stringify(await mcpPost({ jsonrpc: "2.0", id: 9, method: "ping" }, "2.2.2.2", { "mcp-protocol-version": "1999-01-01" })));
  // batch rate-limit bypass: 200 pings in one POST from a fresh IP
  const batch = Array.from({ length: 200 }, (_, i) => ({ jsonrpc: "2.0", id: i, method: "tools/call", params: { name: "run_calculator", arguments: { slug: "imaging/airy-disk" } } }));
  const b = await mcpPost(batch, "3.3.3.3");
  out(`batch200 status ${b.status} answers ${JSON.parse(b.text).length} bytes ${JSON.stringify(batch).length}`);
  const g = await MGET(); out("mcp GET " + g.status);
  const o = OPTIONS(); out("mcp OPTIONS " + o.status + " " + JSON.stringify(Object.fromEntries(o.headers)));
  // checks.json and openapi spot
  const cj: any = buildChecksJson();
  const n = cj.calculators.length; const cases = cj.calculators.reduce((a: number, c: any) => a + c.checks.length, 0);
  const bad = cj.calculators.flatMap((c: any) => c.checks.filter((k: any) => k.pass === false || k.passes === false).map(() => c.slug ?? c.href));
  out(`checks.json calculators ${n} cases ${cases} failing ${bad.length}; sample keys ${Object.keys(cj.calculators[0]).join(",")} / ${Object.keys(cj.calculators[0].checks[0]).join(",")}`);
  out("checks.json first apiUrl " + JSON.stringify(cj.calculators[0].checks[0]).slice(0, 300));
  const oa: any = buildOpenApi();
  const op = oa.paths["/api/v1/laser-safety/nohd"].get;
  out("openapi nohd params " + op.parameters.map((p: any) => `${p.name}:${JSON.stringify(p.schema)}`).join(" ").slice(0, 400));
  out("openapi responses " + Object.keys(op.responses).join(","));
})();
