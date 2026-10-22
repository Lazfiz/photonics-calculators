/**
 * Stress-optic coefficients of isotropic glasses, for the stress-optic law Δn = C (σ₁ − σ₂) and the plate retardance
 * R = C d (σ₁ − σ₂) of `polarization/photoelasticity.ts`.
 * Model tier: textbook approximation (linear stress-optic law, isotropic glass, one wavelength).
 *
 * - Schott glasses: K in 10⁻⁶ mm²/N = 10⁻¹² Pa⁻¹ (Schott optical glass data sheets, 2017-01-20). N-BK7 is not in that
 *   collection; its K equals N-BK7HT's 2.77 (and `C_NBK7` in photoelasticity.ts, from the N-BK7 sheet).
 * - Fused silica: C = 3.55 brewsters (10⁻¹² Pa⁻¹) at 649.5 nm, Filon & Harris' mean value; C rises to 3.58 at 589.6 nm and
 *   3.75 at 460.3 nm (Jog 1957, J. Indian Inst. Sci. 39(2), 93, Table I).
 * - A crystal has a stress-optic tensor, not one C: its birefringence depends on the stress and light directions.
 */

export type StressOpticId =
  | "silica" | "n-bk7" | "n-bak4" | "n-fk51a" | "f2" | "sf10" | "sf11" | "n-sf11" | "sf6" | "n-sf6" | "sf57" | "n-sf57" | "n-lasf9";

export interface StressOpticGlass {
  name: string;
  /** Stress-optic coefficient, Pa⁻¹. */
  C: number;
  source: string;
}

const schott = (name: string, K: number): StressOpticGlass => ({ name, C: K * 1e-12, source: "Schott data sheet" });

export const STRESS_OPTIC: Record<StressOpticId, StressOpticGlass> = {
  silica: { name: "Fused silica", C: 3.55e-12, source: "Jog 1957 (Filon & Harris), 649.5 nm" },
  "n-bk7": { name: "N-BK7", C: 2.77e-12, source: "Schott data sheet (N-BK7HT)" },
  "n-bak4": schott("N-BAK4", 2.9),
  "n-fk51a": schott("N-FK51A", 0.7),
  f2: schott("F2", 2.81),
  sf10: schott("SF10", 1.95),
  sf11: schott("SF11", 1.33),
  "n-sf11": schott("N-SF11", 2.94),
  sf6: schott("SF6", 0.65),
  "n-sf6": schott("N-SF6", 2.82),
  sf57: schott("SF57", 0.02),
  "n-sf57": schott("N-SF57", 2.78),
  "n-lasf9": schott("N-LASF9", 1.72),
};

/** Principal stress difference (Pa) that gives retardance R (m) in a plate of thickness d (m): R / (C d). */
export const stressForRetardance = (R: number, C: number, d: number) => (C !== 0 && d > 0 ? R / (C * d) : NaN);
