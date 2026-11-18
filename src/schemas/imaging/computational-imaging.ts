import {
  type DoseMode, coherentCutoffPeriod, fusedSnr, incoherentCutoffPeriod, singleViewSnr, spaceBandwidthGain, syntheticNa,
} from "../../physics/imaging/computational-imaging";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer DN → λ. SPIE Press, doi:10.1117/3.725073 " +
  "(shot, background and read noise of a pixel; N reads add N σ_r²).";
const ZHENG = "Zheng G., Horstmeyer R., Yang C. (2013). Wide-field, high-resolution Fourier ptychographic microscopy. " +
  "Nat. Photonics 7, 739–745 (synthetic NA = NA_obj + NA_ill). https://doi.org/10.1038/nphoton.2013.187";

export default defineSchema({
  href: "/imaging/computational-imaging",
  inputs: [
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.1, min: 0.01, max: 1.7 },
    { key: "naIll", label: "Illumination NA (largest LED angle)", unit: "", toSI: 1, siUnit: "", default: 0.4, min: 0, max: 1.7 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 100, max: 20000 },
    { key: "numViews", label: "Number of views N", unit: "", toSI: 1, siUnit: "", default: 25, min: 1, max: 10000 },
    { key: "photonCount", label: "Signal (per view, or total over N views in the total-dose mode)", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 1000, min: 0, max: 1e9 },
    { key: "bgNoise", label: "Mean background (same basis as the signal)", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 10, min: 0, max: 1e9 },
    { key: "readNoise", label: "Read noise per exposure", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻ rms", default: 2, min: 0, max: 1000 },
  ],
  choices: [
    {
      key: "dose", label: "Dose", default: "perView",
      options: [{ value: "perView", label: "Same signal per view" }, { value: "totalDose", label: "Same total dose" }],
    },
  ],
  outputs: [
    { key: "singleViewSnr", label: "Single-view SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "fusedSnr", label: "Fused SNR (N views)", unit: "", toSI: 1, siUnit: "" },
    { key: "syntheticNa", label: "Synthetic NA", unit: "", toSI: 1, siUnit: "" },
    { key: "spaceBandwidthGain", label: "Space-bandwidth gain over one coherent image", unit: "×", toSI: 1, siUnit: "" },
    { key: "periodSynthetic", label: "Finest period, synthetic aperture (coherent)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "periodCoherent", label: "Finest period, coherent, objective alone", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "periodIncoherent", label: "Finest period, incoherent widefield", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  validate({ numViews }) {
    return Number.isInteger(numViews) ? undefined : "The number of views is a whole number.";
  },
  compute({ na, naIll, wavelength, numViews, photonCount, bgNoise, readNoise, dose }) {
    const fusion = { signal: photonCount, background: bgNoise, read: readNoise, views: numViews, mode: dose as DoseMode };
    const naSyn = syntheticNa(na, naIll);
    const noNoise = "With no signal, no background and no read noise there is no noise to compare against, so the SNR is undefined.";
    const snr1 = singleViewSnr(fusion);
    const snrN = fusedSnr(fusion);
    const noSnr = !Number.isFinite(snr1) || !Number.isFinite(snrN);
    return {
      values: {
        singleViewSnr: snr1,
        fusedSnr: snrN,
        syntheticNa: naSyn,
        spaceBandwidthGain: spaceBandwidthGain(na, naIll),
        periodSynthetic: coherentCutoffPeriod(wavelength, naSyn),
        periodCoherent: coherentCutoffPeriod(wavelength, na),
        periodIncoherent: incoherentCutoffPeriod(wavelength, na),
      },
      reasons: noSnr ? { singleViewSnr: noNoise, fusedSnr: noNoise } : {},
    };
  },
  checks: [
    {
      // S = 1000, B = 10, σ_r = 2: SNR₁ = 1000/√(1000 + 10 + 4) = 31.403715; N = 25 views at equal signal: √25·SNR₁ = 157.018573.
      source: JANESICK,
      basis: "computed",
      inputs: { dose: "perView", numViews: 25, photonCount: 1000, bgNoise: 10, readNoise: 2 },
      expect: { singleViewSnr: 31.403714651, fusedSnr: 157.018573255 },
      tolerance: 1e-8,
    },
    {
      // Total dose, N = 4: fused S/√(S + B + Nσ_r²) = 1000/√(1000 + 10 + 16) = 31.219527; each view holds 250 e⁻ and 2.5 e⁻ background:
      // 250/√(250 + 2.5 + 4) = 15.609764.
      source: JANESICK,
      basis: "computed",
      inputs: { dose: "totalDose", numViews: 4, photonCount: 1000, bgNoise: 10, readNoise: 2 },
      expect: { fusedSnr: 31.219527053, singleViewSnr: 15.609763526 },
      tolerance: 1e-8,
    },
    {
      // NA_obj 0.08 + NA_ill 0.42 = 0.5; λ = 550 nm: periods λ/0.5 = 1100 nm (synthetic), λ/0.08 = 6875 nm, λ/(2·0.08) = 3437.5 nm;
      // space-bandwidth gain (0.5/0.08)² = 39.0625.
      source: ZHENG,
      basis: "computed",
      inputs: { na: 0.08, naIll: 0.42, wavelength: 550 },
      expect: { syntheticNa: 0.5, periodSynthetic: 1100, periodCoherent: 6875, periodIncoherent: 3437.5, spaceBandwidthGain: 39.0625 },
      tolerance: 1e-8,
    },
  ],
});
