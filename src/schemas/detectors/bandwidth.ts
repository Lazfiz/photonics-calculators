import { bandwidthSummary, CLASSICAL_LIMIT_FRACTION, quantumCorrectionNeeded, SIGNAL_VOLTAGE_LIMIT, signalVoltageTooHigh } from "../../physics/detectors/bandwidth";
import { defineSchema } from "../types";

const NYQUIST = "Nyquist H. (1928). Thermal agitation of electric charge in conductors. Phys. Rev. 32, 110, doi:10.1103/PhysRev.32.110: Johnson noise density 4k_B·T·R; " +
  "with shot noise 2q·I (Schottky 1918; Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics, Wiley, §17.5) both pass the single pole f_c = 1/(2π·R_L·C_j) of R_L ∥ C_j: " +
  "v² = S₀·f_c·atan(Δf/f_c), with S₀ = 4k_B·T·R_L (Johnson) or 2q·I·R_L² (shot); Johnson limit √(k_B·T/C_j) for Δf → ∞.";

export default defineSchema({
  href: "/detectors/bandwidth",
  inputs: [
    { key: "bandwidth", label: "Measurement bandwidth Δf", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1e6, min: 1, max: 1e12 },
    { key: "capacitance", label: "Junction capacitance", unit: "pF", toSI: 1e-12, siUnit: "F", default: 10, min: 0.01, max: 1e6 },
    { key: "feedbackR", label: "Load resistance R_L", unit: "Ω", toSI: 1, siUnit: "Ω", default: 1e3, min: 1, max: 1e12 },
    { key: "photoCurrent", label: "Photocurrent", unit: "A", toSI: 1, siUnit: "A", default: 1e-6, min: 0, max: 1 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 0, max: 1000 },
  ],
  outputs: [
    { key: "fc", label: "RC 3 dB bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "vJohnson", label: "Johnson noise", unit: "V rms", toSI: 1, siUnit: "V" },
    { key: "vShot", label: "Shot noise", unit: "V rms", toSI: 1, siUnit: "V" },
    { key: "vTotal", label: "Total noise", unit: "V rms", toSI: 1, siUnit: "V" },
    { key: "kTC", label: "Johnson limit √(kT/C)", unit: "V", toSI: 1, siUnit: "V" },
  ],
  compute({ bandwidth, capacitance, feedbackR, photoCurrent, temperature }) {
    const r = bandwidthSummary({ bandwidth, capacitance, loadR: feedbackR, photoCurrent, temperature });
    const warnings: string[] = [];
    if (signalVoltageTooHigh(photoCurrent, feedbackR)) {
      warnings.push(`Signal voltage I·R_L above ${SIGNAL_VOLTAGE_LIMIT} V: beyond the unbiased photovoltaic range; reverse bias not modelled.`);
    }
    if (quantumCorrectionNeeded(bandwidth, r.fc, temperature)) {
      warnings.push(`Noise band above ${CLASSICAL_LIMIT_FRACTION}·k_B·T/h: classical Johnson density; quantum (hf ≳ k_BT) correction not modelled.`);
    }
    return { values: r, warnings };
  },
  checks: [
    {
      // R_L = 1000 Ω, C_j = 1 nF, T = 300 K, I = 1 µA, Δf = f_c = 1/(2π·1000·1e-9) = 159154.94 Hz, so atan(Δf/f_c) = π/4.
      // v_J = √(4k_B·T·R_L·f_c·π/4) = √(1.656779e-17 · 159154.94 · 0.785398) = 1.439088e-6 V; v_S = √(2q·I·R_L²·f_c·π/4) = 2.001360e-7 V;
      // total √(v_J² + v_S²) = 1.452938e-6 V; √(k_B·T/C_j) = √(4.141947e-21/1e-9) = 2.035177e-6 V.
      source: NYQUIST,
      basis: "computed",
      inputs: { bandwidth: 159154.94309189534, capacitance: 1000, feedbackR: 1000, photoCurrent: 1e-6, temperature: 300 },
      expect: {
        fc: 159154.94309189534,
        vJohnson: 1.4390877318634887e-6,
        vShot: 2.00135993389495e-7,
        vTotal: 1.4529376847786698e-6,
        kTC: 2.0351773878460816e-6,
      },
      tolerance: 1e-8,
    },
    {
      // Same circuit with Δf = 10·f_c: atan(10) = 1.4711277 instead of π/4, so each variance grows by atan(10)/(π/4) = 1.873; the result is √(S₀·f_c·atan 10) per source:
      // v_J = 1.969552e-6 V, v_S = 2.739085e-7 V, total 1.988507e-6 V.
      source: NYQUIST,
      basis: "computed",
      inputs: { bandwidth: 1591549.4309189534, capacitance: 1000, feedbackR: 1000, photoCurrent: 1e-6, temperature: 300 },
      expect: { vJohnson: 1.9695522781866294e-6, vShot: 2.7390845811533594e-7, vTotal: 1.988507485512002e-6 },
      tolerance: 1e-8,
    },
  ],
});
