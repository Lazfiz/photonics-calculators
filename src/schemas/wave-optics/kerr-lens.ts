import {
  criticalPower, gaussianPeakIntensity, kerrLensFocalLength, nonlinearPhase, rayleighRangeInMedium, selfFocusingDistance,
} from "../../physics/wave-optics/kerr";
import { defineSchema } from "../types";

const lengthText = (m: number) =>
  Math.abs(m) >= 1 ? `${m.toPrecision(4)} m` : Math.abs(m) >= 1e-3 ? `${(m * 1e3).toPrecision(4)} mm` : `${(m * 1e6).toPrecision(4)} µm`;

export default defineSchema({
  href: "/wave-optics/kerr-lens",
  inputs: [
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 200, max: 20000 },
    { key: "beamWaist", label: "Beam radius w (1/e²)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 30, min: 1, max: 1e5 },
    { key: "n0", label: "Linear index n₀", unit: "", toSI: 1, siUnit: "", default: 1.76, min: 1, max: 5 },
    { key: "n2", label: "Nonlinear index n₂", unit: "10⁻¹⁶ cm²/W", toSI: 1e-20, siUnit: "m²/W", default: 3.2, min: 1e-4, max: 1e6 },
    { key: "peakPower", label: "Peak power P", unit: "kW", toSI: 1e3, siUnit: "W", default: 100, min: 0, max: 1e9 },
    { key: "crystalLength", label: "Crystal length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0, max: 1e4 },
  ],
  outputs: [
    { key: "focalLength", label: "Kerr focal length f = πw⁴/(8n₂PL)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "nonlinearPhase", label: "On-axis nonlinear phase k₀n₂I₀L", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "peakIntensity", label: "Peak intensity I₀ = 2P/(πw²)", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "criticalPower", label: "Critical power P_cr = 3.77λ²/(8πn₀n₂)", unit: "MW", toSI: 1e6, siUnit: "W" },
    { key: "powerRatio", label: "P/P_cr", unit: "", toSI: 1, siUnit: "" },
    { key: "rayleighRange", label: "Rayleigh range in the crystal πn₀w²/λ", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ wavelength, beamWaist, n0, n2, peakPower, crystalLength }) {
    const Pcr = criticalPower(wavelength, n0, n2);
    const ratio = peakPower / Pcr;
    const I0 = gaussianPeakIntensity(peakPower, beamWaist);
    const phi0 = nonlinearPhase(wavelength, n2, I0, crystalLength);
    const f = kerrLensFocalLength(n2, peakPower, crystalLength, beamWaist);
    const zR = rayleighRangeInMedium(wavelength, n0, beamWaist);
    const zsf = selfFocusingDistance(ratio, zR);
    const warnings: string[] = [];
    if (ratio >= 1) {
      warnings.push(`P ≥ P_cr: a collimated beam would collapse after z_sf ≈ ${lengthText(zsf)} (Marburger), so the thin-lens value no longer holds once the crystal approaches that length.`);
    }
    if (crystalLength > zR) {
      warnings.push(`L > z_R (${lengthText(zR)}): the beam changes size inside the crystal, so treat f as an estimate. A thick Kerr medium is modelled as a stack of thin Kerr lenses.`);
    }
    if (Number.isFinite(f) && f > 0 && f < 10 * crystalLength) warnings.push("f is less than 10 L: the lens is not thin compared with the crystal.");
    return {
      values: { focalLength: f, nonlinearPhase: phi0, peakIntensity: I0, criticalPower: Pcr, powerRatio: ratio, rayleighRange: zR },
      warnings,
    };
  },
  checks: [
    {
      // P_cr = 3.77 λ²/(8π n₀ n₂) = 3.77 (800e-9)²/(8π·1.76·3.2e-20) W; ratio = 1e5/P_cr; z_R = π n₀ w²/λ = π·1.76·(30e-6)²/800e-9.
      source: "Fibich G., Gaeta A. L. (2000). Critical power for self-focusing in bulk media and in hollow waveguides. Opt. Lett. 25, 335–337, doi:10.1364/OL.25.000335 (P_cr = 3.77λ²/(8πn₀n₂)).",
      basis: "computed",
      inputs: {},
      expect: { criticalPower: 1.7045856120921745, powerRatio: 0.0586652845657086, rayleighRange: 6.220353454107791 },
      tolerance: 1e-8,
    },
    {
      // I₀ = 2P/(πw²); φ₀ = (2π/λ) n₂ I₀ L; f = πw⁴/(8 n₂ P L), at the defaults (n₂ = 3.2e-20 m²/W, P = 1e5 W, L = 2 mm, w = 30 µm).
      source: "Magni V., Cerullo G., De Silvestri S. (1993). ABCD matrix analysis of propagation of gaussian beams through Kerr media. Opt. Commun. 96, 348–355, doi:10.1016/0030-4018(93)90284-C (thin Kerr lens 1/f = 8n₂PL/(πw⁴), derived here from the parabolic expansion of I(r)).",
      basis: "computed",
      inputs: {},
      expect: { peakIntensity: 7073553026.306459, nonlinearPhase: 0.03555555555555555, focalLength: 49.700977527494786 },
      tolerance: 1e-8,
    },
  ],
});
