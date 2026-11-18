import { geigerSummary } from "../../physics/detectors/geiger-mode-avalanche";
import { defineSchema } from "../types";

const SPAD = "Otte A. N. et al. (2017). Characterization of three high efficiency and blue sensitive silicon photomultipliers. Nucl. Instrum. " +
  "Methods A 846, 106–125, doi:10.1016/j.nima.2016.09.053: trigger probability P_t = 1 − exp(−ΔV/V_c), PDE = PDE_max·P_t, dark rate ∝ " +
  "exp(b·ΔV)·P_t. Webster E. A. G., Henderson R. K. (2013). A TCAD and spectroscopy study of dark count mechanisms in single-photon avalanche " +
  "diodes. IEEE Trans. Electron Devices 60, 4014–4019, doi:10.1109/TED.2013.2285163: Arrhenius dark rate exp[−(E_a/k_B)(1/T − 1/T₀)]. " +
  "Cova S., Lacaita A., Ripamonti G. (1991). Trapping phenomena in avalanche photodiodes on nanosecond scale. IEEE Electron Device Lett. 12, " +
  "685–687, doi:10.1109/55.116955: P_ap = η·exp(−t_d/τ), with η scaled by the avalanche charge ΔV·P_t.";

const OVERFLOW = "The cold-temperature factor exp(b·(ΔV − ΔV₂₅)) overflows at this slope and excess bias (large β, low T): the dark count rate is not representable.";

export default defineSchema({
  href: "/detectors/geiger-mode-avalanche",
  inputs: [
    { key: "overbias", label: "Excess bias at 25 °C", unit: "V", toSI: 1, siUnit: "V", default: 3, min: 0.1, max: 20 },
    { key: "voltageScale", label: "P_t voltage scale V_c", unit: "V", toSI: 1, siUnit: "V", default: 2.09, min: 0.01, max: 50 },
    { key: "pdeMax", label: "PDE at full trigger probability", unit: "", toSI: 1, siUnit: "", default: 0.525, min: 0, max: 1 },
    { key: "temperature", label: "Temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 25, min: -60, max: 100 },
    { key: "tempCoeff", label: "V_br temperature coefficient", unit: "mV/°C", toSI: 1e-3, siUnit: "V/K", default: 54, min: 0, max: 2000 },
    { key: "darkCountRate", label: "Dark count rate at 25 °C", unit: "cps", toSI: 1, siUnit: "1/s", default: 139, min: 0, max: 1e8 },
    { key: "activationEnergy", label: "Dark-rate activation energy", unit: "eV", toSI: 1, siUnit: "eV", default: 0.85, min: 0, max: 1.5 },
    { key: "fieldSlope", label: "Dark-rate field slope b", unit: "1/V", toSI: 1, siUnit: "1/V", default: 0.159, min: 0, max: 5 },
    { key: "deadTime", label: "Dead time", unit: "ns", toSI: 1e-9, siUnit: "s", default: 50, min: 1, max: 1e5 },
    { key: "trapEfficiency", label: "Trap efficiency η at the 25 °C excess bias", unit: "", toSI: 1, siUnit: "", default: 0.05, min: 0, max: 1 },
    { key: "trapLifetime", label: "Trap lifetime", unit: "ns", toSI: 1e-9, siUnit: "s", default: 20, min: 0.1, max: 1e5 },
  ],
  outputs: [
    { key: "bvShift", label: "Breakdown-voltage shift", unit: "V", toSI: 1, siUnit: "V" },
    { key: "excessBias", label: "Excess bias at T", unit: "V", toSI: 1, siUnit: "V" },
    { key: "triggerProbability", label: "Trigger probability P_t", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "pde", label: "PDE", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "darkCountRate", label: "Dark count rate", unit: "cps", toSI: 1, siUnit: "1/s" },
    { key: "afterpulseProbability", label: "Afterpulse probability", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "afterpulseRate", label: "Afterpulse rate (dark)", unit: "cps", toSI: 1, siUnit: "1/s" },
    { key: "maxCountRate", label: "Maximum count rate 1/t_d", unit: "Mcps", toSI: 1e6, siUnit: "1/s" },
    { key: "doublingInterval", label: "Temperature step that doubles the dark rate", unit: "K", toSI: 1, siUnit: "K" },
  ],
  compute({
    overbias, voltageScale, pdeMax, temperature, tempCoeff, darkCountRate, activationEnergy, fieldSlope, deadTime, trapEfficiency, trapLifetime,
  }) {
    const r = geigerSummary({
      overbiasRef: overbias, vc: voltageScale, pdeMax, temperature, beta: tempCoeff, dcrRef: darkCountRate, activationEnergy,
      fieldSlope, deadTime, trapEfficiency, trapLifetime,
    });
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (r.belowBreakdown) {
      warnings.push("At this temperature the breakdown voltage has risen past the supply: the diode is below breakdown and cannot count.");
    }
    if (!Number.isFinite(r.dcr)) {
      reasons.darkCountRate = OVERFLOW;
      reasons.afterpulseRate = OVERFLOW;
    }
    if (!Number.isFinite(r.doubling)) reasons.doublingInterval = "The activation energy is 0: the dark rate does not depend on temperature, so it never doubles.";
    return {
      values: {
        bvShift: r.bvShift, excessBias: r.overbias, triggerProbability: r.triggerProbability, pde: r.pde, darkCountRate: r.dcr,
        afterpulseProbability: r.afterpulseProbability, afterpulseRate: r.afterpulseRate, maxCountRate: r.maxRate, doublingInterval: r.doubling,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Defaults (T = 25 °C): ΔV = 3 V, P_t = 1 − e^(−3/2.09) = 0.76198146; PDE = 0.525·P_t = 0.40004027 = 40.004027 %; DCR = 139 cps (T = T₀, ΔV = ΔV₀);
      // η = 0.05 (ΔV = ΔV₀), P_ap = 0.05·e^(−2.5) = 0.0041042499 = 0.41042499 %; R_ap = P_ap·139 = 0.57049074 cps; 1/t_d = 2e7 = 20 Mcps;
      // doubling ln2·k_B·T²/E_a = 0.693147·8.617333e-5 eV/K·(298.15 K)²/0.85 eV = 6.2466770 K.
      source: SPAD,
      basis: "computed",
      inputs: {},
      expect: {
        excessBias: 3, triggerProbability: 76.1981457472151, pde: 40.00402651728793, darkCountRate: 139,
        afterpulseProbability: 0.41042499311949405, afterpulseRate: 0.5704907404360967, maxCountRate: 20, doublingInterval: 6.246677019879312,
      },
      tolerance: 1e-8,
    },
    {
      // T = 45 °C, ΔV₀ = 4 V, t_d = 100 ns, τ = 30 ns, η = 0.08, other inputs default: bias shift 0.054·20 = 1.08 V; ΔV = 2.92 V; P_t = 1 − e^(−2.92/2.09) = 0.75269409;
      // PDE = 39.516439 %; DCR = 139·exp[−(0.85/8.617333e-5)(1/318.15 − 1/298.15)]·exp[0.159·(2.92 − 4)]·P_t(2.92)/P_t(4) = 827.15301 cps;
      // η(ΔV) = 0.08·(2.92·P_t)/(4·P_t(4)) → P_ap = η(ΔV)·e^(−100/30) = 0.0018394694 = 0.18394694 %; R_ap = P_ap·DCR = 1.5215226 cps; 10 Mcps; doubling 7.1128439 K at 318.15 K.
      source: SPAD,
      basis: "computed",
      inputs: { temperature: 45, overbias: 4, deadTime: 100, trapLifetime: 30, trapEfficiency: 0.08 },
      expect: { bvShift: 1.08, excessBias: 2.92, triggerProbability: 75.269408504449, pde: 39.516439464835723, darkCountRate: 827.1530128316223,
        afterpulseProbability: 0.18394693674005371, afterpulseRate: 1.5215226292568327, maxCountRate: 10, doublingInterval: 7.112843928314323 },
      tolerance: 1e-8,
    },
  ],
});
