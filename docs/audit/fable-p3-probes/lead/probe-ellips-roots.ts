// Lead probe 4: when does transparentFilmThickness return the wrong root? (follow-up to probe-films.ts)
// Run: npx tsx docs/audit/fable-p3-probes/lead/probe-ellips-roots.ts
import { filmPsiDelta, transparentFilmThickness, filmThicknessPeriod } from "../../../../src/physics/thin-film/ellipsometry";
import { createRng } from "../../../../src/physics/random";
const rng = createRng(7);
const U = (a: number, b: number) => a + (b - a) * rng();
let bad = 0, total = 0, badK0 = 0, totK0 = 0, badAbs = 0;
const ex: string[] = [];
for (let i = 0; i < 40000; i++) {
  const th = U(5, 85) * Math.PI / 180, wl = 632.8e-9, nf = U(1.2, 2.6);
  const k0 = rng() < 0.5;
  const sub = { n: U(1.3, 5), k: k0 ? 0 : 10 ** U(-3, 0.8) };
  if (Math.abs(nf - sub.n) < 0.05) continue;
  const period = filmThicknessPeriod(th, wl, nf), d = U(0.02, 0.97) * period;
  const a = filmPsiDelta(d, th, wl, nf, sub);
  const inv = transparentFilmThickness(a.psi, a.delta, th, wl, nf, sub);
  const wrong = Math.abs(inv.thickness - d) / period > 1e-6;
  total++; if (k0) totK0++;
  if (wrong) { bad++; if (k0) badK0++; else badAbs++;
    if (ex.length < 6) ex.push(`θ ${(th * 180 / Math.PI).toFixed(2)}° n_f ${nf.toFixed(3)} sub ${sub.n.toFixed(3)}−${sub.k.toFixed(4)}i d ${(d * 1e9).toFixed(2)} nm → ${(inv.thickness * 1e9).toFixed(2)} nm (period ${(period * 1e9).toFixed(1)}), |X| ${inv.absX.toFixed(9)}, Ψ ${(a.psi * 180 / Math.PI).toFixed(3)} Δ ${(a.delta * 180 / Math.PI).toFixed(3)}`);
  }
}
console.log(`wrong thickness: ${bad}/${total}; transparent substrate ${badK0}/${totK0}; absorbing ${badAbs}/${total - totK0}`);
console.log(ex.join("\n"));
// The page's own case: SiO2 on Si and on glass
for (const [nf, sub, d] of [[1.457, { n: 3.882, k: 0.019 }, 100e-9], [1.457, { n: 3.882, k: 0.019 }, 250e-9], [2.0, { n: 1.52, k: 0 }, 80e-9], [1.38, { n: 1.52, k: 0 }, 120e-9]] as const) {
  const th = 70 * Math.PI / 180, a = filmPsiDelta(d, th, 632.8e-9, nf, sub), inv = transparentFilmThickness(a.psi, a.delta, th, 632.8e-9, nf, sub);
  console.log(`n_f ${nf} on ${sub.n}−${sub.k}i, d ${(d * 1e9).toFixed(1)} nm → ${(inv.thickness * 1e9).toFixed(3)} nm (period ${(inv.period * 1e9).toFixed(2)} nm) |X| ${inv.absX.toFixed(9)}`);
}
// Which substrates give the wrong root? Bin by regime (n_s from 0.2).
{
  const bins: Record<string, [number, number]> = {};
  const r2 = createRng(11);
  const V = (a: number, b: number) => a + (b - a) * r2();
  let shown = 0;
  for (let i = 0; i < 40000; i++) {
    const th = V(5, 85) * Math.PI / 180, wl = 632.8e-9, nf = V(1.2, 2.6);
    const sub = { n: V(0.2, 1.3), k: r2() < 0.5 ? 0 : 10 ** V(-3, 0.8) };
    const period = filmThicknessPeriod(th, wl, nf), d = V(0.02, 0.97) * period;
    const a = filmPsiDelta(d, th, wl, nf, sub);
    const inv = transparentFilmThickness(a.psi, a.delta, th, wl, nf, sub);
    const key = sub.k === 0 ? (sub.n < Math.sin(th) ? "lossless, n_s < sin θ (total reflection at the substrate)" : "lossless, n_s > sin θ") : sub.k < 0.05 ? "k < 0.05" : "k ≥ 0.05";
    bins[key] ??= [0, 0];
    bins[key][1]++;
    if (Math.abs(inv.thickness - d) / period > 1e-6) {
      bins[key][0]++;
      if (shown++ < 3) console.log(`  e.g. θ ${(th * 180 / Math.PI).toFixed(1)}° n_f ${nf.toFixed(3)} sub ${sub.n.toFixed(3)}−${sub.k.toFixed(4)}i: d ${(d * 1e9).toFixed(1)} → ${(inv.thickness * 1e9).toFixed(1)} nm, |X| ${inv.absX.toFixed(6)}, Ψ ${(a.psi * 180 / Math.PI).toFixed(3)}°`);
    }
  }
  for (const [k, [b, t]] of Object.entries(bins)) console.log(`${k}: wrong ${b}/${t}`);
}
