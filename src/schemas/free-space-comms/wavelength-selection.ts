import { scoreWavelengths } from "../../physics/free-space-comms/wavelength-selection";
import { defineSchema } from "../types";

const ICNIRP = "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. " +
  "Health Phys. 105(3), 271–295: at 1500–1800 nm and t > 10 s the corneal limit is 1000 W/m² (Table 5) averaged over the " +
  "3.5 mm stop (Table 8), so the CW point-source limit is P = 1000 W/m² · π(1.75 mm)² = 9.6211 mW";
const KIM = "Kim I. I., McArthur B., Korevaar E. (2001). Comparison of laser beam propagation at 785 nm and 1550 nm in fog and haze for " +
  "optical wireless communications. Proc. SPIE 4214, 26–37: aerosol (3.912/V − β_R(550 nm))(λ/550 nm)^(−q), plus Rayleigh from " +
  "Bucholtz A. (1995). Appl. Opt. 34(15), 2765–2773, eqs. (2)–(4)";
const SCORES = "scores: eye safety 25 log₁₀(P/0.1 mW), atmosphere 100 − 5 × loss(dB), clamped to 0–100; the 1550 nm components " +
  "and cost ratings are the calculator's editorial 95 and 65; weights 0.3 (0.05 without eye priority), 0.35, 0.2, 0.15 (illustrative).";

export default defineSchema({
  href: "/free-space-comms/wavelength-selection",
  inputs: [
    { key: "range", label: "Range", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.01, max: 50 },
    { key: "visibility", label: "Visibility", unit: "km", toSI: 1e3, siUnit: "m", default: 2, min: 0.05, max: 100 },
    { key: "eye", label: "Prioritise eye safety (0 = no, anything else = yes)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1 },
  ],
  outputs: [
    { key: "score850", label: "Total score, 850 nm", unit: "/100", toSI: 1, siUnit: "" },
    { key: "score1064", label: "Total score, 1064 nm", unit: "/100", toSI: 1, siUnit: "" },
    { key: "score1310", label: "Total score, 1310 nm", unit: "/100", toSI: 1, siUnit: "" },
    { key: "score1550", label: "Total score, 1550 nm", unit: "/100", toSI: 1, siUnit: "" },
    { key: "loss850", label: "Atmospheric loss, 850 nm", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "loss1064", label: "Atmospheric loss, 1064 nm", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "loss1310", label: "Atmospheric loss, 1310 nm", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "loss1550", label: "Atmospheric loss, 1550 nm", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "limit850", label: "Class 1 CW limit, 850 nm", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "limit1064", label: "Class 1 CW limit, 1064 nm", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "limit1310", label: "Class 1 CW limit, 1310 nm", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "limit1550", label: "Class 1 CW limit, 1550 nm", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "bestWavelength", label: "Highest-scoring wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ range, visibility, eye }) {
    const weights = { eyeSafety: eye !== 0 ? 0.3 : 0.05, atmosphere: 0.35, components: 0.2, cost: 0.15 };
    const s = scoreWavelengths(range, visibility, weights);
    const best = [...s].sort((a, b) => b.total - a.total)[0];
    const warnings: string[] = [];
    const bestWavelength = best && Number.isFinite(best.total) ? best.lambda : NaN;
    if (Number.isNaN(bestWavelength)) warnings.push("No wavelength could be scored for these inputs: bestWavelength is null.");
    return {
      values: {
        score850: s[0].total, score1064: s[1].total, score1310: s[2].total, score1550: s[3].total,
        loss850: s[0].lossDb, loss1064: s[1].lossDb, loss1310: s[2].lossDb, loss1550: s[3].lossDb,
        limit850: s[0].classOneLimit, limit1064: s[1].classOneLimit, limit1310: s[2].classOneLimit, limit1550: s[3].classOneLimit,
        bestWavelength,
      },
      warnings,
    };
  },
  checks: [
    {
      // 1550 nm, 1 km, V = 2 km, eye priority: P = 1000 · π(1.75e-3)² = 9.621128 mW; Rayleigh 1.7602e-7 m⁻¹ (550 nm: 1.1478e-5 m⁻¹),
      // q = 0.16 · 2 + 0.34 = 0.66, loss 4.262830 dB; scores: eye 25 log₁₀(96.21128) = 49.580649, atmosphere 100 − 5 · 4.262830 = 78.685848;
      // total (0.3 · 49.580649 + 0.35 · 78.685848 + 0.2 · 95 + 0.15 · 65)/1 = 71.164241.
      source: `${ICNIRP}; ${KIM}; ${SCORES}`,
      basis: "computed",
      inputs: { range: 1, visibility: 2, eye: 1 },
      expect: { limit1550: 9.62112750161874, loss1550: 4.262830484469005, score1550: 71.16424142767967 },
      tolerance: 1e-6,
    },
    {
      // 1550 nm, 10 km, V = 5 km, no eye priority: q = 0.16 · 5 + 0.34 = 1.14, loss 10.283846 dB, atmosphere 48.580769,
      // total (0.05 · 49.580649 + 0.35 · 48.580769 + 0.2 · 95 + 0.15 · 65)/0.75 = 64.309735.
      source: `${ICNIRP}; ${KIM}; ${SCORES}`,
      basis: "computed",
      inputs: { range: 10, visibility: 5, eye: 0 },
      expect: { loss1550: 10.283846210135664, score1550: 64.30973545979465 },
      tolerance: 1e-6,
    },
  ],
});
