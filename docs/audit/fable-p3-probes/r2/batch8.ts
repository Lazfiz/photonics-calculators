import { stack, qw, L } from "./tmm";
const nm = 1e-9;
function lp(l0: number, N: number, outer: "L" | "H"): L[] { const a = outer === "L" ? 1.45 : 2.35, b = outer === "L" ? 2.35 : 1.45; const out: L[] = [];
  for (let i = 0; i < N; i++) out.push(qw(a, l0 * nm, 0.5), qw(b, l0 * nm), qw(a, l0 * nm, 0.5)); return out; }
const st = lp(508.665, 10, "L");
console.log("LWP R at l0", (100 * stack(1, st, 1.52, 0, 508.665 * nm).R).toFixed(4), "(99.9832)");
let prev = 0; for (let l = 560; l < 700; l += 0.005) { const T = stack(1, st, 1.52, 0, l * nm).T; if (prev < 0.5 && T >= 0.5) { console.log("LWP first 50% T above band:", l.toFixed(3), "(609.375)"); break; } prev = T; }
for (const outer of ["L", "H"] as const) { const s = lp(508.665, 10, outer); let sum = 0, mn = 1, n = 0; for (let l = 640; l <= 1000; l += 1) { const T = stack(1, s, 1.52, 0, l * nm).T; sum += T; mn = Math.min(mn, T); n++; }
  let sumS = 0, mnS = 1, nS = 0; const s2 = lp(600 * (1 + 0.152225), 10, outer); for (let l = 400; l <= 560; l += 1) { const T = stack(1, s2, 1.52, 0, l * nm).T; sumS += T; mnS = Math.min(mnS, T); nS++; }
  console.log(`outer ${outer}/2: LWP pass 640-1000 mean T ${(100 * sum / n).toFixed(2)} min ${(100 * mn).toFixed(2)} | as SWP (edge 600) pass 400-560 mean ${(100 * sumS / nS).toFixed(2)} min ${(100 * mnS).toFixed(2)}`); }
