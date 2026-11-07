import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS, crystalRange } from "../../physics/materials/uniaxial-data";
import { conoscopeSetup, conoscopicFigure, opticAxialAngle } from "../../physics/polarization/conoscopy";
import { isCrystalId } from "../../physics/polarization/uniaxial";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
// The page draws its figure on a 121 × 121 grid; the largest retardance in the field is read from the same grid.
const SIZE = 121;
const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, ch. 15 'Optics of crystals' " +
  "(cos²V_z = (n_β⁻² − n_γ⁻²)/(n_α⁻² − n_γ⁻²); 2V the acute optic axial angle; optic sign + when V_z < 45°). " +
  "https://doi.org/10.1017/CBO9781139644181";

export default defineSchema({
  href: "/polarization/conoscopic",
  choices: [
    {
      key: "crystal",
      label: "Crystal",
      options: [
        ...CRYSTAL_IDS.map((id) => ({ value: id, label: `Uniaxial: ${UNIAXIAL_CRYSTALS[id].name}` })),
        { value: "biaxial", label: "Biaxial (custom indices)" },
      ],
      default: "calcite",
    },
    { key: "light", label: "Light (colour of the figure only)", options: [{ value: "mono", label: "Monochromatic" }, { value: "white", label: "White (D65)" }], default: "mono" },
    { key: "polars", label: "Polarizers (appearance of the figure only)", options: [{ value: "crossed", label: "Crossed" }, { value: "parallel", label: "Parallel" }], default: "crossed" },
  ],
  inputs: [
    { key: "nAlpha", label: "nα, smallest index (biaxial only)", unit: "", toSI: 1, siUnit: "", default: 1.53, min: 1, max: 3 },
    { key: "nBeta", label: "nβ (biaxial only)", unit: "", toSI: 1, siUnit: "", default: 1.68, min: 1, max: 3 },
    { key: "nGamma", label: "nγ, largest index (biaxial only)", unit: "", toSI: 1, siUnit: "", default: 1.685, min: 1, max: 3 },
    { key: "thickness", label: "Plate thickness d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 1, max: 5000 },
    { key: "tilt", label: "Tilt of the optic axis (uniaxial) or acute bisectrix (biaxial) from the plate normal", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 60 },
    { key: "rotation", label: "Stage rotation", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 360 },
    { key: "na", label: "Conoscope numerical aperture", unit: "", toSI: 1, siUnit: "", default: 0.85, min: 0.1, max: 1.3 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 589, min: 380, max: 780 },
  ],
  outputs: [
    { key: "sign", label: "Optic sign (+1 positive, −1 negative)", unit: "", toSI: 1, siUnit: "" },
    { key: "twoV", label: "Acute optic axial angle 2V", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "birefringence", label: "Birefringence nγ − nα", unit: "", toSI: 1, siUnit: "" },
    { key: "maxRetardance", label: "Largest retardance in the field", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "orders", label: "Largest retardance in orders (waves) at the wavelength", unit: "orders", toSI: 1, siUnit: "orders" },
    { key: "effectiveNA", label: "Numerical aperture used (limited to 0.98 nα)", unit: "", toSI: 1, siUnit: "" },
    { key: "melatope", label: "Melatope position ν = nβ sin V at no tilt (biaxial only)", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ crystal, nAlpha, nBeta, nGamma }) {
    if (isCrystalId(crystal)) return undefined;
    if (nAlpha <= nBeta && nBeta <= nGamma && nAlpha < nGamma) return undefined;
    return "Enter nα ≤ nβ ≤ nγ with nα < nγ.";
  },
  compute({ crystal, nAlpha, nBeta, nGamma, thickness, tilt, rotation, na, wavelength }) {
    const id = isCrystalId(crystal) ? crystal : null;
    const { indices, valid, NA } = conoscopeSetup(id, wavelength, [nAlpha, nBeta, nGamma], na);
    const [n1, n2, n3] = indices;
    const axial = opticAxialAngle(indices);
    const warnings: string[] = [];
    if (id) {
      const [lo, hi] = crystalRange(id);
      if (wavelength < lo || wavelength > hi) warnings.push(`Indices held at the data-range edge: the Sellmeier fit does not cover ${Math.round(wavelength * 1e9)} nm.`);
    }
    if (!valid) warnings.push("No index data at this wavelength.");
    else {
      if (NA < na) warnings.push(`The NA is limited to 0.98 nα = ${NA.toFixed(3)}, the largest cone the plate accepts.`);
      if (NA > 1) warnings.push("An NA above 1 needs immersion of index ≥ NA (oil, n ≈ 1.52) between the lenses and the plate.");
    }
    if (id) warnings.push("Uniaxial crystal: the two optic axes coincide, so there is no melatope position.");
    const figure = valid
      ? conoscopicFigure({
        indices, orientation: { tilt, rotation }, d: thickness, lambda: wavelength, NA, P: 0, A: Math.PI / 2, mode: "mono",
      }, SIZE)
      : null;
    return {
      values: {
        sign: axial.sign === "+" ? 1 : axial.sign === "−" ? -1 : NaN,
        twoV: axial.twoV,
        birefringence: n3 - n1,
        maxRetardance: figure ? figure.maxR : NaN,
        orders: figure ? figure.maxR / wavelength : NaN,
        effectiveNA: NA,
        melatope: valid && !id ? n2 * Math.sin(axial.twoV / 2) : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // Biaxial nα = 1.5, nβ = 1.6, nγ = 1.7: cos²V_z = (1/2.56 − 1/2.89)/(1/2.25 − 1/2.89) = 0.044604/0.098423 = 0.453196,
      // V_z = 47.68618° > 45°: negative, 2V = 2(90° − V_z) = 84.62765°; ν = nβ sin V = 1.6 · sin 42.31382° = 1.07711; nγ − nα = 0.2.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { crystal: "biaxial", nAlpha: 1.5, nBeta: 1.6, nGamma: 1.7 },
      expect: { sign: -1, twoV: 84.62764602, melatope: 1.077105496, birefringence: 0.2 },
      tolerance: 1e-8,
    },
  ],
});
