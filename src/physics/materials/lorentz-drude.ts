/**
 * Optical constants of metals from the Lorentz–Drude model of Rakić et al. SI units in and out:
 * wavelengths in m; the model's own parameters are in eV, as published.
 * Model tier: exact for the fitted model; the fit itself reproduces the measured n, k of evaporated films to a
 * few per cent in the visible and near IR (film quality varies more than that).
 *
 * Permittivity with time dependence e^(−iωt), so Im ε ≥ 0 for absorption (ħω = E in eV):
 *   ε(E) = 1 − f₀ ω_p² / (E (E + iΓ₀)) + Σⱼ fⱼ ω_p² / (Eⱼ² − E² − i E Γⱼ),
 * and N = n + iκ = √ε (principal root, κ ≥ 0), E = hc/λ.
 *
 * Source: A. D. Rakić, A. B. Djurišić, J. M. Elazar, M. L. Majewski, "Optical properties of metallic films for
 * vertical-cavity optoelectronic devices", Appl. Opt. 37, 5271–5283 (1998), Table 1 (LD model). The values below
 * are those transcribed in refractiveindex.info's calculation scripts (M. Polyanskiy, "Rakic 1998 - Ag/Al/Cr
 * (LD model).py"); tests/materials-lorentz-drude.test.ts checks them against that database's tabulated n, k.
 * `tabulated` is the range that database tabulates; outside it the model is an extrapolation (in the far IR it is
 * the Drude term, which is the right physics but not checked against data here).
 */
import { sqrt as csqrt, type Complex } from "../complex";
import { hc_eV_nm } from "../constants";

export interface LorentzOscillator {
  /** Oscillator strength fⱼ. */
  f: number;
  /** Damping Γⱼ, eV. */
  gamma: number;
  /** Resonance energy Eⱼ, eV. */
  energy: number;
}

export interface LorentzDrudeModel {
  /** Plasma energy ħω_p, eV. */
  plasma: number;
  /** Drude (free-electron) strength f₀. */
  f0: number;
  /** Drude damping Γ₀, eV. */
  gamma0: number;
  oscillators: readonly LorentzOscillator[];
  /** Wavelength range of the tabulated model data the parameters were checked against, m. */
  tabulated: readonly [number, number];
}

export type RakicMetal = "Ag" | "Al" | "Cr";

/** Wavelength in m for a photon energy in eV. */
const lambdaOf = (eV: number) => (hc_eV_nm / eV) * 1e-9;

export const RAKIC_LD: Readonly<Record<RakicMetal, LorentzDrudeModel>> = {
  Ag: {
    plasma: 9.01,
    f0: 0.845,
    gamma0: 0.048,
    oscillators: [
      { f: 0.065, gamma: 3.886, energy: 0.816 },
      { f: 0.124, gamma: 0.452, energy: 4.481 },
      { f: 0.011, gamma: 0.065, energy: 8.185 },
      { f: 0.84, gamma: 0.916, energy: 9.083 },
      { f: 5.646, gamma: 2.419, energy: 20.29 },
    ],
    tabulated: [lambdaOf(5), lambdaOf(0.1)],
  },
  Al: {
    plasma: 14.98,
    f0: 0.523,
    gamma0: 0.047,
    oscillators: [
      { f: 0.227, gamma: 0.333, energy: 0.162 },
      { f: 0.05, gamma: 0.312, energy: 1.544 },
      { f: 0.166, gamma: 1.351, energy: 1.808 },
      { f: 0.03, gamma: 3.382, energy: 3.473 },
    ],
    tabulated: [lambdaOf(20), lambdaOf(0.005)],
  },
  Cr: {
    plasma: 10.75,
    f0: 0.168,
    gamma0: 0.047,
    oscillators: [
      { f: 0.151, gamma: 3.175, energy: 0.121 },
      { f: 0.15, gamma: 1.305, energy: 0.543 },
      { f: 1.149, gamma: 2.676, energy: 1.97 },
      { f: 0.825, gamma: 1.335, energy: 8.775 },
    ],
    tabulated: [lambdaOf(5), lambdaOf(0.02)],
  },
};

/** Relative permittivity ε at a vacuum wavelength (m), Im ε ≥ 0. NaN parts for λ ≤ 0 or non-finite λ. */
export function lorentzDrudePermittivity(model: LorentzDrudeModel, wavelength: number): Complex {
  if (!(wavelength > 0 && Number.isFinite(wavelength))) return { re: NaN, im: NaN };
  const E = hc_eV_nm / (wavelength * 1e9);
  const wp2 = model.plasma * model.plasma;
  // Drude: −f₀ω_p² / (E² + iEΓ₀) = −f₀ω_p² (E² − iEΓ₀) / (E⁴ + E²Γ₀²)
  const dDen = E * E * (E * E + model.gamma0 * model.gamma0);
  let re = 1 - (model.f0 * wp2 * E * E) / dDen;
  let im = (model.f0 * wp2 * E * model.gamma0) / dDen;
  for (const o of model.oscillators) {
    // fω_p² / (a − ib) = fω_p² (a + ib) / (a² + b²), a = Eⱼ² − E², b = EΓⱼ
    const a = o.energy * o.energy - E * E;
    const b = E * o.gamma;
    const s = (o.f * wp2) / (a * a + b * b);
    re += s * a;
    im += s * b;
  }
  return { re, im };
}

/** Complex index N = n + iκ (κ ≥ 0) at a vacuum wavelength (m). NaN for invalid λ. */
export function lorentzDrudeIndex(model: LorentzDrudeModel, wavelength: number): { n: number; k: number } {
  const eps = lorentzDrudePermittivity(model, wavelength);
  if (!Number.isFinite(eps.re)) return { n: NaN, k: NaN };
  const N = csqrt(eps);
  return { n: N.re, k: N.im };
}

/** Rakić et al. (1998) Lorentz–Drude index of Ag, Al or Cr at a vacuum wavelength (m). */
export function rakicIndex(metal: RakicMetal, wavelength: number): { n: number; k: number } {
  return lorentzDrudeIndex(RAKIC_LD[metal], wavelength);
}

/** True when λ (m) lies in the range the parameters were checked against. */
export function inTabulatedRange(metal: RakicMetal, wavelength: number): boolean {
  const [lo, hi] = RAKIC_LD[metal].tabulated;
  return wavelength >= lo * (1 - 1e-9) && wavelength <= hi * (1 + 1e-9);
}
