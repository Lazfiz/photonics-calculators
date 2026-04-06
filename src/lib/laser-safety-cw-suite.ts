import { calculateEducationalContinuousMpe } from "./laser-safety-mpe";

export const cwPointSourceAssumptions = [
  "CW / continuous exposure only (no pulse train, no Q-switch, no ultrafast, no PRF rules).",
  "Small-source / point-source direct-beam ocular branch only.",
  "Supported wavelength window: 400–1050 nm.",
  "Supported exposure window: 1 ms to 3×10^4 s, but only for explicitly implemented ANSI-style table slices.",
  "The visible long-duration branch is implemented from a secondary ANSI-style manual summary and remains bounded engineering pre-check logic, not compliance-grade standards software.",
  "Direct-beam geometric pre-check only — no extended source, scan failure, diffuse reflection, limiting-aperture, or product-classification logic.",
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

export function cornealIrradianceWcm2(powerMw: number, beamDiameterMm: number) {
  // ANSI Z136.1: CW ocular hazard uses 7mm limiting aperture (pupil diameter)
  // For beams smaller than 7mm, all power enters the eye → irradiance = P / A_pupil
  // For beams larger than 7mm, only the portion passing through the pupil matters
  const LIMITING_APERTURE_MM = 7;
  const effectiveDiameterMm = Math.min(beamDiameterMm, LIMITING_APERTURE_MM);
  const areaCm2 = circularBeamAreaCm2(effectiveDiameterMm);
  return powerMwToW(powerMw) / areaCm2;
}

export function cwPointSourceMpe(wavelengthNm: number, exposureS: number) {
  return calculateEducationalContinuousMpe(wavelengthNm, exposureS);
}

export function cwPointSourceOdPrecheck(params: {
  wavelengthNm: number;
  exposureS: number;
  powerMw: number;
  beamDiameterMm: number;
  safetyFactor?: number;
}) {
  const { wavelengthNm, exposureS, powerMw, beamDiameterMm, safetyFactor = 1 } = params;
  const mpe = cwPointSourceMpe(wavelengthNm, exposureS);
  if (mpe.status !== "supported") {
    return { status: "unsupported" as const, mpe };
  }

  const irradianceWcm2 = cornealIrradianceWcm2(powerMw, beamDiameterMm);
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
  safetyFactor?: number;
}) {
  const { wavelengthNm, exposureS, powerMw, beamDiameterMm, divergenceMrad, safetyFactor = 1 } = params;
  const mpe = cwPointSourceMpe(wavelengthNm, exposureS);
  if (mpe.status !== "supported") {
    return { status: "unsupported" as const, mpe };
  }

  const targetIrradianceWcm2 = (mpe.equivalentIrradianceMpe_mWcm2 / 1000) / safetyFactor;
  const powerW = powerMwToW(powerMw);
  const beamDiameterCm = beamDiameterMmToCm(beamDiameterMm);
  const divergenceRad = divergenceMradToRad(divergenceMrad); // full-angle in mrad → rad

  // ANSI Z136.1 NOHD: distance at which beam diameter = max(beam_initial, 7mm limiting aperture)
  // Irradiance at distance d: I = P / (π/4 × (beam_d + d×θ)²)
  // Hazard when I < MPE, i.e., beam_d + d×θ > sqrt(4P/(π·MPE))
  // The beam cannot be smaller than the 7mm pupil, so effective initial diameter = max(beam, 7mm)
  const LIMITING_APERTURE_CM = 0.7; // 7mm
  const effectiveBeamDiameterCm = Math.max(beamDiameterCm, LIMITING_APERTURE_CM);

  const requiredDiameterCm = Math.sqrt((4 * powerW) / (Math.PI * targetIrradianceWcm2));
  const nohdM = divergenceRad <= 0 ? 0 : Math.max(0, (requiredDiameterCm - effectiveBeamDiameterCm) / (100 * divergenceRad));
  const diameterAtNohdCm = effectiveBeamDiameterCm + 100 * nohdM * divergenceRad;

  return {
    status: "supported" as const,
    mpe,
    targetIrradianceWcm2,
    nohdM,
    diameterAtNohdCm,
    irradianceAtDistance: (distanceM: number) => {
      const diameterCm = beamDiameterCm + 100 * distanceM * divergenceRad;
      // At large distances beam exceeds 7mm pupil — use actual beam area
      const effectiveDiameterCm = Math.max(diameterCm, LIMITING_APERTURE_CM);
      const areaCm2 = (Math.PI / 4) * effectiveDiameterCm * effectiveDiameterCm;
      return powerW / areaCm2;
    },
  };
}
