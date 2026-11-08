import { exposureDuration, T_MAX } from "../../physics/laser-safety/eye-exposure-limits";
import { axisDiameterAt } from "../../physics/laser-safety/hazard-distance";
import { angularScan, scannedBeamLimits, stationaryMaxPower } from "../../physics/laser-safety/scanned-beam";
import { defineSchema } from "../types";
import { ICNIRP_2013, WAVELENGTH } from "./common";

const SCANNED = `${ICNIRP_2013}. Table 5 (single-pulse limits) and Table 6 / p. 287 (the three rules for repetitive pulses, ` +
  "applied to each pass of the beam over the 7 mm pupil). https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/scanning-mpe",
  choices: [
    {
      key: "scanDirection",
      label: "Scan pattern (triangle: both; sawtooth, polygon: one)",
      options: [
        { value: "both", label: "Both directions" },
        { value: "one", label: "One direction" },
      ],
      default: "both",
    },
  ],
  inputs: [
    WAVELENGTH,
    { key: "power", label: "Beam power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 5, min: 0, max: 1e9 },
    { key: "beamDiam", label: "Beam diameter at the scanner, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.01, max: 1e4 },
    { key: "divergence", label: "Divergence, 1/e² full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1, min: 0, max: 1000 },
    { key: "workingDistance", label: "Eye distance from the scanner", unit: "cm", toSI: 1e-2, siUnit: "m", default: 100, min: 0.1, max: 1e7 },
    { key: "scanAngle", label: "Scan angle, full", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 30, min: 0.01, max: 360 },
    { key: "scanRate", label: "Scan rate (sweeps or periods per s)", unit: "Hz", toSI: 1, siUnit: "Hz", default: 100, min: 0.001, max: 1e9 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 0.25, min: 1e-9, max: T_MAX },
    { key: "alpha", label: "Apparent source α", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1.5, min: 0, max: 1000 },
  ],
  outputs: [
    { key: "maxPowerScanned", label: "Max beam power, scanned", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "powerOverMax", label: "Your power / max", unit: "", toSI: 1, siUnit: "" },
    { key: "bindingRule", label: "Rule that binds (1 single pass, 2 groups of passes, 3 C_P × single pass)", unit: "", toSI: 1, siUnit: "" },
    { key: "passDuration", label: "Pass duration over the eye (binding limit)", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "passes", label: "Passes in the exposure (binding limit)", unit: "", toSI: 1, siUnit: "" },
    { key: "maxPowerStationary", label: "Max beam power, held still", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "scanningGain", label: "Scanning allows (scanned / held still)", unit: "", toSI: 1, siUnit: "" },
    { key: "stopTime", label: "If the scan stops: limit reached after", unit: "s", toSI: 1, siUnit: "s" },
  ],
  compute({ scanDirection, wavelength, power, beamDiam, divergence, workingDistance, scanAngle, scanRate, exposureTime, alpha }) {
    const d = axisDiameterAt(beamDiam, divergence, workingDistance, "linear");
    const scan = angularScan(scanAngle, scanRate, workingDistance, scanDirection !== "one", exposureTime);
    const result = scannedBeamLimits(wavelength, d, scan, alpha);
    const stationary = stationaryMaxPower(wavelength, d, exposureTime, alpha);
    const stopped = exposureDuration(wavelength, power, d, alpha);
    const covered = Number.isFinite(stationary);
    const ok = result.status === "ok" && Number.isFinite(result.pMax);
    const binding = result.limits.find((l) => l.kind === result.limiting) ?? result.limits[0];
    const warnings: string[] = [];
    if (result.status === "noClearance") {
      warnings.push("The sweep is shorter than the 7 mm pupil plus the beam: the beam never leaves the eye. Treat it as a stationary beam.");
    } else if (!ok) {
      warnings.push(covered
        ? "The passes overlap or the exposure is shorter than one pass: treat the beam as stationary."
        : "The eye limits cover 180 nm to 1 mm.");
    }
    return {
      values: {
        maxPowerScanned: ok ? result.pMax : NaN,
        powerOverMax: ok ? power / result.pMax : NaN,
        bindingRule: ok ? (result.rule ?? NaN) : NaN,
        passDuration: ok && binding ? binding.passDuration : NaN,
        passes: ok && binding ? binding.passes : NaN,
        maxPowerStationary: stationary,
        scanningGain: ok ? result.pMax / stationary : NaN,
        stopTime: covered ? stopped.tMax : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults (532 nm, 1 mm + 100 cm × 1 mrad = 2 mm beam, α = 1.5 mrad, 0.25 s), beam held still: 400–1050 nm, 0.25 s,
      // thermal 18 C_A t^0.75 J/m² with C_A = 1 (α = α_min): 18·0.25^0.75 = 6.363961 J/m² → 25.45584 W/m² over the 7 mm
      // aperture (A = π(3.5 mm)² = 3.848451e-5 m²): 25.45584·3.848451e-5 = 9.79656e-4 W = 0.979656 mW (the 2 mm beam puts
      // 1 − e^(−2(7/2)²) = 1 − 2e-11 of its power in the aperture). Stopped scan with 5 mW: A·18/P = 0.138544, the limit
      // H = E t reached after (18A/P)^4 = 3.68429e-4 s (E = P/A, the beam inside the aperture).
      source: SCANNED,
      basis: "computed",
      inputs: {},
      expect: { maxPowerStationary: 0.97965568786, stopTime: 3.68429035066e-4 },
      tolerance: 1e-8,
    },
  ],
});
