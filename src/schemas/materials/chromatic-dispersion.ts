import {
  dispersionParameter, dnDlambda, groupIndex, gvd, inRange, refractiveIndex, zeroDispersionWavelengths,
} from "../../physics/materials/sellmeier";
import { MATERIALS, SCHOTT_GLASSES, type DispersionMaterial } from "../../physics/materials/sellmeier-data";
import { defineSchema } from "../types";

const OPTIONS: Record<string, DispersionMaterial> = { ...MATERIALS, ...SCHOTT_GLASSES };
const DEFAULT_MATERIAL = "fusedSilica";

const MALITSON = "Malitson I. H. (1965). Interspecimen comparison of the refractive index of fused silica. J. Opt. Soc. Am. 55, 1205, " +
  "doi:10.1364/JOSA.55.001205 (Sellmeier coefficients as in the refractiveindex.info database, CC0); β₂ = λ³n″/(2πc²), D = −(λ/c)n″, " +
  "n_g = n − λ dn/dλ (Agrawal G. P., Nonlinear Fiber Optics, §1.2.3); zero-dispersion wavelength of bulk fused silica ≈ 1.27 µm (Agrawal §1.2.3).";
const SCHOTT = "SCHOTT optical glass catalog (Zemax AGF 2017-01-20, as in the refractiveindex.info database, specs/schott/optical/N-BK7.yml): " +
  "n² − 1 = Σ Bᵢλ²/(λ² − Cᵢ) with B = 1.03961212, 0.231792344, 1.01046945 and C = 0.00600069867, 0.0200179144, 103.560653 µm², " +
  "valid 0.3–2.5 µm; catalog n_d = 1.51680 and n(1060.0 nm) = 1.50669 (SCHOTT N-BK 7 data sheet, schott_2017-01-20.pdf as hosted by refractiveindex.info).";

export default defineSchema({
  href: "/materials/chromatic-dispersion",
  choices: [
    {
      key: "material",
      label: "Material",
      options: Object.entries(OPTIONS).map(([value, m]) => ({ value, label: m.name })),
      default: DEFAULT_MATERIAL,
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 30000 },
  ],
  outputs: [
    { key: "n", label: "Refractive index n", unit: "", toSI: 1, siUnit: "" },
    { key: "groupIndex", label: "Group index n_g = n − λ dn/dλ", unit: "", toSI: 1, siUnit: "" },
    { key: "dnDlambda", label: "dn/dλ", unit: "1/µm", toSI: 1e6, siUnit: "1/m" },
    { key: "beta2", label: "GVD β₂", unit: "fs²/mm", toSI: 1e-27, siUnit: "s²/m" },
    { key: "dispersion", label: "Dispersion D", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "zeroDispersion", label: "Zero-dispersion wavelength (shortest, d²n/dλ² = 0)", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ material, wavelength }) {
    const id = material in OPTIONS ? material : DEFAULT_MATERIAL;
    const { model } = OPTIONS[id];
    const warnings: string[] = [];
    const valid = inRange(model, wavelength);
    const at = (f: (lambda: number) => number) => (valid ? f(wavelength) : NaN);
    if (!valid) {
      warnings.push(`${wavelength * 1e9} nm is outside the ${+(model.range[0] * 1e9).toPrecision(4)}–${+(model.range[1] * 1e9).toPrecision(4)} nm range of this formula`);
    }
    const zeros = zeroDispersionWavelengths(model);
    if (zeros.length === 0) warnings.push("No zero-dispersion wavelength in the fit range");
    if (zeros.length > 1) warnings.push(`Zero-dispersion wavelengths: ${zeros.map((z) => `${+(z * 1e9).toPrecision(5)} nm`).join(", ")}`);
    return {
      values: {
        n: at((l) => refractiveIndex(model, l)),
        groupIndex: at((l) => groupIndex(model, l)),
        dnDlambda: at((l) => dnDlambda(model, l)),
        beta2: at((l) => gvd(model, l)),
        dispersion: at((l) => dispersionParameter(model, l)),
        zeroDispersion: zeros.length ? zeros[0] : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // Fused silica at 1550 nm (page defaults): Malitson's formula evaluated in scratch (groupA/disp.mjs) with the derivatives taken by
      // Richardson-extrapolated finite differences of n(λ), not the analytic forms of sellmeier.ts:
      //   n = 1.444024, dn/dλ = −0.0119825 /µm, n_g = n − λ dn/dλ = 1.462596,
      //   β₂ = λ³n″/(2πc²) = −27.9474 fs²/mm, D = −(λ/c)n″ = 21.9118 ps/(nm·km), zero of n″ at 1272.75 nm
      source: MALITSON,
      basis: "computed",
      inputs: {},
      expect: { n: 1.444024, groupIndex: 1.462596, dnDlambda: -0.0119825, beta2: -27.9474, dispersion: 21.9118, zeroDispersion: 1272.75 },
      tolerance: 0.0005,
    },
    {
      // SCHOTT's N-BK7 data sheet prints the catalog index n_d = 1.51680 at the helium d line (587.6 nm; exactly 587.5618 nm).
      source: SCHOTT,
      basis: "printed",
      inputs: { material: "N-BK7", wavelength: 587.5618 },
      expect: { n: 1.5168 },
      tolerance: 0.00001,
    },
    {
      // The same data sheet's refractive-index table prints n(1060.0 nm) = 1.50669 for N-BK7 (the model gives 1.506688).
      source: SCHOTT,
      basis: "printed",
      inputs: { material: "N-BK7", wavelength: 1060 },
      expect: { n: 1.50669 },
      tolerance: 0.00001,
    },
  ],
});
