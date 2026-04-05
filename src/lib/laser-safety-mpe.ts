export const laserSafetyReferencePoints = [
  "ANSI Z136.1 — ocular MPE tables, correction-factor framework (C_A / C_B), limiting apertures, and time-domain rules.",
  "IEC 60825-1 — product-classification / AEL framework (separate from this bounded pre-check suite).",
  "OSHA Technical Manual, Section III Chapter 6 — visible blue-light photochemical hazard becomes important for 0.400–0.550 µm exposures greater than 10 s.",
  "UC Merced Laser Safety Manual (secondary explanatory source, citing ANSI Z136.1-2014 tables 5a-c / 7a-c): C_B = 1 for 400–450 nm, C_B = 10^(0.02(λ_nm - 450)) for 450–600 nm, and T1 = 10 × 10^(0.02(λ_nm - 450)) for 450–500 nm.",
  "These long-duration visible-branch formulas are implemented here only within the bounded pre-check suite and still require independent validation before any formal safety workflow use.",
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

export function correctionCa(wavelengthNm: number) {
  const lambdaUm = wavelengthUm(wavelengthNm);
  if (lambdaUm < 0.7) return 1;
  if (lambdaUm <= 1.05) return Math.pow(10, 2 * (lambdaUm - 0.7));
  return 1;
}

export function correctionCb(wavelengthNm: number) {
  if (wavelengthNm <= 450) return 1;
  if (wavelengthNm <= 600) return Math.pow(10, 0.02 * (wavelengthNm - 450));
  return 1;
}

export function crossoverT1Seconds(wavelengthNm: number) {
  if (wavelengthNm < 450 || wavelengthNm > 500) return null;
  return 10 * Math.pow(10, 0.02 * (wavelengthNm - 450));
}

function commonNotes() {
  return [
    "This calculator is intentionally limited to educational / engineering pre-check use only.",
    "Do not use it for PPE selection sign-off, controlled-area approval, NOHD/NHZ approval, enclosure/interlock sign-off, or product classification.",
    "Formal safety decisions still require ANSI Z136.1 / IEC 60825-1 review and CLSO / LSO oversight.",
    "This bounded suite only supports CW / continuous exposure, small-source / point-source direct-beam logic, and rejects unsupported regimes instead of approximating through them.",
  ];
}

function supported(
  regime: string,
  scope: string,
  radiantExposureMpe_mJcm2: number,
  equivalentIrradianceMpe_mWcm2: number,
  notes: string[]
): SupportedMpeResult {
  return {
    status: "supported",
    regime,
    scope,
    radiantExposureMpe_mJcm2,
    equivalentIrradianceMpe_mWcm2,
    notes,
    references: laserSafetyReferencePoints,
  };
}

function unsupported(regime: string, scope: string, reason: string, notes: string[]): UnsupportedMpeResult {
  return {
    status: "unsupported",
    regime,
    scope,
    reason,
    notes,
    references: laserSafetyReferencePoints,
  };
}

export function calculateEducationalContinuousMpe(
  wavelengthNm: number,
  exposureS: number
): EducationalMpeResult {
  const notes = commonNotes();

  if (exposureS <= 0) {
    return unsupported("Invalid input", "No result", "Exposure time must be greater than zero.", notes);
  }

  if (wavelengthNm < 400 || wavelengthNm > 1050) {
    return unsupported(
      "Outside bounded ocular branch",
      "Quarantined",
      "The bounded mini-suite only supports 400–1050 nm for a small-source / point-source ocular direct-beam branch. UV, corneal / skin branches, and >1050 nm regimes are intentionally excluded.",
      notes
    );
  }

  if (exposureS < 1e-3) {
    return unsupported(
      "Below bounded short-exposure limit",
      "Quarantined",
      "Sub-millisecond cases are intentionally disabled because pulse / short-time rules are outside the bounded CW point-source suite.",
      notes
    );
  }

  if (exposureS > 3e4) {
    return unsupported(
      "Outside bounded long-duration window",
      "Quarantined",
      "This bounded suite currently supports only the ANSI-style table slices up to 3×10^4 s described in the secondary reference summary.",
      notes
    );
  }

  const thermalBase_mJcm2 = 1.8 * Math.pow(exposureS, 0.75);

  if (wavelengthNm < 400) {
    return unsupported("Unsupported", "Quarantined", "Unsupported wavelength.", notes);
  }

  if (wavelengthNm < 450) {
    if (exposureS <= 10) {
      return supported(
        "Visible retinal thermal short-exposure branch",
        "CW / small-source / point-source ocular branch, 1 ms to 10 s",
        thermalBase_mJcm2,
        thermalBase_mJcm2 / exposureS,
        [
          ...notes,
          "For 400–450 nm, the bounded suite uses the ANSI-style 5 µs–10 s thermal branch followed by the long-duration visible branch from the secondary table summary.",
          "For 10–100 s the summary gives H_MPE = 10 mJ/cm², then for 100–3×10^4 s it gives E_MPE = 0.1 mW/cm².",
          "Radiant exposure H and equivalent irradiance E are shown separately to avoid energy / power unit confusion.",
        ]
      );
    }
    if (exposureS <= 100) {
      const h = 10;
      return supported(
        "Visible long-duration branch (400–450 nm)",
        "CW / small-source / point-source ocular branch, 10 s to 100 s",
        h,
        h / exposureS,
        [
          ...notes,
          "Secondary ANSI-style table summary: for 400–450 nm and 10–100 s, H_MPE = 10 mJ/cm².",
          "This is still treated as a bounded pre-check implementation, not a compliance-grade standards engine.",
        ]
      );
    }
    const e = 0.1;
    return supported(
      "Visible long-duration branch (400–450 nm)",
      "CW / small-source / point-source ocular branch, 100 s to 3×10^4 s",
      e * exposureS,
      e,
      [
        ...notes,
        "Secondary ANSI-style table summary: for 400–450 nm and 100–3×10^4 s, E_MPE = 0.1 mW/cm².",
        "This branch corresponds to the blue-light / long-duration regime but is still presented only as a bounded engineering pre-check.",
      ]
    );
  }

  if (wavelengthNm < 500) {
    const cb = correctionCb(wavelengthNm);
    const t1 = crossoverT1Seconds(wavelengthNm)!;

    if (exposureS <= 10) {
      return supported(
        "Visible retinal thermal short-exposure branch",
        "CW / small-source / point-source ocular branch, 1 ms to 10 s",
        thermalBase_mJcm2,
        thermalBase_mJcm2 / exposureS,
        [
          ...notes,
          `For 450–500 nm the secondary ANSI-style summary gives C_B = ${cb.toFixed(3)} and T1 = ${t1.toFixed(3)} s.`,
          "Radiant exposure H and equivalent irradiance E are shown separately to avoid energy / power unit confusion.",
        ]
      );
    }

    if (exposureS <= t1) {
      const e = 1;
      return supported(
        "Visible crossover branch (450–500 nm)",
        "CW / small-source / point-source ocular branch, 10 s to T1",
        e * exposureS,
        e,
        [
          ...notes,
          `Secondary ANSI-style table summary: for 450–500 nm and 10 s to T1, E_MPE = 1 mW/cm² with T1 = ${t1.toFixed(3)} s.`,
        ]
      );
    }

    if (exposureS <= 100) {
      const h = 10 * cb;
      return supported(
        "Visible blue-light branch (450–500 nm)",
        "CW / small-source / point-source ocular branch, T1 to 100 s",
        h,
        h / exposureS,
        [
          ...notes,
          `Secondary ANSI-style table summary: for 450–500 nm and T1–100 s, H_MPE = 10·C_B = ${h.toFixed(3)} mJ/cm².`,
          `Implemented with C_B = ${cb.toFixed(3)} and T1 = ${t1.toFixed(3)} s from the secondary ANSI-style source summary.`,
        ]
      );
    }

    const e = 0.1 * cb;
    return supported(
      "Visible blue-light branch (450–500 nm)",
      "CW / small-source / point-source ocular branch, 100 s to 3×10^4 s",
      e * exposureS,
      e,
      [
        ...notes,
        `Secondary ANSI-style table summary: for 450–500 nm and 100–3×10^4 s, E_MPE = 0.1·C_B = ${e.toFixed(3)} mW/cm².`,
        `Implemented with C_B = ${cb.toFixed(3)} and T1 = ${t1.toFixed(3)} s from the secondary ANSI-style source summary.`,
      ]
    );
  }

  if (wavelengthNm < 700) {
    if (exposureS <= 10) {
      return supported(
        "Visible retinal thermal branch",
        "CW / small-source / point-source ocular branch, 1 ms to 10 s",
        thermalBase_mJcm2,
        thermalBase_mJcm2 / exposureS,
        [
          ...notes,
          "For 500–700 nm the secondary ANSI-style summary gives the standard 1 ms–10 s thermal branch and a constant long-duration irradiance branch beyond 10 s.",
          "Radiant exposure H and equivalent irradiance E are shown separately to avoid energy / power unit confusion.",
        ]
      );
    }
    const e = 1;
    return supported(
      "Visible long-duration branch (500–700 nm)",
      "CW / small-source / point-source ocular branch, 10 s to 3×10^4 s",
      e * exposureS,
      e,
      [
        ...notes,
        "Secondary ANSI-style table summary: for 500–700 nm and 10–3×10^4 s, E_MPE = 1 mW/cm².",
        "This remains a bounded engineering pre-check implementation, not a full standards engine.",
      ]
    );
  }

  const ca = correctionCa(wavelengthNm);

  if (exposureS <= 10) {
    const radiantExposure = thermalBase_mJcm2 * ca;
    return supported(
      "Near-IR retinal thermal branch",
      "CW / small-source / point-source ocular branch, 1 ms to 10 s",
      radiantExposure,
      radiantExposure / exposureS,
      [
        ...notes,
        `Applied ANSI-style C_A correction factor: ${ca.toFixed(3)}.`,
        "The implementation uses wavelength in µm for the C_A expression: C_A = 10^(2(λ - 0.700)) for 0.700–1.050 µm.",
      ]
    );
  }

  const e = ca;
  return supported(
    "Near-IR long-duration branch",
    "CW / small-source / point-source ocular branch, 10 s to 3×10^4 s",
    e * exposureS,
    e,
    [
      ...notes,
      `Applied ANSI-style C_A correction factor: ${ca.toFixed(3)}.`,
      "Secondary ANSI-style table summary: for 700–1050 nm and 10–3×10^4 s, E_MPE = C_A mW/cm².",
    ]
  );
}
