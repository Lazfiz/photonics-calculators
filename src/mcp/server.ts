// A stateless Model Context Protocol server over streamable HTTP (https://modelcontextprotocol.io/specification):
// each POST to /mcp carries JSON-RPC messages and gets a plain JSON answer, with no session and no SSE stream.
// It offers tools only. Server-side only.
import { SITE_URL } from "../lib/site";
import { schemas } from "../schemas";
import { tools, type ToolContext } from "./tools";

/** Newest first; an initialize request that asks for another version gets the newest. */
export const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"] as const;

export const SERVER_INFO = {
  name: "photonics-calculators",
  title: "Photonics Calculators",
  version: "1.0.0",
  websiteUrl: SITE_URL,
};

const INSTRUCTIONS =
  "Optics and photonics calculators from photonicscalculators.com. find_calculator finds a page by topic; for the " +
  `${schemas.length} runnable ones it lists the inputs (page units, ranges, defaults). run_calculator computes with ` +
  "your inputs and returns the model tier, the model's assumptions and its references; get_checks shows the published " +
  "cases each model was checked against. Please verify results that matter against those references or your own " +
  "calculation, and report a disagreement with report_problem.";

type Id = string | number | null;

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: Id;
  result?: unknown;
  error?: { code: number; message: string };
}

export const ERROR = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
} as const;

export const rpcError = (id: Id, code: number, message: string): JsonRpcResponse =>
  ({ jsonrpc: "2.0", id, error: { code, message } });

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

async function callTool(params: Record<string, unknown>, ctx: ToolContext) {
  const tool = tools.find((t) => t.name === params.name);
  if (!tool) return undefined;
  const args = params.arguments ?? {};
  if (!isObject(args)) return { content: [{ type: "text", text: "arguments must be an object." }], isError: true };
  try {
    const result = await tool.call(args, ctx);
    if (!result.ok) return { content: [{ type: "text", text: result.error }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }], structuredContent: result.data };
  } catch (err) {
    console.error(`mcp: ${tool.name} failed`, err);
    return { content: [{ type: "text", text: `${tool.name} failed on the server; please report it.` }], isError: true };
  }
}

/**
 * Answers one JSON-RPC message. Notifications, and responses from the client (this server sends no requests), get
 * null: nothing to send back.
 */
export async function handleMessage(message: unknown, ctx: ToolContext): Promise<JsonRpcResponse | null> {
  if (!isObject(message) || message.jsonrpc !== "2.0") {
    return rpcError(null, ERROR.invalidRequest, "Not a JSON-RPC 2.0 message.");
  }
  if (typeof message.method !== "string") return null;
  if (!("id" in message)) return null;
  const id = message.id;
  if (typeof id !== "string" && typeof id !== "number") {
    return rpcError(null, ERROR.invalidRequest, "A request id must be a string or a number.");
  }
  const params = message.params ?? {};
  if (!isObject(params)) return rpcError(id, ERROR.invalidParams, "params must be an object.");

  switch (message.method) {
    case "initialize": {
      const asked = params.protocolVersion;
      const protocolVersion = PROTOCOL_VERSIONS.find((v) => v === asked) ?? PROTOCOL_VERSIONS[0];
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        },
      };
    }
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: tools.map(({ name, title, description, inputSchema, annotations }) =>
            ({ name, title, description, inputSchema, annotations })),
        },
      };
    case "tools/call": {
      const result = await callTool(params, ctx);
      return result
        ? { jsonrpc: "2.0", id, result }
        : rpcError(id, ERROR.invalidParams, `Unknown tool "${String(params.name)}". Tools: ${tools.map((t) => t.name).join(", ")}.`);
    }
    default:
      return rpcError(id, ERROR.methodNotFound, `Method "${message.method}" is not supported; this server offers tools only.`);
  }
}
