import { MAX_CIRCULAR_FRESNEL_NUMBER, diffractionSummary, plotRadiusLimits } from "../../physics/wave-optics/diffraction-integral";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/diffraction-integral",
  choices: [
    {
      key: "aperture",
      label: "Aperture",
      options: [
        { value: "circular", label: "Circular aperture (radius a)" },
        { value: "slit", label: "Single slit (half-width a)" },
      ],
      default: "circular",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 632.8, min: 200, max: 11000 },
    { key: "apertureSize", label: "Aperture radius or slit half-width a", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 1, max: 1e4 },
    { key: "propDist", label: "Distance to the screen z", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: 0.1, max: 1e5 },
    // The page clamps this to a/10 … max(3a, 40λz/a); it only decides whether the plot edge is paraxial (warning).
    { key: "observationSize", label: "Plotted radius on the screen", unit: "µm", toSI: 1e-6, siUnit: "m", default: 500, min: 0.1, max: 1e9 },
  ],
  outputs: [
    { key: "fresnelNumber", label: "Fresnel number N_F = a²/(λz)", unit: "", toSI: 1, siUnit: "" },
    { key: "onAxis", label: "On-axis intensity I(0)/I₀", unit: "", toSI: 1, siUnit: "" },
    { key: "onAxisParaxial", label: "Paraxial on-axis intensity I(0)/I₀", unit: "", toSI: 1, siUnit: "" },
    { key: "farFieldFirstZero", label: "Far-field first zero (slit λz/(2a), circular 1.22λz/(2a))", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "farFieldDistance", label: "Far field starts beyond a²/λ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "edgePhase", label: "Phase dropped by the Fresnel approximation at the aperture edge", unit: "rad", toSI: 1, siUnit: "rad" },
  ],
  compute({ aperture, wavelength, apertureSize, propDist, observationSize }) {
    const kind = aperture === "slit" ? "slit" : "circular";
    const s = diffractionSummary(kind, apertureSize, wavelength, propDist);
    const limits = plotRadiusLimits(apertureSize, wavelength, propDist);
    const obs = Math.min(limits.max, Math.max(limits.min, observationSize));
    const angle = (apertureSize + obs) / propDist;
    const warnings: string[] = [];
    if (s.tooNear) {
      warnings.push(
        `N_F = ${s.fresnelNumber.toPrecision(3)} is above ${MAX_CIRCULAR_FRESNEL_NUMBER}: the screen is so close that the pattern is the aperture's geometric shadow with fine edge fringes. The on-axis value is the exact Rayleigh–Sommerfeld one.`,
      );
    }
    if (s.edgePhase > 0.1) {
      warnings.push(
        `The Fresnel approximation drops a phase πa⁴/(4λz³) = ${s.edgePhase.toPrecision(2)} rad at the aperture edge, which is not ≪ 1: the Fresnel-pattern values are only approximate. Use a larger z or a smaller aperture.`,
      );
    }
    if (angle > 0.1) {
      warnings.push(`The edge of the plotted region is ${angle.toPrecision(2)} rad off axis: beyond the paraxial Fresnel approximation. Use z ≫ a.`);
    }
    return {
      values: {
        fresnelNumber: s.fresnelNumber,
        onAxis: s.onAxis,
        onAxisParaxial: s.onAxisParaxial,
        farFieldFirstZero: s.farFieldFirstZero,
        farFieldDistance: s.farFieldDistance,
        edgePhase: s.edgePhase,
      },
      warnings,
    };
  },
  checks: [
    {
      // N_F = a²/(λz) = (100 µm)²/(632.8 nm · 50 mm); R = √(z² + a²), I/I₀ = |1 − (z/R) e^(ik(R − z))|² (Osterberg–Smith);
      // first dark ring j₁,₁ λz/(2π a) with j₁,₁ = 3.831705970207512; a²/λ.
      source: "Osterberg H., Smith L. W. (1961). Closed solutions of Rayleigh's diffraction integral for axial points. J. Opt. Soc. Am. 51, 1050–1054; Born M., Wolf E. (1999). Principles of Optics, 7th ed. (Airy pattern, first dark ring).",
      basis: "computed",
      inputs: { aperture: "circular", wavelength: 632.8, apertureSize: 100, propDist: 50 },
      expect: { fresnelNumber: 0.316055625790139, onAxis: 0.9075005667513811, farFieldFirstZero: 192.95177679836098, farFieldDistance: 15.802781289506955 },
      tolerance: 1e-8,
    },
    {
      // Slit, a = 500 µm, λ = 1550 nm, z = 250 mm: first zero λz/(2a) = 1550 nm · 250 mm/(1000 µm) = 387.5 µm; N_F = a²/(λz).
      source: "Goodman J. W. (2005). Introduction to Fourier Optics, 3rd ed. Roberts & Company, ch. 4 (Fraunhofer diffraction by a slit).",
      basis: "computed",
      inputs: { aperture: "slit", wavelength: 1550, apertureSize: 500, propDist: 250 },
      expect: { farFieldFirstZero: 387.5, fresnelNumber: 0.6451612903225806 },
      tolerance: 1e-8,
    },
    {
      // N_F = 1 (a = √(λz), z = 1 m, λ = 500 nm): the dropped edge phase k a⁴/(2z(R + z)²) ≈ πa⁴/(4λz³) = πλ/(4z) = 3.927e-7 rad.
      source: "Goodman J. W. (2005). Introduction to Fourier Optics, 3rd ed. Roberts & Company, ch. 4 (§4.2.2, binomial expansion of the Fresnel approximation).",
      basis: "computed",
      inputs: { aperture: "circular", wavelength: 500, apertureSize: 707.1067811865476, propDist: 1000 },
      expect: { fresnelNumber: 1, edgePhase: 3.9269898352398446e-7 },
      tolerance: 1e-8,
    },
  ],
});
