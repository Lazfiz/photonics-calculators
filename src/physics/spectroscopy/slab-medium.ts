/**
 * Slab media of the optical-path-length page: a custom index pair or one of four glasses whose phase index n and
 * group index n_g = n − λ dn/dλ come from the Sellmeier models in `physics/materials`. Kept apart from
 * `optical-path-length.ts` so that module stays free of the dispersion tables. SI units (m).
 */
import { groupIndex, inRange, refractiveIndex, type SellmeierModel } from "../materials/sellmeier";
import { MATERIALS, SCHOTT_GLASSES } from "../materials/sellmeier-data";

/** The page's glass options, in its order. */
export const SLAB_GLASSES: Record<string, { name: string; model: SellmeierModel }> = {
  fusedSilica: MATERIALS.fusedSilica,
  "N-BK7": SCHOTT_GLASSES["N-BK7"],
  "N-SF11": SCHOTT_GLASSES["N-SF11"],
  caf2: MATERIALS.caf2,
};

/**
 * n and n_g of a slab medium at vacuum wavelength λ (m). A glass id gives the Sellmeier values (NaN with
 * `inRange` false outside the formula's range); any other id is "custom" and returns nCustom and ngCustom.
 */
export function slabIndices(
  material: string, lambda: number, nCustom: number, ngCustom: number,
): { n: number; ng: number; glass: boolean; inRange: boolean } {
  const glass = Object.hasOwn(SLAB_GLASSES, material) ? SLAB_GLASSES[material] : undefined;
  if (!glass) return { n: nCustom, ng: ngCustom, glass: false, inRange: true };
  const ok = inRange(glass.model, lambda);
  return {
    n: ok ? refractiveIndex(glass.model, lambda) : NaN,
    ng: ok ? groupIndex(glass.model, lambda) : NaN,
    glass: true,
    inRange: ok,
  };
}
