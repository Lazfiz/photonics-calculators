// Initial JS per prerendered page, after `npm run build`: node scripts/initial-js.mjs
// gzip -9 of the <script src> chunks in each .next/server/app/**/*.html; noModule polyfills are skipped (modern
// browsers never load them). Prints the chunks shared by every page and the pages with the most JS of their own.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const gz = new Map();
const size = (s) => {
  if (!gz.has(s)) gz.set(s, gzipSync(readFileSync(`.next/${s}`), { level: 9 }).length);
  return gz.get(s);
};
const pages = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".html")) pages.push(p);
  }
};
walk(".next/server/app");
const counts = new Map();
const rows = pages.map((p) => {
  const html = readFileSync(p, "utf8");
  const srcs = [...new Set([...html.matchAll(/<script([^>]*)\ssrc="\/_next\/([^"?]+)"([^>]*)>/g)]
    .filter((m) => !/noModule/i.test(m[1] + m[3])).map((m) => m[2]))];
  srcs.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
  return { page: p.slice(17, -5).replaceAll("\\", "/"), srcs };
});
const shared = [...counts].filter(([, n]) => n === rows.length).map(([s]) => s);
const sharedKB = shared.reduce((a, s) => a + size(s), 0) / 1024;
for (const r of rows) {
  r.own = r.srcs.filter((s) => !shared.includes(s));
  r.ownKB = r.own.reduce((a, s) => a + size(s), 0) / 1024;
}
rows.sort((a, b) => b.ownKB - a.ownKB);
const med = rows[Math.floor(rows.length / 2)].ownKB;
console.log(`${rows.length} pages; shared ${shared.length} chunks ${sharedKB.toFixed(1)} KB gz; page-specific median ${med.toFixed(1)} KB, max ${rows[0].ownKB.toFixed(1)} KB`);
for (const r of rows.slice(0, 12)) {
  const big = r.own.map((s) => [s, size(s)]).sort((a, b) => b[1] - a[1])[0];
  console.log(`  ${r.ownKB.toFixed(1).padStart(5)} KB  ${r.page}  (largest ${big ? `${big[0].slice(14)} ${(big[1] / 1024).toFixed(1)} KB, on ${counts.get(big[0])} pages` : "-"})`);
}
