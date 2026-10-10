import { calculateEducationalContinuousMpe, laserSafetyReferencePoints, type UnsupportedMpeResult } from "./laser-safety-mpe";

export const cwPointSourceAssumptions = [
  "CW / continuous exposure only (no pulse train, no Q-switch, no ultrafast, no PRF rules).",
  "Small-source / point-source direct-beam ocular branch only.",
  "Supported wavelength window: 400–1050 nm.",
  "Supported exposure window: 1 ms to 3×10^4 s, but only for explicitly implemented ANSI-style table slices.",
  "The visible long-duration branch is implemented from a secondary ANSI-style manual summary and remains bounded engineering pre-check logic, not compliance-grade standards software.",
  "Direct-beam geometric pre-check only, averaged over the 7 mm limiting aperture: no extended source, scan failure, diffuse reflection or product-classification logic.",
  "Beam diameter and divergence are converted to the 1/e values the standards use (1/e² values ÷ √2), so 4P/(πd²) is the Gaussian peak.",
  "Engineering pre-check only. Formal safety sign-off still requires ANSI Z136.1 / IEC 60825-1 review and CLSO / LSO oversight.",
];

export function powerMwToW(powerMw: number) {
  return powerMw / 1000;
}

export function beamDiameterMmToCm(beamDiameterMm: number) {
  return beamDiameterMm / 10;
}

export function divergenceMradToRad(divergenceMrad: number) {
  return divergenceMrad / 1000;
}

export function circularBeamAreaCm2(beamDiameterMm: number) {
  const diameterCm = beamDiameterMmToCm(beamDiameterMm);
  return Math.PI * Math.pow(diameterCm / 2, 2);
}

/** How a beam diameter or divergence is quoted: at 1/e² of the peak irradiance (data sheets) or at 1/e (the standards). */
export type BeamDefinition = "1/e2" | "1/e";

/**
 * A width as the 1/e width that ANSI Z136.1 and IEC 60825-1 use: for a Gaussian beam it is 1/√2 of the 1/e² width.
 * With the 1/e diameter d, 4P/(πd²) is the beam's peak irradiance.
 */
export function toOneOverE(width: number, definition: BeamDefinition) {
  return definition === "1/e2" ? width / Math.SQRT2 : width;
}

/** The retinal limits are averaged over a 7 mm aperture (ICNIRP 2013 Table 8; ANSI Z136.1, IEC 60825-1). */
export const LIMITING_APERTURE_MM = 7;

/**
 * Irradiance averaged over the 7 mm aperture, W/cm², for a beam of 1/e diameter `beamDiameterMm`: the peak 4P/(πd²) of
 * a wider beam, or all of P over the aperture for a narrower one. (A narrow beam's own area would overstate it.)
 */
export function cornealIrradianceWcm2(powerMw: number, beamDiameterMm: number) {
  const areaCm2 = circularBeamAreaCm2(Math.max(beamDiameterMm, LIMITING_APERTURE_MM));
  return powerMwToW(powerMw) / areaCm2;
}

export function cwPointSourceMpe(wavelengthNm: number, exposureS: number) {
  return calculateEducationalContinuousMpe(wavelengthNm, exposureS);
}

function invalidSafetyFactor(): { status: "unsupported"; mpe: UnsupportedMpeResult } {
  return {
    status: "unsupported",
    mpe: {
      status: "unsupported",
      regime: "Invalid input",
      scope: "No result",
      reason: "The safety factor must be at least 1.",
      notes: [],
      references: laserSafetyReferencePoints,
    },
  };
}

export function cwPointSourceOdPrecheck(params: {
  wavelengthNm: number;
  exposureS: number;
  powerMw: number;
  beamDiameterMm: number;
  /** How the diameter is quoted; 1/e² (data sheets) by default. */
  beamDefinition?: BeamDefinition;
  safetyFactor?: number;
}) {
  const { wavelengthNm, exposureS, powerMw, beamDiameterMm, beamDefinition = "1/e2", safetyFactor = 1 } = params;
  const mpe = cwPointSourceMpe(wavelengthNm, exposureS);
  if (mpe.status !== "supported") {
    return { status: "unsupported" as const, mpe };
  }
  if (!(safetyFactor >= 1)) return invalidSafetyFactor();

  // OD = log10(E/E_MPE) (ANSI Z136.1 App. B), E averaged over the 7 mm aperture.
  const irradianceWcm2 = cornealIrradianceWcm2(powerMw, toOneOverE(beamDiameterMm, beamDefinition));
  const targetIrradianceWcm2 = (mpe.equivalentIrradianceMpe_mWcm2 / 1000) / safetyFactor;
  const ratio = irradianceWcm2 / targetIrradianceWcm2;
  const requiredOd = Math.max(0, Math.log10(ratio));
  const transmission = Math.pow(10, -requiredOd);

  return {
    status: "supported" as const,
    mpe,
    irradianceWcm2,
    targetIrradianceWcm2,
    ratio,
    requiredOd,
    transmission,
    transmittedPowerMw: powerMw * transmission,
  };
}

export function cwPointSourceNohdPrecheck(params: {
  wavelengthNm: number;
  exposureS: number;
  powerMw: number;
  beamDiameterMm: number;
  divergenceMrad: number;
  /** How the diameter and the divergence are quoted; 1/e² (data sheets) by default. */
  beamDefinition?: BeamDefinition;
  safetyFactor?: number;
}) {
  const { wavelengthNm, exposureS, powerMw, beamDiameterMm, divergenceMrad, beamDefinition = "1/e2", safetyFactor = 1 } = params;
  const mpe = cwPointSourceMpe(wavelengthNm, exposureS);
  if (mpe.status !== "supported") {
    return { status: "unsupported" as const, mpe };
  }
  if (!(safetyFactor >= 1)) return invalidSafetyFactor();

  const targetIrradianceWcm2 = (mpe.equivalentIrradianceMpe_mWcm2 / 1000) / safetyFactor;
  const powerW = powerMwToW(powerMw);
  const beamDiameterCm = beamDiameterMmToCm(toOneOverE(beamDiameterMm, beamDefinition)); // 1/e
  const divergenceRad = divergenceMradToRad(toOneOverE(divergenceMrad, beamDefinition)); // 1/e full angle
  const LIMITING_APERTURE_CM = LIMITING_APERTURE_MM / 10;

  // The 1/e diameter at distance r is a + rφ, and the irradiance through the 7 mm aperture 4P/(π max(a + rφ, 7 mm)²).
  // It exceeds the target while a + rφ < D = √(4P/(π E)), so NOHD = (D − a)/φ (ANSI Z136.1 App. B; IEC TR 60825-14).
  // The beam starts at a, not at 7 mm. Nothing is hazardous if D ≤ max(a, 7 mm); a beam that doesn't spread stays so.
  const requiredDiameterCm = Math.sqrt((4 * powerW) / (Math.PI * targetIrradianceWcm2));
  const hazardous = requiredDiameterCm > Math.max(beamDiameterCm, LIMITING_APERTURE_CM);
  const nohdM = !hazardous ? 0 : divergenceRad > 0 ? (requiredDiameterCm - beamDiameterCm) / (100 * divergenceRad) : Infinity;
  const diameterAtNohdCm = hazardous ? requiredDiameterCm : beamDiameterCm;

  return {
    status: "supported" as const,
    mpe,
    targetIrradianceWcm2,
    nohdM,
    diameterAtNohdCm,
    irradianceAtDistance: (distanceM: number) => {
      const diameterCm = beamDiameterCm + 100 * distanceM * divergenceRad;
      const effectiveDiameterCm = Math.max(diameterCm, LIMITING_APERTURE_CM);
      const areaCm2 = (Math.PI / 4) * effectiveDiameterCm * effectiveDiameterCm;
      return powerW / areaCm2;
    },
  };
}
