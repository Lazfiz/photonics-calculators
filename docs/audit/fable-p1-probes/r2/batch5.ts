import * as CM from "../../../../src/physics/fiber-optics/coupled-mode";
import * as MB from "../../../../src/physics/fiber-optics/macro-bending-loss";
import * as NL from "../../../../src/physics/fiber-optics/fiber-nonlinear";
import * as DG from "../../../../src/physics/fiber-optics/doped-fiber-gain";
const c = 299792458, h = 6.62607015e-34;
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(40)} mine=${mine.toPrecision(6)} code=${code.toPrecision(6)} ratio=${(code / mine).toFixed(4)}`);
const quad = (f: (t: number) => number, a: number, b: number, n = 6000) => { let s = 0; const hh = (b - a) / n; for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(a + i * hh); return s * hh / 3; };
const K = (n: number, x: number) => quad((t) => Math.exp(-x * Math.cosh(t)) * Math.cosh(n * t), 0, 12);
// fiber-coupler defaults: a 4.1, NA .125, n1 1.4494, d 12 um, 1550
const f = { a: 4.1e-6, n1: 1.4494, NA: 0.125 }, lam = 1550e-9;
const m = MB.lp01Mode(MB.vNumber(f, lam)); const D = f.NA ** 2 / (2 * f.n1 ** 2);
const kapSL = Math.sqrt(2 * D) / f.a * m.U ** 2 * K(0, m.W * 12e-6 / f.a) / (m.V ** 3 * K(1, m.W) ** 2);
cmp("coupler kappa (Snyder-Love) d=12um", kapSL, CM.couplingCoefficient(f, lam, 12e-6));
cmp("  d=20um", Math.sqrt(2 * D) / f.a * m.U ** 2 * K(0, m.W * 20e-6 / f.a) / (m.V ** 3 * K(1, m.W) ** 2), CM.couplingCoefficient(f, lam, 20e-6));
console.log("coupler: kappa*L(1.4mm) =", kapSL * 1.4e-3, " sin^2 =", Math.sin(kapSL * 1.4e-3) ** 2);
// multi-core: a 4.5, n 1.468/1.463, pitch 45, R 100 mm
const fm = { a: 4.5e-6, n1: 1.468, NA: Math.sqrt(1.468 ** 2 - 1.463 ** 2) }; const mm = MB.lp01Mode(MB.vNumber(fm, lam)); const Dm = fm.NA ** 2 / (2 * fm.n1 ** 2);
const km = Math.sqrt(2 * Dm) / fm.a * mm.U ** 2 * K(0, mm.W * 45e-6 / fm.a) / (mm.V ** 3 * K(1, mm.W) ** 2);
cmp("MCF kappa pitch 45", km, CM.couplingCoefficient(fm, lam, 45e-6));
const beta = 2 * Math.PI / lam * 1.465;
cmp("Hayashi h=2k^2R/(beta Lambda)", 2 * km * km * 0.1 / (beta * 45e-6), CM.hayashiPowerCoupling(km, beta, 45e-6, 0.1));
cmp("pair XT tanh(hL)", Math.tanh(1e-6 * 1e4), CM.pairCrosstalk(1e-6, 1e4));
cmp("critical R = beta Lambda/dbeta", beta * 45e-6 / 100, CM.criticalBendRadius(beta, 45e-6, 100));
// Raman on-off gain
cmp("Raman on-off G=exp(gR P Leff/(K Aeff))", Math.exp(6.5e-14 * 0.5 * 8013.66 / (2 * 80e-12)), NL.ramanOnOffGain(6.5e-14, 0.5, 8013.66, 80e-12, 2));
// amplifier: own two-level, co-pumped, ASE-free, Euler-RK4 integration
const N = 1e24, A = Math.PI * (2.2e-6) ** 2, tau = 10.2e-3;
const beams = [{ l: 980e-9, G: 0.8, sa: 1.7e-25, se: 0, P: 0.2 }, { l: 1550e-9, G: 0.8, sa: 2.2e-25, se: 3.0e-25, P: 1e-4 }];
const deriv = (P: number[]) => { let num = 0, den = 1 / tau; beams.forEach((b, i) => { const ph = b.G * P[i] / (h * c / b.l * A); num += b.sa * ph; den += (b.sa + b.se) * ph; }); const n2 = num / den; return beams.map((b, i) => b.G * N * (b.se * n2 - b.sa * (1 - n2)) * P[i]); };
let P = beams.map((b) => b.P); const steps = 4000, dz = 10 / steps;
for (let s = 0; s < steps; s++) { const k1 = deriv(P), k2 = deriv(P.map((p, i) => p + dz / 2 * k1[i])), k3 = deriv(P.map((p, i) => p + dz / 2 * k2[i])), k4 = deriv(P.map((p, i) => p + dz * k3[i])); P = P.map((p, i) => p + dz / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); }
const r = DG.amplifierSummary({ length: 10, pumpPower: 0.2, signalDbm: -10, N, coreRadius: 2.2e-6, overlapPump: 0.8, overlapSignal: 0.8, pumpLambda: 980e-9, signalLambda: 1550e-9, sigmaAPump: 1.7e-25, sigmaEPump: 0, sigmaASignal: 2.2e-25, sigmaESignal: 3e-25, tau } as any) as any;
cmp("amp gain dB (own RK4)", 10 * Math.log10(P[1] / 1e-4), r.gainDb);
console.log("amp summary", JSON.stringify(r, (k, v) => Array.isArray(v) ? undefined : v).slice(0, 600));
