/**
 * Absorption depth of tabulated absorbers (crystalline silicon, liquid water) or a given α: δ = 1/α, the depth that
 * absorbs 90 % and the fraction absorbed within a thickness, from the Beer–Lambert relations in ./depth. Kept apart
 * from ./depth so the pages that only need those relations don't load the α tables.
 */
import { SILICON_LAMBDA_MAX, SILICON_LAMBDA_MIN, siliconAbsorption } from "../materials/silicon-absorption";
import { WATER_LAMBDA_MAX, WATER_LAMBDA_MIN, waterAbsorption } from "../materials/water-absorption";
import { absorbedFraction, absorptionDepth, depthForAbsorbedFraction } from "./depth";

export type AbsorberMaterial = "silicon" | "water" | "custom";

/** Tabulated absorbers: α(λ) in 1/m for λ in m, and the table range in m. */
export const ABSORBER_MODELS = {
  silicon: { alpha: siliconAbsorption, min: SILICON_LAMBDA_MIN, max: SILICON_LAMBDA_MAX },
  water: { alpha: waterAbsorption, min: WATER_LAMBDA_MIN, max: WATER_LAMBDA_MAX },
} as const;

/**
 * α (1/m), δ = 1/α, the depth for 90 % absorbed and the fraction absorbed within thickness d (m), for a tabulated
 * material at wavelength λ (m) or, for "custom", the given α (1/m).
 */
export function absorptionSummary(material: AbsorberMaterial, lambda: number, customAlpha: number, thickness: number) {
  const alpha = material === "custom" ? customAlpha : ABSORBER_MODELS[material].alpha(lambda);
  return {
    alpha,
    delta: absorptionDepth(alpha),
    d90: depthForAbsorbedFraction(alpha, 0.9),
    absorbed: absorbedFraction(alpha, thickness),
  };
}
