/**
 * Sum-frequency generation (SFG) vibrational spectroscopy: the SFG wavelength and the effective second-order
 * susceptibility of an interface. SI units in and out: wavelengths in m (vacuum), IR frequencies as wavenumbers in 1/m
 * (1 cm⁻¹ = 100 m⁻¹). Model tier: exact for the wavelength (energy conservation), textbook for the lineshape.
 *
 * Energy conservation ω_SFG = ω_vis + ω_IR gives 1/λ_SFG = 1/λ_vis + ν̃_IR. The SFG intensity is
 *   I_SFG ∝ |χ⁽²⁾_eff|² I_vis I_IR,   χ⁽²⁾_eff(ν̃) = A_NR e^{iφ} + Σ_q A_q / (ν̃ − ν̃_q + iΓ_q),
 * with a non-resonant background of amplitude A_NR and phase φ, and Lorentzian resonances of amplitude A_q, centre ν̃_q
 * and half width at half maximum Γ_q (Shen, Nature 337, 519 (1989), doi:10.1038/337519a0; Lambert, Davies & Neivandt,
 * Appl. Spectrosc. Rev. 40, 103 (2005), doi:10.1081/ASR-200038326). A_q and A_NR share one arbitrary unit, so
 * A_q/Γ_q and A_NR compare directly. Fresnel factors and the polarisation combination are folded into the amplitudes.
 * Because the terms add before squaring, resonances interfere with each other and with the background: peaks shift,
 * turn dispersive or appear as dips.
 */
import { abs2, complex, type Complex } from "../complex";
import { sumFrequencyWavelength } from "../imaging/second-harmonic-generation";

export interface SfgResonance {
  /** Centre ν̃_q, 1/m. */
  center: number;
  /** Amplitude A_q, 1/m (sign sets the orientation/phase of the mode). */
  amplitude: number;
  /** Half width at half maximum Γ_q, 1/m (> 0). */
  halfWidth: number;
}

/** A resonance set for the calculator page and the API: IR range and modes in cm⁻¹ (A/Γ is the peak |χ_R| of a lone resonance). */
export interface SfgPreset {
  label: string;
  range: [number, number];
  modes: { name: string; center: number; amplitude: number; halfWidth: number }[];
}

// Band assignments: Lambert et al. 2005 (alkyl CH) and Du et al. 1993 (air/water OH). Amplitudes and widths are
// illustrative.
export const SFG_PRESETS: Record<string, SfgPreset> = {
  ch: {
    label: "Alkyl chains, CH stretches (ssp; e.g. a thiol monolayer)",
    range: [2800, 3050],
    modes: [
      { name: "CH₂ symmetric (d⁺)", center: 2850, amplitude: 1.5, halfWidth: 6 },
      { name: "CH₃ symmetric (r⁺)", center: 2878, amplitude: 8, halfWidth: 5 },
      { name: "CH₃ Fermi resonance (r⁺_FR)", center: 2938, amplitude: 5, halfWidth: 7 },
      { name: "CH₃ asymmetric (r⁻)", center: 2965, amplitude: 2, halfWidth: 6 },
    ],
  },
  water: {
    label: "Air/water, OH stretches (ssp)",
    range: [2900, 3900],
    modes: [
      { name: "H-bonded OH, ≈ 3200", center: 3200, amplitude: 60, halfWidth: 100 },
      { name: "H-bonded OH, ≈ 3400", center: 3400, amplitude: 50, halfWidth: 100 },
      // Im χ⁽²⁾ = −AΓ/(Δ² + Γ²): A > 0 gives Im χ⁽²⁾ < 0. Heterodyne-detected SFG puts the free OH (pointing to the vapour)
      // positive and the whole H-bonded band negative (Nihonyanagi et al., J. Chem. Phys. 143, 124707 (2015),
      // doi:10.1063/1.4931485). Earlier phase-sensitive data (Ji et al., PRL 100, 096102 (2008)) showed a positive band near
      // 3200 cm⁻¹, now attributed to phase-reference artefacts and still debated (Tang et al., Chem. Rev. 120, 3633 (2020)).
      // The amplitudes are illustrative.
      { name: "Free OH, ≈ 3700", center: 3700, amplitude: -15, halfWidth: 15 },
    ],
  },
};

/** SFG wavelength 1/(1/λ_vis + ν̃_IR), m. NaN unless λ_vis > 0 and ν̃_IR > 0. */
export function sfgWavelength(lambdaVis: number, irWavenumber: number): number {
  if (!(irWavenumber > 0 && Number.isFinite(irWavenumber))) return NaN;
  return sumFrequencyWavelength(lambdaVis, 1 / irWavenumber);
}

/** Resonant part Σ_q A_q / (ν̃ − ν̃_q + iΓ_q). NaN components if any Γ_q ≤ 0. */
export function resonantSusceptibility(wavenumber: number, resonances: readonly SfgResonance[]): Complex {
  let re = 0;
  let im = 0;
  for (const { center, amplitude, halfWidth } of resonances) {
    if (!(halfWidth > 0)) return complex(NaN, NaN);
    // A/(Δ + iΓ) = A(Δ − iΓ)/(Δ² + Γ²)
    const d = wavenumber - center;
    const den = d * d + halfWidth * halfWidth;
    re += (amplitude * d) / den;
    im -= (amplitude * halfWidth) / den;
  }
  return complex(re, im);
}

/** χ⁽²⁾_eff = A_NR e^{iφ} + resonant part (see the header); φ in radians. */
export function sfgSusceptibility(
  wavenumber: number,
  resonances: readonly SfgResonance[],
  nrAmplitude: number,
  nrPhase: number,
): Complex {
  const r = resonantSusceptibility(wavenumber, resonances);
  return complex(r.re + nrAmplitude * Math.cos(nrPhase), r.im + nrAmplitude * Math.sin(nrPhase));
}

/** |χ⁽²⁾_eff|², the SFG intensity in the squared amplitude unit. */
export function sfgIntensity(wavenumber: number, resonances: readonly SfgResonance[], nrAmplitude: number, nrPhase: number): number {
  return abs2(sfgSusceptibility(wavenumber, resonances, nrAmplitude, nrPhase));
}

/**
 * Detuning ν̃ − ν̃_q of the intensity maximum of one resonance on a real background (φ = 0 or π, A_NR signed):
 * d|χ|²/dΔ = 0 gives A_NR Δ² + A Δ − A_NR Γ² = 0, so Δ = (−A + sgn(A)·√(A² + 4A_NR²Γ²))/(2A_NR), and Δ = 0 for A_NR = 0.
 * A real background pulls the peak away from ν̃_q by up to Γ.
 */
export function singleResonancePeakShift(amplitude: number, halfWidth: number, nrAmplitude: number): number {
  if (!(halfWidth > 0) || !Number.isFinite(amplitude) || !Number.isFinite(nrAmplitude) || amplitude === 0) return NaN;
  if (nrAmplitude === 0) return 0;
  const root = Math.sqrt(amplitude * amplitude + 4 * nrAmplitude * nrAmplitude * halfWidth * halfWidth);
  // Rationalised form 2A_NRΓ²/(A + sgn(A)·root) avoids cancellation when A_NR ≪ A/Γ.
  return (2 * nrAmplitude * halfWidth * halfWidth) / (amplitude + Math.sign(amplitude) * root);
}

/**
 * Local maxima of a sampled curve y(x) (x increasing), refined by a parabola through each maximum and its neighbours.
 * Only maxima at least `relThreshold` × max(y) are kept; endpoints are not maxima.
 */
export function localMaxima(x: readonly number[], y: readonly number[], relThreshold = 0.02): { x: number; y: number }[] {
  const n = Math.min(x.length, y.length);
  let top = 0;
  for (let i = 0; i < n; i++) if (y[i] > top) top = y[i];
  const out: { x: number; y: number }[] = [];
  for (let i = 1; i < n - 1; i++) {
    if (!(y[i] > y[i - 1] && y[i] >= y[i + 1] && y[i] >= relThreshold * top)) continue;
    const den = y[i - 1] - 2 * y[i] + y[i + 1];
    const step = x[i + 1] - x[i];
    const p = den < 0 ? (0.5 * (y[i - 1] - y[i + 1])) / den : 0;
    out.push({ x: x[i] + p * step, y: y[i] - 0.25 * (y[i - 1] - y[i + 1]) * p });
  }
  return out;
}
