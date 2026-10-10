/**
 * CIE photopic luminous efficiency V(λ) and standard illuminant D65, 380–780 nm in 5 nm steps, and the
 * luminous (D65 × V-weighted) mean of a spectral quantity: the luminous transmittance or reflectance of
 * glazing (ISO 9050, EN 410: τ_v = Σ τ(λ) D65(λ) V(λ) Δλ / Σ D65(λ) V(λ) Δλ, 380–780 nm). Model tier: exact.
 *
 * Sources (values copied from the CIE's own data files, every 5th row of the 1 nm tables):
 * - CIE (2019), "CIE spectral luminous efficiency for photopic vision", CIE dataset, doi:10.25039/CIE.DS.dktna2s3
 *   (the CIE 1924 V(λ); 1 at 555 nm).
 * - CIE (2022), "CIE standard illuminant D65", CIE dataset, doi:10.25039/CIE.DS.hjfjmt59 (100 at 560 nm).
 */

/** Wavelengths of the tables, nm: 380, 385, …, 780 (81 values). */
export const CIE_WAVELENGTHS_NM: readonly number[] = Array.from({ length: 81 }, (_, i) => 380 + 5 * i);

/** Photopic V(λ) at CIE_WAVELENGTHS_NM. */
export const CIE_V_PHOTOPIC: readonly number[] = [
  3.9e-05, 6.4e-05, 0.00012, 0.000217, 0.000396, 0.00064, 0.00121, 0.00218, 0.004, 0.0073, 0.0116,
  0.01684, 0.023, 0.0298, 0.038, 0.048, 0.06, 0.0739, 0.09098, 0.1126, 0.13902, 0.1693, 0.20802, 0.2586,
  0.323, 0.4073, 0.503, 0.6082, 0.71, 0.7932, 0.862, 0.91485, 0.954, 0.9803, 0.99495, 1, 0.995, 0.9786,
  0.952, 0.9154, 0.87, 0.8163, 0.757, 0.6949, 0.631, 0.5668, 0.503, 0.4412, 0.381, 0.321, 0.265, 0.217,
  0.175, 0.1382, 0.107, 0.0816, 0.061, 0.04458, 0.032, 0.0232, 0.017, 0.01192, 0.00821, 0.005723,
  0.004102, 0.002929, 0.002091, 0.001484, 0.001047, 0.00074, 0.00052, 0.0003611, 0.0002492, 0.0001719,
  0.00012, 8.48e-05, 6e-05, 4.24e-05, 3e-05, 2.12e-05, 1.499e-05,
];

/** Relative spectral power of illuminant D65 at CIE_WAVELENGTHS_NM. */
export const CIE_D65: readonly number[] = [
  49.9755, 52.3118, 54.6482, 68.7015, 82.7549, 87.1204, 91.486, 92.4589, 93.4318, 90.057, 86.6823,
  95.7736, 104.865, 110.936, 117.008, 117.41, 117.812, 116.336, 114.861, 115.392, 115.923, 112.367,
  108.811, 109.082, 109.354, 108.578, 107.802, 106.296, 104.79, 106.239, 107.689, 106.047, 104.405,
  104.225, 104.046, 102.023, 100, 98.1671, 96.3342, 96.0611, 95.788, 92.2368, 88.6856, 89.3459, 90.0062,
  89.8026, 89.5991, 88.6489, 87.6987, 85.4936, 83.2886, 83.4939, 83.6992, 81.863, 80.0268, 80.1207,
  80.2146, 81.2462, 82.2778, 80.281, 78.2842, 74.0027, 69.7213, 70.6652, 71.6091, 72.979, 74.349,
  67.9765, 61.604, 65.7448, 69.8856, 72.4863, 75.087, 69.3398, 63.5927, 55.0054, 46.4182, 56.6118,
  66.8054, 65.0941, 63.3828,
];

/**
 * Luminous mean Σ f D65 V / Σ D65 V over 380–780 nm, summed on the 5 nm grid. f takes a
 * vacuum wavelength in m. NaN if f returns NaN.
 */
export function luminousWeightedMean(f: (wavelength: number) => number): number {
  let num = 0;
  let den = 0;
  for (let i = 0; i < CIE_WAVELENGTHS_NM.length; i++) {
    const w = CIE_D65[i] * CIE_V_PHOTOPIC[i];
    num += w * f(CIE_WAVELENGTHS_NM[i] * 1e-9);
    den += w;
  }
  return num / den;
}
