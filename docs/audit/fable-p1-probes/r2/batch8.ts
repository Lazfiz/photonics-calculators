import * as MI from "../../../../src/physics/fiber-optics/microbend";
import * as MB from "../../../../src/physics/fiber-optics/macro-bending-loss";
import * as CD from "../../../../src/physics/fiber-optics/chromatic-dispersion";
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(40)} mine=${mine.toPrecision(6)} code=${code.toPrecision(6)} ratio=${(code / mine).toFixed(4)}`);
const f = { a: 4.1e-6, n1: 1.4494, NA: 0.1246 }, lam = 1550e-9, k = 2 * Math.PI / lam;
const m = MB.lp01Mode(MB.vNumber(f, lam)); const n2 = Math.sqrt(f.n1 ** 2 - f.NA ** 2);
const beta = Math.sqrt((f.n1 * k) ** 2 - (m.U / f.a) ** 2); const delta = beta - k * n2;
cmp("delta = beta - k n2", delta, MI.claddingMismatch(f, lam));
cmp("critical period 2pi/delta", 2 * Math.PI / delta, MI.criticalPeriod(f, lam));
const w = MB.modeFieldRadius(f, lam);
for (const P of [0.5e-3, 1e-3, 2e-3]) {
  const nu = 2 * Math.PI / P, C = 20e-9 * nu * nu, s = nu - delta, kn = k * n2;
  const aG = s > 0 ? Math.PI / 8 * kn ** 4 * w ** 6 * C * C * s * Math.exp(-kn * w * w * s) : 0;
  cmp(`gaussian microbend P=${P * 1e3}mm (own derivation)`, aG, MI.gaussianMicrobendLoss(f, lam, 20e-9, P));
  console.log("   exact-field/gaussian ratio", MI.sinusoidalMicrobendLoss(f, lam, 20e-9, P) / MI.gaussianMicrobendLoss(f, lam, 20e-9, P), " dB/m exact", 4.343 * MI.sinusoidalMicrobendLoss(f, lam, 20e-9, P));
}
for (const k2 of ["G652", "G653", "NZDSF_PLUS", "NZDSF_MINUS", "DCF", "G654"]) { try { console.log(k2, (CD.presetDispersion(k2 as any, 1550e-9) * 1e6).toFixed(3), "ps/nm/km @1550"); } catch (e) { console.log(k2, "n/a"); } }
