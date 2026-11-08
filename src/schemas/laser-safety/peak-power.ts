import { peakPower, pulseTrain } from "../../physics/laser-safety/peak-power";
import { defineSchema } from "../types";

const SOURCE = "Diels & Rudolph (2006). Ultrashort Laser Pulse Phenomena, 2nd ed., Academic Press, ch. 1 (pulse shapes, " +
  "peak power = shape factor × E/τ); P_avg = E·f and duty cycle D = τ·f; Gaussian factor 2√(ln2/π) = 0.9394, " +
  "sech² factor ln(1+√2) = 0.8814.";

export default defineSchema({
  href: "/laser-safety/peak-power",
  inputs: [
    { key: "avgPower", label: "Average power", unit: "W", toSI: 1, siUnit: "W", default: 10, min: 0.000001, max: 1000000 },
    { key: "repRate", label: "Repetition rate", unit: "Hz", toSI: 1, siUnit: "Hz", default: 80e6, min: 0.001, max: 1e12 },
    { key: "dutyCycle", label: "Duty cycle", unit: "%", toSI: 0.01, siUnit: "", default: 0.1, min: 0.001, max: 100 },
  ],
  outputs: [
    { key: "energy", label: "Pulse energy", unit: "µJ", toSI: 1e-6, siUnit: "J" },
    { key: "duration", label: "Pulse duration (FWHM)", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "peakRectangular", label: "Peak power, rectangular pulse", unit: "W", toSI: 1, siUnit: "W" },
    { key: "peakGaussian", label: "Peak power, Gaussian pulse", unit: "W", toSI: 1, siUnit: "W" },
    { key: "peakSech2", label: "Peak power, sech² pulse", unit: "W", toSI: 1, siUnit: "W" },
  ],
  compute({ avgPower, repRate, dutyCycle }) {
    const t = pulseTrain(avgPower, repRate, dutyCycle);
    return {
      values: {
        energy: t.energy,
        duration: t.duration,
        peakRectangular: peakPower(t.energy, t.duration, "rectangular"),
        peakGaussian: peakPower(t.energy, t.duration, "gaussian"),
        peakSech2: peakPower(t.energy, t.duration, "sech2"),
      },
    };
  },
  checks: [
    {
      // Defaults: E = 10 W / 80 MHz = 0.125 µJ; τ = D/f = 1e-3/80e6 = 0.0125 ns; rectangular peak P/D = 10/1e-3 = 10 kW;
      // Gaussian 0.9394372787 × 1e4 = 9394.372787 W; sech² 0.8813735870 × 1e4 = 8813.735870 W.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        energy: 0.125, duration: 0.0125, peakRectangular: 10000, peakGaussian: 9394.372787, peakSech2: 8813.735870,
      },
      tolerance: 1e-8,
    },
  ],
});
