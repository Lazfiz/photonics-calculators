// Lead probe 3: ellipsometry (two conventions against each other, inversion round trip), quarter-wave stack closed
// forms against the transfer matrix, TIR retardance against Fresnel coefficients.
// Run: npx tsx docs/audit/fable-p3-probes/lead/probe-films.ts
import { filmPsiDelta, transparentFilmThickness, pseudoOpticalConstants, filmThicknessPeriod } from "../../../../src/physics/thin-film/ellipsometry";
import { stackResponse, reflectionGroupDelay, quarterWaveLayers, quarterWaveStackReflectance } from "../../../../src/physics/thin-film/transfer-matrix";
import { stopBandEdges, quarterWaveMirrorDelay, quarterWaveMirrorIndices, quarterWavePairsForReflectance, reflectionBandEdges } from "../../../../src/physics/thin-film/quarter-wave-stack";
import { fresnel, phaseDifference } from "../../../../src/physics/polarization/fresnel";
import { tirPhaseDifference, tirMaxPhase } from "../../../../src/physics/polarization/retarders";
import { createRng } from "../../../../src/physics/random";

const rng = createRng(7);
const U = (a: number, b: number) => a + (b - a) * rng();
const worst: Record<string, number> = {};
const track = (k: string, v: number) => { worst[k] = Math.max(worst[k] ?? 0, Number.isFinite(v) ? v : Infinity); };
const wrap = (x: number) => Math.abs(Math.atan2(Math.sin(x), Math.cos(x)));

// SiO2 on Si, 633 nm, 70°: textbook Ψ, Δ for 100 nm (ROADMAP quotes 41.055°, 79.787° for n 1.457, Si 3.882 − 0.019i)
const pd = filmPsiDelta(100e-9, (70 * Math.PI) / 180, 632.8e-9, 1.457, { n: 3.882, k: 0.019 });
console.log(`SiO2 100 nm on Si, 70°, 632.8 nm: Ψ ${(pd.psi * 180 / Math.PI).toFixed(3)}° Δ ${(pd.delta * 180 / Math.PI).toFixed(3)}°`);

for (let i = 0; i < 4000; i++) {
  const th = U(5, 85) * Math.PI / 180, wl = U(300e-9, 1700e-9), nf = U(1.2, 2.6), sub = { n: U(0.2, 5), k: rng() < 0.3 ? 0 : 10 ** U(-3, 0.8) };
  const period = filmThicknessPeriod(th, wl, nf);
  const d = U(0.02, 0.97) * period;
  const a = filmPsiDelta(d, th, wl, nf, sub);
  // Same system through the transfer matrix (e^{-iωt}, r_p = r_s at normal incidence): ρ_TMM = −conj(ρ_Nebraska)
  const st = { incident: 1, layers: [{ n: nf, thickness: d }], substrate: sub };
  const rs = stackResponse(st, wl, th, "s").r, rp = stackResponse(st, wl, th, "p").r;
  const den = rs.re * rs.re + rs.im * rs.im;
  const rho = { re: (rp.re * rs.re + rp.im * rs.im) / den, im: (rp.im * rs.re - rp.re * rs.im) / den };
  track("ellipsometry Ψ vs TMM", Math.abs(Math.atan(Math.hypot(rho.re, rho.im)) - a.psi));
  track("ellipsometry Δ vs TMM (Δ = π − arg ρ_TMM)", wrap(Math.PI - Math.atan2(rho.im, rho.re) - a.delta));
  const inv = transparentFilmThickness(a.psi, a.delta, th, wl, nf, sub);
  if (Math.abs(nf - sub.n) > 0.05 || sub.k > 0.05) {
    track("inversion |d_back − d|/period", Math.abs(inv.thickness - d) / period);
    track("inversion ||X| − 1|", Math.abs(inv.absX - 1));
  }
  // bare substrate: pseudo constants must return the substrate
  const b = filmPsiDelta(0, th, wl, nf, sub);
  const p = pseudoOpticalConstants(b.psi, b.delta, th);
  track("pseudo n vs substrate (rel)", Math.abs(p.n - sub.n) / sub.n);
  track("pseudo k vs substrate (abs)", Math.abs(p.k - sub.k));
}
// Quarter-wave stacks
for (let i = 0; i < 300; i++) {
  const nH = U(1.8, 2.6), nL = U(1.3, 1.6), n0 = U(1, 1.5), ns = U(1.4, 1.8), N = 2 + Math.floor(U(0, 9)), l0 = 800e-9;
  for (const outer of ["high", "low"] as const) {
    const idx = quarterWaveMirrorIndices(outer, N, nH, nL);
    const st = { incident: n0, layers: quarterWaveLayers(idx, l0), substrate: { n: ns } };
    track("QW closed-form R vs TMM", Math.abs(quarterWaveStackReflectance(n0, idx, ns) - stackResponse(st, l0).R));
  }
  const pairs = quarterWavePairsForReflectance(0.999, nH, nL, n0, ns);
  const HL = (k: number) => Array.from({ length: 2 * k }, (_, j) => (j % 2 === 0 ? nH : nL));
  const Rn = quarterWaveStackReflectance(n0, HL(pairs), ns), Rm = pairs > 0 ? quarterWaveStackReflectance(n0, HL(pairs - 1), ns) : 0;
  if (!(Rn >= 0.999 && (pairs === 0 || Rm < 0.999))) track("pairs-for-R not minimal", 1);
}
{
  const nH = 2.35, nL = 1.46, l0 = 1064e-9, n0 = 1, ns = 1.5;
  for (const outer of ["high", "low"] as const) {
    const st = { incident: n0, layers: quarterWaveLayers(quarterWaveMirrorIndices(outer, 30, nH, nL), l0), substrate: { n: ns } };
    const gd = reflectionGroupDelay(st, l0);
    console.log(`QW mirror delay (${outer} outer, 30 pairs): TMM ${(gd.groupDelay * 1e15).toFixed(5)} fs, closed form ${(quarterWaveMirrorDelay(l0, nH, nL, n0, outer) * 1e15).toFixed(5)} fs, GDD ${(gd.gdd * 1e30).toExponential(2)} fs²`);
  }
  const st = { incident: n0, layers: quarterWaveLayers(quarterWaveMirrorIndices("high", 60, nH, nL), l0), substrate: { n: ns } };
  const e = stopBandEdges(l0, nH, nL), b = reflectionBandEdges(st, l0, 0.5, 0.9);
  console.log(`stop band edges: closed form ${(e.short * 1e9).toFixed(2)}–${(e.long * 1e9).toFixed(2)} nm; 60-pair 50 % points ${(b.short * 1e9).toFixed(2)}–${(b.long * 1e9).toFixed(2)} nm`);
}
// TIR retardance vs Fresnel coefficients (Goldstein convention module)
for (let i = 0; i < 2000; i++) {
  const n = U(1.3, 2.5), thc = Math.asin(1 / n), th = U(thc + 1e-4, Math.PI / 2 - 1e-4);
  const f = fresnel(n, 1, th);
  track("TIR δ: retarders.ts vs |arg(rp/rs)| from fresnel.ts", wrap(Math.abs(phaseDifference(f.rp, f.rs)) - tirPhaseDifference(n, th)));
  track("TIR |r| − 1", Math.max(Math.abs(f.Rs - 1), Math.abs(f.Rp - 1)));
}
{
  const n = 1.5151, m = tirMaxPhase(n);
  let best = 0;
  for (let t = Math.asin(1 / n) + 1e-6; t < Math.PI / 2; t += 1e-5) best = Math.max(best, tirPhaseDifference(n, t));
  console.log(`TIR max δ n=1.5151: closed form ${(m.delta * 180 / Math.PI).toFixed(4)}° scan ${(best * 180 / Math.PI).toFixed(4)}°`);
  const f = fresnel(1.5, 1, 0.9);
  console.log("sign of arg(rp/rs) in TIR (Goldstein module):", phaseDifference(f.rp, f.rs).toFixed(4), "rad; normal incidence rp/rs:", fresnel(1, 1.5, 0).rp.re.toFixed(3), fresnel(1, 1.5, 0).rs.re.toFixed(3));
}
console.log(Object.entries(worst).map(([k, v]) => `${k.padEnd(52)} ${v.toExponential(2)}`).join("\n"));
