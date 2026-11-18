import { MEAN_DGD_BIT_FRACTION } from "../../physics/fiber-optics/polarization-mode-dispersion";
import { MINUTES_PER_YEAR, PS_PER_SQRT_KM, pmdSummary } from "../../physics/fiber-optics/polarization-mode-dispersion-summary";
import { defineSchema } from "../types";

const POOLE_FOSCHINI = "Poole C. D. (1988). Statistical treatment of polarization dispersion in single-mode fiber. Opt. Lett. 13, 687–689, " +
  "doi:10.1364/OL.13.000687; Maxwellian DGD: ⟨Δτ⟩ = PMD √L, σ = ⟨Δτ⟩√(π/8), P(DGD > Δτ) = ∫ from u to ∞ of √(2/π) t² e^(−t²/2) dt, u = Δτ/σ; " +
  "⟨Δτ⟩ = √(8/(3π)) ⟨Δτ²⟩^½; " +
  "Foschini G. J., Poole C. D. (1991). Statistical theory of polarization dispersion in single mode fibers. J. Lightwave Technol. 9, 1439–1456, " +
  "doi:10.1109/50.97630 (Maxwellian theory of the DGD). The design rule ⟨Δτ⟩ ≤ 0.1 bit period, so L_max = (0.1/(B · PMD))², is the common engineering rule of thumb (no citation).";

export default defineSchema({
  href: "/fiber-optics/polarization-mode-dispersion",
  inputs: [
    { key: "pmdCoeff", label: "PMD coefficient", unit: "ps/√km", toSI: PS_PER_SQRT_KM, siUnit: "s/√m", default: 0.5, min: 0.001, max: 10 },
    { key: "length", label: "Link length", unit: "km", toSI: 1e3, siUnit: "m", default: 100, min: 0.1, max: 50000 },
    { key: "bitRate", label: "Bit rate", unit: "Gb/s", toSI: 1e9, siUnit: "1/s", default: 10, min: 0.1, max: 1000 },
    { key: "maxToMean", label: "Design maximum DGD", unit: "× mean", toSI: 1, siUnit: "", default: 3, min: 1, max: 8 },
  ],
  outputs: [
    { key: "meanDgd", label: "Mean DGD", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "rmsDgd", label: "RMS DGD", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "meanOverBitPeriod", label: "Mean DGD / bit period", unit: "", toSI: 1, siUnit: "" },
    { key: "pmdLimitedLength", label: "PMD-limited length (mean DGD ≤ 0.1 bit period)", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "maxDgd", label: "Design maximum DGD", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "maxOverBitPeriod", label: "Design maximum DGD / bit period", unit: "", toSI: 1, siUnit: "" },
    { key: "exceedanceProbability", label: "Probability that the DGD exceeds the design maximum", unit: "", toSI: 1, siUnit: "" },
    { key: "outagePerYear", label: "Equivalent outage time per year", unit: "min/year", toSI: 60, siUnit: "s/year" },
  ],
  compute({ pmdCoeff, length, bitRate, maxToMean }) {
    const s = pmdSummary({ pmdCoefficient: pmdCoeff, length, bitRate, maxToMean });
    const warnings: string[] = [];
    if (!s.withinRule) {
      warnings.push(`Mean DGD / bit period = ${s.meanOverT.toPrecision(3)} exceeds the ≤ ${MEAN_DGD_BIT_FRACTION} rule of thumb.`);
    }
    return {
      values: {
        meanDgd: s.mean, rmsDgd: s.rms, meanOverBitPeriod: s.meanOverT, pmdLimitedLength: s.maxLength,
        maxDgd: s.maxDgd, maxOverBitPeriod: s.maxOverT, exceedanceProbability: s.pOut, outagePerYear: s.pOut * MINUTES_PER_YEAR * 60,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: PMD = 0.5 ps/√km, L = 100 km: ⟨Δτ⟩ = 0.5 · √100 = 5 ps; rms = 5/√(8/(3π)) = 5.4270094 ps; T = 100 ps → 0.05;
      // max = 3 · 5 = 15 ps → 0.15 T; L_max = (0.1/(10e9 · 0.5e-12 s/√km))² = 400 km;
      // u = 3/√(π/8) = 4.7870 (numerical tail integral of the Maxwellian) → P = 4.19976e-5, 22.0891 min/year.
      source: POOLE_FOSCHINI,
      basis: "computed",
      inputs: {},
      expect: {
        meanDgd: 5, rmsDgd: 5.427009409187008, meanOverBitPeriod: 0.05, pmdLimitedLength: 400, maxDgd: 15, maxOverBitPeriod: 0.15,
        exceedanceProbability: 4.199759119544893e-5, outagePerYear: 22.08905306515832,
      },
      tolerance: 1e-8,
    },
    {
      // PMD = 0.1 ps/√km, L = 2000 km, 40 Gb/s (T = 25 ps), design max 2 × mean:
      // ⟨Δτ⟩ = 0.1 · √2000 = 4.4721360 ps; rms = 4.8540648 ps; ratio 0.1788854; max 8.9442719 ps = 0.3577709 T;
      // L_max = (0.1/(40e9 · 0.1e-12))² = 625 km; u = 2/√(π/8) = 3.1915, P(DGD > 2⟨Δτ⟩) = 0.0170501 → 8967.683 min/year.
      source: POOLE_FOSCHINI,
      basis: "computed",
      inputs: { pmdCoeff: 0.1, length: 2000, bitRate: 40, maxToMean: 2 },
      expect: {
        meanDgd: 4.47213595499958, rmsDgd: 4.854064781389249, meanOverBitPeriod: 0.1788854381999832, pmdLimitedLength: 625,
        maxDgd: 8.944271909999159, maxOverBitPeriod: 0.3577708763999664, exceedanceProbability: 0.01705012317015802, outagePerYear: 8967.682782576314,
      },
      tolerance: 1e-8,
    },
  ],
});
