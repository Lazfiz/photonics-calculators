/**
 * Power coupling between two single-mode fibres (or a Gaussian beam and a fibre) in the Gaussian mode approximation.
 * SI units in and out: lengths in m, angles in rad. Model tier: textbook approximation (paraxial Gaussian fields).
 *
 * Fibre 1 launches a Gaussian mode of 1/e² intensity radius w₁ (field ∝ exp(−r²/w₁²)) with its waist on the end face.
 * Fibre 2 (mode radius w₂) sits across a gap z filled with a medium of index n, laterally offset by d and tilted by
 * θ in the same plane as the offset, pivoting about the centre of its face. Each face is normal to its own axis, so the
 * wedge between them is filled with the gap medium and the tilt phase slope is (2πn/λ)·θ: n is the index of the
 * medium the tilt happens in (≈ 1.45 for a fusion splice, physical contact or index gel). With a gap and an offset the
 * sign of θ matters: one sense follows fibre 1's diverging wavefront and couples better;
 * gaussianCouplingWorstTilt takes the worse one. The coupled power is the normalized overlap
 *   η = |∫ E₁ E₂* dA|² / (∫|E₁|² dA ∫|E₂|² dA)
 * evaluated at fibre 2's face. With k = 2πn/λ, q₁ = z + i z_R, z_R = π n w₁²/λ, a₁ = ik/(2q₁), a₂ = 1/w₂²,
 * A = a₁ + a₂ and B = 2a₂d + ikθ, the Gaussian integrals give
 *   η = 4 Re(a₁) a₂ / |A|² · exp(Re(B²/(2A)) − 2a₂d²).
 * This is the general (offset, tilt, gap, mismatch) result of S. Nemoto & T. Makimoto, Opt. Quantum Electron. 11, 447
 * (1979), https://doi.org/10.1007/BF00619826 , and W. B. Joyce & B. C. DeLoach, Appl. Opt. 23, 4187 (1984),
 * https://doi.org/10.1364/AO.23.004187 . At z = 0 it is the product of Marcuse's offset, tilt and spot-size mismatch
 * formulas (D. Marcuse, Bell Syst. Tech. J. 56, 703 (1977), https://doi.org/10.1002/j.1538-7305.1977.tb00534.x ).
 * Single-effect limits:
 *   offset  η = (2w₁w₂/(w₁²+w₂²))² exp(−2d²/(w₁²+w₂²))
 *   tilt    η = (2w₁w₂/(w₁²+w₂²))² exp(−2(πnθ/λ)² w₁²w₂²/(w₁²+w₂²))
 *   gap     η = 4 / ((w₁/w₂ + w₂/w₁)² + (λz/(πn w₁w₂))²), i.e. 1/(1 + (λz/(2πnw²))²) for equal w.
 * Not included: reflections at the gap faces (see gapEtalonTransmission, gapReflectionFactor), mode-field ellipticity, non-Gaussian
 * mode tails (Marcuse's Gaussian fit is good to ~1 % in η near V ≈ 2), tilt angles or beam NAs beyond the paraxial
 * range (NA ≲ 0.3), and the obliquity of a tilted face (θw ≪ z_R).
 */
import { complex, add, mul, div, abs2, scale, type Complex } from "../complex";
import { fresnel } from "../polarization/fresnel";

export interface GaussianJoint {
  /** Mode-field radius of the launching fibre or beam waist w₁, m, > 0. */
  w1: number;
  /** Mode-field radius of the receiving fibre w₂, m, > 0. */
  w2: number;
  /** Vacuum wavelength λ, m, > 0. */
  lambda: number;
  /** Index n of the medium in the gap, ≥ 1 (default 1). */
  n?: number;
  /** Lateral offset d at the receiving face, m (default 0). */
  offset?: number;
  /** Tilt θ between the two axes in the gap medium, rad, |θ| < π/2 (default 0). */
  tilt?: number;
  /** End-face separation z, m, ≥ 0 (default 0). */
  gap?: number;
}

/** Power coupling efficiency η ∈ [0, 1] of a Gaussian joint (formula above). NaN for invalid input. */
export function gaussianCoupling(j: GaussianJoint): number {
  const { w1, w2, lambda, n = 1, offset: d = 0, tilt = 0, gap: z = 0 } = j;
  const valid = [w1, w2, lambda, n, d, tilt, z].every(Number.isFinite) &&
    w1 > 0 && w2 > 0 && lambda > 0 && n >= 1 && z >= 0 && Math.abs(tilt) < Math.PI / 2;
  if (!valid) return NaN;

  const k = (2 * Math.PI * n) / lambda;
  const zR = (Math.PI * n * w1 * w1) / lambda;
  // a₁ = ik/(2q₁) = k(z_R + iz)/(2(z² + z_R²)); Re a₁ = 1/w₁(z)².
  const den = 2 * (z * z + zR * zR);
  const a1 = complex((k * zR) / den, (k * z) / den);
  const a2 = 1 / (w2 * w2);
  const A = add(a1, complex(a2));
  const B: Complex = complex(2 * a2 * d, k * tilt);
  const expo = div(mul(B, B), scale(A, 2)).re - 2 * a2 * d * d;
  const eta = ((4 * a1.re * a2) / abs2(A)) * Math.exp(expo);
  return Math.min(1, eta);
}

/** η with the tilt in the unfavourable sense: min over ±θ (they differ only when there is a gap and an offset). */
export function gaussianCouplingWorstTilt(j: GaussianJoint): number {
  const t = j.tilt ?? 0;
  return Math.min(gaussianCoupling({ ...j, tilt: t }), gaussianCoupling({ ...j, tilt: -t }));
}

/** Loss in dB of a power transmission T ∈ (0, 1]: −10 log₁₀ T. Infinity for T = 0, NaN outside [0, 1]. */
export function lossDb(T: number): number {
  if (!(T >= 0 && T <= 1)) return NaN;
  return T === 0 ? Infinity : -10 * Math.log10(T);
}

/**
 * Normal-incidence power reflectance at an index step, R = ((n₁ − n₂)/(n₁ + n₂))², from polarization/fresnel.ts.
 * Zero when n₁ = n₂.
 */
export function stepReflectance(n1: number, n2: number): number {
  return fresnel(n1, n2, 0).Rs;
}

/** Return loss in dB, −10 log₁₀ R: Infinity for R = 0 (no index step), NaN outside [0, 1]. */
export function returnLossDb(R: number): number {
  return lossDb(R);
}

/**
 * Transmission of a plane-parallel gap of index n_g and thickness z between two fibre faces of index n_f, at normal
 * incidence, counting multiple reflections coherently (Airy formula; M. Born & E. Wolf, Principles of Optics,
 * 7th ed., §7.6.1):
 *   T = 1 / (1 + F sin²(δ/2)),  F = 4R/(1 − R)²,  δ = 4π n_g z/λ,  R = ((n_f − n_g)/(n_f + n_g))².
 * T = 1 at z = 0 (physical contact) and when n_g = n_f (index matching). Plane-wave model: diffraction in the gap
 * is handled separately by gaussianCoupling, and treating the two as independent factors is good for gaps much
 * shorter than the Rayleigh range: against a coherent sum of multiply reflected Gaussian beams it is within 0.02 dB up
 * to z ≈ 5 µm for a 9 µm MFD at 1550 nm (tests/fiber-gaussian-coupling.test.ts). NaN for invalid input.
 */
export function gapEtalonTransmission(nFiber: number, nGap: number, z: number, lambda: number): number {
  if (!(nFiber >= 1 && nGap >= 1 && z >= 0 && lambda > 0 && Number.isFinite(z))) return NaN;
  const R = stepReflectance(nFiber, nGap);
  const F = (4 * R) / (1 - R) ** 2;
  const s = Math.sin((2 * Math.PI * nGap * z) / lambda);
  return 1 / (1 + F * s * s);
}

/**
 * Reflection factor of a gap at any length: the coherent sum of the multiply reflected Gaussian beams, divided by the
 * single-pass diffraction coupling |c(z)|² = 1/(1 + (z/2z_R)²). Pass m crosses the gap 2m + 1 times with amplitude
 * r^(2m)(1 − r²), r = (n_f − n_g)/(n_f + n_g), and couples with the equal-waist amplitude overlap after a path L in
 * index n_g (from the q-parameter, H. Kogelnik, T. Li, Appl. Opt. 5, 1550 (1966), https://doi.org/10.1364/AO.5.001550 ):
 *   c(L) = e^(−ikL)/(1 − iL/(2z_R)),  k = 2π n_g/λ,  z_R = π n_g w²/λ.
 * It equals the Airy factor gapEtalonTransmission for z ≪ z_R. For z ≫ z_R pass m keeps 1/(2m + 1) of the first pass's
 * overlap amplitude, so the fringes persist with less contrast: |Σ (1 − r²) r^(2m) e^(−ik(2m+1)z)/(2m + 1)|². 1 at z = 0 and for
 * n_g = n_f. Equal waists w, parallel faces and a source coherent over the 2z round trip (tilted faces wash out
 * the fringes). NaN for invalid input.
 */
export function gapReflectionFactor(nFiber: number, nGap: number, z: number, lambda: number, w: number): number {
  if (!(nFiber >= 1 && nGap >= 1 && z >= 0 && lambda > 0 && w > 0 && Number.isFinite(z))) return NaN;
  const r = (nFiber - nGap) / (nFiber + nGap);
  const k = (2 * Math.PI * nGap) / lambda, zR = (Math.PI * nGap * w * w) / lambda;
  let re = 0, im = 0, a = 1 - r * r;
  // |r| < 1/3 for indices in [1, 2], so the terms fall at least 9× per pass; stop below 1e-18.
  for (let m = 0; m < 200 && a > 1e-18; m++, a *= r * r) {
    const L = (2 * m + 1) * z, u = L / (2 * zR), den = 1 + u * u;
    const cr = Math.cos(k * L), ci = -Math.sin(k * L);
    re += (a * (cr - ci * u)) / den;
    im += (a * (ci + cr * u)) / den;
  }
  const single = 1 / (1 + (z / (2 * zR)) ** 2);
  return (re * re + im * im) / single;
}

/**
 * Fraction of the guided power reflected back into the LP01 mode by an end face polished at angle α to the normal
 * (fibre core index n₁, outside medium n₂, mode radius w). The unpolarized Fresnel reflectance at incidence α,
 * (R_s + R_p)/2, is multiplied by the coupling of the reflected beam, which travels at 2α to the axis, back into the
 * mode: Marcuse's tilt formula in the core medium, exp(−(2π n₁ w α/λ)²) (D. Marcuse, J. Lightwave Technol. 7, 336
 * (1989), https://doi.org/10.1109/50.17776 ). α = 0 gives the flat-face reflectance. Use the phase index (≈ 1.447 for
 * SMF-28 at 1550 nm), not the group index 1.4682 of datasheets. Optimistic at large α: the true LP01 far field has
 * wider tails than a Gaussian.
 * NaN for invalid input or total internal reflection (α above the critical angle).
 */
export function angledFaceReflectance(n1: number, n2: number, alpha: number, w: number, lambda: number): number {
  if (!(alpha >= 0 && alpha < Math.PI / 4)) return NaN;
  const f = fresnel(n1, n2, alpha);
  if (f.tir) return NaN;
  const back = gaussianCoupling({ w1: w, w2: w, lambda, n: n1, tilt: 2 * alpha });
  return ((f.Rs + f.Rp) / 2) * back;
}

/**
 * Waist radius of a Gaussian beam with far-field 1/e² half-angle divergence θ (paraxial NA = n sin θ ≈ nθ):
 * w₀ = λ/(π·NA). H. Kogelnik & T. Li, Appl. Opt. 5, 1550 (1966), https://doi.org/10.1364/AO.5.001550 .
 */
export function waistFromNA(NA: number, lambda: number): number {
  if (!(NA > 0 && lambda > 0)) return NaN;
  return lambda / (Math.PI * NA);
}

/** Longest end-face gap, m, for which gapEtalonTransmission × gaussianCoupling stays within 0.02 dB of the multi-pass beam sum. */
export const MAX_CONNECTOR_GAP = 5e-6;

/**
 * IEC 61753-1 single-mode attenuation grades, random mate: mean and the limit met by > 97 % of connections (dB).
 * Grade A is not yet defined. Source: P. Kolesar, IEEE 802.3bm SMF ad hoc, 30 Apr 2013, slide 6.
 */
export const IEC_IL_GRADES: Readonly<Record<string, { mean: number; max: number; note: string }>> = {
  B: { mean: 0.12, max: 0.25, note: "" },
  C: { mean: 0.25, max: 0.5, note: "un-tuned LC" },
  D: { mean: 0.5, max: 1.0, note: "MPO" },
};

/** IEC 61753-1 single-mode return-loss grades, random mate (dB); grade 1 is 55 dB unmated. Same source. */
export const IEC_RL_GRADES: Readonly<Record<string, { rl: number; note: string }>> = {
  "1": { rl: 60, note: "APC" },
  "2": { rl: 45, note: "" },
  "3": { rl: 35, note: "" },
  "4": { rl: 26, note: "" },
};

export interface ConnectorJoint {
  /** Mode-field radius of both fibres (MFD/2), m. */
  w: number;
  lambda: number;
  /** Fibre phase index, ≥ 1. */
  nFiber: number;
  /** Gap medium index, ≥ 1. */
  nGap: number;
  /** Lateral offset, m, ≥ 0. */
  offset: number;
  /** Tilt, rad, 0 ≤ θ < 30°. */
  tilt: number;
  /** End-face gap, m, 0 ≤ z ≤ MAX_CONNECTOR_GAP. */
  gap: number;
}

export interface ConnectorLoss {
  /** Each effect alone, then the combined joint, dB; NaN for invalid input. */
  lateral: number;
  angular: number;
  gap: number;
  total: number;
  /** Return loss of the gap alone, −10 log₁₀(1 − T_Airy), dB; Infinity at physical contact. */
  jointReturnLoss: number;
}

/**
 * Loss of one connector joint of two identical fibres: offset, tilt and gap alone, and all together with the Airy
 * reflections of the gap (gapEtalonTransmission) and the unfavourable tilt sense. At physical contact (z = 0) the tilt
 * happens in glass, across a gap in the gap medium.
 */
export function connectorLoss(p: ConnectorJoint): ConnectorLoss {
  const { w, lambda, nFiber, nGap, offset, tilt, gap } = p;
  const valid = w > 0 && lambda > 0 && offset >= 0 && tilt >= 0 && tilt < (30 * Math.PI) / 180 &&
    gap >= 0 && gap <= MAX_CONNECTOR_GAP * (1 + 1e-12) && nFiber >= 1 && nGap >= 1;
  if (!valid) return { lateral: NaN, angular: NaN, gap: NaN, total: NaN, jointReturnLoss: NaN };
  const joint = { w1: w, w2: w, lambda, n: gap === 0 ? nFiber : nGap };
  const etalon = gapEtalonTransmission(nFiber, nGap, gap, lambda);
  return {
    lateral: lossDb(gaussianCoupling({ ...joint, offset })),
    angular: lossDb(gaussianCoupling({ ...joint, tilt })),
    gap: lossDb(gaussianCoupling({ ...joint, gap }) * etalon),
    total: lossDb(gaussianCouplingWorstTilt({ ...joint, offset, tilt, gap }) * etalon),
    jointReturnLoss: -10 * Math.log10(1 - etalon),
  };
}
