// Added 2026-11-17 for the #289 fix (verification M9/W4): probe-scan.ts's references at the new default beam, √5 mm at
// the eye (2 mm at the scanner, 1 mrad, 1 m). Run on fix/fable-review-laser-safety 8b3efe4. Output: probe-scan-sqrt5.out.txt.
// Reference, by hand and brute force (no call into src/physics for the reference):
//   ICNIRP 2013 Table 5: 400–700 nm, 18 µs… wait: 5 µs ≤ t < 10 s: 18 C_E t^0.75 J/m² through 7 mm (C_E = 1 at α ≤ 1.5 mrad);
//   1500–1800 nm: 1e4 J/m² for 1 ns–10 s through 1 mm (t < 0.35 s), 1.5 t^0.375 mm (to 10 s) (Table 8).
//   p. 287 rule 1 (single pass), rule 2 (any group of n passes within the limit for the time it spans).  Rule 3 (C_P) is
//   not reproduced here: at 1550 nm it does not exist (thermal retinal only) and at 532 nm, T ≤ 0.25 s, the repo takes C_P = 1.
//   Pass model as documented on the page: Gaussian beam (1/e² diameter d) crossing the aperture centre at v;
//   pass duration = FWHM of the power through the aperture, pass energy = P·L/v.  η(x) by 2-D midpoint quadrature.
import { schemas } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
function eta(d: number, D: number, x: number, n = 400): number { // fraction of the beam through the aperture, axis at x
  const R = D / 2, h = D / n; let s = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u = -R + (i + 0.5) * h, w = -R + (j + 0.5) * h;
    if (u * u + w * w > R * R) continue;
    s += Math.exp((-8 * ((u - x) ** 2 + w * w)) / (d * d));
  }
  return (s * h * h * 8) / (Math.PI * d * d);
}
function pass(d: number, D: number) {
  const peak = eta(d, D, 0);
  let lo = 0, hi = D / 2 + 3 * d;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (eta(d, D, m) > peak / 2) lo = m; else hi = m; }
  const W = 2 * lo;
  // L = ∫η dx = ∫_aperture (line-integrated profile) = ∫ 2√(R²−y²)·g(y) dy, g = normalised 1-D Gaussian, σ = d/4
  const R = D / 2, n = 200000; let L = 0;
  for (let i = 0; i < n; i++) { const y = -R + ((i + 0.5) * D) / n; L += 2 * Math.sqrt(R * R - y * y) * Math.exp((-8 * y * y) / (d * d)) * Math.sqrt(8 / Math.PI) / d * (D / n); }
  return { W, L };
}
const A = (D: number) => (Math.PI * D * D) / 4;
function ref532(d: number) { // 532 nm, 30°, 100 Hz both ways, 1 m, 0.25 s
  const v = 2 * (30 * Math.PI / 180) * 100 * 1, f = 200, T = 0.25;
  const { W, L } = pass(d, 7e-3); const tau = W / v;
  const G = (t: number) => 18 * Math.pow(t, 0.75) * A(7e-3) * v / L;
  let p = G(tau), rule = 1; const N = Math.floor((T - tau) * f + 1e-9) + 1;
  for (let n = 2; n <= N; n++) { const q = G(tau + (n - 1) / f) / n; if (q < p) { p = q; rule = 2; } }
  return { mW: p * 1e3, rule, tau_us: tau * 1e6, N, L_mm: L * 1e3 };
}
function ref1550(d: number) { // 1550 nm, same scan, 10 s; valid only for 1/e diameter d/√2 ≥ 1 mm (no note-c peak rule)
  const v = 2 * (30 * Math.PI / 180) * 100 * 1, f = 200, T = 10;
  const Dat = (t: number) => (t < 0.35 ? 1e-3 : t < 10 ? 1.5e-3 * Math.pow(t, 0.375) : 3.5e-3);
  const cache = new Map<number, { W: number; L: number }>();
  const ps = (D: number) => { if (!cache.has(D)) cache.set(D, pass(d, D)); return cache.get(D)!; };
  const tau = ps(1e-3).W / v;
  // L(D) for the growing aperture: interpolate on a grid of D (smooth), exact at 1 mm and 3.5 mm
  const grid = Array.from({ length: 51 }, (_, i) => 1e-3 + (2.5e-3 * i) / 50); const Ls = grid.map((D) => ps(D).L);
  const Lof = (D: number) => { const u = (D - 1e-3) / 2.5e-3 * 50; const i = Math.min(49, Math.floor(u)); return Ls[i] + (Ls[i + 1] - Ls[i]) * (u - i); };
  const G = (t: number) => { const D = Dat(Math.min(t, 10)); return 1e4 * A(D) * v / Lof(D); };
  let p = G(tau), rule = 1, nb = 1; const N = Math.floor((T - tau) * f + 1e-9) + 1;
  for (let n = 2; n <= N; n++) { const q = G(tau + (n - 1) / f) / n; if (q < p) { p = q; rule = 2; nb = n; } }
  return { mW: p * 1e3, rule, nb, N, tau_us: tau * 1e6 };
}
const s = schemas.find((x) => x.href === "/laser-safety/scanning-mpe")!;
const run = (q: Record<string, string | number>) => {
  const p = parseInputs(s, new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])));
  if (!p.ok) throw new Error(p.error);
  return runSchema(s, p.values);
};
const o = (q: Record<string, string | number>) => { const r = run(q).outputs; return `scanned ${r.maxPowerScanned} mW rule ${r.bindingRule} pass ${r.passDuration} µs n ${r.passes} still ${r.maxPowerStationary}`; };
// knife edge: default beam at the eye has 1/e diameter √2/√2 = 1 mm exactly, where Table 5 note c (< 1 mm) switches
console.log("REF 532 nm d=√5 mm:", JSON.stringify(ref532(Math.sqrt(5) * 1e-3)));
console.log("REF 1550 nm d=√5 mm:", JSON.stringify(ref1550(Math.sqrt(5) * 1e-3)));
console.log("CODE defaults:", o({}));
console.log("CODE 1550:", o({ wavelength: 1550 }));
