import { dimer, homogeneousFwhm, transferMatrix } from "../../physics/spectroscopy/two-dimensional";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const HAMM = "Hamm P., Zanni M. (2011). Concepts and Methods of 2D Infrared Spectroscopy, Cambridge University Press, " +
  "doi:10.1017/cbo9780511675935, chs. 4–7 (excitonic dimer: E∓ = ν₀ ∓ ½√(Δ² + 4J²), tan 2θ = 2J/Δ, dipole strengths " +
  "|μ₀∓|² = 1 ∓ sin 2θ cos φ in monomer units); Lorentzian FWHM 1/(πcT₂).";

export default defineSchema({
  href: "/spectroscopy/two-dimensional",
  inputs: [
    { key: "excitationCenter", label: "Mean site energy ν₀", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 12500, min: 500, max: 50000 },
    { key: "siteDifference", label: "Site energy difference Δ", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 200, min: 0, max: 5000 },
    { key: "coupling", label: "Coupling J", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 100, min: -2000, max: 2000 },
    { key: "dipoleAngle", label: "Angle between dipoles φ", unit: "°", toSI: DEG, siUnit: "rad", default: 60, min: 0, max: 180 },
    { key: "linewidth", label: "Inhomogeneous FWHM", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 100, min: 0, max: 2000 },
    { key: "t2", label: "Dephasing time T₂", unit: "fs", toSI: 1e-15, siUnit: "s", default: 200, min: 1, max: 100000 },
    { key: "waitingTime", label: "Waiting time T_w", unit: "fs", toSI: 1e-15, siUnit: "s", default: 0, min: 0, max: 1e6 },
    { key: "relaxation", label: "Downhill relaxation time E₊ → E₋", unit: "fs", toSI: 1e-15, siUnit: "s", default: 300, min: 1, max: 1e7 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 0, max: 2000 },
  ],
  outputs: [
    { key: "energyLow", label: "Exciton energy E₋", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "energyHigh", label: "Exciton energy E₊", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "splitting", label: "Splitting √(Δ² + 4J²)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "mixingAngle", label: "Mixing angle θ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "strengthLow", label: "Dipole strength |μ₀₋|² (monomer units)", unit: "", toSI: 1, siUnit: "" },
    { key: "strengthHigh", label: "Dipole strength |μ₀₊|² (monomer units)", unit: "", toSI: 1, siUnit: "" },
    { key: "homogeneousFwhm", label: "Homogeneous FWHM 1/(πcT₂)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "transferUpToDown", label: "P(E₋ | excited E₊) after T_w", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ excitationCenter, siteDifference, coupling, dipoleAngle, t2, waitingTime, relaxation, temperature }) {
    const d = dimer(excitationCenter, siteDifference, coupling, dipoleAngle);
    const P = transferMatrix(d, waitingTime, relaxation, temperature);
    const warnings: string[] = [];
    if (!(d.energies[0] > 0)) warnings.push("E₋ ≤ 0: reduce Δ or J.");
    return {
      values: {
        energyLow: d.energies[0], energyHigh: d.energies[1], splitting: d.splitting, mixingAngle: d.theta,
        strengthLow: d.mu0[0][0] ** 2 + d.mu0[0][1] ** 2, strengthHigh: d.mu0[1][0] ** 2 + d.mu0[1][1] ** 2,
        homogeneousFwhm: homogeneousFwhm(t2), transferUpToDown: P[1][0],
      },
      warnings,
    };
  },
  checks: [
    {
      // J = 0, Δ = 200 cm⁻¹, ν₀ = 12500 cm⁻¹: E∓ = 12500 ∓ ½·√(200² + 0) = 12400 / 12600 cm⁻¹; θ = 0 so |μ₀∓|² = 1 for any φ;
      // T₂ = 200 fs: 1/(π · 2.99792458e10 cm/s · 2e-13 s) = 53.08837 cm⁻¹.
      source: HAMM,
      basis: "computed",
      inputs: { coupling: 0, siteDifference: 200 },
      expect: { energyLow: 12400, energyHigh: 12600, splitting: 200, strengthLow: 1, strengthHigh: 1, homogeneousFwhm: 53.08837458876145 },
      tolerance: 1e-8,
    },
    {
      // Defaults, Δ = 200, J = 100 cm⁻¹: splitting √(40000 + 40000) = 282.842712 cm⁻¹; E∓ = 12500 ∓ 141.421356;
      // θ = ½ atan(2J/Δ) = ½ atan 1 = 22.5°; |μ₀∓|² = 1 ∓ sin 45° cos 60° = 1 ∓ 0.353553 = 0.646447 / 1.353553.
      source: HAMM,
      basis: "computed",
      inputs: {},
      expect: {
        energyLow: 12358.57864376269, energyHigh: 12641.42135623731, splitting: 282.84271247461904, mixingAngle: 22.5,
        strengthLow: 0.6464466094067262, strengthHigh: 1.353553390593274,
      },
      tolerance: 1e-8,
    },
  ],
});
