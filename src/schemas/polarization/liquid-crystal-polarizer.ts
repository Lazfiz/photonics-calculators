import { retardance } from "../../physics/polarization/retarders";
import { goochTarryMinimum, lcEffectiveBirefringence, lcTransmission } from "../../physics/polarization/twisted-nematic";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const YEH = "Yeh P., Gu C. (1999). Optics of Liquid Crystal Displays, Wiley (twisted-nematic Jones matrix J = R(−Φ)[cos X·I + " +
  "(sin X/X)·K], X = √(Φ² + (Γ/2)²)); Gooch C. H., Tarry H. A. (1975). J. Phys. D 8, 1575, https://doi.org/10.1088/0022-3727/8/13/020 " +
  "(first-minimum condition Δn·d/λ = √3/2 for the 90° twisted cell).";

export default defineSchema({
  href: "/polarization/liquid-crystal-polarizer",
  choices: [
    {
      key: "cell",
      label: "Cell",
      options: [
        { value: "twisted", label: "Twisted or planar (director in the cell plane)" },
        { value: "va", label: "Vertically aligned (director tilted from the normal)" },
      ],
      default: "twisted",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 380, max: 780 },
    { key: "neNo", label: "Δn = nₑ − nₒ", unit: "", toSI: 1, siUnit: "", default: 0.2, min: 0.01, max: 0.5 },
    { key: "no", label: "nₒ (vertically aligned cell only)", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 1.3, max: 2 },
    { key: "cellThickness", label: "Cell thickness", unit: "µm", toSI: 1e-6, siUnit: "m", default: 5, min: 0.5, max: 30 },
    { key: "twistAngle", label: "Twist angle Φ (twisted or planar cell only)", unit: "°", toSI: DEG, siUnit: "rad", default: 90, min: -360, max: 360 },
    { key: "polarizer", label: "Polarizer, from the entrance director", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -180, max: 180 },
    { key: "analyzer", label: "Analyzer, from the entrance director", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -180, max: 180 },
    { key: "tilt", label: "Director tilt from the normal (vertically aligned cell only)", unit: "°", toSI: DEG, siUnit: "rad", default: 30, min: 0, max: 90 },
  ],
  outputs: [
    { key: "retardance", label: "Retardance Γ", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "waves", label: "Retardance in waves", unit: "waves", toSI: 1, siUnit: "waves" },
    { key: "effectiveBirefringence", label: "Effective birefringence Δn_eff", unit: "", toSI: 1, siUnit: "" },
    { key: "dndOverLambda", label: "Δn_eff·d/λ", unit: "", toSI: 1, siUnit: "" },
    { key: "transmission", label: "Transmission of the light after the first polarizer", unit: "%", toSI: 0.01, siUnit: "1" },
    { key: "firstMinimumThickness", label: "Thickness of the first Gooch-Tarry minimum, (√3/2)λ/Δn (90° twisted cell)", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ cell, wavelength, neNo, no, cellThickness, twistAngle, polarizer, analyzer, tilt }) {
    const va = cell === "va";
    const twist = va ? 0 : twistAngle;
    const dnE = lcEffectiveBirefringence(va, neNo, no, tilt);
    const gamma = retardance(dnE, cellThickness, wavelength);
    const T = lcTransmission(twist, gamma, polarizer, analyzer);
    const warnings: string[] = [];
    if (va) warnings.push("Vertically aligned cell: the twist angle is ignored (no twist) and nₒ and the tilt set Δn_eff.");
    else warnings.push("Twisted or planar cell: nₒ and the tilt do not apply.");
    if (va || Math.abs(Math.abs(twist) - Math.PI / 2) > 1e-9) warnings.push("The first Gooch-Tarry minimum thickness is meaningful for a 90° twisted cell only.");
    warnings.push("Not modelled: pretilt, the field-dependent director profile, dispersion of Δn, oblique viewing, reflections.");
    return {
      values: {
        retardance: gamma,
        waves: gamma / (2 * Math.PI),
        effectiveBirefringence: dnE,
        dndOverLambda: (dnE * cellThickness) / wavelength,
        transmission: T,
        firstMinimumThickness: (goochTarryMinimum(1) * wavelength) / neNo,
      },
      warnings,
    };
  },
  checks: [
    {
      // ECB cell (Φ = 0) between polarizers at +45° and −45° is a plain retarder between crossed polarizers: T = sin²(Γ/2).
      // Δn = 0.2, d = 5 µm, λ = 550 nm: Δn·d/λ = 1.818182, Γ/2 = π·1.818182, T = sin²(0.818182π) = 0.54064² = 0.2922925 (29.22925 %).
      source: YEH,
      basis: "computed",
      inputs: { cell: "twisted", twistAngle: 0, polarizer: 45, analyzer: -45, neNo: 0.2, cellThickness: 5, wavelength: 550 },
      expect: { transmission: 29.22924935, waves: 1.818181818 },
      tolerance: 1e-8,
    },
    {
      // 90° TN, polarizer and analyzer along the entrance director (Gooch-Tarry): T∥ = sin²X/(1 + u²), u = 2Δn·d/λ.
      // Δn = 0.2, d = 2.75 µm, λ = 550 nm: Δn·d/λ = 1, u = 2, Γ = 2π, X = √((π/2)² + π²) = 3.512407, sin²X = 0.131316,
      // T = 0.131316/5 = 0.0262631 (2.62631 %). First minimum: d = (√3/2)·550 nm/0.2 = 2.381570 µm.
      source: YEH,
      basis: "computed",
      inputs: { cell: "twisted", twistAngle: 90, polarizer: 0, analyzer: 0, neNo: 0.2, cellThickness: 2.75, wavelength: 550 },
      expect: { transmission: 2.626311219, firstMinimumThickness: 2.38156986 },
      tolerance: 1e-8,
    },
  ],
});
