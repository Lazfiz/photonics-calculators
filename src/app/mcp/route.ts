import { clientIp, RateLimiter } from "../../lib/report";
import { ERROR, handleMessage, PROTOCOL_VERSIONS, rpcError, type JsonRpcResponse } from "../../mcp/server";

// 120 messages per IP per minute, per server instance; report_problem has its own, tighter limit.
const MESSAGES_PER_MINUTE = 120;
const limiter = new RateLimiter(MESSAGES_PER_MINUTE, 60 * 1000);

const MAX_BODY = 64 * 1024;

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: HEADERS });

const TOO_MANY = "Too many requests from this address; please try again in a minute.";

/** The answer to a batched message past the rate limit: an error for a request with an id, nothing for a notification. */
function overLimit(message: unknown): JsonRpcResponse | null {
  if (typeof message !== "object" || message === null || !("id" in message)) return null;
  const id = (message as { id: unknown }).id;
  if (typeof id !== "string" && typeof id !== "number") return null;
  return rpcError(id, ERROR.invalidRequest, `${TOO_MANY} This message was past the limit of ${MESSAGES_PER_MINUTE} messages per minute; the earlier messages of the batch were answered.`);
}

/**
 * The MCP endpoint (streamable HTTP, stateless): POST JSON-RPC, get JSON back. No session id and no SSE stream, so GET
 * answers 405 as the transport allows. Add it to Claude Code with `claude mcp add --transport http photonics <url>`.
 */
export async function POST(request: Request) {
  const version = request.headers.get("mcp-protocol-version");
  if (version && !(PROTOCOL_VERSIONS as readonly string[]).includes(version)) {
    return json(rpcError(null, ERROR.invalidRequest,
      `Unsupported MCP-Protocol-Version ${version}; supported: ${PROTOCOL_VERSIONS.join(", ")}.`), 400);
  }
  const ip = clientIp(request);
  if (!limiter.allow(ip)) {
    return json(rpcError(null, ERROR.invalidRequest, TOO_MANY), 429);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(rpcError(null, ERROR.invalidRequest, "The request is too large."), 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(rpcError(null, ERROR.parse, "The body isn't valid JSON."), 400);
  }

  const ctx = { ip, origin: new URL(request.url).origin };
  if (Array.isArray(body)) {
    // Batches (protocol 2025-03-26) still get an answer; newer clients send one message per request.
    if (body.length === 0) return json(rpcError(null, ERROR.invalidRequest, "An empty batch."), 400);
    // The limit counts messages, not POSTs: the request above paid for the first one. Messages within the limit are
    // answered; each request past it gets its own error (a notification past it is dropped), so a batch that crosses
    // the limit loses only its excess (verification 2026-11 M7).
    const allowed = body.map((_, i) => i === 0 || limiter.allow(ip));
    const answers = (await Promise.all(body.map((message, i) => (allowed[i] ? handleMessage(message, ctx) : overLimit(message)))))
      .filter((a) => a !== null);
    return answers.length > 0 ? json(answers) : new Response(null, { status: 202, headers: HEADERS });
  }
  const answer = await handleMessage(body, ctx);
  return answer ? json(answer) : new Response(null, { status: 202, headers: HEADERS });
}

const notAllowed = () =>
  new Response("This MCP server is stateless: POST JSON-RPC messages to it. There is no SSE stream or session.", {
    status: 405,
    headers: { ...HEADERS, Allow: "POST, OPTIONS" },
  });

export const GET = notAllowed;
export const DELETE = notAllowed;

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...HEADERS,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
      "Access-Control-Max-Age": "86400",
    },
  });
}
