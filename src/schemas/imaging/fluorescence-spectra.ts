import { FLUOROPHORES, fluorophoreByName } from "../../physics/imaging/fluorophores";
import { fluorescenceSpectraSummary } from "../../physics/imaging/fluorescence-spectra";
import { defineSchema } from "../types";

const FPBASE = "Lambert T. J. (2019). FPbase: a community-editable fluorescent protein database. Nat. Methods 16, 277–278. " +
  "https://doi.org/10.1038/s41592-019-0352-8 (excitation and emission spectra, extinction coefficients and quantum yields, www.fpbase.org).";
const LAKOWICZ = "Lakowicz J. R. (2006). Principles of Fluorescence Spectroscopy, 3rd ed., Springer. " +
  "https://doi.org/10.1007/978-0-387-46312-4, §13.2 (overlap integral J, Förster distance R₀, E = 1/(1 + (r/R₀)⁶)).";

const dyeOptions = FLUOROPHORES.map((f) => ({ value: f.name, label: f.name }));

export default defineSchema({
  href: "/imaging/fluorescence-spectra",
  choices: [
    { key: "dye1", label: "Fluorophore 1 (FRET donor)", options: dyeOptions, default: "EGFP" },
    { key: "dye2", label: "Fluorophore 2 (FRET acceptor)", options: dyeOptions, default: "mCherry" },
  ],
  inputs: [
    { key: "laser", label: "Laser line", unit: "nm", toSI: 1e-9, siUnit: "m", default: 488, min: 350, max: 800 },
    { key: "filterCenter", label: "Emission filter centre", unit: "nm", toSI: 1e-9, siUnit: "m", default: 525, min: 350, max: 900 },
    { key: "filterBW", label: "Emission filter width", unit: "nm", toSI: 1e-9, siUnit: "m", default: 50, min: 1, max: 300 },
    { key: "kappa2", label: "Orientation factor κ²", unit: "", toSI: 1, siUnit: "", default: 0.6667, min: 0, max: 4 },
    { key: "n", label: "Refractive index n", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 1, max: 2 },
    { key: "distance", label: "Donor–acceptor distance r", unit: "nm", toSI: 1e-9, siUnit: "m", default: 5, min: 0.5, max: 20 },
  ],
  outputs: [
    { key: "excitation1", label: "Fluorophore 1 excitation at the laser", unit: "% of peak", toSI: 0.01, siUnit: "" },
    { key: "inFilter1", label: "Fluorophore 1 emission in the filter", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "excitation2", label: "Fluorophore 2 excitation at the laser", unit: "% of peak", toSI: 0.01, siUnit: "" },
    { key: "inFilter2", label: "Fluorophore 2 emission in the filter", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bleed", label: "Fluorophore 2 signal / fluorophore 1 signal in the filter", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bleedReverse", label: "Fluorophore 1 signal / fluorophore 2 signal in the filter", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "overlap", label: "Förster overlap J", unit: "M⁻¹ cm⁻¹ nm⁴", toSI: 1e-37, siUnit: "m⁶/mol" },
    { key: "forsterRadius", label: "Förster radius R₀", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "efficiency", label: "FRET efficiency at r", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ dye1, dye2, laser, filterCenter, filterBW, kappa2, n, distance }) {
    const r = fluorescenceSpectraSummary({
      donor: fluorophoreByName(dye1), acceptor: fluorophoreByName(dye2), laser,
      filterLow: filterCenter - filterBW / 2, filterHigh: filterCenter + filterBW / 2, kappa2, n, distance,
    });
    const noSignal = (which: string) =>
      `Fluorophore ${which} gives no detected signal (zero excitation at the laser line or no emission inside the filter), so the signal ratio is undefined.`;
    const reasons: Record<string, string> = {};
    if (!(r.dyes[0].signal > 0)) reasons.bleed = noSignal("1");
    if (!(r.dyes[1].signal > 0)) reasons.bleedReverse = noSignal("2");
    if (!(r.R0 > 0)) {
      reasons.efficiency = "The Förster radius is zero (κ² = 0, or no spectral overlap between the donor emission and the acceptor excitation), so the efficiency is undefined.";
    }
    return {
      values: {
        excitation1: r.dyes[0].excitation, inFilter1: r.dyes[0].inFilter,
        excitation2: r.dyes[1].excitation, inFilter2: r.dyes[1].inFilter,
        bleed: r.bleed, bleedReverse: r.bleedReverse, overlap: r.overlap * 1e-37, forsterRadius: r.R0, efficiency: r.efficiency,
      },
      reasons,
    };
  },
  checks: [
    {
      // EGFP and mCherry at 488 nm with the 500–550 nm filter. Excitation = the FPbase sample at 488 nm (0.9982 and 0.0762 of the peak).
      // Emission in the filter = trapezoid sum of the 1 nm samples over 500–550 nm divided by the sum over 300–1000 nm: 0.70648278 (EGFP).
      // mCherry is not asserted here: its FPbase emission data start exactly at 550 nm, the filter edge, so that value is only an interpolation ramp.
      source: FPBASE,
      basis: "computed",
      inputs: {},
      expect: { excitation1: 99.82, inFilter1: 70.64827840110, excitation2: 7.62 },
      tolerance: 1e-8,
    },
    {
      // EGFP → mCherry, κ² 0.6667, n 1.4, Φ_D 0.6, ε_A,max 72000 M⁻¹cm⁻¹: J = ∫F_D ε_A λ⁴ dλ/∫F_D dλ (5-point Gauss–Legendre on each
      // 1 nm interval of the sampled spectra) = 1.944102106e15 M⁻¹cm⁻¹nm⁴; R₀⁶ = 9000 ln10 κ² Φ_D J/(128 π⁵ N_A n⁴) (J in cm⁴ units, 1 nm⁴ = 1e-28 cm⁴)
      // gives R₀ = 5.109041527 nm; E(5 nm) = 1/(1 + (5/5.109041527)⁶) = 0.5323157493.
      // Filter 590–630 nm (centre 610, width 40): mCherry emission = trapezoid sum of its 1 nm samples over 590–630 nm / the sum over 300–1000 nm = 0.4701541914195.
      source: LAKOWICZ,
      basis: "computed",
      inputs: { filterCenter: 610, filterBW: 40 },
      expect: { inFilter2: 47.01541914195, overlap: 1.944102106398e15, forsterRadius: 5.109041527065, efficiency: 53.23157492554 },
      tolerance: 1e-8,
    },
    {
      // mTurquoise2 → mVenus, κ² 1, n 1.33, r 6 nm, Φ_D 0.93, ε_A,max 104000: J = 2.298269574e15, R₀ = 6.257068159 nm,
      // E = 1/(1 + (6/6.257068159)⁶) = 0.5625982228206 (R₀ recomputed from J: 6.2570681591 nm).
      source: LAKOWICZ,
      basis: "computed",
      inputs: { dye1: "mTurquoise2", dye2: "mVenus", kappa2: 1, n: 1.33, distance: 6 },
      expect: { overlap: 2.298269574249e15, forsterRadius: 6.257068159088, efficiency: 56.25982228206 },
      tolerance: 1e-8,
    },
  ],
});
