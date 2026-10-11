/**
 * Photoelastic retardance of a plate under in-plane stress, and the Kirsch field around a circular hole.
 * Model tier: textbook approximation (linear stress-optic law, plane stress, infinite plate).
 *
 * - Stress-optic law: the principal stress directions are the birefringence axes and
 *   R = C d (σ₁ − σ₂), Γ = 2πR/λ, with C the stress-optic coefficient (Pa⁻¹) and d the thickness
 *   (Dally & Riley, Experimental Stress Analysis, 4th ed., chapter "Theory of photoelasticity").
 * - Kirsch (1898): uniaxial tension S along x in an infinite plate with a hole of radius a, polar (r, θ) from x
 *   (Timoshenko & Goodier, Theory of Elasticity, 3rd ed., art. 35):
 *     σ_rr = S/2 (1 − a²/r²) + S/2 (1 − 4a²/r² + 3a⁴/r⁴) cos 2θ
 *     σ_θθ = S/2 (1 + a²/r²) − S/2 (1 + 3a⁴/r⁴) cos 2θ
 *     τ_rθ = −S/2 (1 + 2a²/r² − 3a⁴/r⁴) sin 2θ
 *   giving the stress concentration σ_θθ = 3S at (a, 90°) and −S at (a, 0).
 * - N-BK7: K = 2.77 × 10⁻⁶ mm²/N = 2.77 × 10⁻¹² Pa⁻¹ (Schott N-BK7 data sheet, stress optical coefficient).
 */

/** Stress-optic coefficient of N-BK7, Pa⁻¹ (Schott data sheet). */
export const C_NBK7 = 2.77e-12;

export interface PolarStress {
  srr: number;
  stt: number;
  srt: number;
}

/** Kirsch stresses (Pa) at (r, θ) for remote tension S (Pa) along x and hole radius a; NaN inside the hole. */
export function kirschStress(S: number, a: number, r: number, theta: number): PolarStress {
  if (!(a > 0 && r >= a)) return { srr: NaN, stt: NaN, srt: NaN };
  const q2 = (a * a) / (r * r), q4 = q2 * q2;
  const c = Math.cos(2 * theta), s = Math.sin(2 * theta);
  return {
    srr: (S / 2) * (1 - q2) + (S / 2) * (1 - 4 * q2 + 3 * q4) * c,
    stt: (S / 2) * (1 + q2) - (S / 2) * (1 + 3 * q4) * c,
    srt: (-S / 2) * (1 + 2 * q2 - 3 * q4) * s,
  };
}

/**
 * Principal stress difference σ₁ − σ₂ ≥ 0 (Pa) and the lab azimuth of σ₁ (rad) from polar components at angle θ
 * (Mohr's circle).
 */
export function principalStresses({ srr, stt, srt }: PolarStress, theta: number): { diff: number; azimuth: number } {
  return {
    diff: Math.hypot(srr - stt, 2 * srt),
    azimuth: theta + 0.5 * Math.atan2(2 * srt, srr - stt),
  };
}

/** Photoelastic path difference R = C d (σ₁ − σ₂), m. */
export const photoelasticRetardance = (C: number, d: number, diff: number) => C * d * diff;

/**
 * Largest retardance in the Kirsch field, m: σ₁ − σ₂ peaks at 3S on the hole edge across the load, (a, ±90°), where
 * σ_θθ = 3S and σ_rr = τ_rθ = 0 (Timoshenko & Goodier art. 35), so R_max = 3 S C d.
 */
export const kirschMaxRetardance = (S: number, C: number, d: number) => photoelasticRetardance(C, d, 3 * Math.abs(S));

/**
 * Retardance (m) and σ₁ azimuth (rad) on an N×N grid spanning ±halfWidth (m) around the hole centre, row 0 at +y; NaN
 * inside the hole. Remote tension S (Pa) along x, hole radius a (m), stress-optic coefficient C (Pa⁻¹), thickness d (m).
 */
export function kirschRetardanceField(
  S: number, a: number, C: number, d: number, N: number, halfWidth: number,
): { R: Float64Array; azimuth: Float64Array } {
  const R = new Float64Array(N * N), azimuth = new Float64Array(N * N);
  for (let j = 0; j < N; j++) {
    const y = (1 - (2 * (j + 0.5)) / N) * halfWidth;
    for (let i = 0; i < N; i++) {
      const x = ((2 * (i + 0.5)) / N - 1) * halfWidth;
      const r = Math.hypot(x, y), theta = Math.atan2(y, x);
      const p = principalStresses(kirschStress(S, a, r, theta), theta);
      R[j * N + i] = photoelasticRetardance(C, d, p.diff);
      azimuth[j * N + i] = p.azimuth;
    }
  }
  return { R, azimuth };
}
