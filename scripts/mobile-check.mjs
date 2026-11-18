// Phone-width check (session 252, ROADMAP 10e): per page, horizontal overflow, text under 11 px (HTML, and SVG text
// scaled by its CTM), tap targets under 24 px, console errors, and a full-page PNG in OUT. Touch is emulated, so
// (hover: none) and (pointer: coarse) match. HERO=1 first runs the home-hero touch test: auto-cycle, first tap on a
// branch arms it ("Tap again to open"), second tap opens it. Its selector follows the phone card's classes.
// The off-screen spam honeypot (-left-[9999px]) always shows as one overflow offender and one small input: ignore it.
//
//   OUT=<dir> [PORT=9341] [W=375] [HERO=1] MSYS_NO_PATHCONV=1 node scripts/mobile-check.mjs <baseUrl> /path …
//
// OUT must be relative under Git Bash: MSYS_NO_PATHCONV leaves /c/… paths unconverted.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = Number(process.env.PORT ?? 9341);
const W = Number(process.env.W ?? 375);
const BASE = process.argv[2];
const OUT = process.env.OUT ?? ".";
const profile = mkdtempSync(join(tmpdir(), "mobile-check-"));
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
  } catch {}
  await sleep(200);
}
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
  } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    logs.push(`[${currentPage}] error: ${msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200)}`);
  } else if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    logs.push(`[${currentPage}] exception: ${(d.exception?.description ?? d.text).slice(0, 200)}`);
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
await send("Emulation.setDeviceMetricsOverride", { width: W, height: 812, deviceScaleFactor: 1, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Emulation.setUserAgentOverride", {
  userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
});

const PROBE = `(() => {
  const vw = window.innerWidth;
  const desc = (el) => {
    const cls = (el.getAttribute("class") || "").split(/\\s+/).slice(0, 4).join(".");
    const txt = (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40);
    return el.tagName.toLowerCase() + (cls ? "." + cls : "") + (txt ? ' "' + txt + '"' : "");
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox !== "visible") return true;
    }
    return false;
  };
  const all = [...document.body.querySelectorAll("*")];
  const over = [];
  for (const el of all) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) {
      if (el.parentElement && over.includes(el.parentElement)) continue;
      over.push(el);
    }
  }
  const small = [];
  for (const el of all) {
    if (!visible(el) || el.closest("[hidden]")) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    let px = parseFloat(getComputedStyle(el).fontSize);
    if (el instanceof SVGElement && el.getScreenCTM) {
      const m = el.getScreenCTM();
      if (m) px *= Math.hypot(m.a, m.b);
    }
    if (px < 10.95) small.push(px.toFixed(1) + "px " + desc(el));
  }
  const taps = [];
  for (const el of document.querySelectorAll("a[href], button, input, select, [role=button]")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (el.type === "range" || el.type === "hidden") continue;
    if (r.height < 24 || r.width < 24) taps.push(Math.round(r.width) + "x" + Math.round(r.height) + " " + desc(el));
  }
  return {
    docOverflow: document.documentElement.scrollWidth - vw,
    height: document.documentElement.scrollHeight,
    over: over.slice(0, 8).map((el) => Math.round(el.getBoundingClientRect().right) + " " + desc(el)),
    overCount: over.length,
    small: [...new Set(small)].slice(0, 10),
    smallCount: small.length,
    taps: taps.slice(0, 6),
    tapCount: taps.length,
  };
})()`;

if (process.env.HERO) {
  const card = `(() => { const el = [...document.querySelectorAll("div.md\\\\:hidden")].find((d) => d.className.includes("h-[5.75rem]")); return el ? el.textContent : "NO CARD"; })()`;
  const point = (vx, vy) => `(() => { const svg = document.querySelector("svg.hero-art"); const m = svg.getScreenCTM(); const p = new DOMPoint(${vx}, ${vy}).matrixTransform(m); return [p.x, p.y]; })()`;
  const tap = async ([x, y]) => {
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await sleep(60);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(800);
  };
  await send("Page.navigate", { url: BASE + "/" });
  await sleep(4000);
  console.log("hover:none", await evaluate("matchMedia(\"(hover: none)\").matches"), "pointer:coarse", await evaluate("matchMedia(\"(pointer: coarse)\").matches"));
  console.log("t=4s  card:", await evaluate(card));
  await sleep(3000);
  console.log("t=7s  card:", await evaluate(card));
  const xy = await evaluate(point(1250, 450));
  console.log("imaging point", xy.map(Math.round));
  await tap(xy);
  console.log("tap1  card:", await evaluate(card), "| path", await evaluate("location.pathname"));
  await sleep(3000);
  console.log("+3s   card:", await evaluate(card), "(cycle stopped: same card)");
  await tap(xy);
  await sleep(12000); // dev mode compiles /imaging on its first visit
  console.log("tap2  path", await evaluate("location.pathname"));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, "hero-after.png"), Buffer.from(shot.data, "base64"));
}

for (const href of process.argv.slice(3)) {
  currentPage = href;
  await send("Page.navigate", { url: BASE + href });
  await sleep(7000);
  const r = await evaluate(PROBE);
  console.log(`\n== ${href}  overflow=${r.docOverflow}px height=${r.height} offenders=${r.overCount} small=${r.smallCount} taps<24=${r.tapCount}`);
  for (const o of r.over) console.log("  OVER  " + o);
  for (const s of r.small) console.log("  SMALL " + s);
  for (const t of r.taps) console.log("  TAP   " + t);
  const h = Math.min(r.height, 6000);
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: W, height: h, scale: 1 },
  });
  const name = (href.replace(/^\//, "").replace(/[/?&=]/g, "_") || "home") + ".png";
  writeFileSync(join(OUT, name), Buffer.from(shot.data, "base64"));
}
console.log("\n" + (logs.length ? logs.join("\n") : "console: 0 errors"));
ws.close();
chrome.kill();
await sleep(500);
try { rmSync(profile, { recursive: true, force: true }); } catch {}
