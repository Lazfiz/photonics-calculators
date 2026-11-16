import { eyeLimits, T_MAX, T_MIN } from "../../physics/laser-safety/eye-exposure-limits";
import { nominalOcularHazardDistance, requiredOpticalDensity, roundBeam } from "../../physics/laser-safety/hazard-distance";
import {
  diffractionLimitedSpot, focusedDivergence, spotPowerDensity, thermalRelaxationTime, type TargetShape,
} from "../../physics/laser-safety/surgical-laser";
import { defineSchema } from "../types";
import { ICNIRP_2013, WAVELENGTH } from "./common";

const ANDERSON_PARRISH = "Anderson & Parrish (1983). Selective photothermolysis: precise microsurgery by selective absorption of " +
  "pulsed radiation. Science 220(4596), 524–527. https://doi.org/10.1126/science.6836297 (τ = d²/(16κ) for a vessel)";
const HANDPIECE = `ANSI Z136.1-2014, Appendix B (lens-on-laser: divergence b₀/f beyond the focus, NOHD (f/b₀)√(4P/(π MPE)); here the beam grows from the focal spot a as √(a² + (rφ)²)); limits from ` +
  `${ICNIRP_2013}, Table 5.`;

export default defineSchema({
  href: "/laser-safety/medical-laser-safety",
  choices: [
    {
      key: "targetShape",
      label: "Target shape",
      options: [
        { value: "cylinder", label: "Cylinder (vessel, hair shaft)" },
        { value: "sphere", label: "Sphere (melanosome, cell)" },
        { value: "layer", label: "Layer (heated depth)" },
      ],
      default: "cylinder",
    },
  ],
  inputs: [
    { key: "power", label: "Power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 10000, min: 0, max: 1e9 },
    { ...WAVELENGTH, default: 10600 },
    { key: "beamDia", label: "Beam diameter on the focusing lens, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 8, min: 0.001, max: 1e4 },
    { key: "focalLength", label: "Focal length of the handpiece", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: 1, max: 1e6 },
    { key: "spotSize", label: "Spot diameter at the focus, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.2, min: 0.0001, max: 1e4 },
    { key: "exposureTime", label: "Pulse or dwell time on tissue", unit: "s", toSI: 1, siUnit: "s", default: 0.1, min: 0, max: 1e6 },
    { key: "targetSize", label: "Target size", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 0, max: 1e6 },
    { key: "eyeExposure", label: "Eye exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: T_MIN, max: T_MAX },
  ],
  outputs: [
    { key: "powerDensity", label: "Power density at the spot, P/(πd²/4)", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "fluence", label: "Fluence per pulse or dwell", unit: "J/cm²", toSI: 1e4, siUnit: "J/m²" },
    { key: "relaxationTime", label: "Thermal relaxation time of the target", unit: "ms", toSI: 1e-3, siUnit: "s" },
    { key: "minSpot", label: "Diffraction-limited spot 4λf/(πb₀)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "divergence", label: "Divergence beyond the focus b₀/f", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "nohd", label: "NOHD beyond the focus (0: within at the focus)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "odFocus", label: "Eyewear optical density for the beam at its focus", unit: "", toSI: 1, siUnit: "" },
    { key: "odLens", label: "Eyewear optical density for the beam at the lens", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ power, wavelength, beamDia, focalLength, spotSize, exposureTime, targetSize, targetShape, eyeExposure }) {
    const shape: TargetShape = targetShape === "sphere" || targetShape === "layer" ? targetShape : "cylinder";
    const density = spotPowerDensity(power, spotSize);
    const phi = focusedDivergence(beamDia, focalLength);
    const minSpot = diffractionLimitedSpot(wavelength, beamDia, focalLength);
    const tissue = {
      powerDensity: density,
      fluence: density * exposureTime,
      relaxationTime: thermalRelaxationTime(targetSize, shape),
      minSpot,
      divergence: phi,
    };
    const warnings: string[] = [];
    if (spotSize < minSpot * (1 - 1e-9)) warnings.push("The spot is smaller than the diffraction limit of this beam and lens.");
    const nohd = nominalOcularHazardDistance(wavelength, power, roundBeam(spotSize, phi), eyeExposure);
    const odFocus = requiredOpticalDensity(wavelength, power, spotSize, eyeExposure);
    const odLens = requiredOpticalDensity(wavelength, power, beamDia, eyeExposure);
    if (eyeLimits(wavelength).length === 0 || Number.isNaN(nohd.distance) || Number.isNaN(odFocus.od)) {
      warnings.push("The eye limits cover 180 nm to 1 mm.");
      return { values: { ...tissue, nohd: NaN, odFocus: NaN, odLens: NaN }, warnings };
    }
    return { values: { ...tissue, nohd: nohd.distance, odFocus: odFocus.od, odLens: odLens.od }, warnings };
  },
  checks: [
    {
      // Defaults: 10 W on a 0.2 mm spot: P/(πd²/4) = 10/(π·1e-8 m²) = 3.1830989e8 W/m² = 31830.989 W/cm²; × 0.1 s = 3183.0989
      // J/cm². Cylinder of 100 µm, κ = 1.3e-7 m²/s: d²/(16κ) = 1e-8/2.08e-6 = 4.807692 ms. 4λf/(πb₀) with λ = 10.6 µm,
      // f = 100 mm, b₀ = 8 mm: 4.24e-6/(8e-3·π) = 1.687042e-4 m. Divergence b₀/f = 0.08 rad = 80 mrad.
      source: ANDERSON_PARRISH + "; " + HANDPIECE,
      basis: "computed",
      inputs: {},
      expect: {
        powerDensity: 31830.98862, fluence: 3183.098862, relaxationTime: 4.807692308, minSpot: 0.1687042397, divergence: 80,
      },
      tolerance: 1e-8,
    },
    {
      // Defaults, eye side: 10.6 µm, 10 s, the corneal 5.6×10³ t^0.25 J/m² over its 1.5·t^0.375 mm aperture binds; the
      // beam must have spread to 159.87 mm (the worked case of nohd, tests/laser-safety-hazard-distance.test.ts), so
      // NOHD = √(0.15987² − 0.0002²) m/(80 mrad) = 1.9984 m.
      source: HANDPIECE,
      basis: "computed",
      inputs: {},
      expect: { nohd: 1.9984 },
      tolerance: 2e-4,
    },
  ],
});
