import { channelPmtSummary } from "../../physics/detectors/channel-photomultiplier";
import { defineSchema } from "../types";

const HAMAMATSU = "Hamamatsu Photonics (2017). Photomultiplier Tubes: Basics and Applications, 4th ed., §4.3.7 (signal-to-noise ratio of a multiplied " +
  "photocurrent, Eq. 4-29: SNR = R_s/√(2B(R_s + R_d)F), photoelectrons per second at the cathode so the gain cancels) and the radiant " +
  "sensitivity S = QE·qλ/(hc)·G. Pulse charge FWHM = 2√(2 ln 2)·√(F/N_pe) for Poisson photoelectrons and noise figure F " +
  "(Wiza J. L. (1979), Microchannel plate detectors, Nucl. Instrum. Methods 162, 587–601, doi:10.1016/0029-554X(79)90734-1). " +
  "Counting SNR R_s·T/√((R_s + R_d)·T) for Poisson counts.";

export default defineSchema({
  href: "/detectors/channel-photomultiplier",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 410, min: 115, max: 900 },
    { key: "quantumEff", label: "Photocathode QE", unit: "", toSI: 1, siUnit: "", default: 0.25, min: 0, max: 1 },
    { key: "channelGain", label: "Channel gain", unit: "", toSI: 1, siUnit: "", default: 1e5, min: 100, max: 1e9 },
    { key: "excessNoise", label: "Excess noise factor F", unit: "", toSI: 1, siUnit: "", default: 2, min: 1, max: 3 },
    { key: "darkCountRate", label: "Dark count rate", unit: "counts/s", toSI: 1, siUnit: "1/s", default: 10, min: 0, max: 1e6 },
    { key: "photonRate", label: "Photon rate", unit: "photons/s", toSI: 1, siUnit: "1/s", default: 1e4, min: 0, max: 1e10 },
    { key: "gateTime", label: "Gate time", unit: "s", toSI: 1, siUnit: "s", default: 1, min: 1e-6, max: 1e4 },
    { key: "photonsPerPulse", label: "Photons per pulse", unit: "", toSI: 1, siUnit: "", default: 100, min: 1, max: 1e7 },
    { key: "linearLimit", label: "Linear limit (e⁻ per pulse)", unit: "e⁻", toSI: 1, siUnit: "", default: 1e7, min: 1e5, max: 1e10 },
  ],
  outputs: [
    { key: "anodeSensitivity", label: "Anode sensitivity", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "photoelectronRate", label: "Photoelectron rate", unit: "1/s", toSI: 1, siUnit: "1/s" },
    { key: "signalCurrent", label: "Signal anode current", unit: "A", toSI: 1, siUnit: "A" },
    { key: "darkCurrent", label: "Dark anode current", unit: "A", toSI: 1, siUnit: "A" },
    { key: "countingSnr", label: "Photon-counting SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "analogSnr", label: "Analog SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "pulseElectrons", label: "Electrons per pulse at the anode", unit: "e⁻", toSI: 1, siUnit: "" },
    { key: "pulseResolution", label: "Pulse resolution (FWHM)", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ wavelength, quantumEff, channelGain, excessNoise, darkCountRate, photonRate, gateTime, photonsPerPulse, linearLimit }) {
    const r = channelPmtSummary({
      wavelength, quantumEff, gain: channelGain, excessNoise, darkRate: darkCountRate, photonRate, gate: gateTime,
      photonsPerPulse, linearLimit,
    });
    const reasons: Record<string, string> = {};
    const noCounts = "There are no counts: the photoelectron rate (photon rate × QE) and the dark count rate are both zero, so the SNR is undefined.";
    if (!Number.isFinite(r.countSnr)) reasons.countingSnr = noCounts;
    if (!Number.isFinite(r.analogSnr)) reasons.analogSnr = noCounts;
    if (!Number.isFinite(r.resolution)) {
      reasons.pulseResolution = r.linear
        ? "The quantum efficiency is zero, so a pulse has no photoelectrons."
        : "The pulse exceeds the linear limit: it is clipped and its resolution is not defined.";
    }
    return {
      values: {
        anodeSensitivity: r.sensitivity, photoelectronRate: r.signalRate, signalCurrent: r.signalCurrent, darkCurrent: r.darkCurrent,
        countingSnr: r.countSnr, analogSnr: r.analogSnr, pulseElectrons: r.pulseElectrons, pulseResolution: r.resolution,
      },
      warnings: r.warnings,
      reasons,
    };
  },
  checks: [
    {
      // Defaults: QE 0.25, 410 nm, G = 1e5, F = 2, R_d = 10 /s, Φ = 1e4 /s, T = 1 s, 100 photons per pulse. Constants q = 1.602176634e-19 C, h = 6.62607015e-34 J s, c = 299792458 m/s.
      // S = 0.25·q·410e-9/(h·c)·1e5 = 8267.1825 A/W; R_s = 2500 /s; I = R_s·q·G = 4.0054416e-11 A; I_d = 10·q·G = 1.6021766e-13 A.
      // SNR_count = 2500·1/√2510 = 49.900299; B = 0.5 Hz, SNR_analog = 2500/√(2·0.5·2510·2) = 2500/√5020 = 35.284840;
      // N_pe = 25, N_pe·G = 2.5e6 ≤ 1e7 (linear): FWHM = 2√(2 ln 2)·√(2/25) = 2.3548200·0.2828427 = 0.66604369 = 66.604369 %.
      source: HAMAMATSU,
      basis: "computed",
      inputs: {},
      expect: {
        anodeSensitivity: 8267.18253578294, photoelectronRate: 2500, signalCurrent: 4.0054415849999995e-11, darkCurrent: 1.6021766339999998e-13,
        countingSnr: 49.90029900348744, analogSnr: 35.28483980860229, pulseElectrons: 2500000, pulseResolution: 66.60436889261582,
      },
      tolerance: 1e-8,
    },
    {
      // QE 0.2, 650 nm, G = 1e6, F = 1.5, R_d = 100 /s, Φ = 5e5 /s, T = 0.01 s, 9 photons per pulse.
      // S = 0.2·q·650e-9/(h·c)·1e6 = 104852.07 A/W; R_s = 1e5 /s; SNR_count = 1e5·0.01/√(100100·0.01) = 1000/√1001 = 31.606977;
      // B = 50 Hz: SNR_analog = 1e5/√(2·50·100100·1.5) = 1e5/√15015000 = 25.806989; N_pe = 1.8, N_pe·G = 1.8e6 (linear): FWHM = 2.3548200·√(1.5/1.8) = 2.1496468 = 214.96468 %.
      source: HAMAMATSU,
      basis: "computed",
      inputs: { wavelength: 650, quantumEff: 0.2, channelGain: 1e6, excessNoise: 1.5, darkCountRate: 100, photonRate: 5e5, gateTime: 0.01, photonsPerPulse: 9 },
      expect: {
        anodeSensitivity: 104852.07118553975, photoelectronRate: 100000, signalCurrent: 1.602176634e-8, darkCurrent: 1.602176634e-11,
        countingSnr: 31.606977062050696, analogSnr: 25.806988704625457, pulseElectrons: 1800000, pulseResolution: 214.96467625479702,
      },
      tolerance: 1e-8,
    },
  ],
});
