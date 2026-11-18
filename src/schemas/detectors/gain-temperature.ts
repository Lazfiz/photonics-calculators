import { gainTemperatureSummary, type GainTemperatureDetector } from "../../physics/detectors/gain-temperature";
import { defineSchema } from "../types";

const CROWELL_SZE = "Crowell C. R., Sze S. M. (1966). Temperature dependence of avalanche multiplication in semiconductors. Appl. Phys. " +
  "Lett. 9, 242–244, doi:10.1063/1.1754731: V_br rises with temperature, taken linear, V_br(T) = V_br,ref + γ·ΔT. Gain at fixed bias " +
  "M = 1/[1 − (V/V_br)^n] (Miller S. L. (1955), Avalanche breakdown in germanium, Phys. Rev. 99, 1234–1241, doi:10.1103/PhysRev.99.1234), " +
  "n fitted through the operating point; relative coefficient (1/M)dM/dT = −n(M − 1)γ/V_br. PMT: constant relative coefficient, M = M_ref·exp(β·ΔT).";

const APD_ONLY = "A PMT has no breakdown voltage or Miller exponent; this output belongs to the APD model.";

export default defineSchema({
  href: "/detectors/gain-temperature",
  choices: [
    {
      key: "detector",
      label: "Detector type",
      options: [{ value: "apd", label: "APD at fixed bias" }, { value: "pmt", label: "PMT at fixed high voltage" }],
      default: "apd",
    },
  ],
  inputs: [
    { key: "gainRef", label: "Gain at reference temperature", unit: "", toSI: 1, siUnit: "", default: 10, min: 1.01, max: 1e8 },
    { key: "tempRef", label: "Reference temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 22, min: -100, max: 150 },
    { key: "breakdownVoltage", label: "APD breakdown voltage at reference", unit: "V", toSI: 1, siUnit: "V", default: 50, min: 1, max: 5000 },
    { key: "margin", label: "APD bias below breakdown V_br − V (must be below V_br)", unit: "V", toSI: 1, siUnit: "V", default: 4, min: 0.001, max: 5000 },
    { key: "vbrCoeff", label: "APD V_br temperature coefficient γ", unit: "V/°C", toSI: 1, siUnit: "V/K", default: 0.14, min: 0, max: 10 },
    { key: "pmtCoeff", label: "PMT gain temperature coefficient", unit: "%/°C", toSI: 0.01, siUnit: "1/K", default: -0.3, min: -2, max: 2 },
    { key: "tempMin", label: "Plot from", unit: "°C", toSI: 1, siUnit: "°C", default: 0, min: -100, max: 150 },
    { key: "tempMax", label: "Plot to (must exceed the start)", unit: "°C", toSI: 1, siUnit: "°C", default: 60, min: -100, max: 150 },
  ],
  outputs: [
    { key: "gainAtMin", label: "Gain at the start temperature", unit: "", toSI: 1, siUnit: "" },
    { key: "gainAtMax", label: "Gain at the end temperature", unit: "", toSI: 1, siUnit: "" },
    { key: "gainRatio", label: "Gain ratio (start/end)", unit: "", toSI: 1, siUnit: "" },
    { key: "gainCoefficient", label: "Relative gain coefficient at the reference temperature", unit: "%/°C", toSI: 0.01, siUnit: "1/K" },
    { key: "millerExponent", label: "Fitted Miller exponent n (APD)", unit: "", toSI: 1, siUnit: "" },
    { key: "fixedBias", label: "Fixed bias V (APD)", unit: "V", toSI: 1, siUnit: "V" },
    { key: "breakdownTemp", label: "Temperature below which V_br(T) reaches the bias (APD)", unit: "°C", toSI: 1, siUnit: "°C" },
  ],
  validate({ margin, breakdownVoltage, tempMin, tempMax }) {
    if (!(margin < breakdownVoltage)) return "The bias below breakdown must be smaller than the breakdown voltage (the bias must stay positive).";
    if (!(tempMax > tempMin)) return "The end temperature must exceed the start temperature.";
    return undefined;
  },
  compute({ detector, gainRef, tempRef, breakdownVoltage, margin, vbrCoeff, pmtCoeff, tempMin, tempMax }) {
    const apd = detector === "apd";
    const r = gainTemperatureSummary(
      { detector: detector as GainTemperatureDetector, gainRef, tempRef, breakdown: breakdownVoltage, margin, vbrCoeff, pmtCoeff: pmtCoeff * 100 },
      tempMin, tempMax,
    );
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    // The bias stays positive (validate), so V_br(T) reaching zero or below is already V_br(T) <= V: the only non-finite gain is Infinity.
    const gainReason = (which: string) =>
      `At the ${which} temperature the breakdown voltage has fallen to the bias: the gain diverges (outside this model).`;
    if (!Number.isFinite(r.gainAtMin)) reasons.gainAtMin = gainReason("start");
    if (!Number.isFinite(r.gainAtMax)) reasons.gainAtMax = gainReason("end");
    if (!Number.isFinite(r.ratio)) reasons.gainRatio = "The gain at one end of the span is not finite, so the ratio is undefined.";
    if (apd) {
      if (r.breakdownTemp >= tempMin) {
        warnings.push("Over part of the plotted span the APD's breakdown voltage falls to the fixed bias: the gain diverges there (Geiger mode, outside this model).");
      }
      if (!Number.isFinite(r.breakdownTemp)) reasons.breakdownTemp = "The breakdown voltage does not change with temperature (γ = 0), so it never reaches the bias.";
    } else {
      reasons.millerExponent = APD_ONLY;
      reasons.fixedBias = APD_ONLY;
      reasons.breakdownTemp = APD_ONLY;
    }
    return {
      values: {
        gainAtMin: r.gainAtMin, gainAtMax: r.gainAtMax, gainRatio: r.ratio, gainCoefficient: r.coeffPercent / 100,
        millerExponent: r.exponent, fixedBias: r.bias, breakdownTemp: r.breakdownTemp,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // APD, M_ref = 10 at 22 °C, V_br = 50 V, V = 46 V, γ = 0.14 V/K. n = ln(1 − 1/10)/ln(46/50) = −0.1053605/−0.0833816 = 1.26359418.
      // T = 0 °C: V_br = 50 − 0.14·22 = 46.92, M = 1/(1 − (46/46.92)^n) = 40.466142; T = 60 °C: V_br = 50 + 0.14·38 = 55.32, M = 4.8089644;
      // ratio 8.4147311; (1/M)dM/dT = −n·9·0.14/50 = −0.03184257/K = −3.1842573 %/K; breakdown reached at 22 − 4/0.14 = −6.5714286 °C.
      source: CROWELL_SZE,
      basis: "computed",
      inputs: {},
      expect: {
        gainAtMin: 40.46614219584382, gainAtMax: 4.808964365882074, gainRatio: 8.41473113898223, gainCoefficient: -3.184257330076222,
        millerExponent: 1.2635941786016753, fixedBias: 46, breakdownTemp: -6.571428571428569,
      },
      tolerance: 1e-8,
    },
    {
      // APD, M_ref = 50 at 25 °C, V_br = 100 V, V = 97 V, γ = 0.5 V/K, span 22–45 °C. n = ln(0.98)/ln(0.97) = 0.66327094;
      // T = 22 °C: V_br = 98.5, M = 98.749367; T = 45 °C: V_br = 110, M = 12.494602; ratio 7.9033626; coefficient −n·49·0.5/100 = −0.16250138/K.
      source: CROWELL_SZE,
      basis: "computed",
      inputs: { gainRef: 50, tempRef: 25, breakdownVoltage: 100, margin: 3, vbrCoeff: 0.5, tempMin: 22, tempMax: 45 },
      expect: { gainAtMin: 98.74936700684714, gainAtMax: 12.494601551062335, gainRatio: 7.90336263251637, gainCoefficient: -16.25013814058408 },
      tolerance: 1e-8,
    },
    {
      // PMT, M_ref = 10 at 22 °C, β = −0.3 %/K: M(0 °C) = 10·exp(0.003·22) = 10.682267; M(60 °C) = 10·exp(−0.003·38) = 8.9225796; ratio 1.1972174.
      source: CROWELL_SZE,
      basis: "computed",
      inputs: { detector: "pmt" },
      expect: { gainAtMin: 10.682267171659934, gainAtMax: 8.922579558824083, gainRatio: 1.1972173631218104, gainCoefficient: -0.3 },
      tolerance: 1e-8,
    },
  ],
});
