export const laserSafetyReferencePoints = [
  "ANSI Z136.1 — ocular MPE tables, correction-factor framework (C_A / C_B), limiting apertures, and time-domain rules.",
  "IEC 60825-1 — product-classification / AEL framework (separate from this bounded pre-check suite).",
  "OSHA Technical Manual, Section III Chapter 6 — visible blue-light photochemical hazard becomes important for 0.400–0.550 µm exposures greater than 10 s.",
  "UC Merced Laser Safety Manual (secondary explanatory source): C_B = 1 for 400–450 nm, and C_B = 10^(0.02(λ_nm - 450)) for 450–600 nm; T1 is summarized as T1 = 10 × 10^(0.02(λ_nm - 450)) for 450–500 nm.",
  "These secondary-source expressions are useful reference anchors, but the bounded suite still rejects the long-duration blue-light branch until the full standards-table logic is implemented and validated.",
];

export type SupportedMpeResult = {
  status: "supported";
  regime: string;
  scope: string;
  radiantExposureMpe_mJcm2: number;
  equivalentIrradianceMpe_mWcm2: number;
  notes: string[];
  references: string[];
};

export type UnsupportedMpeResult = {
  status: "unsupported";
  regime: string;
  scope: string;
  reason: string;
  notes: string[];
  references: string[];
};

export type EducationalMpeResult = SupportedMpeResult | UnsupportedMpeResult;

function wavelengthUm(wavelengthNm: number) {
  return wavelengthNm / 1000;
}

function correctionCa(wavelengthNm: number) {
  const lambdaUm = wavelengthUm(wavelengthNm);
  if (lambdaUm < 0.7) return 1;
  if (lambdaUm <= 1.05) return Math.pow(10, 2 * (lambdaUm - 0.7));
  return 1;
}

function commonNotes() {
  return [
    "This calculator is intentionally limited to educational / engineering pre-check use only.",
    "Do not use it for PPE selection sign-off, controlled-area approval, NOHD/NHZ approval, enclosure/interlock sign-off, or product classification.",
    "Formal safety decisions still require ANSI Z136.1 / IEC 60825-1 review and CLSO / LSO oversight.",
    "This bounded suite only supports CW / continuous exposure, small-source / point-source direct-beam logic, and rejects unsupported regimes instead of approximating through them.",
  ];
}

export function calculateEducationalContinuousMpe(
  wavelengthNm: number,
  exposureS: number
): EducationalMpeResult {
  const notes = commonNotes();
  const references = laserSafetyReferencePoints;

  if (exposureS <= 0) {
    return {
      status: "unsupported",
      regime: "Invalid input",
      scope: "No result",
      reason: "Exposure time must be greater than zero.",
      notes,
      references,
    };
  }

  if (wavelengthNm < 400 || wavelengthNm > 1050) {
    return {
      status: "unsupported",
      regime: "Outside bounded ocular branch",
      scope: "Quarantined",
      reason:
        "The bounded mini-suite only supports 400–1050 nm for a small-source / point-source ocular direct-beam branch. UV, corneal / skin branches, and >1050 nm regimes are intentionally excluded.",
      notes,
      references,
    };
  }

  if (exposureS < 1e-3) {
    return {
      status: "unsupported",
      regime: "Below bounded short-exposure limit",
      scope: "Quarantined",
      reason:
        "Sub-millisecond cases are intentionally disabled because pulse / short-time rules are outside the bounded CW point-source suite.",
      notes,
      references,
    };
  }

  if (wavelengthNm <= 550 && exposureS > 10) {
    return {
      status: "unsupported",
      regime: "Visible blue-light photochemical crossover",
      scope: "Quarantined",
      reason:
        "For 400–550 nm exposures longer than 10 s, blue-light photochemical retinal limits become relevant. That C_B-dependent long-duration branch is intentionally disabled in this bounded suite instead of being approximated.",
      notes: [
        ...notes,
        "OSHA's laser-hazard summary explicitly flags blue-light photochemical retinal injury for 0.400–0.550 µm exposures greater than 10 s.",
        "Secondary manual summaries commonly state C_B = 1 for 400–450 nm and C_B = 10^(0.02(λ_nm - 450)) for 450–600 nm.",
        "Secondary manual summaries also state T1 = 10 × 10^(0.02(λ_nm - 450)) for 450–500 nm, marking the thermal / photochemical crossover region.",
        "This suite still rejects that branch until the full standards-table implementation is validated against authoritative examples.",
      ],
      references,
    };
  }

  if (exposureS > 10) {
    return {
      status: "unsupported",
      regime: "Outside bounded long-duration window",
      scope: "Quarantined",
      reason:
        "This bounded suite currently stops at 10 s. Longer-duration ocular limits require additional standards-table logic and are intentionally not auto-applied here.",
      notes,
      references,
    };
  }

  const thermalBase_mJcm2 = 1.8 * Math.pow(exposureS, 0.75);

  if (wavelengthNm < 700) {
    return {
      status: "supported",
      regime: wavelengthNm <= 550 ? "Visible retinal thermal short-exposure branch" : "Visible retinal thermal branch",
      scope: "CW / small-source / point-source ocular thermal branch, 1 ms to 10 s",
      radiantExposureMpe_mJcm2: thermalBase_mJcm2,
      equivalentIrradianceMpe_mWcm2: thermalBase_mJcm2 / exposureS,
      notes: [
        ...notes,
        "The bounded suite uses the short-duration visible retinal thermal branch for 1 ms to 10 s.",
        "For 400–550 nm, the longer-duration blue-light photochemical branch (>10 s) is intentionally rejected instead of being merged in approximately.",
        "Radiant exposure H and equivalent irradiance E are shown separately to avoid energy / power unit confusion.",
      ],
      references,
    };
  }

  const ca = correctionCa(wavelengthNm);
  const radiantExposure = thermalBase_mJcm2 * ca;

  return {
    status: "supported",
    regime: "Near-IR retinal thermal branch",
    scope: "CW / small-source / point-source ocular thermal branch, 1 ms to 10 s",
    radiantExposureMpe_mJcm2: radiantExposure,
    equivalentIrradianceMpe_mWcm2: radiantExposure / exposureS,
    notes: [
      ...notes,
      `Applied ANSI-style C_A correction factor: ${ca.toFixed(3)}.`,
      "This bounded suite still excludes extended-source corrections, pulse rules, scan rules, and limiting-aperture edge cases.",
      "The implementation uses wavelength in µm for the C_A expression: C_A = 10^(2(λ - 0.700)) for 0.700–1.050 µm.",
    ],
    references,
  };
}
