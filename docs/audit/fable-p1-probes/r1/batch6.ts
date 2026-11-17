// R1 batch 6: photodiode-speed diffusion corner, si-vs-ingaas photodiodeSnr, responsivity inverse.
import * as rc from "../../../../src/physics/detectors/photodiode-rc";
import * as nz from "../../../../src/physics/detectors/noise";
import * as rs from "../../../../src/physics/detectors/responsivity";
import { siliconAbsorption } from "../../../../src/physics/materials/silicon-absorption";
const q = 1.602176634e-19;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(44)} mine=${mine.toPrecision(6).padStart(12)} code=${String(Number(code.toPrecision(6))).padStart(12)} ratio=${(code / mine).toFixed(5)}`);
const a = siliconAbsorption(850e-9), W = 11.9 * 8.8541878188e-12 / 1e-5, L = 35e-6, D = 36e-4, tau = L * L / D;
const Hmag = (f: number) => { // my own complex arithmetic
  const w = 2 * Math.PI * f * tau, r = Math.hypot(1, w), sr = Math.sqrt((r + 1) / 2), si = Math.sqrt((r - 1) / 2); // sqrt(1+iw)
  const aL = a * L, e = Math.exp(-a * W);
  // e*aL/(aL+s): denominator (aL+sr) + i si
  const dr = aL + sr, den = dr * dr + si * si, re = e * aL * dr / den, im = -e * aL * si / den;
  const tot = 1 - e / (1 + aL);
  return Math.hypot((1 - e + re) / tot, im / tot);
};
cmp("speed drift fraction", (1 - Math.exp(-a * W)) / (1 - Math.exp(-a * W) / (1 + a * L)), rc.driftFraction(a, W, L));
let lo = 1, hi = 1e10; for (let i = 0; i < 200; i++) { const m = Math.sqrt(lo * hi); if (Hmag(m) > Math.SQRT1_2) lo = m; else hi = m; }
console.log("speed: |H| floor (drift share)", rc.driftFraction(a, W, L).toFixed(4), " my -3dB", Hmag(1e12) > Math.SQRT1_2 ? "never (drift share > .707)" : lo.toPrecision(5));
cmp("speed diffusion -3dB (if any)", lo, rc.diffusionBandwidth(a, W, L, D));
const a2 = siliconAbsorption(950e-9); const Hm2 = (f: number) => { const w = 2 * Math.PI * f * tau, r = Math.hypot(1, w), sr = Math.sqrt((r + 1) / 2), si = Math.sqrt((r - 1) / 2), aL = a2 * L, e = Math.exp(-a2 * W), dr = aL + sr, den = dr * dr + si * si; const tot = 1 - e / (1 + aL); return Math.hypot((1 - e + e * aL * dr / den) / tot, (-e * aL * si / den) / tot); };
lo = 1; hi = 1e12; for (let i = 0; i < 200; i++) { const m = Math.sqrt(lo * hi); if (Hm2(m) > Math.SQRT1_2) lo = m; else hi = m; }
cmp("speed diffusion -3dB @950nm", lo, rc.diffusionBandwidth(a2, W, L, D));
// si-vs-ingaas: photodiodeSnr(signal, dark, ampNoise, B)
const Is = 1e-7 * 0.8, Id = 1e-9, ia = 1e-12, B = 1e6;
cmp("photodiodeSnr (power ratio?)", Is / Math.sqrt(2 * q * (Is + Id) * B + ia * ia * B), nz.photodiodeSnr(Is, Id, ia, B));
cmp("responsivity inverse QE(0.6 A/W, 900nm)", 0.6 * 1239.841984 / 900, rs.quantumEfficiencyFromResponsivity(0.6, 900e-9));
