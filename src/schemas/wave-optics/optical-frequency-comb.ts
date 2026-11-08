import { c } from "../../physics/constants";
import { cePhaseSlip, combTooth, nearestTooth, wrapOffset } from "../../physics/wave-optics/frequency-comb";
import { transformLimitedBandwidth } from "../../physics/wave-optics/pulsed-laser";
import { defineSchema } from "../types";

const TELLE = "Telle H. R., Steinmeyer G., Dunlop A. E., Stenger J., Sutter D. H., Keller U. (1999). Carrier-envelope offset phase " +
  "control: a novel concept for absolute optical frequency measurement and ultrashort pulse generation. Appl. Phys. B 69, 327–332, " +
  "doi:10.1007/s003400050813 (comb equation ν_n = n f_rep + f_ceo and f_ceo = Δφ_CE f_rep/2π; no equation number cited); " +
  "Jones D. J. et al. (2000). Science 288, 635–639, doi:10.1126/science.288.5466.635. The Gaussian time-bandwidth product 2 ln2/π is the textbook value.";

export default defineSchema({
  href: "/wave-optics/optical-frequency-comb",
  inputs: [
    { key: "repRate", label: "Repetition rate f_rep", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 250, min: 1e-3, max: 1e5 },
    { key: "fceo", label: "Offset frequency f_ceo (wrapped into [0, f_rep))", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 20, min: -1e5, max: 1e5 },
    { key: "centerWavelength", label: "Centre wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "pulseDuration", label: "Pulse duration, FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 20, min: 1, max: 1000 },
    { key: "cepOffset", label: "CEP of the first pulse φ₀ (plot only)", unit: "rad", toSI: 1, siUnit: "rad", default: 0, min: -100, max: 100 },
    { key: "combLines", label: "Teeth to plot (plot only)", unit: "", toSI: 1, siUnit: "", default: 20, min: 1, max: 2000 },
  ],
  outputs: [
    { key: "toothIndex", label: "Index n of the tooth nearest the centre", unit: "", toSI: 1, siUnit: "" },
    { key: "toothFrequency", label: "Frequency of that tooth ν_n = n f_rep + f_ceo", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "offsetWrapped", label: "f_ceo wrapped into [0, f_rep)", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
    { key: "phaseSlip", label: "CE phase slip per pulse Δφ_CE", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "teethInFwhm", label: "Teeth in the spectral FWHM", unit: "", toSI: 1, siUnit: "" },
    { key: "cycles", label: "Optical cycles in the FWHM", unit: "", toSI: 1, siUnit: "" },
    { key: "period", label: "Optical period λ/c", unit: "fs", toSI: 1e-15, siUnit: "s" },
  ],
  compute({ repRate, fceo, centerWavelength, pulseDuration }) {
    const offset = wrapOffset(fceo, repRate);
    const comb = { frep: repRate, fceo: offset };
    const n0 = nearestTooth(comb, c / centerWavelength);
    const dnu = transformLimitedBandwidth(pulseDuration, "gaussian");
    const period = centerWavelength / c;
    return {
      values: {
        toothIndex: n0,
        toothFrequency: combTooth(comb, n0),
        offsetWrapped: offset,
        phaseSlip: cePhaseSlip(offset, repRate),
        teethInFwhm: dnu / repRate,
        cycles: pulseDuration / period,
        period,
      },
    };
  },
  checks: [
    {
      // f_rep = 250 MHz, f_ceo = 20 MHz, 1550 nm: ν = c/λ = 193.414489 THz; n = round((ν − f_ceo)/f_rep) = 773658;
      // ν_n = 773658 × 250 MHz + 20 MHz = 193.41452 THz; Δφ = 2π × 20/250 = 0.50265482 rad; Δν = 2 ln2/π/20 fs = 22.06356 THz,
      // /f_rep = 88254.24 teeth; period = λ/c = 5.17024348 fs; cycles = 20 fs/period = 3.86828978.
      source: TELLE,
      basis: "computed",
      inputs: { repRate: 250, fceo: 20, centerWavelength: 1550, pulseDuration: 20 },
      expect: {
        toothIndex: 773658, toothFrequency: 193.41452, offsetWrapped: 20, phaseSlip: 0.5026548245743669,
        teethInFwhm: 88254.24006106064, cycles: 3.8682897806451613, period: 5.1702434755713565,
      },
      tolerance: 1e-8,
    },
    {
      // f_ceo = −30 MHz wraps into [0, f_rep = 100 MHz) as 70 MHz (−30 + 100); Δφ_CE = 2π × 0.7 = 4.39822972 rad.
      source: TELLE,
      basis: "computed",
      inputs: { repRate: 100, fceo: -30 },
      expect: { offsetWrapped: 70, phaseSlip: 4.39822971502571 },
      tolerance: 1e-8,
    },
  ],
});
