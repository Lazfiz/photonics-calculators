// After a merge: wait for Vercel's status on the merge commit, check that each page's prerendered HTML holds its
// default values, then load the pages in headless Chrome (ui-check). Prints a short summary; exit 1 on any failure.
//   node scripts/post-merge-check.mjs <merge sha> polarization/wire-grid=23.9 polarization/glans-prism=5.61 laser-safety/nohd
// Give pages without a leading slash, so Git Bash doesn't turn them into Windows paths. An argument without "=" is only
// loaded. Repeat a page to check several values. BASE overrides the production URL.
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE ?? "https://photonics-calculators.vercel.app";
const [sha, ...specs] = process.argv.slice(2);
if (!sha || specs.length === 0) {
  console.error("Usage: node scripts/post-merge-check.mjs <sha> <category/slug>[=<value>] …");
  process.exit(2);
}

// Undo Git Bash's path conversion if a page was given with a leading slash.
const pagePath = (p) => "/" + p.replace(/^[A-Za-z]:[\\/].*?[\\/]Git(?=[\\/])/, "").replace(/^[\\/]+/, "");
const expected = new Map();
for (const spec of specs) {
  const [page, value] = spec.split("=");
  const path = pagePath(page);
  if (!expected.has(path)) expected.set(path, []);
  if (value) expected.get(path).push(value);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let state = "pending";
for (let i = 0; i < 80 && state === "pending"; i++) {
  if (i > 0) await sleep(15000);
  state = execFileSync("gh", ["api", `repos/{owner}/{repo}/commits/${sha}/status`, "--jq", ".state"], {
    encoding: "utf8",
  }).trim();
}
console.log(`Vercel status on ${sha.slice(0, 8)}: ${state}`);
if (state !== "success") process.exit(1);

let failures = 0;
for (const [path, values] of expected) {
  if (values.length === 0) continue;
  const html = await (await fetch(BASE + path)).text();
  const text = html.replace(/<[^>]*>/g, " ");
  const missing = values.filter((v) => !html.includes(v) && !text.includes(v));
  const found = values.filter((v) => !missing.includes(v));
  failures += missing.length;
  const parts = [found.length ? `ok ${found.join(", ")}` : "", missing.length ? `MISSING ${missing.join(", ")}` : ""];
  console.log(`${path}: ${parts.filter(Boolean).join("; ")}`);
}

try {
  const out = execFileSync("node", ["scripts/ui-check.mjs", BASE, "load", ...expected.keys()], { encoding: "utf8" });
  console.log(out.trim().split("\n").slice(-4).join("\n"));
} catch (error) {
  failures++;
  console.log(String(error.stdout ?? error.message).trim().split("\n").slice(-8).join("\n"));
}
process.exit(failures ? 1 : 0);
