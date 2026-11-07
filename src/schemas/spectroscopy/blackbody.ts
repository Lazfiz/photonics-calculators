import { blackbodyBandFraction, planckExitance, totalExitance } from "../../physics/blackbody";
import { b_Wien } from "../../physics/constants";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/spectroscopy/blackbody",
  inputs: [
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 5778, min: 100, max: 40000 },
    { key: "bandFromNm", label: "Band from", unit: "nm", toSI: 1e-9, siUnit: "m", default: 380, min: 1, max: 1e6 },
    { key: "bandToNm", label: "Band to", unit: "nm", toSI: 1e-9, siUnit: "m", default: 780, min: 1, max: 1e6 },
  ],
  outputs: [
    { key: "peakWavelength", label: "Peak wavelength (Wien)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "peakSpectralRadiance", label: "Peak spectral radiance", unit: "W/(m²·sr·nm)", toSI: 1e9, siUnit: "W/(m³·sr)" },
    { key: "exitance", label: "Radiant exitance M = σT⁴", unit: "W/m²", toSI: 1, siUnit: "W/m²" },
    { key: "radiance", label: "Radiance L = σT⁴/π", unit: "W/(m²·sr)", toSI: 1, siUnit: "W/(m²·sr)" },
    { key: "bandFraction", label: "Fraction of the exitance in the band", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  validate: ({ bandFromNm, bandToNm }) =>
    bandToNm > bandFromNm ? undefined : "bandToNm must be larger than bandFromNm.",
  compute({ temperature, bandFromNm, bandToNm }) {
    const peak = b_Wien / temperature;
    const exitance = totalExitance(temperature);
    return {
      values: {
        peakWavelength: peak,
        // Radiance of a Lambertian emitter: L = M/π.
        peakSpectralRadiance: planckExitance(peak, temperature) / Math.PI,
        exitance,
        radiance: exitance / Math.PI,
        bandFraction: blackbodyBandFraction(bandFromNm, bandToNm, temperature),
      },
    };
  },
  checks: [
    {
      // F(0 → 2000 µm·K) = 0.066728; F(0 → 1 µm·K) is 0. The table rounds to 4e-5 against the exact integral.
      source: "Incropera F. P., DeWitt D. P. Fundamentals of Heat and Mass Transfer, blackbody radiation functions " +
        "table (c₂ = 14 388 µm·K).",
      basis: "printed",
      inputs: { temperature: 1000, bandFromNm: 1, bandToNm: 2000 },
      expect: { bandFraction: 6.6728 },
      tolerance: 1e-3,
    },
    {
      // b = 2.897 771 955e-3 m·K and σ = 5.670 374 419e-8 W m⁻² K⁻⁴, so at 1000 K: λ_peak = b/T, M = σT⁴.
      source: "Mohr P. J., Newell D. B., Taylor B. N., Tiesinga E. (2025). CODATA recommended values of the " +
        "fundamental physical constants: 2022. Rev. Mod. Phys. 97, 025002 (Wien and Stefan–Boltzmann constants).",
      basis: "printed",
      inputs: { temperature: 1000 },
      expect: { peakWavelength: 2897.771955, exitance: 56703.74419 },
      tolerance: 1e-9,
    },
  ],
});
