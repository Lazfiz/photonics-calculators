import { abs } from "../../physics/complex";
import { brewsterAngle, fresnel, phaseDifference, phaseOf } from "../../physics/polarization/fresnel";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §1.5.2 (Fresnel formulae), §1.5.3 " +
  "(normal incidence) and §1.5.4 (total internal reflection phase), Cambridge University Press. " +
  "https://doi.org/10.1017/CBO9781139644181";

export default defineSchema({
  href: "/polarization/fresnel-polarization",
  inputs: [
    { key: "n1", label: "n₁ (incident medium, lossless)", unit: "", toSI: 1, siUnit: "", default: 1.0, min: 1, max: 5 },
    { key: "n2", label: "n₂ (second medium)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 0.01, max: 10 },
    { key: "k2", label: "κ₂ (absorption index, N₂ = n₂ − iκ₂)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 20 },
    { key: "thetaIDeg", label: "Angle of incidence", unit: "°", toSI: DEG, siUnit: "rad", default: 30, min: 0, max: 89.9 },
  ],
  outputs: [
    { key: "thetaT", label: "Refraction angle θ₂ (lossless, not TIR)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "brewster", label: "Brewster angle atan(n₂/n₁) (lossless only)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "Rs", label: "R_s", unit: "", toSI: 1, siUnit: "" },
    { key: "Rp", label: "R_p", unit: "", toSI: 1, siUnit: "" },
    { key: "Ts", label: "T_s", unit: "", toSI: 1, siUnit: "" },
    { key: "Tp", label: "T_p", unit: "", toSI: 1, siUnit: "" },
    { key: "Runpolarized", label: "R for unpolarized light (R_s + R_p)/2", unit: "", toSI: 1, siUnit: "" },
    { key: "reflectedPolarization", label: "Polarization of the reflected light (R_s − R_p)/(R_s + R_p)", unit: "", toSI: 1, siUnit: "" },
    { key: "rsAbs", label: "|r_s|", unit: "", toSI: 1, siUnit: "" },
    { key: "rpAbs", label: "|r_p|", unit: "", toSI: 1, siUnit: "" },
    { key: "rsPhase", label: "arg r_s", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "rpPhase", label: "arg r_p", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "delta", label: "Δ = arg(r_p/r_s)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "psi", label: "ψ, tan ψ = |r_p|/|r_s|", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute({ n1, n2, k2, thetaIDeg }) {
    const theta = thetaIDeg; // SI (rad) at the schema boundary
    const f = fresnel(n1, n2, theta, k2);
    const lossless = k2 === 0;
    const warnings: string[] = [
      "Convention: time factor e^{i(ωt − kz)}, N = n − iκ, r_p = −r_s at normal incidence (Born & Wolf, Hecht; Δ = 180° there).",
    ];
    if (f.tir) warnings.push("Total internal reflection: no wave propagates into medium 2 (θ₂ is null); |r_s| = |r_p| = 1.");
    else if (!lossless) warnings.push("Absorbing medium 2: the refraction angle is complex (null) and the Brewster angle is not defined.");
    return {
      values: {
        thetaT: f.thetaT,
        brewster: lossless ? brewsterAngle(n1, n2) : NaN,
        Rs: f.Rs,
        Rp: f.Rp,
        Ts: f.Ts,
        Tp: f.Tp,
        Runpolarized: (f.Rs + f.Rp) / 2,
        reflectedPolarization: (f.Rs - f.Rp) / (f.Rs + f.Rp),
        rsAbs: abs(f.rs),
        rpAbs: abs(f.rp),
        rsPhase: phaseOf(f.rs),
        rpPhase: phaseOf(f.rp),
        delta: phaseDifference(f.rp, f.rs),
        psi: Math.atan2(abs(f.rp), abs(f.rs)),
      },
      warnings,
    };
  },
  checks: [
    {
      // Normal incidence air to glass 1.52: R_s = R_p = ((n − 1)/(n + 1))² = (0.52/2.52)² = 0.04257999; T = 1 − R.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { n1: 1, n2: 1.52, k2: 0, thetaIDeg: 0 },
      expect: { Rs: 0.04257999496, Rp: 0.04257999496, Ts: 0.95742000504, Tp: 0.95742000504 },
      tolerance: 1e-8,
    },
    {
      // 45°, 1 to 1.52: θ₂ = asin(sin 45°/1.52) = 27.723285°; R_s = sin²(θ₁ − θ₂)/sin²(θ₁ + θ₂) = 0.09673316,
      // R_p = tan²(θ₁ − θ₂)/tan²(θ₁ + θ₂) = 0.009357304 (Born & Wolf §1.5.2).
      source: BORN_WOLF,
      basis: "computed",
      inputs: { n1: 1, n2: 1.52, k2: 0, thetaIDeg: 45 },
      expect: { thetaT: 27.723284903, Rs: 0.09673315997, Rp: 0.009357304237 },
      tolerance: 1e-8,
    },
    {
      // TIR 1.52 to 1 at 50° (critical angle 41.1°): δ = 2 atan(cos θ √(sin²θ − n²)/sin²θ), n = 1/1.52 = 46.521000°.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { n1: 1.52, n2: 1, k2: 0, thetaIDeg: 50 },
      expect: { delta: 46.521000436, Rs: 1, Rp: 1 },
      tolerance: 1e-8,
    },
  ],
});
