import {
  POLYMERS, corecladNA, normalReflectance, polymerAbbe, polymerDnDlambda, polymerGroupIndex, polymerIndex, polymerRange,
  type PolymerId,
} from "../../physics/materials/polymer-optics";
import { defineSchema } from "../types";

const IDS = Object.keys(POLYMERS) as PolymerId[];

const SULTANOVA = "Sultanova N., Kasarova S., Nikolov I. (2009). Dispersion properties of optical polymers. Acta Phys. Pol. A 116, 585–587 " +
  "(Sellmeier fit n² = 1 + Bλ²/(λ² − C), λ in µm, 20 °C, 0.4368–1.052 µm; PS: B = 1.4435, C = 0.020216, coefficients as recorded by the " +
  "refractiveindex.info database); R = ((n − 1)/(n + 1))² is the Fresnel equation at normal incidence in air.";
const BEADIE = "Beadie G., Brindza M., Flynn R. A., Rosenberg A., Shirk J. S. (2015). Refractive index measurements of poly(methyl " +
  "methacrylate) (PMMA) from 0.4–1.6 µm. Appl. Opt. 54, F139–F143 (fit n² = A + Σ Bᵢλ^pᵢ, λ in µm, 20.1 °C, 0.42–1.62 µm: A = 2.1778, " +
  "terms 6.1209e-3 λ², −1.5004e-3 λ⁴, 2.3678e-2 λ⁻², −4.2137e-3 λ⁻⁴, 7.3417e-4 λ⁻⁶, −4.5042e-5 λ⁻⁸; coefficients as recorded by the " +
  "refractiveindex.info database); R = ((n − 1)/(n + 1))² at normal incidence in air.";

export default defineSchema({
  href: "/materials/polymer-optics",
  choices: [
    {
      key: "polymer",
      label: "Polymer (core)",
      options: IDS.map((id) => ({ value: id, label: POLYMERS[id].name })),
      default: "pmma",
    },
    {
      key: "cladding",
      label: "Cladding polymer for the numerical aperture (\"none\" or the core polymer gives none)",
      options: [{ value: "none", label: "None" }, ...IDS.map((id) => ({ value: id, label: POLYMERS[id].name }))],
      default: "none",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 633, min: 320, max: 1620 },
  ],
  outputs: [
    { key: "n", label: "Refractive index n", unit: "", toSI: 1, siUnit: "" },
    { key: "groupIndex", label: "Group index n_g = n − λ dn/dλ", unit: "", toSI: 1, siUnit: "" },
    { key: "dndlambda", label: "dn/dλ", unit: "µm⁻¹", toSI: 1e6, siUnit: "1/m" },
    { key: "abbe", label: "Abbe number V_d", unit: "", toSI: 1, siUnit: "" },
    { key: "reflectance", label: "Reflectance per surface, normal incidence in air", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "claddingIndex", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "" },
    { key: "na", label: "Core–cladding numerical aperture √(n² − n₂²)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ polymer, cladding, wavelength }) {
    const d = POLYMERS[polymer as PolymerId].dispersion;
    const n = polymerIndex(d, wavelength);
    const warnings: string[] = [];
    if (!Number.isFinite(n)) {
      const [lo, hi] = polymerRange(d);
      warnings.push(`${POLYMERS[polymer as PolymerId].name}: the fit covers ${Math.round(lo * 1e9)}–${Math.round(hi * 1e9)} nm only.`);
    }
    const clad = cladding !== polymer && cladding in POLYMERS ? POLYMERS[cladding as PolymerId] : undefined;
    const n2 = clad ? polymerIndex(clad.dispersion, wavelength) : NaN;
    const na = corecladNA(n, n2);
    if (!clad) warnings.push("No cladding chosen (or the cladding is the core polymer): no numerical aperture.");
    else if (!Number.isFinite(n2)) {
      const [lo, hi] = polymerRange(clad.dispersion);
      warnings.push(`${clad.name} cladding: the fit covers ${Math.round(lo * 1e9)}–${Math.round(hi * 1e9)} nm only.`);
    } else if (!(na > 0) && Number.isFinite(n)) warnings.push("Cladding index ≥ core index: no guiding.");
    return {
      values: {
        n,
        groupIndex: polymerGroupIndex(d, wavelength),
        dndlambda: polymerDnDlambda(d, wavelength),
        abbe: polymerAbbe(d),
        reflectance: normalReflectance(n),
        claddingIndex: n2,
        na,
      },
      warnings,
    };
  },
  checks: [
    {
      // λ = 0.633 µm, λ² = 0.400689: n² = 2.1778 + 0.0024526 − 0.00024089 + 0.059093 − 0.026245 + 0.011413 − 0.0017474 = 2.2225253,
      // n = 1.4908134; R = (0.4908134/2.4908134)² = 3.88285 %.
      source: BEADIE,
      basis: "computed",
      inputs: { polymer: "pmma", wavelength: 633 },
      expect: { n: 1.4908134402843045, reflectance: 3.8828489198265363, groupIndex: 1.5121974820737247, abbe: 59.36675502110955 },
      tolerance: 1e-8,
    },
    {
      // λ² = 0.400689: n² = 1 + 1.4435 · 0.400689/(0.400689 − 0.020216) = 2.5201..., n = 1.5875134; R = (0.5875134/2.5875134)² = 5.15549 %.
      // PS core on PMMA cladding: NA = √(1.5875134² − 1.4908134²) = √(0.0966999 · 3.0783268) = 0.5455951.
      source: `${SULTANOVA} Cladding: ${BEADIE} NA = √(n₁² − n₂²) (core–cladding step index).`,
      basis: "computed",
      inputs: { polymer: "ps", cladding: "pmma", wavelength: 633 },
      expect: { n: 1.5875133795545464, reflectance: 5.155494340010477, claddingIndex: 1.4908134402843045, na: 0.5455951031052001 },
      tolerance: 1e-8,
    },
  ],
});
