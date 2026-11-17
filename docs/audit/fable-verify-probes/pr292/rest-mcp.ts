// PR #292 verify probe. Run on the PR head (on main, `reason` is simply absent).
// Reference: PR claim "REST/MCP output carries `reason` next to a null value; OpenAPI documents it".
import { NextRequest } from "next/server";
import { GET } from "../../../../src/app/api/v1/[category]/[slug]/route";
import { POST } from "../../../../src/app/mcp/route";
import { buildOpenApi } from "../../../../src/registry/api";

const cases: [string, string][] = [
  ["/imaging/tirf", "theta=0"], ["/imaging/tirf", ""],
  ["/spectroscopy/fluorescence-lifetime", ""], ["/spectroscopy/fluorescence-lifetime", "tauRad=0.001"],
  ["/free-space-comms/background-noise", "filterT=0"], ["/spectroscopy/fluorescence-lifetime", "model=bi"], ["/spectroscopy/fluorescence-lifetime", "model=bi&tauRad=0.001"], ["/free-space-comms/background-noise", ""],
  ["/thin-film/environmental-stability", ""], ["/thin-film/environmental-stability", "nuH=0&nuL=0"], ["/thin-film/environmental-stability", "nuH=0.6"],
];
(async () => {
  for (const [href, qs] of cases) {
    const [, category, slug] = href.split("/");
    const res = await GET(new NextRequest(`https://x.test/api/v1${href}?${qs}`), { params: Promise.resolve({ category, slug }) });
    const body = await res.json();
    console.log(`REST ${href}?${qs} -> ${res.status}`, body.error ?? "");
    if (body.outputs) {
      for (const [k, o] of Object.entries(body.outputs as Record<string, { value: number | null; reason?: string }>))
        if (o.value === null || o.reason) console.log("   ", k, o.value, "reason:", o.reason);
      console.log("    warnings:", JSON.stringify(body.warnings));
      if (href.endsWith("stability")) console.log("    shiftHot", body.outputs.shiftHot?.value, "shiftBoth", body.outputs.shiftBoth?.value, "shiftWet", body.outputs.shiftWet?.value);
    }
  }
  const rpc = async (method: string, params: unknown) => (await (await POST(new Request("https://x.test/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }))).json());
  const list = await rpc("tools/list", {});
  const tools = list.result.tools as { name: string; inputSchema: unknown; outputSchema?: unknown }[];
  console.log("MCP tools:", tools.map((t) => t.name).join(", "));
  for (const t of tools) console.log("  ", t.name, "mentions reason:", JSON.stringify(t).includes("reason"));
  const runTool = tools.find((t) => t.name === "run_calculator")!;
  console.log("run tool schema:", JSON.stringify(runTool.inputSchema).slice(0, 400));
  for (const args of [{ slug: "/imaging/tirf", inputs: { theta: 0 } }, { slug: "imaging/tirf", inputs: { theta: 0 } }]) {
    const r = await rpc("tools/call", { name: runTool.name, arguments: args });
    const sc = r.result?.structuredContent;
    console.log("MCP call", JSON.stringify(args), "isError", r.result?.isError, sc?.outputs ? JSON.stringify(sc.outputs.depth) : JSON.stringify(r).slice(0, 300));
    if (sc?.outputs) { console.log("   criticalAngle", JSON.stringify(sc.outputs.criticalAngle), "text has reason:", r.result.content[0].text.includes('"reason"')); break; }
  }
  const api = (buildOpenApi as (o: string) => { components: { schemas: Record<string, unknown> } })("https://x.test");
  console.log("OpenAPI Quantity:", JSON.stringify(api.components.schemas.Quantity));
})();
