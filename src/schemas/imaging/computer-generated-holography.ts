import { BIT_DEPTHS, PARAXIAL_SIN_LIMIT, slmReplaySummary } from "../../physics/imaging/computer-generated-holography";
import { defineSchema } from "../types";

const SCHNARS = "Schnars U., Jüptner W. P. O. (2002). Digital recording and numerical reconstruction of holograms. " +
  "Meas. Sci. Technol. 13, R85–R101 (Fresnel image pixel λz/(NΔx)). https://doi.org/10.1088/0957-0233/13/9/201";
const SWANSON = "Swanson G. J. (1989). Binary optics technology: the theory and design of multi-level diffractive optical " +
  "elements. MIT Lincoln Laboratory Technical Report 854, https://doi.org/10.21236/ada213404 (first-order efficiency sinc²(π/L) of an L-level phase profile).";
const GOODMAN = "Goodman J. W. (2005). Introduction to Fourier Optics, 3rd ed., Roberts & Company (sinc aperture " +
  "envelope of a rectangular pixel of open width a: sinc²(a f); grating equation sin θ = λ/(2Δx) for the finest period 2Δx; " +
  "first-order efficiency |c₁|² = 1/π² of a 50 % square-wave amplitude grating).";
const DEG = Math.PI / 180;

export default defineSchema({
  href: "/imaging/computer-generated-holography",
  inputs: [
    { key: "wavelengthNm", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 633, min: 350, max: 1600 },
    { key: "pixelPitchUm", label: "SLM pixel pitch Δx", unit: "µm", toSI: 1e-6, siUnit: "m", default: 8, min: 1, max: 50 },
    { key: "slmWidth", label: "SLM width N_x", unit: "px", toSI: 1, siUnit: "", default: 1920, min: 64, max: 8192 },
    { key: "slmHeight", label: "SLM height N_y", unit: "px", toSI: 1, siUnit: "", default: 1080, min: 64, max: 8192 },
    { key: "reconstructionDistMm", label: "Replay distance or Fourier-lens focal length z", unit: "mm", toSI: 1e-3, siUnit: "m", default: 500, min: 10, max: 5000 },
    { key: "bitDepth", label: "Phase bit depth (1, 2, 3, 4, 6, 8 or 10; phase modulation only)", unit: "bit", toSI: 1, siUnit: "", default: 8, min: 1, max: 10 },
    { key: "fillFactor", label: "Pixel fill factor (area)", unit: "", toSI: 1, siUnit: "", default: 0.9, min: 0.1, max: 1 },
  ],
  choices: [
    {
      key: "modulation", label: "Modulation", default: "phase",
      options: [{ value: "phase", label: "Phase (kinoform)" }, { value: "amplitude", label: "Binary amplitude" }],
    },
  ],
  outputs: [
    { key: "maxAngle", label: "Largest diffraction angle arcsin(λ/2Δx)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "replayField", label: "Replay field λz/Δx", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "spotX", label: "Replay spot λz/(N_xΔx), x", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "spotY", label: "Replay spot λz/(N_yΔx), y", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "angularResolution", label: "Angular resolution λ/(N_xΔx)", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "efficiency", label: "First-order efficiency", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "edgeEnvelope", label: "Pixel envelope at the field edge", unit: "", toSI: 1, siUnit: "" },
    { key: "apertureX", label: "SLM aperture N_xΔx", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "apertureY", label: "SLM aperture N_yΔx", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "frameBytes", label: "Hologram frame size", unit: "MB", toSI: 1e6, siUnit: "B" },
    { key: "aliasDistance", label: "Shortest lensless Fresnel distance N_xΔx²/λ", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  validate({ slmWidth, slmHeight, bitDepth, modulation }) {
    if (!Number.isInteger(slmWidth) || !Number.isInteger(slmHeight)) return "The SLM width and height are whole numbers of pixels.";
    if (modulation !== "amplitude" && !BIT_DEPTHS.includes(bitDepth)) return `The phase bit depth must be one of ${BIT_DEPTHS.join(", ")}.`;
    return undefined;
  },
  compute({ wavelengthNm, pixelPitchUm, slmWidth, slmHeight, reconstructionDistMm, bitDepth, fillFactor, modulation }) {
    const { sinMax, ...s } = slmReplaySummary({
      lambda: wavelengthNm, pitch: pixelPitchUm, nx: slmWidth, ny: slmHeight, z: reconstructionDistMm, bits: bitDepth,
      fill: fillFactor, amplitude: modulation === "amplitude",
    });
    const warnings: string[] = [];
    if (reconstructionDistMm < s.aliasDistance) {
      warnings.push("Lensless Fresnel replay: the quadratic phase aliases on the SLM below z = N_xΔx²/λ; use a Fourier lens or a longer distance.");
    }
    if (sinMax > PARAXIAL_SIN_LIMIT) {
      warnings.push(`λ/(2Δx) is above ${PARAXIAL_SIN_LIMIT}: the field λz/Δx is paraxial and only approximate. A lensless field is 2z·tan θ_max; a Fourier lens obeying the sine condition gives λf/Δx exactly.`);
    }
    return { values: s, warnings };
  },
  checks: [
    {
      // Defaults: θ_max = asin(633e-9/(2·8e-6)) = asin(0.0395625) = 2.267356°; λz/Δx = 633e-9·0.5/8e-6 = 39.5625 mm;
      // λz/(N_xΔx) = 633e-9·0.5/(1920·8e-6) = 20.60547 µm.
      source: SCHNARS + "; " + GOODMAN,
      basis: "computed",
      inputs: { wavelengthNm: 633, pixelPitchUm: 8, slmWidth: 1920, reconstructionDistMm: 500 },
      expect: { maxAngle: 2.2673560139, replayField: 39.5625, spotX: 20.60546875 },
      tolerance: 1e-8,
    },
    {
      // 3 bits = 8 levels: sinc²(π/8) = (sin(π/8)/(π/8))² = (0.3826834/0.3926991)² = 0.9496412 → 94.96412 %.
      source: SWANSON,
      basis: "computed",
      inputs: { modulation: "phase", bitDepth: 3 },
      expect: { efficiency: 94.964120355 },
      tolerance: 1e-8,
    },
    {
      // Binary amplitude: 1/π² = 10.132118 %. Fill factor 0.64 (open width 0.8Δx) at the field edge f = 1/(2Δx):
      // sinc²(0.4π) = (sin(1.2566371)/1.2566371)² = (0.9510565/1.2566371)² = 0.5727867.
      source: GOODMAN,
      basis: "computed",
      inputs: { modulation: "amplitude", fillFactor: 0.64 },
      expect: { efficiency: 10.132118364, edgeEnvelope: 0.5727866972 },
      tolerance: 1e-8,
    },
  ],
});
