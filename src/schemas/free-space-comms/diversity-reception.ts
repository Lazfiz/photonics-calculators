import {
  diversityThreshold, irradianceCorrelation, logIrradianceCorrelation, rytovVariance, scintillationIndex, type Combiner,
} from "../../physics/free-space-comms/turbulence";
import { defineSchema } from "../types";

const LEE_CHAN = "Lee E. J., Chan V. W. S. (2004). Part 1: Optical communication over the clear turbulent atmospheric " +
  "channel using diversity. IEEE J. Sel. Areas Commun. 22(9), 1896–1906.";
const ANDREWS = "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE: " +
  "plane-wave Rytov variance σ_R² = 1.23 C_n² k^(7/6) L^(11/6) and the scintillation index of a point receiver.";

const marginDb = (t: number) => -10 * Math.log10(t);

export default defineSchema({
  href: "/free-space-comms/diversity-reception",
  choices: [
    {
      key: "combiner",
      label: "Combiner",
      options: [
        { value: "sc", label: "Selection" },
        { value: "egc", label: "Equal-gain" },
        { value: "mrc", label: "Maximal-ratio" },
      ],
      default: "egc",
    },
  ],
  inputs: [
    { key: "numRx", label: "Number of receivers N", unit: "", toSI: 1, siUnit: "", default: 2, min: 1, max: 8 },
    { key: "separation", label: "Receiver separation", unit: "cm", toSI: 1e-2, siUnit: "m", default: 5, min: 0, max: 1000 },
    { key: "c2n", label: "Refractive-index structure constant Cn²", unit: "m⁻²ᐟ³", toSI: 1, siUnit: "m^(-2/3)", default: 1e-14, min: 1e-18, max: 1e-11 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "range", label: "Link distance", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 1000 },
    { key: "pOut", label: "Target outage probability P_out", unit: "", toSI: 1, siUnit: "", default: 1e-6, min: 1e-12, max: 0.1 },
  ],
  outputs: [
    { key: "rytovVariance", label: "Rytov variance σ_R²", unit: "", toSI: 1, siUnit: "" },
    { key: "scintillationIndex", label: "Scintillation index σ_I² (point receiver)", unit: "", toSI: 1, siUnit: "" },
    { key: "irradianceCorrelation", label: "Irradiance correlation b_I at the separation", unit: "", toSI: 1, siUnit: "" },
    { key: "logIrradianceCorrelation", label: "Log-irradiance correlation ρ_ln", unit: "", toSI: 1, siUnit: "" },
    { key: "singleMargin", label: "Fade margin, single receiver", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "combinerMargin", label: "Fade margin, selected combiner with N receivers", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "diversityGain", label: "Diversity gain (single margin − combiner margin)", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ combiner, numRx, separation, c2n, wavelength, range, pOut }) {
    const n = Math.min(8, Math.max(1, Math.round(numRx)));
    const selected: Combiner = combiner === "sc" || combiner === "mrc" ? combiner : "egc";
    const sigmaR2 = rytovVariance(c2n, wavelength, range);
    const sigmaI2 = scintillationIndex(sigmaR2, wavelength, range);
    const bI = irradianceCorrelation(separation, wavelength, range);
    const rho = logIrradianceCorrelation(bI, sigmaI2);
    const single = marginDb(diversityThreshold(pOut, 1, sigmaI2, rho, "sc"));
    const margin = marginDb(diversityThreshold(pOut, n, sigmaI2, rho, selected));
    const warnings: string[] = [];
    if (sigmaR2 > 1) {
      warnings.push("σ_R² > 1: the irradiance correlation and the log-normal model hold for weak fluctuations only. Treat the margins as indicative.");
    }
    if (!Number.isFinite(single) || !Number.isFinite(margin)) warnings.push("The outage threshold has no solution for these inputs.");
    return {
      values: {
        rytovVariance: sigmaR2,
        scintillationIndex: sigmaI2,
        irradianceCorrelation: bI,
        logIrradianceCorrelation: rho,
        singleMargin: single,
        combinerMargin: margin,
        diversityGain: single - margin,
      },
      warnings,
    };
  },
  checks: [
    {
      // Cn² = 1e-14, 1550 nm, 1 km: k = 2π/λ, σ_R² = 1.23 Cn² k^(7/6) L^(11/6) = 0.199095; σ_I² = exp(σ²lnX + σ²lnY) − 1
      // with σ²lnX = 0.49σ_R²/(1 + 1.11σ_R^(12/5))^(7/6), σ²lnY = 0.51σ_R²/(1 + 0.69σ_R^(12/5))^(5/6): 0.192279.
      // One receiver is log-normal with ln I ~ N(−s²/2, s²), s² = ln(1 + σ_I²): P(I < t) = Φ((ln t + s²/2)/s) = 1e-6.
      source: ANDREWS,
      basis: "computed",
      inputs: { numRx: 1, c2n: 1e-14, wavelength: 1550, range: 1, pOut: 1e-6 },
      expect: { rytovVariance: 0.19909543851127037, scintillationIndex: 0.19227895472932174, singleMargin: 9.039190700966325 },
      tolerance: 1e-6,
    },
    {
      // Receivers 10 m apart are beyond the covariance's reach (r = ρ√(k/L) > 6, b_I = 0), so the branches are independent:
      // selection combining of N = 2 fails when both do, Φ(z)² = P_out, so Φ(z) = √P_out. Same link and P_out as above:
      // margin 6.010058 dB against 9.039191 dB for one receiver, gain 3.029133 dB.
      source: LEE_CHAN + " Independent-branch selection combining: outage P = ∏ P_i.",
      basis: "computed",
      inputs: { numRx: 2, separation: 1000, combiner: "sc", c2n: 1e-14, wavelength: 1550, range: 1, pOut: 1e-6 },
      expect: { combinerMargin: 6.010057728992919, diversityGain: 3.0291329719734055 },
      tolerance: 1e-6,
    },
    {
      // Independent branches, N = 3 selection: Φ(z)³ = P_out, Φ(z) = P_out^(1/3). Cn² = 5e-15, 850 nm, 2 km, P_out = 1e-4:
      // σ_R² = 0.715019, σ_I² = 0.566990; margins 11.799915 dB (one receiver) and 5.867024 dB (three).
      source: LEE_CHAN + " Independent-branch selection combining: outage P = ∏ P_i.",
      basis: "computed",
      inputs: { numRx: 3, separation: 1000, combiner: "sc", c2n: 5e-15, wavelength: 850, range: 2, pOut: 1e-4 },
      expect: { rytovVariance: 0.7150194805878909, singleMargin: 11.799914510105808, combinerMargin: 5.867024254245498, diversityGain: 5.932890255860309 },
      tolerance: 1e-6,
    },
  ],
});
