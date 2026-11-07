import { brewsterAngle } from "../../physics/polarization/fresnel";
import { pileOfPlates } from "../../physics/polarization/reflection-polarizers";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const SHURCLIFF = "Shurcliff W. A. (1962). Polarized Light: Production and Use, ch. 6 (pile of plates; Stokes 1862 " +
  "incoherent sum T_m = (1 − r)/(1 + (2m − 1) r)), Harvard University Press; Born M., Wolf E. (1999). Principles of " +
  "Optics, 7th ed., §1.5.2 (Fresnel equations, Brewster angle tan θ_B = n), Cambridge University Press. " +
  "https://doi.org/10.1017/CBO9781139644181";

export default defineSchema({
  href: "/polarization/brewster-polarizer",
  inputs: [
    { key: "n2", label: "Plate index n", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1.01, max: 5 },
    { key: "plates", label: "Number of plates m (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 4, min: 1, max: 50 },
  ],
  outputs: [
    { key: "thetaB", label: "Brewster angle θ_B = arctan n", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "rs", label: "One-surface reflectance r_s at θ_B", unit: "", toSI: 1, siUnit: "" },
    { key: "Tp", label: "Pile transmittance T_p at θ_B", unit: "", toSI: 1, siUnit: "" },
    { key: "Ts", label: "Pile transmittance T_s at θ_B", unit: "", toSI: 1, siUnit: "" },
    { key: "dop", label: "Degree of polarization (unpolarized in), multiple reflections included", unit: "", toSI: 1, siUnit: "" },
    { key: "dopSinglePass", label: "Degree of polarization ignoring multiple reflections, (1 − r)^2m", unit: "", toSI: 1, siUnit: "" },
    { key: "extinction", label: "Extinction ratio T_p/T_s", unit: "", toSI: 1, siUnit: "" },
    { key: "extinctionDb", label: "Extinction ratio 10 log10(T_p/T_s)", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ n2, plates }) {
    const m = Math.round(plates);
    const thetaB = brewsterAngle(1, n2);
    const atB = pileOfPlates(n2, thetaB, m);
    const singlePassDop = (atB.TpSinglePass - atB.TsSinglePass) / (atB.TpSinglePass + atB.TsSinglePass);
    return {
      values: {
        thetaB,
        rs: atB.rs,
        Tp: atB.Tp,
        Ts: atB.Ts,
        dop: atB.dop,
        dopSinglePass: singlePassDop,
        extinction: atB.extinction,
        extinctionDb: 10 * Math.log10(atB.extinction),
      },
      warnings: ["Lossless plane-parallel plates in air, incoherent between surfaces; no absorption or dispersion."],
    };
  },
  checks: [
    {
      // n = 1.52, m = 4: r_s = ((n² − 1)/(n² + 1))² = (1.3104/3.3104)² = 0.15669200; T_s = (1 − r_s)/(1 + 7 r_s) =
      // 0.402179658; P = m/(m + (2n/(n² − 1))²) = 4/(4 + 2.3199²) = 0.426350745; θ_B = atan 1.52 = 56.659293°.
      source: SHURCLIFF,
      basis: "computed",
      inputs: { n2: 1.52, plates: 4 },
      expect: { thetaB: 56.659292654, rs: 0.156691999, Ts: 0.402179658, dop: 0.426350745, dopSinglePass: 0.592618337 },
      tolerance: 1e-8,
    },
    {
      // n = 2.42, m = 10: P = 10/(10 + (4.84/4.8564)²) = 0.909648488; θ_B = atan 2.42 = 67.548454°.
      source: SHURCLIFF,
      basis: "computed",
      inputs: { n2: 2.42, plates: 10 },
      expect: { thetaB: 67.548453544, dop: 0.909648488 },
      tolerance: 1e-8,
    },
  ],
});
