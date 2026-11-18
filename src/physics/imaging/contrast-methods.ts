/**
 * Contrast-methods page summary: Zernike phase contrast and DIC image contrast of a weak phase object, with the page's
 * warnings. SI in and out (m, rad); the contrasts are fractions. Model tier: textbook. The formulas are in
 * `phase-contrast` (Zernike 1942, doi:10.1016/S0031-8914(42)80035-X; Salmon & Tran 2007,
 * doi:10.1016/S0091-679X(06)81016-2); this module adds the page's dispatch and warnings.
 */
import {
  dicContrast, dicShearPhase, objectPhase, zernikeContrast, zernikeContrastLinear,
} from "./phase-contrast";

export type Ring = "positive" | "negative";
/** Lateral resolution coefficient: 0.61 λ/NA (Rayleigh criterion, first zero of the Airy pattern). */
export const RESOLUTION_COEFFICIENT = 0.61;

/** Why the DIC contrasts are undefined: a black background (zero bias and zero stray light). */
export const BLACK_BACKGROUND = "With zero bias and no stray light the DIC background is black, so the relative contrast is undefined.";

export interface ContrastMethodsSummary {
  /** Δn·t, m. */
  opticalPathDifference: number;
  /** Object phase φ, rad. */
  phi: number;
  /** 0.61 λ/NA, m. */
  resolution: number;
  /** Zernike contrast (I − I_bg)/I_bg and its small-φ limit. */
  phaseContrast: number;
  phaseContrastLinear: number;
  /** Phase difference across the DIC shear, rad. */
  shearPhase: number;
  dicPlus: number;
  dicMinus: number;
  warnings: string[];
}

/**
 * lambda, thickness, shear, edge in m; dn the index step; ringTransmission and stray as fractions (0.25 = 25 %);
 * bias in waves (Γ = 2π·bias).
 */
export function contrastMethodsSummary(p: {
  lambda: number; na: number; thickness: number; dn: number; ring: Ring; ringTransmission: number;
  shear: number; edge: number; bias: number; stray: number;
}): ContrastMethodsSummary {
  const { lambda, na, thickness, dn, ring, ringTransmission, shear, edge, bias, stray } = p;
  const delta = ring === "positive" ? -Math.PI / 2 : Math.PI / 2;
  const Gamma = 2 * Math.PI * bias;
  const phi = objectPhase(dn, thickness, lambda);
  const pc = zernikeContrast(phi, delta, ringTransmission);
  const pcLinear = zernikeContrastLinear(phi, delta, ringTransmission);
  const dPhi = dicShearPhase(phi, shear, edge);
  const resolution = (RESOLUTION_COEFFICIENT * lambda) / na;

  const warnings: string[] = [];
  const a = Math.sqrt(ringTransmission);
  if (Math.abs(phi) > Math.PI) warnings.push(`|φ| = ${Math.abs(phi).toFixed(3)} rad exceeds π: far from a weak phase object, the phase wraps and the contrast is not monotonic in φ.`);
  else if (phi !== 0 && Math.sign(pc) !== Math.sign(pcLinear)) warnings.push(`Contrast reversal: tan(|φ|/2) = ${Math.tan(Math.abs(phi) / 2).toFixed(3)} exceeds the ring amplitude a = ${a.toFixed(3)}, so the object appears with the opposite sign to the ${ring} phase-contrast rule.`);
  else if (Math.abs(phi) > a / 2) warnings.push(`|φ| = ${Math.abs(phi).toFixed(3)} rad is not small next to the ring amplitude a = ${a.toFixed(3)}: the contrast is no longer proportional to φ and the small-φ limit is wrong.`);
  if (shear > resolution) warnings.push(`A shear of ${Number((shear * 1e9).toPrecision(6))} nm exceeds the resolution ${(resolution * 1e9).toFixed(0)} nm: DIC shows a doubled image.`);
  if (bias === 0 && stray === 0) warnings.push(BLACK_BACKGROUND);

  return {
    opticalPathDifference: dn * thickness,
    phi,
    resolution,
    phaseContrast: pc,
    phaseContrastLinear: pcLinear,
    shearPhase: dPhi,
    dicPlus: dicContrast(Gamma, dPhi, stray),
    dicMinus: dicContrast(Gamma, -dPhi, stray),
    warnings,
  };
}
