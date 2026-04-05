import { calculateEducationalContinuousMpe } from "./laser-safety-mpe";

export const cwPointSourceAssumptions = [
  "CW / continuous exposure only (no pulse train, no Q-switch, no ultrafast, no PRF rules).",
  "Small-source / point-source ocular thermal branch only.",
  "Supported wavelength window: 400–1050 nm.",
  "Supported exposure window: 1 ms to 10 s.",
  "Direct-beam geometric pre-check only — no extended source, scan failure, diffuse reflection, limiting-aperture, or product-classification logic.",
  "Engineering pre-check only. Formal safety sign-off still requires ANSI Z136.1 / IEC 60825-1 review and CLSO / LSO oversight.",
];

export function circularBeamAreaCm2(beamDiameterMm: number) {
  const diameterCm = beamDiameterMm / 10;
  return Math.PI * Math.pow(diameterCm / 2, 2);
}

export function cornealIrradianceWcm2(powerMw: number, beamDiameterMm: number) {
  const powerW = powerMw / 1000;
  const areaCm2 = circularBeamAreaCm2(beamDiameterMm);
  return powerW / areaCm2;
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
  const powerW = powerMw / 1000;
  const beamDiameterCm = beamDiameterMm / 10;
  const divergenceRad = divergenceMrad / 1000; // full-angle in mrad → rad

  const requiredDiameterCm = Math.sqrt((4 * powerW) / (Math.PI * targetIrradianceWcm2));
  const nohdM = divergenceRad <= 0 ? 0 : Math.max(0, (requiredDiameterCm - beamDiameterCm) / (100 * divergenceRad));
  const diameterAtNohdCm = beamDiameterCm + 100 * nohdM * divergenceRad;

  return {
    status: "supported" as const,
    mpe,
    targetIrradianceWcm2,
    nohdM,
    diameterAtNohdCm,
    irradianceAtDistance: (distanceM: number) => {
      const diameterCm = beamDiameterCm + 100 * distanceM * divergenceRad;
      const areaCm2 = (Math.PI / 4) * diameterCm * diameterCm;
      return powerW / areaCm2;
    },
  };
}
