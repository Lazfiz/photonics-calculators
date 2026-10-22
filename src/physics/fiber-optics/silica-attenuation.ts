/**
 * Spectral attenuation of germania-doped silica fibre: Rayleigh scattering, infrared and ultraviolet absorption
 * tails, and the OH (water) bands at 943, 1383 and 2722 nm. Wavelengths in m; losses in dB/km (the unit fibre data use).
 * Model tier: textbook approximation (empirical fits); the OH band shapes are illustrative.
 *
 *   Rayleigh      α_R = A/λ⁴, λ in µm, A ≈ 0.7–0.9 dB·km⁻¹·µm⁴ depending on the core dopants
 *                 (Agrawal, Fiber-Optic Communication Systems, 4th ed., 2010, §2.5).
 *   Infrared      α_IR = 7.81×10¹¹ exp(−48.48/λ), λ in µm (Keiser, Optical Fiber Communications, 4th ed., 2010,
 *                 §3.1, after Osanai et al., Electron. Lett. 12, 549 (1976), doi 10.1049/el:19760418).
 *   Ultraviolet   α_UV = 154.2x/(46.6x + 60) × 10⁻² exp(4.63/λ), x = GeO₂ mole fraction (same sources).
 *   OH bands      Gaussians at the band positions of Humbach et al., J. Non-Cryst. Solids 203, 19 (1996),
 *                 doi 10.1016/0022-3093(96)00329-8 (positions as tabulated in arXiv:1402.0466, Table 2), each scaled
 *                 from the 1383 nm peak height α_OH by its strength per ppm (weight) of OH, in OH_BANDS.
 *                 The 1383 nm band has an illustrative 30 nm FWHM, and the others the same width in wavenumber
 *                 (157 cm⁻¹). 1 ppm gives 62.7 dB/km at 1383 nm, so 0.5 dB/km is 8 ppb. The 1246 and 2212 nm
 *                 combination bands are listed without a strength (no open source found), so they are not modelled.
 * Not included: waveguide imperfection and bend losses, hydrogen ageing, and the absorption of other impurities.
 * With A = 0.85 and x = 0.04 the total is 0.323 dB/km at 1310 nm and 0.187 dB/km at 1550 nm, typical of G.652.D fibre.
 */

export const OH_PEAK_WAVELENGTH = 1383e-9;
/** Illustrative full width at half maximum of the 1383 nm OH band, m. */
export const OH_BAND_FWHM = 30e-9;
/** First-overtone strength, dB/km per ppm (weight) of OH at 1383 nm (Humbach 1996, as quoted in arXiv:2303.17814 Table I). */
export const OH_1383_DB_PER_KM_PER_PPM = 62.7;

/** Density of fused silica, kg/m³ (Corning HPFS 7980 data sheet: 2.201 g/cm³). */
const SILICA_DENSITY = 2201;
/** Molar mass of OH, kg/mol (IUPAC standard atomic weights: O 15.999, H 1.008). */
const M_OH = 17.007e-3;

/**
 * Loss in dB/km per ppm (weight) of OH from a molar decadic absorption coefficient ε (m²/mol): 1 ppm is
 * c = ρ·10⁻⁶/M_OH mol/m³, the decadic coefficient is ε c per m, and dB/km = 10 · ε c · 1000.
 */
export function ohDbPerKmPerPpm(epsilon: number): number {
  return 10 * epsilon * ((SILICA_DENSITY * 1e-6) / M_OH) * 1000;
}

export interface OhBand {
  /** Peak wavelength, m (Humbach 1996). */
  wavelength: number;
  assignment: string;
  /** Peak loss per ppm (weight) of OH, dB/km; NaN where no open source gives it (band not modelled). */
  dbPerKmPerPpm: number;
  source: string;
}

/**
 * OH absorption bands of silica, 0.9–2.8 µm. ν₃ is the OH stretch and ν₁ the SiO₄ tetrahedron vibration (Humbach 1996).
 * - 2722 nm: ε = 77.5 L mol⁻¹ cm⁻¹ = 7.75 m²/mol (Hetherington & Jack, Phys. Chem. Glasses 3, 129 (1962)), ≈ 1.0 × 10⁴ dB/km/ppm.
 * - 943 nm: 12 dB/km for 10 ppm (Philen, Bell Syst. Tech. J. 61, 283 (1982), doi 10.1002/j.1538-7305.1982.tb03407.x).
 */
const NM = 1e-9;
export const OH_BANDS: OhBand[] = [
  { wavelength: 943 * NM, assignment: "3ν₃ (second overtone)", dbPerKmPerPpm: 1.2, source: "Philen 1982" },
  { wavelength: 1246 * NM, assignment: "2ν₃ + ν₁ (combination)", dbPerKmPerPpm: NaN, source: "—" },
  { wavelength: 1383 * NM, assignment: "2ν₃ (first overtone)", dbPerKmPerPpm: OH_1383_DB_PER_KM_PER_PPM, source: "Humbach 1996" },
  { wavelength: 2212 * NM, assignment: "ν₃ + ν₁ (combination)", dbPerKmPerPpm: NaN, source: "—" },
  { wavelength: 2722 * NM, assignment: "ν₃ (fundamental stretch)", dbPerKmPerPpm: ohDbPerKmPerPpm(7.75), source: "Hetherington & Jack 1962" },
];

/** FWHM of an OH band, m: the 1383 nm width at the same wavenumber width, Δλ ∝ λ². */
export const ohBandFwhm = (wavelength: number) => OH_BAND_FWHM * (wavelength / OH_PEAK_WAVELENGTH) ** 2;

/** OH content (ppm by weight) that gives an excess loss α_OH (dB/km) at the 1383 nm peak. */
export const ohContentPpm = (ohPeakDbPerKm: number) => ohPeakDbPerKm / OH_1383_DB_PER_KM_PER_PPM;

/** ITU-T G.694.2 CWDM grid: 18 channels, 1271–1611 nm in 20 nm steps (m). */
export const CWDM_CHANNELS = Array.from({ length: 18 }, (_, i) => (1271 + 20 * i) * 1e-9);

export interface SilicaLossParams {
  /** Rayleigh coefficient A, dB·km⁻¹·µm⁴, > 0. */
  rayleighA: number;
  /** GeO₂ mole fraction x in the core, 0 ≤ x < 1. */
  geO2Fraction: number;
  /** Excess OH loss at the 1383 nm peak, dB/km, ≥ 0; it sets the OH content, which scales the other bands. */
  ohPeakDbPerKm: number;
}

export interface SilicaLoss {
  rayleigh: number;
  infrared: number;
  ultraviolet: number;
  oh: number;
  total: number;
}

const valid = (p: SilicaLossParams, lambda: number) =>
  p.rayleighA > 0 && p.geO2Fraction >= 0 && p.geO2Fraction < 1 && p.ohPeakDbPerKm >= 0 && lambda > 0 && Number.isFinite(lambda);

/** Loss terms at vacuum wavelength λ (m), dB/km. NaN fields outside the domain. */
export function silicaLossDbPerKm(p: SilicaLossParams, lambda: number): SilicaLoss {
  if (!valid(p, lambda)) return { rayleigh: NaN, infrared: NaN, ultraviolet: NaN, oh: NaN, total: NaN };
  const lambda_um = lambda * 1e6;
  const x = p.geO2Fraction;
  const rayleigh = p.rayleighA / lambda_um ** 4;
  const infrared = 7.81e11 * Math.exp(-48.48 / lambda_um);
  const ultraviolet = ((154.2 * x) / (46.6 * x + 60)) * 1e-2 * Math.exp(4.63 / lambda_um);
  const ppm = ohContentPpm(p.ohPeakDbPerKm);
  let oh = 0;
  for (const b of OH_BANDS) {
    if (!Number.isFinite(b.dbPerKmPerPpm)) continue;
    const sigma = ohBandFwhm(b.wavelength) / (2 * Math.sqrt(2 * Math.LN2));
    oh += ppm * b.dbPerKmPerPpm * Math.exp(-0.5 * ((lambda - b.wavelength) / sigma) ** 2);
  }
  return { rayleigh, infrared, ultraviolet, oh, total: rayleigh + infrared + ultraviolet + oh };
}

/**
 * Wavelength of minimum total loss between 1450 and 1800 nm (m), where the loss is unimodal (falling scattering,
 * rising infrared absorption; the OH bands are outside). Golden-section search to 1e-13 m.
 */
export function minimumLossWavelength(p: SilicaLossParams): number {
  if (!valid(p, 1.55e-6)) return NaN;
  const f = (l: number) => silicaLossDbPerKm(p, l).total;
  const g = (Math.sqrt(5) - 1) / 2;
  let a = 1450e-9;
  let b = 1800e-9;
  let c = b - g * (b - a);
  let d = a + g * (b - a);
  let fc = f(c);
  let fd = f(d);
  for (let i = 0; i < 200 && b - a > 1e-13; i++) {
    if (fc < fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - g * (b - a);
      fc = f(c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + g * (b - a);
      fd = f(d);
    }
  }
  return (a + b) / 2;
}
