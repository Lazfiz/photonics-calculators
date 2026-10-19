import { hc_eV_nm } from "../constants";

/**
 * Stokes shift between an absorption maximum λ_abs and an emission maximum λ_em (both in nm, vacuum):
 * Δλ = λ_em − λ_abs, Δν̃ = 10⁷ (1/λ_abs − 1/λ_em) cm⁻¹, ΔE = hc (1/λ_abs − 1/λ_em) (Lakowicz, Principles of Fluorescence
 * Spectroscopy, 3rd ed., ch. 1). Negative values mean anti-Stokes emission. NaN unless both wavelengths are > 0.
 */
export function stokesShift(absNm: number, emNm: number): { dNm: number; dCm: number; dEv: number } {
  if (!(absNm > 0 && emNm > 0)) return { dNm: NaN, dCm: NaN, dEv: NaN };
  const inv = 1 / absNm - 1 / emNm; // nm⁻¹
  return { dNm: emNm - absNm, dCm: 1e7 * inv, dEv: hc_eV_nm * inv };
}
