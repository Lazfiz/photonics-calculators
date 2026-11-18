import {
  C_BAND_NM, NZDSF_BAND_MAX_NM, NZDSF_BAND_MIN_NM, nonzeroDispersionSummary,
} from "../../physics/fiber-optics/nonzero-dispersion";
import { defineSchema } from "../types";

const AGRAWAL = "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., Wiley. https://doi.org/10.1002/9780470918524, " +
  "eqs. 2.3.5 and 2.3.13 (β₂ = −λ²D/(2πc), β₃ from D and S); FWM phase mismatch Δβ = −Δω²(β₂ + β₃Δω), Δλ = λ²Δν/c.";
const G655 = "ITU-T Recommendation G.655 (2009), Characteristics of a non-zero dispersion-shifted single-mode optical fibre and cable: " +
  "D(λ) linear in λ about 1550 nm, G.655.C |D| between 1 and 10 ps/(nm·km) over 1530–1565 nm.";
const G652 = "ITU-T Recommendation G.652 (2016), Characteristics of a single-mode optical fibre and cable: " +
  "D(λ) = (S₀/4)(λ − λ₀⁴/λ³) with λ₀ = 1310 nm (a nominal value within the G.652 range 1300–1324 nm) and S₀ = 0.092 ps/(nm²·km) (the G.652 maximum).";

const NO_ZERO = `The linear model has no zero-dispersion wavelength inside ${NZDSF_BAND_MIN_NM}–${NZDSF_BAND_MAX_NM} nm.`;

export default defineSchema({
  href: "/fiber-optics/nonzero-dispersion",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: NZDSF_BAND_MIN_NM, max: NZDSF_BAND_MAX_NM },
    { key: "length", label: "Link length", unit: "km", toSI: 1e3, siUnit: "m", default: 80, min: 0.001, max: 5000 },
    { key: "dispAt1550", label: "D at 1550 nm", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²", default: 4.5, min: -20, max: 20 },
    { key: "dispSlope", label: "Dispersion slope S", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³", default: 0.05, min: -0.2, max: 0.2 },
    { key: "channelSpacing", label: "Channel spacing", unit: "GHz", toSI: 1e9, siUnit: "Hz", default: 100, min: 1, max: 1000 },
  ],
  outputs: [
    { key: "dispersion", label: "Dispersion D(λ)", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "zeroWavelength", label: "Zero-dispersion wavelength λ₀ (inside the band)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "totalDispersion", label: "Accumulated dispersion over the link", unit: "ps/nm", toSI: 1e-3, siUnit: "s/m" },
    { key: "cBandMin", label: "Smallest D over 1530–1565 nm", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "cBandMax", label: "Largest D over 1530–1565 nm", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "spacingWavelength", label: "Channel spacing in wavelength Δλ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "deltaBeta", label: "FWM phase mismatch |Δβ| between adjacent channels", unit: "rad/km", toSI: 1e-3, siUnit: "rad/m" },
    { key: "smfDispersion", label: "Standard fibre (G.652) D at this wavelength", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
  ],
  compute({ wavelength, length, dispAt1550, dispSlope, channelSpacing }) {
    const s = nonzeroDispersionSummary({ wavelength, length, dispAt1550, dispSlope, channelSpacing });
    const warnings: string[] = [];
    if (s.fwmRisk) {
      warnings.push(`D runs from ${(s.dCMin / 1e-6).toFixed(2)} to ${(s.dCMax / 1e-6).toFixed(2)} ps/(nm·km) over ${C_BAND_NM[0]}–${C_BAND_NM[1]} nm (linear model): four-wave mixing risk.`);
    }
    if (s.nzZero) warnings.push("The NZ-DSF dispersion is about zero at this wavelength.");
    return {
      values: {
        dispersion: s.D,
        zeroWavelength: s.lambda0InBand ? s.lambda0 : NaN,
        totalDispersion: s.totalDisp,
        cBandMin: s.dCMin,
        cBandMax: s.dCMax,
        spacingWavelength: s.deltaLambda,
        deltaBeta: s.deltaBeta,
        smfDispersion: s.dSMF,
      },
      warnings,
      reasons: { zeroWavelength: NO_ZERO },
    };
  },
  checks: [
    {
      // D = 3 ps/(nm·km) (the default 4.5 puts λ₀ on the 1460 nm band edge), S = 0.05 ps/(nm²·km), L = 80 km, Δν = 100 GHz, λ = 1550 nm:
      // total 3·80 = 240 ps/nm; C band: D(1530) = 3 + 0.05·(−20) = 2 and D(1565) = 3 + 0.05·15 = 3.75 ps/(nm·km);
      // λ₀ = 1550 − 3/0.05 = 1490 nm (inside 1460–1625 nm);
      // Δλ = λ²Δν/c = (1550e-9)²·100e9/299792458 = 0.801387739 nm.
      source: G655,
      basis: "computed",
      inputs: { dispAt1550: 3 },
      expect: { totalDispersion: 240, cBandMin: 2, cBandMax: 3.75, zeroWavelength: 1490, spacingWavelength: 0.8013877387135605 },
      tolerance: 1e-8,
    },
    {
      // β₂ = −λ²D/(2πc) = −5.73951690e-27 s²/m and β₃ = (λ²/(2πc))²(S + 2D/λ) = 9.07841558e-41 s³/m at 1550 nm (S = 50 s/m³ = 0.05 ps/(nm²·km),
      // D = 4.5e-6 s/m²); ω = 2π·100e9. Δβ = −ω²(β₂ ± β₃ω), the smaller magnitude: 2.24335142 rad/km.
      source: AGRAWAL,
      basis: "computed",
      inputs: {},
      expect: { deltaBeta: 2.2433514201357396 },
      tolerance: 1e-8,
    },
    {
      // G.652 Sellmeier form at 1550 nm: (0.092/4)(1550 − 1310⁴/1550³) = 17.4606188 ps/(nm·km).
      source: G652,
      basis: "computed",
      inputs: {},
      expect: { smfDispersion: 17.460618823134503 },
      tolerance: 1e-8,
    },
  ],
});
