// Captures what a calculator page shows, as text: inputs as ⟦value⟧, results, formulas, model note and references
// (charts, nav and the report form are dropped). The blind audit (docs/audit/9b-blind-audit.md) recomputes pages from
// these captures before anyone reads the code. CDP plumbing as in scripts/ui-check.mjs.
//
//   OUT=<dir> [PORT=9333] MSYS_NO_PATHCONV=1 node scripts/page-capture.mjs <baseUrl> /<cat>/<slug>[?key=value&…] …
//
// Writes one <cat>__<slug>[_query].txt per page into OUT. Use a different PORT per parallel run.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = Number(process.env.PORT ?? 9333);
const BASE = process.argv[2] ?? "http://localhost:3000";
const profile = mkdtempSync(join(tmpdir(), "ui-check-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "about:blank",
], { stdio: "ignore" });

let targets = [];
for (let i = 0; i < 75; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    if (targets.some((t) => t.type === "page")) break;
  } catch {
    // Chrome not listening yet
  }
  await sleep(200);
}
// Newer Chrome builds start `--headless=new` without a page target: open one.
if (!targets.some((t) => t.type === "page")) {
  await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" });
  targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
}
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let nextId = 0;
const waiting = new Map();
const logs = [];
let currentPage = "";
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && waiting.has(msg.id)) {
    const { resolve, reject } = waiting.get(msg.id);
    waiting.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  } else if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    const text = msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
    logs.push(`[${currentPage}] ${msg.params.type}: ${text}`);
  } else if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    logs.push(`[${currentPage}] exception: ${d.exception?.description ?? d.text}`);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    waiting.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};
await send("Runtime.enable");
await send("Page.enable");

const OUT = process.env.OUT ?? ".";
for (const href of process.argv.slice(3)) {
  currentPage = href;
  await send("Page.navigate", { url: BASE + href });
  await sleep(6000);
  const text = await evaluate(`(() => {
    const main = document.querySelector("main") ?? document.body;
    for (const el of main.querySelectorAll("input, select, textarea")) {
      if (el.type === "hidden" || el.type === "range" || el.closest("#report")) continue;
      const value = el.tagName === "SELECT" ? el.options[el.selectedIndex]?.text
        : el.type === "checkbox" || el.type === "radio" ? (el.checked ? "checked" : "unchecked") : el.value;
      const span = document.createElement("span");
      span.textContent = " ⟦" + value + "⟧ ";
      el.after(span);
    }
    for (const el of main.querySelectorAll("svg, .js-plotly-plot, #report, nav")) el.remove();
    return main.innerText;
  })()`);
  // Keep at most one blank line in a row.
  const lines = text.split("\n").filter((line, i, all) => line.trim() || (all[i - 1] ?? "").trim());
  const file = href.slice(1).replace("/", "__").replace(/[^A-Za-z0-9_.=-]+/g, "_");
  writeFileSync(join(OUT, `${file}.txt`), lines.join("\n"));
  console.log(href, text.length);
}
if (logs.length) console.log(logs.slice(0, 10).join("\n"));
ws.close();
chrome.kill();
await sleep(500);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  // Chrome may still hold the profile
}
process.exit(0);
