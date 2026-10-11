/**
 * CIE 1931 colorimetry on the 5 nm grid of cie-photometry.ts (380–780 nm): tristimulus values of a transmission
 * spectrum under illuminant D65 and their sRGB display colour. Model tier: exact (the CIE definitions, sampled at
 * 5 nm as CIE 15 permits).
 *
 * Sources:
 * - CIE (2019), "CIE 1931 colour-matching functions, 2 degree observer", CIE dataset, doi:10.25039/CIE.DS.xvudnb9b:
 *   x̄ and z̄ below are every 5th row of its 1 nm file; ȳ equals V(λ) (cie-photometry.ts), as the dataset states.
 * - IEC 61966-2-1:1999, "Default RGB colour space – sRGB": linear RGB = M · XYZ with the D65-white matrix below, then
 *   the transfer function 12.92 C (C ≤ 0.0031308) or 1.055 C^(1/2.4) − 0.055.
 *
 * Normalisation: XYZ = Σ T(λ) S(λ) c̄(λ) / Σ S(λ) ȳ(λ), so a clear sample (T ≡ 1) has Y = 1 and its chromaticity is
 * that of the illuminant (D65: x = 0.3127, y = 0.3290).
 */
import { CIE_D65, CIE_V_PHOTOPIC, CIE_WAVELENGTHS_NM } from "./cie-photometry";

export type XYZ = [number, number, number];
export type RGB = [number, number, number];

/** x̄(λ) at CIE_WAVELENGTHS_NM. */
export const CIE_X_BAR: readonly number[] = [
  0.001368, 0.002236, 0.004243, 0.00765, 0.01431, 0.02319, 0.04351, 0.07763, 0.13438, 0.21477, 0.2839, 0.3285,
  0.34828, 0.34806, 0.3362, 0.3187, 0.2908, 0.2511, 0.19536, 0.1421, 0.09564, 0.05795001, 0.03201, 0.0147,
  0.0049, 0.0024, 0.0093, 0.0291, 0.06327, 0.1096, 0.1655, 0.2257499, 0.2904, 0.3597, 0.4334499, 0.5120501,
  0.5945, 0.6784, 0.7621, 0.8425, 0.9163, 0.9786, 1.0263, 1.0567, 1.0622, 1.0456, 1.0026, 0.9384, 0.8544499,
  0.7514, 0.6424, 0.5419, 0.4479, 0.3608, 0.2835, 0.2187, 0.1649, 0.1212, 0.0874, 0.0636, 0.04677, 0.0329,
  0.0227, 0.01584, 0.01135916, 0.008110916, 0.005790346, 0.004109457, 0.002899327, 0.00204919, 0.001439971,
  0.0009999493, 0.0006900786, 0.0004760213, 0.0003323011, 0.0002348261, 0.0001661505, 0.000117413, 8.307527e-05,
  5.870652e-05, 4.150994e-05,
];

/** z̄(λ) at CIE_WAVELENGTHS_NM. */
export const CIE_Z_BAR: readonly number[] = [
  0.006450001, 0.01054999, 0.02005001, 0.03621, 0.06785001, 0.1102, 0.2074, 0.3713, 0.6456, 1.0390501, 1.3856,
  1.62296, 1.74706, 1.7826, 1.77211, 1.7441, 1.6692, 1.5281, 1.28764, 1.0419, 0.8129501, 0.6162, 0.46518, 0.3533,
  0.272, 0.2123, 0.1582, 0.1117, 0.07824999, 0.05725001, 0.04216, 0.02984, 0.0203, 0.0134, 0.008749999,
  0.005749999, 0.0039, 0.002749999, 0.0021, 0.0018, 0.001650001, 0.0014, 0.0011, 0.001, 0.0008, 0.0006, 0.00034,
  0.00024, 0.00019, 0.0001, 4.999999e-05, 3e-05, 2e-05, 1e-05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

/** Wavelengths of the colour grid, m. */
export const COLOUR_WAVELENGTHS: readonly number[] = CIE_WAVELENGTHS_NM.map((nm) => nm * 1e-9);

/** Per-wavelength weights S·x̄, S·ȳ, S·z̄ divided by Σ S·ȳ, for an illuminant S on the grid. */
export function colourWeights(illuminant: readonly number[] = CIE_D65): { wx: number[]; wy: number[]; wz: number[] } {
  const norm = illuminant.reduce((s, v, i) => s + v * CIE_V_PHOTOPIC[i], 0);
  return {
    wx: illuminant.map((v, i) => (v * CIE_X_BAR[i]) / norm),
    wy: illuminant.map((v, i) => (v * CIE_V_PHOTOPIC[i]) / norm),
    wz: illuminant.map((v, i) => (v * CIE_Z_BAR[i]) / norm),
  };
}

const D65_WEIGHTS = colourWeights();

/** XYZ of a transmission spectrum sampled at COLOUR_WAVELENGTHS (81 values), under D65 unless weights are given. */
export function xyzFromSamples(T: readonly number[], w = D65_WEIGHTS): XYZ {
  let X = 0, Y = 0, Z = 0;
  for (let i = 0; i < T.length; i++) {
    X += T[i] * w.wx[i];
    Y += T[i] * w.wy[i];
    Z += T[i] * w.wz[i];
  }
  return [X, Y, Z];
}

/** XYZ of a transmission function T(λ), λ in m, under D65. */
export function xyzOfTransmission(T: (lambda: number) => number): XYZ {
  return xyzFromSamples(COLOUR_WAVELENGTHS.map(T));
}

/** Chromaticity (x, y); NaN for black. */
export function chromaticity([X, Y, Z]: XYZ): [number, number] {
  const s = X + Y + Z;
  return s > 0 ? [X / s, Y / s] : [NaN, NaN];
}

/** Linear sRGB from XYZ (IEC 61966-2-1), unclipped. */
export function linearSrgb([X, Y, Z]: XYZ): RGB {
  return [
    3.2406 * X - 1.5372 * Y - 0.4986 * Z,
    -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
    0.0557 * X - 0.204 * Y + 1.057 * Z,
  ];
}

/** sRGB transfer function for one linear channel clipped to [0, 1]. */
export function srgbEncode(c: number): number {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

/** Display sRGB in [0, 1] from XYZ; out-of-gamut channels are clipped. */
export function srgbFromXyz(xyz: XYZ): RGB {
  const [r, g, b] = linearSrgb(xyz);
  return [srgbEncode(r), srgbEncode(g), srgbEncode(b)];
}

/** CSS rgb() string from display sRGB in [0, 1]. */
export function cssRgb([r, g, b]: RGB): string {
  return `rgb(${Math.round(255 * r)}, ${Math.round(255 * g)}, ${Math.round(255 * b)})`;
}
