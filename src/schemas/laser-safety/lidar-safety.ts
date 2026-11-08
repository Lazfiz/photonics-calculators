import { T_MAX } from "../../physics/laser-safety/eye-exposure-limits";
import { lidarSafety } from "../../physics/laser-safety/lidar-safety";
import { defineSchema } from "../types";
import { ICNIRP_2013, WAVELENGTH } from "./common";

const RULES = `${ICNIRP_2013}. Table 5 (single-pulse limits) and Table 6 / p. 287 (the three rules for repetitive pulses, ` +
  "C_P, T_i, T_2 of Table 4; scanning beams are repetitive-pulse exposures). https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/lidar-safety",
  choices: [
    {
      key: "mode",
      label: "Beam",
      options: [
        { value: "stationary", label: "Stationary (worst case, scanner failure)" },
        { value: "scanned", label: "Scanned across the eye" },
      ],
      default: "stationary",
    },
    {
      key: "scanDirection",
      label: "Scan pattern (rotating, polygon, sawtooth: one; triangle: both)",
      options: [
        { value: "one", label: "One direction" },
        { value: "both", label: "Both directions" },
      ],
      default: "one",
    },
  ],
  inputs: [
    { key: "pulseEnergy", label: "Pulse energy", unit: "µJ", toSI: 1e-6, siUnit: "J", default: 10, min: 0, max: 1e12 },
    { key: "repRate", label: "Repetition rate (0 = one pulse)", unit: "kHz", toSI: 1e3, siUnit: "Hz", default: 200, min: 0, max: 1e12 },
    { key: "pulseWidth", label: "Pulse duration", unit: "ns", toSI: 1e-9, siUnit: "s", default: 5, min: 1e-4, max: 3e13 },
    { ...WAVELENGTH, default: 905 },
    { key: "beamDia", label: "Beam diameter at the window, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 3, min: 0.001, max: 1e4 },
    { key: "divergence", label: "Full-angle divergence, 1/e²", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 3, min: 0, max: 1000 },
    { key: "scanRange", label: "Viewing distance", unit: "m", toSI: 1, siUnit: "m", default: 10, min: 0, max: 1e9 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: 1e-13, max: T_MAX },
    { key: "scanAngle", label: "Scan angle, full (360 = rotating)", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 360, min: 0.01, max: 360 },
    { key: "scanRate", label: "Scan rate (sweeps, periods or turns per s)", unit: "Hz", toSI: 1, siUnit: "Hz", default: 10, min: 0.001, max: 1e9 },
  ],
  outputs: [
    { key: "averagePower", label: "Average power", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "peakPower", label: "Peak power E/τ", unit: "W", toSI: 1, siUnit: "W" },
    { key: "nohdStationary", label: "NOHD, stationary beam (0: within at the window)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "nohdScanned", label: "NOHD, scanned beam (scanned mode only)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "maxEnergyAtEye", label: "Max energy per pulse at the viewing distance", unit: "µJ", toSI: 1e-6, siUnit: "J" },
    { key: "pulseOverMax", label: "Pulse / max at the viewing distance", unit: "", toSI: 1, siUnit: "" },
    { key: "eyewearOD", label: "Eyewear OD at the window, stationary beam (0: within)", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ pulseWidth, repRate }) {
    return repRate * pulseWidth > 1 ? "The pulses overlap: the repetition rate times the pulse duration is above 1." : undefined;
  },
  compute({ mode, scanDirection, pulseEnergy, repRate, pulseWidth, wavelength, beamDia, divergence, scanRange, exposureTime, scanAngle, scanRate }) {
    const r = lidarSafety({
      lambda: wavelength,
      pulseEnergy,
      prf: repRate,
      pulseDuration: pulseWidth,
      beamDiameter: beamDia,
      divergence,
      range: scanRange,
      exposure: exposureTime,
      scanned: mode === "scanned",
      scanAngle,
      scanRate,
      bothDirections: scanDirection === "both",
    });
    if (!r.covered) {
      return {
        values: {
          averagePower: r.Q * r.prf, peakPower: r.Q / r.tau, nohdStationary: NaN, nohdScanned: NaN,
          maxEnergyAtEye: NaN, pulseOverMax: NaN, eyewearOD: NaN,
        },
        warnings: ["The eye limits cover 180 nm to 1 mm."],
      };
    }
    const warnings: string[] = [];
    if (mode !== "scanned") warnings.push("The scanned-beam NOHD is given only in scanned mode.");
    if (mode === "scanned" && r.prf === 0) warnings.push("A scanned lidar needs a repetition rate: one pulse is the stationary case.");
    if (r.scanOn && !r.scanEyeOk) {
      warnings.push(
        r.range === 0
          ? "At the window the beam doesn't sweep across the eye: it is treated as stationary."
          : r.scanEye?.status === "noClearance"
            ? "The sweep at the viewing distance is shorter than the pupil plus the beam: the beam never leaves the eye, so it is treated as stationary."
            : "The exposure is shorter than one pass: the beam is treated as stationary.",
      );
    }
    return {
      values: {
        averagePower: r.Q * r.prf,
        peakPower: r.Q / r.tau,
        nohdStationary: r.nohd,
        nohdScanned: r.scanOn ? r.nohdScan : NaN,
        maxEnergyAtEye: r.qMaxEye,
        pulseOverMax: r.ratioEye,
        eyewearOD: r.ratioOut > 1 ? Math.log10(r.ratioOut) : 0,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: average power = 10 µJ × 200 kHz = 2 W = 2000 mW; peak power = 10 µJ / 5 ns = 2000 W.
      source: RULES,
      basis: "computed",
      inputs: {},
      expect: { averagePower: 2000, peakPower: 2000 },
      tolerance: 1e-8,
    },
    {
      // 532 nm, one 10 ns pulse, 2 mm beam, no divergence, eye at the window: 400–1050 nm, 1 ns–5 µs, 2×10⁻³ C_A J/m²
      // (C_A = 1) over the 7 mm aperture (A = π(3.5 mm)² = 3.848451e-5 m²): 2e-3·3.848451e-5 = 7.696902e-8 J
      // = 0.07696902 µJ (the beam puts 1 − e^(−2(7/2)²) = 1 − 2.3e-11 of its power in the aperture). 10 µJ / that
      // = 129.92240; OD = log10(129.92240) = 2.113684.
      source: RULES,
      basis: "computed",
      inputs: { wavelength: 532, repRate: 0, pulseWidth: 10, beamDia: 2, divergence: 0, scanRange: 0, exposureTime: 1e-8 },
      expect: { maxEnergyAtEye: 0.07696902001, pulseOverMax: 129.9224, eyewearOD: 2.113684 },
      tolerance: 1e-6,
    },
  ],
});
