import { peakPower } from "../../physics/laser-safety/peak-power";
import { roundTripTime } from "../../physics/wave-optics/pulsed-laser";
import { defineSchema } from "../types";

const KOECHNER = "Koechner W. (2006). Solid-State Laser Engineering, 6th ed. Springer, doi:10.1007/0-387-29338-8 (the page's registry " +
  "reference; chapter number not checked against the text). A full dump of a linear cavity of optical length L empties E = P_circ τ_RT " +
  "in one round trip τ_RT = 2L/c, so the rectangular pulse has P_peak = E/τ_RT; P_avg = E f and duty = τ_RT f follow from the definitions.";

export default defineSchema({
  href: "/wave-optics/cavity-dumped",
  inputs: [
    { key: "repRate", label: "Dump rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 1, min: 1e-6, max: 1e4 },
    { key: "pulseEnergy", label: "Pulse energy", unit: "µJ", toSI: 1e-6, siUnit: "J", default: 10, min: 1e-6, max: 1e9 },
    { key: "cavityLength", label: "Optical cavity length L", unit: "m", toSI: 1, siUnit: "m", default: 1.5, min: 1e-3, max: 1000 },
  ],
  outputs: [
    { key: "roundTrip", label: "Round-trip time = pulse length 2L/c", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "maxRate", label: "Highest dump rate c/2L", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
    { key: "peakPower", label: "Peak power E/τ_RT", unit: "kW", toSI: 1e3, siUnit: "W" },
    { key: "averagePower", label: "Average power E f", unit: "W", toSI: 1, siUnit: "W" },
    { key: "dutyCycle", label: "Duty cycle τ_RT f", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ repRate, pulseEnergy, cavityLength }) {
    const tRT = roundTripTime(cavityLength);
    const fsr = 1 / tRT;
    const possible = repRate < fsr;
    const duty = tRT * repRate;
    const warnings: string[] = [];
    if (!possible) {
      warnings.push("The dump rate is at or above the round-trip rate c/2L: a dump empties the cavity, so it cannot repeat faster than once per round trip.");
    } else if (duty > 0.1) {
      warnings.push("The dump rate is above 10 % of c/2L: fewer than 10 round trips between dumps, so the cavity can't rebuild the full circulating power; the real pulse energy is lower.");
    }
    return {
      values: {
        roundTrip: tRT,
        maxRate: fsr,
        peakPower: peakPower(pulseEnergy, tRT, "rectangular"),
        averagePower: possible ? pulseEnergy * repRate : NaN,
        dutyCycle: possible ? duty : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // τ_RT = 2L/c = 3 m / 299 792 458 m/s = 10.00692286 ns; c/2L = 99.93082 MHz; P = E/τ = 10 µJ/10.00692286 ns = 0.99931 kW;
      // P_avg = 10 µJ × 1 MHz = 10 W; duty = 1.000692286e-8 s × 1e6 Hz = 1.000692286 %.
      source: KOECHNER,
      basis: "computed",
      inputs: { repRate: 1, pulseEnergy: 10, cavityLength: 1.5 },
      expect: { roundTrip: 10.00692285594456, maxRate: 99.93081933333335, peakPower: 0.9993081933333333, averagePower: 10, dutyCycle: 1.0006922855944562 },
      tolerance: 1e-8,
    },
    {
      // L = 0.75 m: τ_RT = 1.5 m/c = 5.00346 ns; 100 µJ/τ_RT = 19.9862 kW; P_avg = 100 µJ × 10 MHz = 1000 W.
      source: KOECHNER,
      basis: "computed",
      inputs: { repRate: 10, pulseEnergy: 100, cavityLength: 0.75 },
      expect: { roundTrip: 5.00346142797228, peakPower: 19.986163866666665, averagePower: 1000 },
      tolerance: 1e-8,
    },
  ],
});
