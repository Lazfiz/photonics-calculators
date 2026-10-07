// Headless-Chrome UI check over the DevTools protocol (Node 24's global WebSocket; no deps).
// Covers useURLState, ValidatedNumberInput, InputSlider and CalculatorShell (share button,
// breadcrumb) on three calculators, and reports console errors (hydration mismatches,
// exceptions). Use it when the Chrome extension isn't connected.
//
//   npm run dev                                   # in another shell
//   node scripts/ui-check.mjs [baseUrl]           # default http://localhost:3000
//   node scripts/ui-check.mjs <baseUrl> load /a /b  # only load pages and report console errors
//
// Set CHROME to the browser binary if it isn't at the default Windows path. Each run uses a fresh
// profile. A warm profile can expose 1-ulp SSR/client differences in chart paths (see ROADMAP).
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
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

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}

// React attaches fibers to DOM nodes while hydrating; then wait for an idle period.
const hydrated = `document.readyState === "complete" && [...document.querySelectorAll("input")].some((el) => Object.keys(el).some((k) => k.startsWith("__reactFiber")))`;
async function waitHydrated(label) {
  for (let i = 0; i < 300; i++) {
    await sleep(200);
    if (await evaluate(hydrated).catch(() => false)) {
      return evaluate("new Promise((r) => setTimeout(() => requestIdleCallback(() => r(true), { timeout: 5000 }), 1000))");
    }
  }
  throw new Error(`not hydrated: ${label}`);
}
async function open(path) {
  currentPage = path;
  await send("Page.navigate", { url: BASE + path });
  await waitHydrated(path);
}
async function waitForPath(path) {
  for (let i = 0; i < 100 && (await evaluate("location.pathname")) !== path; i++) await sleep(200);
  currentPage = path;
}

const byLabel = (text) =>
  `[...document.querySelectorAll("label")].find((l) => l.querySelector("input") && l.textContent.includes(${JSON.stringify(text)})).querySelector("input")`;
const byAria = (text) => `document.querySelector('input[aria-label=${JSON.stringify(text)}]')`;
const field = (sel) =>
  evaluate(`(() => { const el = ${sel}; const p = el.closest("label")?.querySelector("p"); return { value: el.value, invalid: el.getAttribute("aria-invalid"), warning: p ? p.textContent : null }; })()`);
const shareShown = `[...document.querySelectorAll("button")].some((b) => b.title === "Copy URL with current settings")`;
const param = (key) => evaluate(`new URLSearchParams(location.search).get(${JSON.stringify(key)})`);

async function key(keyName, code, vk, extra = {}) {
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: keyName, code, windowsVirtualKeyCode: vk, ...extra });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code, windowsVirtualKeyCode: vk, modifiers: extra.modifiers ?? 0 });
}
/** Focuses the field, clears it and types `text` one character at a time. */
async function typeInto(sel, text) {
  await evaluate(`(${sel}).focus()`);
  await key("a", "KeyA", 65, { modifiers: 2, commands: ["selectAll"] });
  await key("Backspace", "Backspace", 8);
  for (const ch of text) {
    await send("Input.insertText", { text: ch });
    await sleep(40);
  }
  await sleep(300); // > the 100 ms URL write debounce
}
async function blur() {
  await evaluate("document.activeElement.blur()");
  await sleep(300);
}
async function pressEnter() {
  await key("Enter", "Enter", 13);
  await sleep(300);
}

try {
  if (process.argv[3] === "load") {
    for (const path of process.argv.slice(4)) {
      await open(path);
      await sleep(2000);
    }
  } else {
    // 1. ValidatedNumberInput with min=10: typing "50" must not become 10.
    await open("/detectors/boxcar-integrator");
    const pw = byLabel("Pulse Width (ns)");
    check("boxcar: default", (await field(pw)).value, "500");
    check("share: hidden without params", await evaluate(shareShown), false);
    await typeInto(pw, "50");
    check("boxcar: typed 50 stays 50", await field(pw), { value: "50", invalid: "false", warning: null });
    check("share: shown once a param is set", await evaluate(shareShown), true);
    check("boxcar: URL pulseWidth=50", await param("pulseWidth"), "50");
    await typeInto(pw, "5");
    check("boxcar: 5 held back with warning", await field(pw), { value: "5", invalid: "true", warning: "Min: 10" });
    check("boxcar: URL keeps 50 while out of range", await param("pulseWidth"), "50");
    await pressEnter();
    check("boxcar: Enter clamps to 10", (await field(pw)).value, "10");
    check("boxcar: URL pulseWidth=10", await param("pulseWidth"), "10");
    await typeInto(pw, "500");
    check("boxcar: reset to default removes param", await evaluate("location.search"), "");
    await typeInto(pw, "");
    check("boxcar: empty shows warning", (await field(pw)).warning, "Enter a valid number");
    await blur();
    check("boxcar: blur on empty reverts", await field(pw), { value: "500", invalid: "false", warning: null });

    // 2. Client-side navigation away and back keeps the page's URL state.
    await typeInto(pw, "42");
    await blur();
    await evaluate(`document.querySelector('a[href="/detectors"]').click()`);
    await waitForPath("/detectors");
    await sleep(1500);
    check("nav: /detectors has a clean query", await evaluate("location.search"), "");
    await evaluate("history.back()");
    await waitForPath("/detectors/boxcar-integrator");
    await waitHydrated("back");
    check("nav: back restores pulseWidth=42", (await field(pw)).value, "42");
    check("nav: URL still pulseWidth=42", await param("pulseWidth"), "42");

    // 3. A shared link applies after hydration; a reset removes the stale param, keeps others.
    await open("/free-space-comms/ber?photons=50&utm_source=test");
    const ph = byLabel("Detected Signal Photons");
    check("ber: URL value applied", (await field(ph)).value, "50");
    await typeInto(ph, "0.5");
    check("ber: typing 0.5 through '0' works", await field(ph), { value: "0.5", invalid: "false", warning: null });
    check("ber: URL photons=0.5", await param("photons"), "0.5");
    await typeInto(ph, "100");
    check("ber: reset removes photons, keeps utm", await evaluate("location.search"), "?utm_source=test");
    check("ber: shell renders the title", await evaluate(`document.querySelector("h1")?.textContent`), "Photon-Counting BER (OOK and DPSK)");

    // 3b. One label per number input, naming the value it's bound to. A bulk edit once left a
    // caption <label> beside each input, shifted the input labels by a row, and wrote "{label}".
    const valueLabelled = (text) =>
      evaluate(`(() => { const l = [...document.querySelectorAll("label")].find((l) => l.querySelector("input") && l.querySelector("span")?.textContent === ${JSON.stringify(text)}); return l ? l.querySelector("input").value : null; })()`);
    await open("/wave-optics/gas-laser-resonator");
    check("labels: 'Wavelength (nm)' holds the wavelength", await valueLabelled("Wavelength (nm)"), "632.8");
    check("labels: 'Tube Length (mm)' holds the length", await valueLabelled("Tube Length (mm)"), "500");
    check(
      "labels: no caption <label> before a number input's own label",
      await evaluate(`[...document.querySelectorAll("label")].filter((l) => !l.htmlFor && !l.querySelector("input, select, textarea") && l.nextElementSibling?.matches("label") && l.nextElementSibling.querySelector('input[type="number"]')).length`),
      0
    );
    await open("/fiber-optics/sbs-threshold");
    check("labels: no literal {label}", await evaluate(`document.body.innerText.includes("{label}")`), false);

    // 4. InputSlider: out-of-range typing never reaches onChange; clamp on blur.
    await open("/detectors/quantum-efficiency");
    const ff = byAria("Fill factor exact value");
    const ffShown = `[...document.querySelectorAll("label")].find((l) => l.textContent === "Fill factor").parentElement.querySelector("span").textContent`;
    const before = await evaluate(ffShown);
    await typeInto(ff, "0");
    check("slider: 0 held back (aria-invalid)", (await field(ff)).invalid, "true");
    check("slider: physics value unchanged", await evaluate(ffShown), before);
    await blur();
    check("slider: blur clamps to 0.1", (await field(ff)).value, "0.1");
    check("slider: shown value 0.1", await evaluate(ffShown), "0.1");
    const pwl = byAria("Probe wavelength exact value");
    await typeInto(pwl, "1550");
    check("slider: URL probeWavelength=1550", await param("probeWavelength"), "1550");
    const range = `document.getElementById([...document.querySelectorAll("label")].find((l) => l.textContent === "Probe wavelength").htmlFor)`;
    check("slider: range follows typed value", await evaluate(`${range}.value`), "1550");
    await evaluate(`(() => { const s = ${range}; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(s, "850"); s.dispatchEvent(new Event("input", { bubbles: true })); })()`);
    await sleep(300);
    check("slider: drag to default removes param", await param("probeWavelength"), null);
    check("slider: exact field follows drag", (await field(pwl)).value, "850");

    // 5. CalculatorShell: a shared link hydrates without a mismatch; the breadcrumb ends at the page.
    const shared = "/detectors/boxcar-integrator?pulseWidth=42";
    await open(shared);
    check("share: shown on a shared link", await evaluate(shareShown), true);
    check("share: no console errors on a shared link", logs.filter((l) => l.startsWith(`[${shared}]`)).length, 0);
    check(
      "breadcrumb: links, then the current page",
      await evaluate(`(() => { const nav = document.querySelector('nav[aria-label="Breadcrumb"]'); return { links: [...nav.querySelectorAll("a")].map((a) => a.textContent), current: nav.querySelector('[aria-current="page"]')?.textContent === document.querySelector("h1").textContent, stray: nav.querySelectorAll("ol > :not(li)").length }; })()`),
      { links: ["Home", "Detectors"], current: true, stray: 0 }
    );
  }
} catch (e) {
  failures++;
  console.log(`ERROR ${e.message}`);
} finally {
  console.log(`console errors/warnings: ${logs.length}`);
  for (const l of logs.slice(0, 8)) {
    const lines = l.split("\n");
    console.log(`  ${lines[0].slice(0, 160)}`);
    const diff = lines.filter((x) => /^\s*[+-]\s+\S+=/.test(x));
    for (const d of diff.slice(0, 6)) console.log(`    ${d.trim().slice(0, 160)}`);
  }
  console.log(failures ? `${failures} FAILED` : "ALL PASS");
  ws.close();
  chrome.kill();
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // Chrome may still hold files; the OS temp dir cleans up eventually
  }
  process.exit(failures ? 1 : 0);
}
