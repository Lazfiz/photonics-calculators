import { eV } from "../../physics/constants";
import { COLOR_CENTERS, stokesShift, type ColorCenterId } from "../../physics/materials/color-centers";
import { dopantAbsorption } from "../../physics/materials/dopant-absorption";
import { absorbanceFromNapierian } from "../../physics/spectroscopy/lambert-beer-law";
import { defineSchema } from "../types";

const IDS = Object.keys(COLOR_CENTERS) as ColorCenterId[];
const SIGMA_UNIT = 1e-21; // m² = 10⁻¹⁷ cm², the unit of the cross-section input
const nm = (x: number) => (x * 1e9).toFixed(1);
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const DOHERTY = "Doherty M. W., Manson N. B., Delaney P., Jelezko F., Wrachtrup J., Hollenberg L. C. L. (2013). The nitrogen-vacancy colour " +
  "centre in diamond. Phys. Rep. 528, 1–45, arXiv:1302.3288, Table 9 (Davies & Hamer 1976, experiment): NV⁻ absorption 2.180 eV, " +
  "ZPL 1.945 eV, emission 1.760 eV; text: \"zero phonon lines (ZPLs) at 1.945 eV (637 nm)\".";
const BALDACCHINI = "Baldacchini G. (2002). Colored LiF: an optical material for all seasons. J. Lumin. 100, 333–343, as tabulated in " +
  "Guerrero Perez M. et al. (2024), arXiv:2412.21060, Table I: F₂ absorption 443 nm, emission 678 nm. Stokes shift ΔE = hc(1/λ_abs − 1/λ_em) " +
  "(de Jong M., Seijo L., Meijerink A., Rabouw F. T. (2015), Phys. Chem. Chem. Phys. 17, 16959).";
const WEE = "Wee T.-L. et al. (2007). Two-photon excited fluorescence of nitrogen-vacancy centers in proton-irradiated type Ib diamond. " +
  "J. Phys. Chem. A 111, 9379: NV⁻ σ = (3.1 ± 0.8)e-17 cm² at 532 nm; α = σN, T = e^(−αd), OD = αd/ln 10.";

export default defineSchema({
  href: "/materials/color-centers",
  choices: [
    {
      key: "center",
      label: "Centre",
      options: IDS.map((id) => ({ value: id, label: `${COLOR_CENTERS[id].name} in ${COLOR_CENTERS[id].host}` })),
      default: "nv",
    },
  ],
  inputs: [
    { key: "absPeak", label: "Absorption peak (0 = the centre's preset)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0, min: 0, max: 5000 },
    { key: "emPeak", label: "Emission peak (0 = the centre's preset)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0, min: 0, max: 5000 },
    { key: "sigmaA", label: "Absorption cross-section (0 = the centre's preset)", unit: "×10⁻¹⁷ cm²", toSI: SIGMA_UNIT, siUnit: "m²", default: 0, min: 0, max: 1e4 },
    { key: "concentration", label: "Centre density", unit: "m⁻³", toSI: 1, siUnit: "m⁻³", default: 1e24, min: 0, max: 1e28 },
    { key: "thickness", label: "Thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.5, min: 1e-3, max: 1000 },
  ],
  outputs: [
    { key: "stokesShift", label: "Stokes shift", unit: "eV", toSI: eV, siUnit: "J" },
    { key: "stokesWavenumber", label: "Stokes shift as wavenumber", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "quantumDefect", label: "Quantum defect 1 − λ_abs/λ_em", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "zeroPhononLine", label: "Zero-phonon line", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "alpha", label: "Absorption coefficient α = σN", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "opticalDensity", label: "Optical density αd/ln 10", unit: "", toSI: 1, siUnit: "" },
    { key: "transmitted", label: "Transmitted e^(−αd), no surface reflections", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ center: centerId, absPeak, emPeak, sigmaA: sigmaRaw, concentration, thickness }) {
    const id = IDS.find((k) => k === centerId) ?? "nv";
    const center = COLOR_CENTERS[id];
    const warnings: string[] = [];
    // The page shows the presets rounded to 0.1 nm and 6 significant digits, and computes from those displayed values.
    const absRaw = absPeak * 1e9;
    const emRaw = emPeak * 1e9;
    const sigmaRaw17 = sigmaRaw / SIGMA_UNIT;
    const absInput = absRaw > 0 ? absRaw : Number(nm(center.absorptionPeak));
    const emInput = emRaw > 0 ? emRaw : Number(nm(center.emissionPeak));
    const presetSigma = Number((center.sigmaA / SIGMA_UNIT).toPrecision(6));
    const sigmaInput = sigmaRaw17 > 0 ? sigmaRaw17 : presetSigma;
    const abs = clamp(absInput, 100, 5000, 500) * 1e-9;
    const em = clamp(emInput, 100, 5000, 600) * 1e-9;
    const sigma = Number.isFinite(sigmaInput) ? clamp(sigmaInput, 1e-6, 1e4, 1) * SIGMA_UNIT : NaN;
    const s = stokesShift(abs, em);
    const r = dopantAbsorption(sigma, concentration, thickness);
    const od = absorbanceFromNapierian(r.alpha, thickness);
    if (s.energyEv < 0) warnings.push("The emission peak is below the absorption peak: an anti-Stokes shift, which band maxima of a single centre do not show");
    if (!Number.isFinite(sigma)) warnings.push("No cross-section is cited for this centre: enter one to get the absorption");
    const edited = absRaw > 0 || emRaw > 0;
    if (edited) warnings.push("Preset peaks edited: the zero-phonon line is not shown");
    else if (!Number.isFinite(center.zpl)) warnings.push("No zero-phonon line is listed for this centre");
    return {
      values: {
        stokesShift: s.energyEv * eV, stokesWavenumber: s.wavenumber, quantumDefect: s.quantumDefect,
        zeroPhononLine: edited ? NaN : center.zpl, alpha: r.alpha, opticalDensity: od, transmitted: r.transmission,
      },
      warnings,
    };
  },
  checks: [
    {
      // The NV⁻ zero-phonon line, printed as 1.945 eV (637 nm). hc/(1.945 eV) = 637.46 nm.
      source: DOHERTY,
      basis: "printed",
      inputs: {},
      expect: { zeroPhononLine: 637 },
      tolerance: 0.001,
    },
    {
      // NV⁻ band maxima 2.180 eV (568.7 nm) and 1.760 eV (704.4 nm), printed in Table 9 (its columns "Stokes" and "Anti-Stokes" are the absorption and emission energies; the page rounds the preset to 0.1 nm).
      // Stokes shift ΔE = 2.180 − 1.760 = 0.420 eV (printed energies subtracted; the wavelengths rounded to 0.1 nm give 0.4200 eV to 3 digits),
      // quantum defect 1 − 1.760/2.180 = 19.266 %. Absorption at the preset σ = 3.1e-17 cm² (Wee 2007) with N = 1e24 m⁻³, d = 0.5 mm:
      // α = 3.1e-21 · 1e24 = 3100 m⁻¹ = 31 cm⁻¹, OD = 3100 · 5e-4 / ln 10 = 0.67315, T = e^(−1.55) = 21.225 %.
      source: DOHERTY + " Absorption: " + WEE,
      basis: "computed",
      inputs: {},
      expect: { stokesShift: 0.420, quantumDefect: 19.266, alpha: 31, opticalDensity: 0.67315, transmitted: 21.225 },
      tolerance: 0.002,
    },
    {
      // F₂ in LiF, 443 → 678 nm: ΔE = hc(1/443 nm − 1/678 nm) = 1239.84198/443 − 1239.84198/678 = 2.79874 − 1.82868 = 0.97006 eV,
      // wavenumber 1/443e-7 − 1/678e-7 = 7824.1 cm⁻¹, quantum defect 1 − 443/678 = 34.661 %.
      source: BALDACCHINI,
      basis: "computed",
      inputs: { center: "lifF2" },
      expect: { stokesShift: 0.97006, stokesWavenumber: 7824.1, quantumDefect: 34.661 },
      tolerance: 0.002,
    },
  ],
});
