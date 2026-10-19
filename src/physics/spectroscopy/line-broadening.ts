import { c, h, k_B, m_e } from "../constants";

/**
 * Spectral line shapes and widths. SI units in and out unless a name says otherwise; a width and the offset from line
 * centre only need to share one unit (Hz, cm⁻¹, nm, …), since the profiles are functions of their ratio.
 *
 * Doppler (thermal) broadening of a gas in a Maxwell velocity distribution is a Gaussian with
 * FWHM Δν_D = ν₀ √(8 k_B T ln 2 / (m c²)) (Demtröder, Laser Spectroscopy Vol. 1, 5th ed., ch. 3). Homogeneous broadening
 * (natural decay, collisions in the impact approximation) is a Lorentzian, and Lorentzian widths of independent
 * processes add. Both together give the Voigt profile, the convolution of the two, computed here exactly from the
 * Faddeeva function w(z): V(x) = Re w((x + iγ)/(σ√2)) / (σ√(2π)), with σ = Δ_G/(2√(2 ln 2)) and γ = Δ_L/2.
 */

const SQRT_PI = Math.sqrt(Math.PI);
const SQRT_2LN2 = Math.sqrt(2 * Math.LN2);

/**
 * Faddeeva function w(z) = e^(−z²) erfc(−iz) for Im z ≥ 0, by Weideman's rational expansion with N = 32 terms
 * (J. A. C. Weideman, SIAM J. Numer. Anal. 31, 1497 (1994), doi 10.1137/0731077). The coefficients a_n are the cosine
 * transform of f(t) = e^(−t²)(L² + t²) sampled at t_k = L tan(kπ/2M), here summed directly instead of by FFT.
 */
const WEIDEMAN_N = 32;
const WEIDEMAN_L = Math.sqrt(WEIDEMAN_N / Math.SQRT2);
const WEIDEMAN_A: number[] = (() => {
  const M = 2 * WEIDEMAN_N;
  const f: number[] = [];
  for (let k = -M + 1; k <= M - 1; k++) {
    const t = WEIDEMAN_L * Math.tan((k * Math.PI) / (2 * M));
    f.push(Math.exp(-t * t) * (WEIDEMAN_L * WEIDEMAN_L + t * t));
  }
  const a: number[] = [];
  for (let n = 1; n <= WEIDEMAN_N; n++) {
    let sum = 0;
    for (let k = -M + 1; k <= M - 1; k++) sum += f[k + M - 1] * Math.cos((Math.PI * k * n) / M);
    a.push(sum / (2 * M));
  }
  return a;
})();

/** [Re, Im] of w(x + iy) for y ≥ 0. */
export function faddeeva(x: number, y: number): [number, number] {
  const L = WEIDEMAN_L;
  // d = L − iz = (L + y) − ix and Z = (L + iz)/(L − iz) = ((L − y) + ix)/d.
  const dr = L + y, di = -x;
  const d2 = dr * dr + di * di;
  const nr = L - y, ni = x;
  const Zr = (nr * dr + ni * di) / d2, Zi = (ni * dr - nr * di) / d2;
  // Horner: p = Σ a_n Z^(n−1).
  let pr = 0, pi = 0;
  for (let n = WEIDEMAN_N - 1; n >= 0; n--) {
    const r = pr * Zr - pi * Zi + WEIDEMAN_A[n];
    pi = pr * Zi + pi * Zr;
    pr = r;
  }
  // w = 2p/d² + 1/(√π d).
  const d2r = dr * dr - di * di, d2i = 2 * dr * di;
  const q2 = d2r * d2r + d2i * d2i;
  const tr = (2 * (pr * d2r + pi * d2i)) / q2, ti = (2 * (pi * d2r - pr * d2i)) / q2;
  return [tr + dr / (SQRT_PI * d2), ti - di / (SQRT_PI * d2)];
}

/** Area-normalised Gaussian of FWHM fwhmG at offset x from line centre. */
export function gaussianProfile(x: number, fwhmG: number): number {
  if (!(fwhmG > 0)) return NaN;
  const sigma = fwhmG / (2 * SQRT_2LN2);
  return Math.exp(-0.5 * (x / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

/** Area-normalised Lorentzian of FWHM fwhmL at offset x from line centre. */
export function lorentzianProfile(x: number, fwhmL: number): number {
  if (!(fwhmL > 0)) return NaN;
  const gamma = fwhmL / 2;
  return gamma / (Math.PI * (x * x + gamma * gamma));
}

/** Area-normalised Voigt profile (exact), the convolution of a Gaussian of FWHM fwhmG and a Lorentzian of FWHM fwhmL. */
export function voigtProfile(x: number, fwhmG: number, fwhmL: number): number {
  if (!(fwhmG >= 0 && fwhmL >= 0) || fwhmG + fwhmL === 0) return NaN;
  if (fwhmG === 0) return lorentzianProfile(x, fwhmL);
  const sigma = fwhmG / (2 * SQRT_2LN2);
  const s = sigma * Math.SQRT2;
  return faddeeva(x / s, fwhmL / 2 / s)[0] / (sigma * Math.sqrt(2 * Math.PI));
}

/** FWHM of the exact Voigt profile, by bisection on V(x) = V(0)/2 over [0, (Δ_G + Δ_L)/2] to 1e-13 relative. */
export function voigtFwhm(fwhmG: number, fwhmL: number): number {
  if (!(fwhmG >= 0 && fwhmL >= 0) || fwhmG + fwhmL === 0) return NaN;
  if (fwhmG === 0) return fwhmL;
  if (fwhmL === 0) return fwhmG;
  const half = voigtProfile(0, fwhmG, fwhmL) / 2;
  let lo = 0, hi = (fwhmG + fwhmL) / 2; // the Voigt FWHM never exceeds Δ_G + Δ_L
  for (let i = 0; i < 100 && hi - lo > 1e-13 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (voigtProfile(mid, fwhmG, fwhmL) > half) lo = mid;
    else hi = mid;
  }
  return lo + hi;
}

/**
 * Olivero & Longbothum (1977) Voigt FWHM, f_V ≈ 0.5346 Δ_L + √(0.2166 Δ_L² + Δ_G²), within 0.02 % of exact
 * (J. Quant. Spectrosc. Radiat. Transfer 17, 233, doi 10.1016/0022-4073(77)90161-3).
 */
export function voigtFwhmOlivero(fwhmG: number, fwhmL: number): number {
  return 0.5346 * fwhmL + Math.sqrt(0.2166 * fwhmL * fwhmL + fwhmG * fwhmG);
}

/**
 * Thompson, Cox & Hastings (1987) pseudo-Voigt: width f = (Δ_G⁵ + 2.69269 Δ_G⁴Δ_L + 2.42843 Δ_G³Δ_L² + 4.47163 Δ_G²Δ_L³ +
 * 0.07842 Δ_G Δ_L⁴ + Δ_L⁵)^(1/5) and mixing η = 1.36603 r − 0.47719 r² + 0.11116 r³ with r = Δ_L/f
 * (J. Appl. Cryst. 20, 79, doi 10.1107/S0021889887087090).
 */
export function pseudoVoigtTch(fwhmG: number, fwhmL: number): { fwhm: number; eta: number } {
  const G = fwhmG, L = fwhmL;
  const fwhm = (G ** 5 + 2.69269 * G ** 4 * L + 2.42843 * G ** 3 * L ** 2 + 4.47163 * G ** 2 * L ** 3 + 0.07842 * G * L ** 4 + L ** 5) ** 0.2;
  const r = L / fwhm;
  return { fwhm, eta: 1.36603 * r - 0.47719 * r * r + 0.11116 * r ** 3 };
}

/** TCH pseudo-Voigt η·L(x; f) + (1 − η)·G(x; f), mixing area-normalised profiles of one width f. */
export function pseudoVoigtProfile(x: number, fwhmG: number, fwhmL: number): number {
  const { fwhm, eta } = pseudoVoigtTch(fwhmG, fwhmL);
  if (!(fwhm > 0)) return NaN;
  return eta * lorentzianProfile(x, fwhm) + (1 - eta) * gaussianProfile(x, fwhm);
}

/** Doppler FWHM as a fraction of the line frequency (or wavenumber, or wavelength to first order): √(8 k_B T ln 2/(m c²)). */
export function dopplerFwhmFraction(T: number, mass: number): number {
  if (!(T >= 0 && mass > 0)) return NaN;
  return Math.sqrt((8 * k_B * T * Math.LN2) / (mass * c * c));
}

/** Most probable speed of the Maxwell distribution, v_p = √(2 k_B T/m) (m/s). */
export function mostProbableSpeed(T: number, mass: number): number {
  if (!(T >= 0 && mass > 0)) return NaN;
  return Math.sqrt((2 * k_B * T) / mass);
}

/** Natural (lifetime) FWHM in Hz of a level decaying with lifetime τ (s): Δν = 1/(2πτ). */
export function naturalFwhmHz(tau: number): number {
  return tau > 0 ? 1 / (2 * Math.PI * tau) : NaN;
}

/** Lifetime τ (s) that gives a natural FWHM Δν (Hz). */
export function lifetimeFromFwhmHz(fwhmHz: number): number {
  return fwhmHz > 0 ? 1 / (2 * Math.PI * fwhmHz) : NaN;
}

/**
 * Stark (electron-impact) FWHM of an isolated line, Δλ_S = 2 w (n_e / n_ref), linear in electron density with the
 * tabulated half-width w at n_ref, usually 1e16 cm⁻³ = 1e22 m⁻³ (Griem, Spectral Line Broadening by Plasmas, 1974;
 * Konjević et al., J. Phys. Chem. Ref. Data 31, 819 (2002)). Ion broadening is neglected, a few percent for ionic lines.
 */
export function starkFwhm(w: number, ne: number, neRef = 1e22): number {
  return w >= 0 && ne >= 0 ? (2 * w * ne) / neRef : NaN;
}

/** Electron density (m⁻³) from a measured Stark FWHM: n_e = n_ref Δλ_S / (2w). */
export function electronDensityFromStark(fwhm: number, w: number, neRef = 1e22): number {
  return fwhm >= 0 && w > 0 ? (neRef * fwhm) / (2 * w) : NaN;
}

/**
 * Saha equation in LTE, n_(z+1) n_e / n_z = 2 (U_(z+1)/U_z) (2π m_e k_B T/h²)^(3/2) exp(−χ/(k_B T)), in m⁻³, with the
 * ionisation energy χ in J and no ionisation-potential lowering (Griem, Principles of Plasma Spectroscopy, 1997).
 */
export function sahaRatio(T: number, chi: number, partitionRatio = 1): number {
  if (!(T > 0 && chi >= 0 && partitionRatio > 0)) return NaN;
  const lambdaFactor = ((2 * Math.PI * m_e * k_B * T) / (h * h)) ** 1.5;
  return 2 * partitionRatio * lambdaFactor * Math.exp(-chi / (k_B * T));
}

/**
 * McWhirter criterion for LTE: n_e ≥ 1.6e12 √T ΔE³ cm⁻³ with T in K and the largest energy gap ΔE in eV
 * (Cristoforetti et al., Spectrochim. Acta B 65, 86 (2010)). Returned in m⁻³.
 */
export function mcWhirterDensity(T: number, deltaE_eV: number): number {
  return T >= 0 && deltaE_eV >= 0 ? 1.6e18 * Math.sqrt(T) * deltaE_eV ** 3 : NaN;
}
