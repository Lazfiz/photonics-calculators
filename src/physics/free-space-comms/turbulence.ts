/**
 * Optical turbulence on a horizontal path with constant C_n² (Kolmogorov spectrum, zero inner scale, infinite
 * outer scale), plane-wave results. SI units: wavelengths, path lengths and diameters in m, C_n² in m^(−2/3),
 * angles in rad, speeds in m/s, frequencies in Hz. Model tier: textbook approximation.
 *
 * L. C. Andrews, R. L. Phillips, Laser Beam Propagation through Random Media, 2nd ed. (SPIE, 2005):
 * - Rytov variance σ_R² = 1.23 C_n² k^(7/6) L^(11/6);
 * - Fried parameter r₀ = (0.423 k² C_n² L)^(−3/5), the same as Fried's 0.185 λ^(6/5) (C_n² L)^(−3/5);
 * - isoplanatic angle θ₀ = (2.91 k² C_n² ∫₀ᴸ z^(5/3) dz)^(−3/5) = (2.91 · 3/8 · k² C_n² L^(8/3))^(−3/5);
 * - scintillation index of a plane wave in all regimes, for a receiver of diameter D, with d² = kD²/(4L):
 *   σ_I²(D) = exp[0.49σ_R² / (1 + 0.65d² + 1.11σ_R^(12/5))^(7/6)
 *                 + 0.51σ_R² (1 + 0.69σ_R^(12/5))^(−5/6) / (1 + 0.90d² + 0.62d²σ_R^(12/5))] − 1,
 *   which tends to σ_R² in weak turbulence and saturates at 1 in strong turbulence.
 * Fades: in weak fluctuations the received irradiance is log-normal with σ_ln² = ln(1 + σ_I²), so
 * P(I < F⟨I⟩) = Φ((ln F + σ_ln²/2)/σ_ln). In all regimes the gamma-gamma CDF (Al-Habash, Andrews & Phillips,
 * Opt. Eng. 40, 1554 (2001)) applies, with α, β from the aperture-averaged log variances.
 * Weak-fluctuation aperture averaging is the exact Gaussian-aperture integral (Andrews' interpolations, JOSA A 9,
 * 597 (1992), for comparison); the irradiance correlation of two receivers is the weak-fluctuation plane-wave
 * covariance, tabulated by scripts/gen-irradiance-covariance.ts; diversity outage for equicorrelated log-normal
 * branches with SC, EGC and MRC combining; beam wander ⟨r_c²⟩ = 2.42 C_n² L³ W₀^(−1/3) (collimated beam).
 *
 * Adaptive optics (a single turbulent layer moving at speed v):
 * - uncorrected phase variance 1.0299 (D/r₀)^(5/3), piston removed, and the residual after correcting the first
 *   J Zernike modes ≈ 0.2944 J^(−√3/2) (D/r₀)^(5/3) for large J (R. J. Noll, JOSA 66, 207 (1976)); for any J the
 *   exact Δ_J (D/r₀)^(5/3) from Noll's diagonal covariance, ⟨a_j²⟩ ∝ (n + 1) Γ(n − 5/6)/Γ(n + 23/6) for radial
 *   order n, scaled so that all modes sum to 1.0299 (his Table IV: Δ₃ 0.134, Δ₁₅ 0.0279, Δ₂₁ 0.0208);
 * - fitting error of a deformable mirror with actuator pitch d, κ (d/r₀)^(5/3): κ 0.28 for a continuous facesheet
 *   with Gaussian influence functions, 0.134 for piston-tip-tilt segments and 1.26 for piston-only segments
 *   (R. H. Hudgin, JOSA 67, 393 (1977); tabulated in R. K. Tyson, Principles of Adaptive Optics, and J. W. Hardy,
 *   Adaptive Optics for Astronomical Telescopes (Oxford, 1998));
 * - Greenwood frequency f_G = 0.427 v/r₀, servo-lag variance (f_G/f_3dB)^(5/3) for a first-order loop with
 *   closed-loop bandwidth f_3dB (D. P. Greenwood, JOSA 67, 390 (1977));
 * - Strehl ratio S ≈ e^(−σ²) + (1 − e^(−σ²))/(1 + (D/r₀)²), the Maréchal core plus the seeing halo, semi-empirical
 *   (R. R. Parenti, R. J. Sasiela, JOSA A 11, 288 (1994)). It tends to (r₀/D)² for an uncorrected D ≫ r₀.
 */

import { erfc, integrateSimpson, integrateTanhSinh, lnGamma, regularizedGammaP } from "../math";

const waveNumber = (lambda: number) => (2 * Math.PI) / lambda;

/** Rytov variance σ_R² = 1.23 C_n² k^(7/6) L^(11/6) (plane wave). */
export function rytovVariance(cn2: number, lambda: number, pathLength: number): number {
  return 1.23 * cn2 * waveNumber(lambda) ** (7 / 6) * pathLength ** (11 / 6);
}

/** Fried parameter r₀ = (0.423 k² C_n² L)^(−3/5), m (plane wave). */
export function friedParameter(cn2: number, lambda: number, pathLength: number): number {
  return (0.423 * waveNumber(lambda) ** 2 * cn2 * pathLength) ** (-3 / 5);
}

/** Isoplanatic angle θ₀ = (2.91 · 3/8 · k² C_n² L^(8/3))^(−3/5), rad, uniform C_n² seen from one end. */
export function isoplanaticAngle(cn2: number, lambda: number, pathLength: number): number {
  return (2.91 * (3 / 8) * waveNumber(lambda) ** 2 * cn2 * pathLength ** (8 / 3)) ** (-3 / 5);
}

/** Fresnel zone √(L/k), m. */
export function fresnelZone(lambda: number, pathLength: number): number {
  return Math.sqrt(pathLength / waveNumber(lambda));
}

/** Aperture parameter d² = kD²/(4L) = (D/2)²/(L/k): the receiver radius over the Fresnel zone, squared. */
export function apertureParameter(lambda: number, pathLength: number, apertureDiameter: number): number {
  return (waveNumber(lambda) * apertureDiameter ** 2) / (4 * pathLength);
}

/**
 * Large- and small-scale log-irradiance variances σ²_lnX, σ²_lnY of a plane wave on a receiver with aperture
 * parameter d² (0 for a point receiver), all regimes (Andrews & Phillips 2005; the terms of σ_I² above).
 */
export function logIrradianceVariances(sigmaR2: number, d2 = 0): { x: number; y: number } {
  const s125 = sigmaR2 ** (6 / 5); // σ_R^(12/5)
  return {
    x: (0.49 * sigmaR2) / (1 + 0.65 * d2 + 1.11 * s125) ** (7 / 6),
    y: (0.51 * sigmaR2 * (1 + 0.69 * s125) ** (-5 / 6)) / (1 + 0.9 * d2 + 0.62 * d2 * s125),
  };
}

/** Scintillation index σ_I² of a plane wave for a receiver of diameter D (0 for a point receiver), all regimes. */
export function scintillationIndex(sigmaR2: number, lambda: number, pathLength: number, apertureDiameter = 0): number {
  const { x, y } = logIrradianceVariances(sigmaR2, apertureParameter(lambda, pathLength, apertureDiameter));
  return Math.expm1(x + y);
}

/** Log-normal probability that the irradiance falls below F times its mean, for scintillation index σ_I². */
export function lognormalFadeProbability(fadeRatio: number, sigmaI2: number): number {
  if (sigmaI2 <= 0) return fadeRatio > 1 ? 1 : 0;
  const s2 = Math.log1p(sigmaI2);
  // Φ(x) = ½ erfc(−x/√2)
  return 0.5 * erfc(-(Math.log(fadeRatio) + s2 / 2) / Math.sqrt(2 * s2));
}

// ── Aperture averaging in weak fluctuations ─────────────────────────────────────────────────────────────────

/** Spherical-wave Rytov variance β₀² = 0.4 σ_R² = 0.496 C_n² k^(7/6) L^(11/6). */
export function sphericalRytovVariance(cn2: number, lambda: number, pathLength: number): number {
  return 0.496 * cn2 * waveNumber(lambda) ** (7 / 6) * pathLength ** (11 / 6);
}

/** Andrews (1992) interpolation of the weak-fluctuation aperture factor: [1 + c·d²]^(−7/6), c = 1.062 or 0.333. */
export function andrewsApertureFactor(d2: number, wave: "plane" | "spherical"): number {
  return (1 + (wave === "plane" ? 1.062 : 0.333) * d2) ** (-7 / 6);
}

/**
 * Weak-fluctuation aperture-averaging factor A = σ_I²(D)/σ_I²(0) for a Gaussian aperture exp(−κ²D²/16), the
 * aperture model of Andrews & Phillips 2005 ch. 10:
 *   σ_I²(D) ∝ ∫₀¹ dξ ∫₀^∞ κ^(−8/3) exp(−D²κ²w²/16) [1 − cos(Lκ²b/k)] dκ,
 * with w = 1, b = ξ (plane wave) or w = ξ, b = ξ(1 − ξ) (spherical wave). With u = Lκ²/k the κ integral is
 * ½Γ(−5/6)[a^(5/6) − Re (a + ib)^(5/6)], a = d²w²/4 (∫u^(s−1)e^(−pu)du = Γ(s)p^(−s), continued to s = −5/6); the
 * constant cancels in A and the ξ integral is done by tanh-sinh quadrature. The same integral at D = 0 gives the
 * prefactors 1.23 and 0.496 of σ_R² and β₀² (tests). A hard circular aperture averages slightly more.
 */
export function weakApertureFactor(d2: number, wave: "plane" | "spherical"): number {
  if (!(d2 >= 0)) return NaN;
  if (d2 === 0) return 1;
  const s = 5 / 6;
  // a^s − Re (a + ib)^s = a^s [1 − (1 + τ²)^(s/2) cos(s·atan τ)], τ = b/a, written without cancellation for small τ.
  const kernel = (a: number, b: number) => {
    if (a === 0) return -(b ** s) * Math.cos((s * Math.PI) / 2);
    const tau = b / a;
    const g = (s / 2) * Math.log1p(tau * tau);
    const half = Math.sin((s * Math.atan(tau)) / 2);
    return a ** s * (-Math.expm1(g) + 2 * Math.exp(g) * half * half);
  };
  const integrand = (d: number) => (xi: number) =>
    wave === "plane" ? kernel(d / 4, xi) : kernel((d * xi * xi) / 4, xi * (1 - xi));
  return integrateTanhSinh(integrand(d2), 0, 1) / integrateTanhSinh(integrand(0), 0, 1);
}

// ── Gamma-gamma irradiance statistics ───────────────────────────────────────────────────────────────────────

/**
 * Gamma-gamma shape parameters of a plane wave, α = 1/(exp σ²_lnX − 1), β = 1/(exp σ²_lnY − 1), from the
 * aperture-averaged log variances above (Al-Habash, Andrews & Phillips 2001; Andrews & Phillips 2005).
 * Then σ_I² = 1/α + 1/β + 1/(αβ).
 */
export function gammaGammaParameters(sigmaR2: number, d2 = 0): { alpha: number; beta: number } {
  const { x, y } = logIrradianceVariances(sigmaR2, d2);
  return { alpha: 1 / Math.expm1(x), beta: 1 / Math.expm1(y) };
}

/**
 * Gamma-gamma probability P(I < t⟨I⟩). I = XY with independent unit-mean gammas X ~ Γ(a, 1/a), Y ~ Γ(b, 1/b)
 * (a = max(α, β), b = min(α, β)), so P = E_X[P(b, b·t/X)] with P(·,·) the regularized incomplete gamma. The
 * expectation is a trapezoidal integral over u = ln X on the interval where the integrand is within e^(−45) of its
 * peak, located by a 240-point scan; the bell-shaped integrand makes the rule converge fast (relative error ≲ 1e-6).
 */
export function gammaGammaCdf(t: number, alpha: number, beta: number): number {
  if (!(alpha > 0 && beta > 0) || Number.isNaN(t)) return NaN;
  if (t <= 0) return 0;
  if (t === Infinity) return 1;
  const a = Math.max(alpha, beta);
  const b = Math.min(alpha, beta);
  // Density of u = ln X: e^(c(a) − a(e^u − 1 − u)) with c(a) = a ln a − a − ln Γ(a), by Stirling's series for a ≥ 10
  // (truncation < 1e-10) so that large a does not cancel.
  const lnNorm = a >= 10
    ? 0.5 * Math.log(a / (2 * Math.PI)) - (1 / (12 * a)) * (1 - (1 / (30 * a * a)) * (1 - 2 / (7 * a * a)))
    : a * Math.log(a) - a - lnGamma(a);
  const lnF = (u: number) => lnNorm - a * (Math.expm1(u) - u) + Math.log(regularizedGammaP(b, b * t * Math.exp(-u)));
  // Scan from below ln t (where P(b, ·) → 1 and the X density decays as e^(au)) to the upper tail of X. The density
  // is below e^(−700) of its peak for u > √(1400/a), and for u < −√(3806/a) when a > 3806 (e^u − 1 − u ≥ u²/2e on
  // [−1, 0]), so for large a the scan narrows to width ~1/√a and still resolves the peak.
  let lo = Math.min(-1, Math.log(t)) - 2 - 60 / a;
  const hi = Math.min(Math.log1p(60 / a) + 2, Math.sqrt(1400 / a));
  if (a > 3806) lo = Math.max(lo, -Math.sqrt(3806 / a));
  if (!(hi > lo)) return 0;
  const nScan = 240;
  let peak = -Infinity;
  const scan: number[] = [];
  for (let i = 0; i <= nScan; i++) {
    const v = lnF(lo + ((hi - lo) * i) / nScan);
    scan.push(v);
    if (v > peak) peak = v;
  }
  if (peak === -Infinity) return 0;
  let iLo = 0;
  let iHi = nScan;
  while (iLo < nScan && !(scan[iLo] > peak - 45)) iLo++;
  while (iHi > 0 && !(scan[iHi] > peak - 45)) iHi--;
  const uLo = lo + ((hi - lo) * Math.max(0, iLo - 1)) / nScan;
  const uHi = lo + ((hi - lo) * Math.min(nScan, iHi + 1)) / nScan;
  const n = 800;
  const h = (uHi - uLo) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) sum += (i === 0 || i === n ? 0.5 : 1) * Math.exp(lnF(uLo + i * h));
  return Math.min(1, sum * h);
}

// ── Spatial diversity in weak fluctuations ──────────────────────────────────────────────────────────────────

/**
 * Normalised irradiance covariance b_I of a plane wave in weak fluctuations (Kolmogorov, zero inner scale, point
 * receivers) at r = ρ√(k/L) = 0, 0.05, …, 6, from b_I(r) = I(r)/I(0), I(r) = ∫₀^∞ x^(−8/3) J₀(xr)(1 − sin x²/x²) dx
 * (Andrews & Phillips 2005 ch. 8 spectral integral; generated by scripts/gen-irradiance-covariance.ts). |b_I| < 0.006
 * beyond r = 6.
 */
const IRRADIANCE_COVARIANCE = [
  1.00000, .98824, .96603, .93801, .90616, .87149, .83486, .79689, .75800, .71862, .67905, .63953,
  .60032, .56159, .52351, .48622, .44983, .41445, .38016, .34705, .31516, .28455, .25526, .22731,
  .20074, .17555, .15176, .12936, .10835, .08872, .07045, .05353, .03793, .02361, .01056, -.00126,
  -.01191, -.02140, -.02979, -.03712, -.04345, -.04881, -.05326, -.05684, -.05962, -.06164, -.06296, -.06363,
  -.06370, -.06322, -.06225, -.06084, -.05903, -.05688, -.05444, -.05175, -.04885, -.04579, -.04261, -.03935,
  -.03605, -.03273, -.02944, -.02620, -.02304, -.01998, -.01705, -.01427, -.01164, -.00919, -.00693, -.00486,
  -.00300, -.00134, .00011, .00136, .00240, .00324, .00389, .00436, .00465, .00478, .00476, .00460,
  .00432, .00393, .00345, .00290, .00228, .00162, .00093, .00022, -.00048, -.00118, -.00185, -.00249,
  -.00309, -.00363, -.00411, -.00453, -.00488, -.00515, -.00536, -.00548, -.00554, -.00553, -.00545, -.00532,
  -.00512, -.00488, -.00460, -.00429, -.00395, -.00359, -.00322, -.00285, -.00249, -.00214, -.00181, -.00151,
  -.00124,
];
const COVARIANCE_STEP = 0.05;

/** Irradiance correlation b_I between two point receivers a distance ρ apart (weak fluctuations, plane wave). */
export function irradianceCorrelation(separation: number, lambda: number, pathLength: number): number {
  const r = Math.abs(separation) * Math.sqrt(waveNumber(lambda) / pathLength);
  const pos = r / COVARIANCE_STEP;
  const i = Math.floor(pos);
  if (!Number.isFinite(pos)) return NaN;
  if (i >= IRRADIANCE_COVARIANCE.length - 1) return 0;
  return IRRADIANCE_COVARIANCE[i] + (pos - i) * (IRRADIANCE_COVARIANCE[i + 1] - IRRADIANCE_COVARIANCE[i]);
}

/** Correlation of ln I implied by irradiance correlation b_I for log-normal branches: ln(1 + b_I σ_I²)/ln(1 + σ_I²). */
export function logIrradianceCorrelation(bI: number, sigmaI2: number): number {
  return sigmaI2 > 0 ? Math.log1p(bI * sigmaI2) / Math.log1p(sigmaI2) : bI;
}

export type Combiner = "sc" | "egc" | "mrc";

const SUM_GRID = 80;
const PANELS_PER_SIGMA = 6;
const MAX_PANELS = 4000; // both ranges span < 21σ + ln 2 (126 panels); a guard only

/**
 * ln P(Σᵢ₌₁ⁿ e^(σWᵢ) < e^u) for iid standard normal Wᵢ, tabulated on 80 points of u ∈ [ln n − 9σ, ln n + 9σ]: a sum
 * below n·e^(−9σ) needs one term below e^(−9σ), and above n·e^(9σ) one above e^(9σ), so the probability outside is
 * < nΦ(−9) = n·1.1e-19 (absolute). Built by the recursion
 * F_k(y) = ∫ φ(v/σ)/σ · F_(k−1)(y − e^v) dv over v < ln y (one term in log space, the other k − 1 from the previous
 * table, Catmull–Rom in u), by Simpson's rule at 6 panels per σ. Against the same recursion on 320 points at 24 panels
 * per σ (σ = 0.07–1.3, n = 3 and 8, P = 1e-12 to 0.5) the relative error is < 1.5e-3, falling as h⁴ (1.4e-3 at σ = 1.7 by an
 * independent quadrature); ≈ 15 ms for n = 8.
 */
function lnSumCdfTable(n: number, sigma: number): { lo: number; du: number; lnF: Float64Array } {
  const du = (18 * sigma) / (SUM_GRID - 1);
  let lo = -9 * sigma;
  let lnF = new Float64Array(SUM_GRID);
  for (let i = 0; i < SUM_GRID; i++) lnF[i] = Math.log(0.5 * erfc(-(lo + i * du) / sigma / Math.SQRT2));
  const norm = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const vLo = -10 * sigma; // φ(v/σ) beyond ±10σ adds < Φ(−10) = 8e-24 (absolute)
  for (let k = 2; k <= n; k++) {
    const prev = { lo, du, lnF };
    lo = Math.log(k) - 9 * sigma;
    const next = new Float64Array(SUM_GRID);
    for (let i = 0; i < SUM_GRID; i++) {
      const u = lo + i * du;
      // v < 10σ, and the other k − 1 terms need at least e^(prev.lo): v < ln(e^u − e^(prev.lo)).
      const vEnd = Math.min(10 * sigma, u + Math.log(-Math.expm1(prev.lo - u)));
      // Split at e^v = y/2. Below, step in v: y − e^v = e^u (1 − e^(v − u)) stays within a factor 2 of y. Above, the
      // other terms' CDF falls off over a v-interval far narrower than σ as e^v → y, so step in their log-share
      // r = ln(1 − e^(v − u)) instead: v = u + ln(1 − e^r), |dv/dr| = e^r/(1 − e^r) ≤ 1. Simpson, PANELS_PER_SIGMA.
      const vA = Math.min(u - Math.LN2, vEnd);
      let total = 0;
      if (vA > vLo) {
        total += integrateSimpson((v) => {
          const l = interpLnSumCdf(prev, u + Math.log(-Math.expm1(v - u)));
          return l > -Infinity ? Math.exp(-0.5 * (v / sigma) ** 2 + l) : 0;
        }, vLo, vA, Math.min(MAX_PANELS, Math.ceil((PANELS_PER_SIGMA * (vA - vLo)) / sigma)));
      }
      const vB = Math.max(u - Math.LN2, vLo);
      if (vEnd > vB) {
        const rHi = Math.log(-Math.expm1(vB - u));
        // r at vEnd, exactly: e^(prev.lo − u) can round 1 − e^(vEnd − u) to 0 (σ ≳ 1.85), which would give r = −∞.
        const rLo = Math.max(prev.lo - u, Math.log(-Math.expm1(Math.min(10 * sigma, u) - u)));
        total += integrateSimpson((r) => {
          const l = interpLnSumCdf(prev, u + r);
          const v = u + Math.log(-Math.expm1(r));
          return l > -Infinity ? Math.exp(-0.5 * (v / sigma) ** 2 + l + r) / -Math.expm1(r) : 0;
        }, rLo, rHi, Math.min(MAX_PANELS, Math.ceil((PANELS_PER_SIGMA * (rHi - rLo)) / sigma)));
      }
      next[i] = total > 0 ? Math.log(total * norm) : -Infinity;
    }
    lnF = next;
  }
  return { lo, du, lnF };
}

function interpLnSumCdf(table: { lo: number; du: number; lnF: Float64Array }, u: number): number {
  const { lo, du, lnF } = table;
  const x = (u - lo) / du;
  if (!(x > 0)) return -Infinity;
  if (x >= SUM_GRID - 1) return 0;
  const i = Math.floor(x);
  const f = x - i;
  const p1 = lnF[i];
  const p2 = lnF[i + 1];
  if (!(p1 > -Infinity && p2 > -Infinity)) return -Infinity;
  const p0 = i > 0 ? lnF[i - 1] : -Infinity;
  const p3 = i + 2 < SUM_GRID ? lnF[i + 2] : -Infinity;
  if (!(p0 > -Infinity && p3 > -Infinity)) return p1 + f * (p2 - p1);
  return p1 + 0.5 * f * (p2 - p0 + f * (2 * p0 - 5 * p1 + 4 * p2 - p3 + f * (3 * (p1 - p2) + p3 - p0)));
}

// diversityThreshold calls the outage ~20 times with one (n, σ), and the page's chart needs 34 tables: keep the last 64.
const sumTableCache = new Map<string, ReturnType<typeof lnSumCdfTable>>();
function cachedSumTable(n: number, sigma: number) {
  const key = `${n}|${sigma}`;
  let table = sumTableCache.get(key);
  if (!table) {
    if (sumTableCache.size >= 64) sumTableCache.clear();
    table = lnSumCdfTable(n, sigma);
    sumTableCache.set(key, table);
  }
  return table;
}

/**
 * Outage probability of N receivers with equicorrelated log-normal irradiances I_n (mean 1, scintillation σ_I²,
 * correlation ρ of ln I, clamped to [0, 1]; a negative ρ is treated as 0, which overestimates the outage). The
 * combined signal is the irradiance-equivalent of the electrical SNR of thermal-noise-limited IM/DD, each receiver
 * having the single receiver's aperture: SC max I_n, EGC ΣI_n/√N, MRC √(ΣI_n²). Outage = P(signal < t).
 * SC is exact: given the common factor Z₀ the branches are independent, P = ∫φ(z) Φ((ln t − μ − σ√ρ z)/(σ√(1 − ρ)))ᴺ dz.
 * EGC and MRC are exact for N = 2 (one conditioned integral). For N ≥ 3, given Z₀ the ΣI_n (EGC) or ΣI_n² (MRC, I² is
 * log-normal with twice the log-deviation) is a sum of iid log-normals, whose CDF comes from lnSumCdfTable; the outer
 * integral over Z₀ is Simpson's rule. Against 4×-refined tables and a 40000-panel outer integral (240 cases: N = 3, 8;
 * σ_I² = 1e-4–1; ρ = 0.05–0.99999; EGC and MRC; P = 1e-3–1e-9) P is within 1e-3 relative (2.8e-3 at σ_I² = 1, MRC), i.e.
 * < 0.001 dB; 4e6-run Monte Carlo agrees within 2σ (±1.6 %). The Fenton–Wilkinson log-normal fit it replaces overstated
 * the EGC margin by 0.02–0.30 dB at σ_I² ≤ 0.5 and up to 0.8 dB at σ_I² = 1.
 */
export function diversityOutage(t: number, n: number, sigmaI2: number, rhoLn: number, combiner: Combiner): number {
  if (!(n >= 1) || Number.isNaN(t) || Number.isNaN(rhoLn) || !(sigmaI2 >= 0)) return NaN;
  if (t <= 0) return 0;
  const gain = combiner === "sc" ? 1 : Math.sqrt(n); // signal without fading
  if (sigmaI2 === 0) return t > gain ? 1 : 0;
  const s2 = Math.log1p(sigmaI2);
  const s = Math.sqrt(s2);
  const mu = -s2 / 2;
  const rho = Math.min(1, Math.max(0, rhoLn));
  const phi = (x: number) => 0.5 * erfc(-x / Math.SQRT2);
  const lnT = Math.log(t);
  if (n === 1 || rho >= 1 - 1e-12) {
    // One receiver, or fully correlated branches: every combiner sees one log-normal irradiance (times √N for EGC/MRC).
    return phi((lnT - Math.log(gain) - mu) / s);
  }
  if (combiner === "sc") {
    if (rho === 0) return phi((lnT - mu) / s) ** n;
    const sr = s * Math.sqrt(rho);
    const width = Math.sqrt((1 - rho) / rho); // width in z of the conditional step
    const zc = (lnT - mu) / sr;
    // The conditional factor Φ((z_c − z)/width)ᴺ is 1 to 1e-23 below z_c − 10·width − 1 (that part is Φ(z_lo)) and
    // below 1e-23 above z_c + 10·width + 1; φ(z) < 1e-31 beyond |z| = 12, so the absolute error is < 1e-31.
    const zLo = Math.min(12, Math.max(-12, zc - 10 * width - 1));
    const zHi = Math.min(12, Math.max(-12, zc + 10 * width + 1));
    const tail = zLo > -12 ? phi(zLo) : 0;
    if (!(zHi > zLo)) return tail;
    const h = Math.max((zHi - zLo) / 6000, Math.min(0.05, width / 5));
    const steps = Math.ceil((zHi - zLo) / h);
    const dz = (zHi - zLo) / steps;
    const sc = s * Math.sqrt(1 - rho);
    let sum = 0;
    for (let i = 0; i <= steps; i++) {
      const z = zLo + i * dz;
      const w = i === 0 || i === steps ? 0.5 : 1;
      sum += w * Math.exp(-z * z / 2) * phi((lnT - mu - sr * z) / sc) ** n;
    }
    // Euler–Maclaurin end correction: the integrand φ(z)·1 has slope −z_lo φ(z_lo) at z_lo and is flat at z_hi.
    const slope = zLo > -12 ? -zLo * Math.exp(-zLo * zLo / 2) : 0;
    const integral = (sum * dz + ((dz * dz) / 12) * slope) / Math.sqrt(2 * Math.PI);
    return Math.min(1, tail + integral);
  }
  if (n === 2) {
    // Exact: condition on ln I₁ = μ + σz; then ln I₂ ~ N(μ + ρσz, σ²(1 − ρ²)) must stay below the remaining budget.
    const limit = combiner === "egc" ? t * Math.SQRT2 : t * t; // I₁ + I₂ (EGC) or I₁² + I₂² (MRC) below this
    const power = combiner === "egc" ? 1 : 2;
    const zMax = (Math.log(limit) / power - mu) / s; // I₁ alone reaches the limit here
    const sc = s * Math.sqrt(1 - rho * rho);
    const integrand = (z: number) => {
      const i1 = Math.exp(power * (mu + s * z));
      const rest = limit - i1;
      if (!(rest > 0)) return 0;
      return Math.exp(-z * z / 2) * phi((Math.log(rest) / power - mu - rho * s * z) / sc);
    };
    return Math.min(1, integrateTanhSinh(integrand, Math.min(zMax - 8, -12), zMax) / Math.sqrt(2 * Math.PI));
  }
  // N ≥ 3: ln(sum) < uAt(z) given Z₀ = z, in units of the branch log-deviation (EGC: σ_c, MRC: 2σ_c).
  const mrc = combiner === "mrc";
  const power = mrc ? 2 : 1;
  const branch = power * s * Math.sqrt(1 - rho);
  const table = cachedSumTable(n, branch);
  const u0 = mrc ? 2 * (lnT - mu) : lnT + Math.log(n) / 2 - mu;
  const slope = power * s * Math.sqrt(rho); // du/dz
  if (rho === 0) return Math.min(1, Math.exp(interpLnSumCdf(table, u0)));
  // The table spans u ∈ [lo, hi]: P = 1 above (z < zA), negligible below (z > zB).
  const hi = table.lo + (SUM_GRID - 1) * table.du;
  const zA = Math.max(-12, Math.min(12, (u0 - hi) / slope));
  const zB = Math.max(-12, Math.min(12, (u0 - table.lo) / slope));
  const tail = zA > -12 ? phi(zA) : 0;
  if (!(zB > zA)) return Math.min(1, tail);
  // Simpson over the 18σ_b/slope window (≥ 64 panels, ≤ 0.05 in z).
  const integral = integrateSimpson(
    (z) => Math.exp(-z * z / 2 + interpLnSumCdf(table, u0 - slope * z)), zA, zB, Math.max(64, Math.ceil((zB - zA) / 0.05)),
  ) / Math.sqrt(2 * Math.PI);
  return Math.min(1, tail + integral);
}

/**
 * Threshold t (fraction of one receiver's mean irradiance) at which diversityOutage equals pOut. Bracket: with q(p)
 * the single-receiver threshold, ρ ≥ 0 gives p^N ≤ P_SC ≤ p, so q(pOut) ≤ t_SC ≤ q(pOut^(1/N)); and
 * max I ≤ √(ΣI²) ≤ √N max I, ΣI/√N between max I/√N and √N max I, so EGC and MRC lie within a factor √N of that range
 * (widened by a factor e, else [e^(−80), e^10]). Root of ln P(t) − ln pOut in ln t by the Illinois
 * method, to |Δ ln P| < 1e-9 or |Δ ln t| < 1e-9.
 */
export function diversityThreshold(pOut: number, n: number, sigmaI2: number, rhoLn: number, combiner: Combiner): number {
  if (!(pOut > 0 && pOut < 1) || !(n >= 1)) return NaN;
  const lnP = Math.log(pOut);
  const g = (x: number) => Math.log(diversityOutage(Math.exp(x), n, sigmaI2, rhoLn, combiner)) - lnP;
  const singleLnT = (p: number) => {
    let lo = -80;
    let hi = 10;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (lognormalFadeProbability(Math.exp(mid), sigmaI2) < p) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  let a = singleLnT(pOut) - Math.log(n) / 2 - 1;
  let b = singleLnT(pOut ** (1 / n)) + Math.log(n) / 2 + 1;
  let fa = g(a);
  let fb = g(b);
  if (!(fa < 0 && fb > 0)) {
    [a, b] = [-80, 10];
    [fa, fb] = [g(a), g(b)];
    if (!(fa <= 0 && fb >= 0)) return NaN;
  }
  let side = 0;
  for (let i = 0; i < 100 && b - a > 1e-9; i++) {
    let x = Number.isFinite(fa) && Number.isFinite(fb) ? (a * fb - b * fa) / (fb - fa) : (a + b) / 2;
    if (!(x > a && x < b)) x = (a + b) / 2;
    const fx = g(x);
    if (Math.abs(fx) < 1e-9) return Math.exp(x);
    if (fx < 0) {
      a = x;
      fa = fx;
      if (side === -1) fb /= 2;
      side = -1;
    } else {
      b = x;
      fb = fx;
      if (side === 1) fa /= 2;
      side = 1;
    }
  }
  return Math.exp((a + b) / 2);
}

// ── Beam wander ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Beam-wander variance of a collimated Gaussian beam, ⟨r_c²⟩ = 2.42 C_n² L³ W₀^(−1/3), m² (W₀ the 1/e² radius at
 * the transmitter; infinite outer scale). It is the Θ₀ = 1 case of 2.42 C_n² L³ W₀^(−1/3) ₂F₁(1/3, 1; 4; 1 − |Θ₀|)
 * (Andrews & Phillips 2005 ch. 6), the weak-fluctuation result from the large eddies; in strong fluctuations, with W₀
 * near or above r₀, it overestimates the wander. A finite outer scale also reduces it.
 */
export function beamWanderVariance(cn2: number, pathLength: number, waist: number): number {
  return 2.42 * cn2 * pathLength ** 3 * waist ** (-1 / 3);
}

/**
 * Mean on-axis irradiance loss from beam wander, dB: a Gaussian beam of radius W displaced by a circular-Gaussian
 * r_c gives ⟨exp(−2r_c²/W²)⟩ = 1/(1 + 2⟨r_c²⟩/W²), so the loss is 10 log₁₀(1 + 2⟨r_c²⟩/W²).
 */
export function beamWanderLossDb(variance: number, beamRadiusAtRx: number): number {
  return 10 * Math.log10(1 + (2 * variance) / beamRadiusAtRx ** 2);
}

/** Uncorrected Kolmogorov phase variance over an aperture D, piston removed: 1.0299 (D/r₀)^(5/3), rad². */
export function uncorrectedPhaseVariance(diameter: number, r0: number): number {
  return 1.0299 * (diameter / r0) ** (5 / 3);
}

/** Residual phase variance after correcting the first J Zernike modes, 0.2944 J^(−√3/2) (D/r₀)^(5/3), rad². */
export function fittingErrorVariance(modes: number, diameter: number, r0: number): number {
  return 0.2944 * modes ** (-Math.sqrt(3) / 2) * (diameter / r0) ** (5 / 3);
}

/** Radial order n of Zernike mode j in Noll's ordering (j = 1 piston, 2–3 tilt, 4–6 n = 2, …). */
export function zernikeRadialOrder(j: number): number {
  return Math.floor((Math.sqrt(8 * j - 7) - 1) / 2);
}

/** Highest J that `nollResidual` accepts. */
export const NOLL_MAX_MODES = 5000;

// Noll's diagonal covariance per mode of radial order n, up to a constant: (n + 1) Γ(n − 5/6)/Γ(n + 23/6).
const nollModeShape = (n: number) => (n + 1) * Math.exp(lnGamma(n - 5 / 6) - lnGamma(n + 23 / 6));
// Scale so that every mode beyond piston sums to Noll's 1.0299; the terms fall as n^(−14/3), so 2000 radial orders
// (each holding n + 1 modes) leave a tail below 1e-9.
const NOLL_SCALE = (() => {
  let sum = 0;
  for (let n = 2000; n >= 1; n--) sum += (n + 1) * nollModeShape(n);
  return 1.0299 / sum;
})();

/**
 * Noll's Δ_J: the residual phase variance after correcting the first J Zernike modes (piston included), in units of
 * (D/r₀)^(5/3). Exact for Kolmogorov turbulence; Δ₁ = 1.0299. NaN outside 1 ≤ J ≤ NOLL_MAX_MODES or for a fractional J.
 */
export function nollResidual(modes: number): number {
  if (!Number.isInteger(modes) || modes < 1 || modes > NOLL_MAX_MODES) return NaN;
  let removed = 0;
  for (let j = 2; j <= modes; j++) removed += NOLL_SCALE * nollModeShape(zernikeRadialOrder(j));
  return 1.0299 - removed;
}

/** Fitting-error coefficients κ of σ² = κ (d/r₀)^(5/3) by deformable-mirror type (Hudgin 1977; Hardy 1998). */
export const DM_FITTING_COEFFICIENT = { continuous: 0.28, segmentedTipTilt: 0.134, segmentedPiston: 1.26 } as const;

/** Deformable-mirror fitting error κ (d/r₀)^(5/3), rad², for actuator pitch d (projected on the pupil). */
export function dmFittingVariance(pitch: number, r0: number, kappa: number = DM_FITTING_COEFFICIENT.continuous): number {
  if (!(pitch >= 0) || !(r0 > 0) || !(kappa >= 0)) return NaN;
  return kappa * (pitch / r0) ** (5 / 3);
}

/** Greenwood frequency f_G = 0.427 v/r₀, Hz. */
export function greenwoodFrequency(windSpeed: number, r0: number): number {
  return (0.427 * windSpeed) / r0;
}

/** Servo-lag phase variance (f_G/f_3dB)^(5/3), rad², for a first-order loop. */
export function servoLagVariance(greenwood: number, bandwidth: number): number {
  return (greenwood / bandwidth) ** (5 / 3);
}

/** Strehl ratio e^(−σ²) + (1 − e^(−σ²))/(1 + (D/r₀)²) (Parenti & Sasiela 1994). */
export function strehlRatio(phaseVariance: number, diameter: number, r0: number): number {
  const core = Math.exp(-phaseVariance);
  return core + (1 - core) / (1 + (diameter / r0) ** 2);
}
