import { h, c, eV } from "../../physics/constants";
import {
  DIATOMICS, forceConstant, isotopologue, mostPopulatedJ, reducedMass, rotationalConstantV, rovibrationalBand, vibrationalTerm,
} from "../../physics/spectroscopy/diatomic";
import { defineSchema } from "../types";

const CM = 100; // 1 cm⁻¹ in m⁻¹
const HCL_MAX_K = 1200;

export default defineSchema({
  href: "/spectroscopy/infrared-spectroscopy",
  choices: [
    {
      key: "molecule",
      label: "Molecule",
      options: [
        { value: "hcl", label: `${DIATOMICS.hcl.label} (hydrogen chloride)` },
        { value: "co", label: `${DIATOMICS.co.label} (carbon monoxide)` },
      ],
      default: "hcl",
    },
  ],
  inputs: [
    { key: "band", label: "Band (upper level v of v ← 0: 1 fundamental, 2 first overtone, 3 second overtone)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 3 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 10, max: 3000 },
    { key: "resolution", label: "Instrument resolution (FWHM)", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹", default: 0.5, min: 0.01, max: 20 },
    { key: "isotopes", label: "Show the minor isotopologue (1 yes, 0 no)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1 },
  ],
  outputs: [
    { key: "bandOrigin", label: "Band origin ν₀ = G(v) − G(0)", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "bandOriginWavelength", label: "Band origin wavelength", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "r0", label: "R(0) line", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "p1", label: "P(1) line", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "strongestRJ", label: "J″ of the strongest R line", unit: "", toSI: 1, siUnit: "" },
    { key: "strongestPJ", label: "J″ of the strongest P line", unit: "", toSI: 1, siUnit: "" },
    { key: "strongestRLine", label: "Strongest R line", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "strongestPLine", label: "Strongest P line", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "mostPopulatedJ", label: "Most populated J″", unit: "", toSI: 1, siUnit: "" },
    { key: "isotopeShift", label: "Isotope shift of ν₀ (minor − major)", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "harmonicFrequency", label: "Harmonic frequency ω_e", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "fundamental", label: "Fundamental G(1) − G(0) (anharmonic)", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "forceConstant", label: "Force constant k = μ(2πcω_e)²", unit: "N/m", toSI: 1, siUnit: "N/m" },
    { key: "anharmonicity", label: "Anharmonicity ω_e x_e", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "morseDepth", label: "Morse well depth ω_e²/(4ω_e x_e) (rough)", unit: "eV", toSI: eV, siUnit: "J" },
    { key: "B0", label: "Rotational constant B₀", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "Bv", label: "Rotational constant B_v of the upper level", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
  ],
  validate: ({ molecule, temperature }) =>
    molecule === "hcl" && temperature > HCL_MAX_K
      ? `The rotational sum of H³⁵Cl does not converge above ${HCL_MAX_K} K (the page stops there); use at most ${HCL_MAX_K} K.`
      : undefined,
  // The instrument resolution and the isotopes switch only shape the page's plotted spectrum.
  compute({ molecule, band, temperature }) {
    const p = DIATOMICS[molecule === "co" ? "co" : "hcl"];
    const vUp = Math.round(band);
    const minor = isotopologue(p, p.minor.m1, p.minor.m2);
    const mu = reducedMass(p.m1, p.m2);
    const origin = vibrationalTerm(vUp, p) - vibrationalTerm(0, p);
    const originMinor = vibrationalTerm(vUp, minor) - vibrationalTerm(0, minor);
    const lines = rovibrationalBand(p, vUp, temperature);
    const R0 = lines.find((l) => l.branch === "R" && l.J === 0), P1 = lines.find((l) => l.branch === "P" && l.J === 1);
    const strongest = (branch: "P" | "R") => lines.filter((l) => l.branch === branch)
      .reduce<(typeof lines)[number] | undefined>((a, b) => (!a || b.strength > a.strength ? b : a), undefined);
    const strongestR = strongest("R"), strongestP = strongest("P");
    const B0 = rotationalConstantV(p, 0);
    const warnings: string[] = [];
    if (lines.length === 0) warnings.push("The rotational sum does not converge at this temperature, so the line positions are null.");
    return {
      values: {
        bandOrigin: origin,
        bandOriginWavelength: 1 / origin,
        r0: R0 ? R0.sigma : NaN,
        p1: P1 ? P1.sigma : NaN,
        strongestRJ: strongestR ? strongestR.J : NaN,
        strongestPJ: strongestP ? strongestP.J : NaN,
        strongestRLine: strongestR ? strongestR.sigma : NaN,
        strongestPLine: strongestP ? strongestP.sigma : NaN,
        mostPopulatedJ: mostPopulatedJ(B0, temperature),
        isotopeShift: originMinor - origin,
        harmonicFrequency: p.we,
        fundamental: vibrationalTerm(1, p) - vibrationalTerm(0, p),
        forceConstant: forceConstant(mu, p.we),
        anharmonicity: p.wexe,
        morseDepth: (h * c * p.we * p.we) / (4 * p.wexe),
        B0,
        Bv: rotationalConstantV(p, vUp),
      },
      warnings,
    };
  },
  checks: [
    {
      // H³⁵Cl fundamental: ω_e − 2ω_e x_e + 3.25 ω_e y_e + 5 ω_e z_e = 2990.946 − 105.6372 + 0.728975 − 0.0605 = 2885.977275 cm⁻¹.
      source: "Hand calculation from the NIST Chemistry WebBook constants for H³⁵Cl (Huber & Herzberg 1979; ω_e z_e from " +
        "Rank et al. 1965): G(1) − G(0) = ω_e − 2ω_e x_e + 3.25 ω_e y_e + 5 ω_e z_e (tests/spectroscopy-molecular.test.ts).",
      basis: "computed",
      inputs: { molecule: "hcl", band: 1, temperature: 300 },
      expect: { bandOrigin: 2885.977275 },
      tolerance: 1e-9,
    },
    {
      // k = μ(2πcω_e)² = 516.3 N/m for H³⁵Cl; Atkins' Physical Chemistry quotes 516 N/m.
      source: "Hand calculation k = μ(2πcω_e)² from the NIST ω_e of H³⁵Cl (Atkins' Physical Chemistry quotes 516 N/m); " +
        "tests/spectroscopy-molecular.test.ts.",
      basis: "computed",
      inputs: { molecule: "hcl" },
      expect: { forceConstant: 516.3 },
      tolerance: 2e-4,
    },
  ],
});
