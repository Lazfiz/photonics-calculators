// photonics-calculators: src/app/lattice/mcp/route.ts, the Lattice MCP endpoint (lattice-sim docs/mcp-route.md).
// The server itself is the vendored bundle in vendor/lattice-mcp (built by lattice-sim apps/mcp/build.mjs): it is
// loaded at run time, not bundled by Next, so its worker threads and the .wasm next to it stay where they are.
// This file only supplies what belongs to the site: the client address and the report sender (source "lattice-mcp").
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { clientIp } from "../../../lib/report";
import { sendReport } from "../../../lib/report-send";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type Handler = (request: Request) => Promise<Response>;
interface LatticeReport { tool: string; message: string; arguments: string; permalink: string; contact: string }
interface LatticeMcp {
  createLatticeMcpHandler(opts: {
    clientIp?: (request: Request) => string;
    sendReport?: (report: LatticeReport, meta: { origin: string; ip: string }) => Promise<{ ok: boolean }>;
  }): Handler;
}

/** Where the bundle lives: vendor/lattice-mcp, traced into the function by outputFileTracingIncludes. */
const DIR = process.env.LATTICE_MCP_DIR ?? join(process.cwd(), "vendor", "lattice-mcp");

let handler: Promise<Handler> | null = null;

function lattice(): Promise<Handler> {
  handler ??= (import(/* webpackIgnore: true */ /* turbopackIgnore: true */ pathToFileURL(join(DIR, "lattice-mcp.mjs")).href) as Promise<LatticeMcp>)
    .then((m) => m.createLatticeMcpHandler({
      clientIp,
      sendReport: async (r, meta) => {
        const query = r.permalink.includes("?") ? r.permalink.slice(r.permalink.indexOf("?") + 1) : "";
        const message = [
          `Lattice MCP, tool ${r.tool}:`,
          r.message,
          r.arguments ? `\nArguments: ${r.arguments}` : "",
          r.permalink ? `Permalink: ${r.permalink}` : "",
        ].filter(Boolean).join("\n");
        const sent = await sendReport({ href: "/lattice/mcp", query, message, contact: r.contact }, meta.origin, "lattice-mcp");
        return { ok: sent.ok };
      },
    }));
  return handler;
}

const serve = async (request: Request) => (await lattice())(request);

/** JSON-RPC over POST; GET and DELETE answer 405 and OPTIONS the CORS preflight, from the same handler. */
export const POST = serve;
export const GET = serve;
export const DELETE = serve;
export const OPTIONS = serve;
