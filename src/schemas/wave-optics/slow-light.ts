import { NP_PER_DB, slowLightModel } from "../../physics/wave-optics/slow-light";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/slow-light",
  choices: [
    {
      key: "model",
      label: "Group index from",
      options: [
        { value: "index", label: "Given group index (photonic crystal, EIT, …)" },
        { value: "resonance", label: "Lorentzian resonance (Brillouin gain, EIT window)" },
      ],
      default: "index",
    },
  ],
  inputs: [
    { key: "nGroup", label: "Group index n_g (index model)", unit: "", toSI: 1, siUnit: "", default: 10, min: 0.01, max: 1e9 },
    { key: "nBase", label: "Background group index n₀", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 1, max: 5 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
    { key: "bandwidth", label: "Signal bandwidth Δλ (index model)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1, min: 0, max: 1000 },
    { key: "structureLength", label: "Structure length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 1e-6, max: 1e9 },
    { key: "gainDb", label: "Power gain at line centre (resonance model)", unit: "dB", toSI: 1, siUnit: "dB", default: 30, min: -100, max: 100 },
    { key: "resonanceWidth", label: "Resonance FWHM (resonance model)", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 30, min: 1e-6, max: 1e6 },
    { key: "signalMHz", label: "Signal bandwidth Δν (resonance model)", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 10, min: 1e-6, max: 1e9 },
  ],
  outputs: [
    { key: "groupIndex", label: "Group index n_g", unit: "", toSI: 1, siUnit: "" },
    { key: "groupVelocity", label: "Group velocity c/n_g", unit: "m/s", toSI: 1, siUnit: "m/s" },
    { key: "groupDelay", label: "Group delay τ", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "excessDelay", label: "Excess delay over n₀", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "signalBandwidth", label: "Signal bandwidth Δν", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "delayBandwidth", label: "Delay × bandwidth τΔν", unit: "", toSI: 1, siUnit: "" },
    { key: "resonanceDelay", label: "Resonance delay G/Γ at line centre", unit: "ns", toSI: 1e-9, siUnit: "s" },
  ],
  compute({ model, nGroup, nBase, wavelength, bandwidth, structureLength, gainDb, resonanceWidth, signalMHz }) {
    const resonance = model === "resonance";
    const r = slowLightModel({
      resonance, nGroup, n0: nBase, lambda: wavelength, dLambda: bandwidth, length: structureLength,
      gainNp: gainDb * NP_PER_DB, fwhmHz: resonanceWidth, signalHz: signalMHz,
    });
    const warnings: string[] = [];
    if (resonance && r.dnu > resonanceWidth) {
      warnings.push("The signal bandwidth is wider than the resonance: the delay and gain vary across the signal, so pulses are distorted and the line-centre delay does not apply.");
    }
    if (!(r.nGroup > 0)) warnings.push("n_g < 0: fast light, the output peak leaves before the input peak arrives; group velocity and delay have no result.");
    return {
      values: {
        groupIndex: r.nGroup,
        groupVelocity: r.vg,
        groupDelay: r.tau,
        excessDelay: r.excess,
        signalBandwidth: r.dnu,
        delayBandwidth: r.tau * r.dnu,
        resonanceDelay: r.tauRes,
      },
      warnings,
    };
  },
  checks: [
    {
      // G = 30 dB × ln10/10 = 6.907755 Np, Γ = 2π × 30 MHz = 1.884956e8 rad/s, ΔT = G/Γ = 36.64678 ns.
      source: "Okawachi Y. et al. (2005). Tunable all-optical delays via Brillouin slow light in an optical fiber. Phys. Rev. Lett. 94, 153902, doi:10.1103/PhysRevLett.94.153902 (ΔT_d = G/Γ_B).",
      basis: "computed",
      inputs: { model: "resonance", gainDb: 30, resonanceWidth: 30 },
      expect: { resonanceDelay: 36.64677994 },
      tolerance: 1e-8,
    },
    {
      // τ = n_g L/c = 10 × 1 mm/299 792 458 m/s = 33.35640952 ps = 0.03335640952 ns.
      source: "Tucker R. S., Ku P.-C., Chang-Hasnain C. J. (2005). Slow-light optical buffers: capabilities and fundamental limitations. J. Lightwave Technol. 23, 4046–4066, doi:10.1109/JLT.2005.853125 (τ = n_g L/c, v_g = c/n_g).",
      basis: "computed",
      inputs: { model: "index", nGroup: 10, structureLength: 1 },
      expect: { groupDelay: 0.03335640952 },
      tolerance: 1e-8,
    },
  ],
});
