// Lead probes, free-space comms: independent recomputation, then comparison with the modules.
import * as T from "../../../../src/physics/free-space-comms/turbulence";
import { decoyBb84 } from "../../../../src/physics/free-space-comms/qkd";
import { ookPhotonCountingBer, dpskPhotonCountingBer, requiredPhotonsPerBit } from "../../../../src/physics/free-space-comms/ber";
import { kleinDegnanEfficiency, optimumTruncation, truncatedGaussianWidth } from "../../../../src/physics/free-space-comms/link-budget";

const row = (name: string, mine: number, code: number) =>
  console.log(name.padEnd(46), mine.toExponential(6), code.toExponential(6), (code / mine).toFixed(6));

// 1. Scintillation index, plane wave, point receiver: A&P 2005 eq. (9.47)-like closed form, and asymptote 1 + 0.86 σ_R^(-4/5).
for (const s of [0.01, 0.3, 1, 4, 25, 400]) {
  const a = (0.49 * s) / (1 + 1.11 * s ** 1.2) ** (7 / 6);
  const b = (0.51 * s) / (1 + 0.69 * s ** 1.2) ** (5 / 6);
  row(`sigmaI2 point sR2=${s}`, Math.exp(a + b) - 1, T.scintillationIndex(s, 1550e-9, 1000, 0));
}
console.log("asymptote 1+0.86/sR^0.8 at 400:", 1 + 0.86 / 400 ** 0.4);

// 2. Gamma-gamma CDF by brute force: P = ∫ gammaPdf(x; a) P(b, b t/x) dx, Simpson on a fine linear grid in ln x.
function lnGamma(z: number): number {
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function gammaP(a: number, x: number): number { // series / continued fraction
  if (x <= 0) return 0;
  if (x < a + 1) { let s = 1 / a, d = s; for (let n = 1; n < 2000; n++) { d *= x / (a + n); s += d; if (d < s * 1e-16) break; } return s * Math.exp(-x + a * Math.log(x) - lnGamma(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 2000; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}
function ggBrute(t: number, al: number, be: number): number {
  const n = 40000, lo = -40, hi = 12, h = (hi - lo) / n; let s = 0;
  for (let i = 0; i <= n; i++) {
    const u = lo + i * h, x = Math.exp(u);
    const pdf = Math.exp(al * Math.log(al) + al * u - al * x - lnGamma(al)); // density of ln X
    s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * pdf * gammaP(be, (be * t) / x);
  }
  return (s * h) / 3;
}
for (const [s, t] of [[0.2, 0.1], [1, 0.1], [4, 0.01], [25, 0.001], [0.05, 0.5]] as const) {
  const { alpha, beta } = T.gammaGammaParameters(s, 0);
  row(`GG cdf sR2=${s} t=${t} (a=${alpha.toFixed(2)},b=${beta.toFixed(2)})`, ggBrute(t, alpha, beta), T.gammaGammaCdf(t, alpha, beta));
}
// lognormal vs gamma-gamma in weak turbulence must agree roughly; in strong they must not be presented as equal
{
  const s = 0.05, si = T.scintillationIndex(s, 1550e-9, 1000, 0), { alpha, beta } = T.gammaGammaParameters(s, 0);
  console.log("weak: LN vs GG at -3 dB:", T.lognormalFadeProbability(0.5, si), T.gammaGammaCdf(0.5, alpha, beta));
}

// 3. Fried, isoplanatic, Greenwood: my own numbers. Cn2 1e-14, 1550 nm, 1 km.
{
  const k = (2 * Math.PI) / 1550e-9, cn2 = 1e-14, L = 1000;
  row("r0 plane (0.185 λ^1.2 (Cn2 L)^-0.6)", 0.185 * 1550e-9 ** 1.2 * (cn2 * L) ** -0.6, T.friedParameter(cn2, 1550e-9, L));
  row("theta0", (2.914 * k * k * cn2 * (3 / 8) * L ** (8 / 3)) ** -0.6, T.isoplanaticAngle(cn2, 1550e-9, L));
  row("theta0 = 0.314 r0sph... check ratio θ0·L/r0", 0, (T.isoplanaticAngle(cn2, 1550e-9, L) * L) / T.friedParameter(cn2, 1550e-9, L));
  // exact Kolmogorov coefficients: plane Rytov 1.2287, spherical 0.4966 (=1.2287*0.4042)
  console.log("spherical/plane Rytov ratio in code:", T.sphericalRytovVariance(cn2, 1550e-9, L) / T.rytovVariance(cn2, 1550e-9, L), "exact 0.4042");
}

// 4. Aperture averaging weak, plane wave, Gaussian aperture: closed form of A&P (eq. 10.?): numerical double check by direct κ-ξ integration.
{
  for (const d2 of [0.25, 1, 9, 100]) {
    // σ²(D)/σ²(0) = ∫0^1 dξ Re-kernel; brute force: ∫0^1 dξ ∫0^∞ u^(-11/6) e^(-a u)(1-cos(ξ u)) du, a=d2/4
    const a = d2 / 4; let num = 0, den = 0; const nx = 200;
    for (let j = 0; j < nx; j++) {
      const xi = (j + 0.5) / nx;
      // substitute u = e^v
      let sn = 0, sd = 0; const nv = 6000, v0 = -40, v1 = 12, hv = (v1 - v0) / nv;
      for (let i = 0; i <= nv; i++) {
        const u = Math.exp(v0 + i * hv), w = i === 0 || i === nv ? 0.5 : 1;
        const base = u ** (-5 / 6) * (xi * u < 1e-4 ? (xi * u) ** 2 / 2 : 1 - Math.cos(xi * u));
        // damp the non-convergent oscillatory tail of the D=0 integral with an Abel factor e^(-1e-6 u)... use tiny a instead
        sn += w * base * Math.exp(-a * u); sd += w * base * Math.exp(-1e-5 * u);
      }
      num += sn * hv; den += sd * hv;
    }
    row(`A plane Gaussian d2=${d2}`, num / den, T.weakApertureFactor(d2, "plane"));
  }
  console.log("Andrews interp plane d2=1:", T.andrewsApertureFactor(1, "plane"), "hard:", T.hardApertureFactor(1));
}

// 5. QKD GYS: Ma et al. 2005 parameters at 100 km.
{
  const eta = 0.045 * 10 ** (-0.21 * 100 / 10), mu = 0.48, y0 = 1.7e-6, ed = 0.033, f = 1.22;
  const h2 = (x: number) => (x <= 0 || x >= 1 ? 0 : -x * Math.log2(x) - (1 - x) * Math.log2(1 - x));
  const Q = y0 + 1 - Math.exp(-eta * mu), E = (0.5 * y0 + ed * (1 - Math.exp(-eta * mu))) / Q; // Ma eqs (10),(11)
  const Y1 = y0 + eta, Q1 = Y1 * mu * Math.exp(-mu), e1 = (0.5 * y0 + ed * eta) / Y1;
  const R = 0.5 * (-Q * f * h2(E) + Q1 * (1 - h2(e1)));
  const r = decoyBb84({ mu, eta, y0, eDetector: ed, fEc: f });
  row("QKD GYS 100 km key/pulse (Ma eqs)", R, r.rawRate);
  row("QBER", E, r.qber);
}

// 6. Photon-counting BER quantum limits.
row("OOK n=10, nb=0", 0.5 * Math.exp(-20), ookPhotonCountingBer(10, 0).ber);
row("DPSK n=20, nb=0", 0.5 * Math.exp(-20), dpskPhotonCountingBer(20, 0));
{
  // DPSK with noise: brute double sum
  const n = 8, nb = 1.5; const pm = (k: number, m: number) => Math.exp(-m + k * Math.log(m) - lnGamma(k + 1));
  let ber = 0; for (let j = 0; j < 200; j++) for (let d = j; d < 200; d++) ber += pm(j, n + nb) * pm(d, nb) * (d === j ? 0.5 : 1);
  row("DPSK n=8 nb=1.5 brute", ber, dpskPhotonCountingBer(8, 1.5));
  // OOK with noise: brute over thresholds
  let best = 1; for (let th = 1; th < 100; th++) { let fa = 0, miss = 0; for (let k = 0; k < 300; k++) { if (k >= th) fa += pm(k, nb); else miss += pm(k, 2 * n + nb); } best = Math.min(best, 0.5 * (fa + miss)); }
  row("OOK n=8 nb=1.5 best threshold", best, ookPhotonCountingBer(8, 1.5).ber);
}
console.log("req photons OOK 1e-9:", requiredPhotonsPerBit("OOK", 1e-9, 0), "DPSK:", requiredPhotonsPerBit("DPSK", 1e-9, 0));

// 7. Klein–Degnan optimum.
console.log("KD opt:", optimumTruncation(0), "g(1.12)=", kleinDegnanEfficiency(1.12, 0), "width α=1:", truncatedGaussianWidth(1, 0));
