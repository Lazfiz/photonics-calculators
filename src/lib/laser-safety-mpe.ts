export type SupportedMpeResult = {
  status: "supported";
  regime: string;
  scope: string;
  radiantExposureMpe_mJcm2: number;
  equivalentIrradianceMpe_mWcm2: number;
  notes: string[];
};

export type UnsupportedMpeResult = {
  status: "unsupported";
  regime: string;
  scope: string;
  reason: string;
  notes: string[];
};

export type EducationalMpeResult = SupportedMpeResult | UnsupportedMpeResult;

function correctionCa(wavelengthNm: number) {
  if (wavelengthNm < 700) return 1;
  if (wavelengthNm < 1050) return Math.pow(10, 0.002 * (wavelengthNm - 700));
  if (wavelengthNm <= 1400) return 5;
  return 1;
}

export function calculateEducationalContinuousMpe(
  wavelengthNm: number,
  exposureS: number
): EducationalMpeResult {
  const commonNotes = [
    "This calculator is intentionally quarantined to educational use only.",
    "Do not use it for PPE selection, hazard sign-off, NHZ/NOHD approval, enclosure/interlock design approval, or product classification.",
    "For real safety decisions, verify against ANSI Z136.1 / IEC 60825-1 and your CLSO / LSO workflow.",
  ];

  if (exposureS <= 0) {
    return {
      status: "unsupported",
      regime: "Invalid input",
      scope: "No result",
      reason: "Exposure time must be greater than zero.",
      notes: commonNotes,
    };
  }

  if (exposureS < 1e-3 || exposureS > 10) {
    return {
      status: "unsupported",
      regime: "Outside short-exposure window",
      scope: "Quarantined",
      reason:
        "This page only exposes the short-exposure educational branch (1 ms to 10 s). Longer-duration photochemical / blue-light corrected branches and sub-millisecond pulse rules are intentionally disabled here.",
      notes: commonNotes,
    };
  }

  if (wavelengthNm < 400 || wavelengthNm > 1050) {
    return {
      status: "unsupported",
      regime: "Outside supported ocular thermal branch",
      scope: "Quarantined",
      reason:
        "This page only returns values for a simplified small-source ocular thermal branch from 400 nm to 1050 nm. Corneal/skin regimes, UV, and >1050 nm branches are intentionally disabled rather than approximated.",
      notes: commonNotes,
    };
  }

  const thermalBase_mJcm2 = 1.8 * Math.pow(exposureS, 0.75);

  if (wavelengthNm < 700) {
    return {
      status: "supported",
      regime: wavelengthNm < 500 ? "Visible retinal thermal (blue-light long-duration branch disabled)" : "Visible retinal thermal",
      scope: "Small-source ocular thermal branch, 1 ms to 10 s",
      radiantExposureMpe_mJcm2: thermalBase_mJcm2,
      equivalentIrradianceMpe_mWcm2: thermalBase_mJcm2 / exposureS,
      notes: [
        ...commonNotes,
        "Radiant exposure H and equivalent irradiance E are shown separately to avoid mixing energy-limited and power-limited quantities.",
        "The longer-duration photochemical / C_b-corrected branch is intentionally not auto-applied on this page; blue-light cases remain educational only.",
      ],
    };
  }

  const ca = correctionCa(wavelengthNm);
  const radiantExposure = thermalBase_mJcm2 * ca;

  return {
    status: "supported",
    regime: "Near-IR retinal thermal",
    scope: "Small-source ocular thermal branch, 1 ms to 10 s",
    radiantExposureMpe_mJcm2: radiantExposure,
    equivalentIrradianceMpe_mWcm2: radiantExposure / exposureS,
    notes: [
      ...commonNotes,
      `Applied C_A correction factor: ${ca.toFixed(3)}.`,
      "This branch still omits extended-source corrections, pulse rules, and limiting-aperture details.",
    ],
  };
}
