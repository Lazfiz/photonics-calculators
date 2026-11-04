/**
 * Pure helpers for the home-page chip hero: the power split of its Mach-Zehnder splitter and the beam colour.
 *
 * Model tier: Exact for the ideal lossless 50/50 Mach-Zehnder of `machZehnderBeams` (two-beam interference,
 * I = I₁ + I₂ ± 2√(I₁I₂)cos φ, Born & Wolf ch. 7). The interferometer is quadrature-biased, φ = π/2 − Δφ, so the
 * outputs are P± = ½(1 ± sin Δφ) for a phase shift Δφ in one arm. Each output is tapped 50/50 into the middle
 * imaging bus, which therefore always carries half of the input power. The colours are illustrative only.
 */
import { machZehnderBeams, twoBeamIntensity } from "../physics/spectroscopy/two-beam";

export interface HeroPowerSplit {
  /** Upper branch: half of the output with the + cross term. */
  spectral: number;
  /** Middle bus: half of each output. */
  imaging: number;
  /** Lower branch: half of the output with the − cross term. */
  interference: number;
}

/** Fractions of the input power in the three branches for a phase shift Δφ (rad). NaN for a non-finite Δφ. */
export function heroPowerSplit(dPhiRad: number): HeroPowerSplit {
  if (!Number.isFinite(dPhiRad)) return { spectral: NaN, imaging: NaN, interference: NaN };
  const { A, B } = machZehnderBeams(0.5, 0.5);
  const phi = Math.PI / 2 - dPhiRad;
  const upper = twoBeamIntensity(A, phi);
  const lower = twoBeamIntensity(B, phi + Math.PI);
  return { spectral: upper / 2, imaging: (upper + lower) / 2, interference: lower / 2 };
}

export interface HeroBeamTheme {
  core: string;
  glow: string;
  deep: string;
  /** "λ nm · band", stating the actual wavelength. */
  name: string;
}

/** Name of the spectral band containing the wavelength (nm). */
export function wavelengthBand(nm: number): string {
  if (nm < 450) return "violet";
  if (nm < 495) return "blue";
  if (nm < 520) return "cyan";
  if (nm < 565) return "green";
  if (nm < 590) return "yellow";
  if (nm < 625) return "orange";
  if (nm < 700) return "red";
  if (nm < 1260) return "near-IR";
  if (nm < 1530) return "O/E/S-band";
  if (nm <= 1565) return "C-band";
  return "L-band";
}

/** Display colours of the beam for a vacuum wavelength in nm, plus a label with the true wavelength and band. */
export function wavelengthToColor(nm: number): HeroBeamTheme {
  const name = `${nm} nm · ${wavelengthBand(nm)}`;
  if (nm >= 475 && nm <= 515) return { core: "#a5ffff", glow: "#00f2ff", deep: "#0284c7", name };
  if (nm < 450) return { core: "#e0c3fc", glow: "#8b5cf6", deep: "#4c1d95", name };
  if (nm < 475) return { core: "#bae6fd", glow: "#38bdf8", deep: "#0369a1", name };
  if (nm < 560) return { core: "#bbf7d0", glow: "#10b981", deep: "#047857", name };
  if (nm < 610) return { core: "#fef08a", glow: "#f59e0b", deep: "#b45309", name };
  if (nm < 700) return { core: "#fecdd3", glow: "#f43f5e", deep: "#be123c", name };
  return { core: "#99ffff", glow: "#00f2ff", deep: "#0891b2", name };
}
