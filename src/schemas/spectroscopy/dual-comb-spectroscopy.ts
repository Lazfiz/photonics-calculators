import { c } from "../../physics/constants";
import { aliasFreeBandwidth, rfMapping } from "../../physics/spectroscopy/dual-comb-spectroscopy";
import { defineSchema } from "../types";

const CNS = "Coddington I., Newbury N., Swann W. (2016). Dual-comb spectroscopy. Optica 3(4), 414–426, doi:10.1364/OPTICA.3.000414. " +
  "Comb equation ν_j(n) = n f_r,j + f_0,j; compression f_r/Δf_r; interferogram period 1/Δf_r; alias-free optical bandwidth " +
  "Δν ≤ f_r²/(2Δf_r) (equation numbers not cited).";

export default defineSchema({
  href: "/spectroscopy/dual-comb-spectroscopy",
  inputs: [
    { key: "repRate1", label: "Comb 1 repetition rate f_r", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 100, min: 1, max: 100000 },
    { key: "repRate2", label: "Comb 2 repetition rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 100.0002, min: 1, max: 100000 },
    { key: "ceoFreq1", label: "f_CEO comb 1", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 20, min: 0, max: 100000 },
    { key: "ceoFreq2", label: "f_CEO comb 2", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 20.1, min: 0, max: 100000 },
    { key: "centerWavelength", label: "Center wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "numModes", label: "Number of comb teeth N", unit: "", toSI: 1, siUnit: "", default: 100000, min: 2, max: 10000000 },
  ],
  outputs: [
    { key: "deltaFr", label: "Δf_r = f_r,2 − f_r,1", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "compression", label: "Compression f_r/Δf_r", unit: "", toSI: 1, siUnit: "" },
    { key: "updateTime", label: "Update time 1/Δf_r", unit: "ms", toSI: 1e-3, siUnit: "s" },
    { key: "opticalBandwidth", label: "Optical bandwidth (N − 1) f_r", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "aliasFreeLimit", label: "Alias-free limit f_r²/(2Δf_r)", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "rfMin", label: "Lowest RF frequency of the band", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
    { key: "rfMax", label: "Highest RF frequency of the band", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
    { key: "toothSpacing", label: "Resolution (tooth spacing f_r)", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
  ],
  compute({ repRate1, repRate2, ceoFreq1, ceoFreq2, centerWavelength, numModes }) {
    const comb1 = { frep: repRate1, fceo: ceoFreq1 };
    const comb2 = { frep: repRate2, fceo: ceoFreq2 };
    const N = Math.max(2, Math.round(numModes));
    const dfr = comb2.frep - comb1.frep;
    const map = rfMapping(comb1, comb2, c / centerWavelength, N);
    const warnings: string[] = [];
    if (dfr === 0) warnings.push("Equal repetition rates: the two combs give no dual-comb interferogram.");
    else if (!map.aliasFree) warnings.push("Aliased: two or more optical teeth share an RF frequency, so no RF range is reported.");
    return {
      values: {
        deltaFr: dfr,
        compression: dfr === 0 ? NaN : Math.abs(comb1.frep / dfr),
        updateTime: dfr === 0 ? NaN : 1 / Math.abs(dfr),
        opticalBandwidth: (N - 1) * comb1.frep,
        aliasFreeLimit: dfr === 0 ? NaN : aliasFreeBandwidth(comb1, comb2),
        rfMin: map.rfMin,
        rfMax: map.rfMax,
        toothSpacing: comb1.frep,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: Δf_r = 100.0002 − 100 MHz = 200 Hz; compression 1e8/200 = 5e5; update 1/200 s = 5 ms;
      // bandwidth (1e5 − 1)·100 MHz = 9.9999 THz; limit (1e8)²/(2·200) = 2.5e13 Hz = 25 THz; tooth spacing 100 MHz.
      source: CNS,
      basis: "computed",
      inputs: {},
      expect: { deltaFr: 200, compression: 5e5, updateTime: 5, opticalBandwidth: 9.9999, aliasFreeLimit: 25, toothSpacing: 100 },
      tolerance: 1e-8,
    },
    {
      // Δf_r = 1 kHz (f_r2 = 100.001 MHz), N = 1001: compression 1e5, update 1 ms, bandwidth 1000·100 MHz = 0.1 THz,
      // limit 1e16/2000 = 5e12 Hz = 5 THz.
      source: CNS,
      basis: "computed",
      inputs: { repRate2: 100.001, numModes: 1001 },
      expect: { deltaFr: 1000, compression: 1e5, updateTime: 1, opticalBandwidth: 0.1, aliasFreeLimit: 5 },
      tolerance: 1e-8,
    },
  ],
});
