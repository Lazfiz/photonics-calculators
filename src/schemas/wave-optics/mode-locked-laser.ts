import { c } from "../../physics/constants";
import { peakPower } from "../../physics/laser-safety/peak-power";
import {
  cavityLengthForRepRate, transformLimitedBandwidth, wavelengthWidth, type PulseShapeTL,
} from "../../physics/wave-optics/pulsed-laser";
import { defineSchema } from "../types";

const HAUS = "Haus H. A. (2000). Mode-locking of lasers. IEEE J. Sel. Top. Quantum Electron. 6, 1173–1185, doi:10.1109/2944.902165 " +
  "(the page's registry reference; the time-bandwidth products and shape factors are the textbook values for these pulse shapes, " +
  "no equation number cited). Worked from f_rep = c/2L (linear) or c/L (ring), Δν = K/τ with K = 2 ln2/π (Gaussian) or " +
  "4 ln²(1+√2)/π² (sech²), Δλ = λ ρ/(1 − ρ²/4) with ρ = Δν λ/c, E = P/f, P_peak = (shape factor) E/τ.";

export default defineSchema({
  href: "/wave-optics/mode-locked-laser",
  inputs: [
    { key: "repRate", label: "Repetition rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 1e-3, max: 1e6 },
    { key: "pulseDuration", label: "Pulse duration, FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 0.1, max: 1e6 },
    { key: "wavelength", label: "Centre wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
    { key: "avgPower", label: "Average power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 100, min: 0, max: 1e7 },
  ],
  choices: [
    {
      key: "shape", label: "Pulse shape",
      options: [{ value: "sech2", label: "sech² (soliton, Δν τ = 0.315)" }, { value: "gaussian", label: "Gaussian (Δν τ = 0.441)" }],
      default: "sech2",
    },
    {
      key: "cavity", label: "Cavity",
      options: [{ value: "linear", label: "Linear (standing wave), L = c/2f" }, { value: "ring", label: "Ring, perimeter = c/f" }],
      default: "linear",
    },
  ],
  outputs: [
    { key: "cavityLength", label: "Cavity length or ring perimeter (optical)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "bandwidthFrequency", label: "Transform-limited bandwidth Δν", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "bandwidthWavelength", label: "Transform-limited bandwidth Δλ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "modes", label: "Locked modes in the FWHM Δν/f_rep", unit: "", toSI: 1, siUnit: "" },
    { key: "pulseEnergy", label: "Pulse energy E = P/f", unit: "nJ", toSI: 1e-9, siUnit: "J" },
    { key: "peakPower", label: "Peak power", unit: "kW", toSI: 1e3, siUnit: "W" },
    { key: "cycles", label: "Optical cycles in the pulse", unit: "", toSI: 1, siUnit: "" },
    { key: "duty", label: "Duty τ f_rep", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ repRate, pulseDuration, wavelength, avgPower, shape, cavity }) {
    const pulseShape: PulseShapeTL = shape === "gaussian" ? "gaussian" : "sech2";
    const ring = cavity === "ring";
    const dnu = transformLimitedBandwidth(pulseDuration, pulseShape);
    const modes = dnu / repRate;
    const energy = avgPower / repRate;
    const cycles = (c * pulseDuration) / wavelength;
    const warnings: string[] = [];
    if (pulseDuration * repRate > 0.1 || modes < 2) {
      warnings.push("Pulses this long for the repetition rate overlap or span fewer than two modes: not a mode-locked train, so the peak power and mode count don't apply.");
    }
    if (cycles < 1) warnings.push("Shorter than one optical cycle: the envelope model and the time-bandwidth product no longer hold.");
    return {
      values: {
        cavityLength: cavityLengthForRepRate(repRate, ring),
        bandwidthFrequency: dnu,
        bandwidthWavelength: wavelengthWidth(dnu, wavelength),
        modes,
        pulseEnergy: energy,
        peakPower: peakPower(energy, pulseDuration, pulseShape),
        cycles,
        duty: pulseDuration * repRate,
      },
      warnings,
    };
  },
  checks: [
    {
      // sech², linear, 80 MHz, 100 fs, 1550 nm, 100 mW: L = c/2f = 1.8737028625 m; K = 0.3148330443, Δν = K/τ = 3.148330443 THz;
      // ρ = Δν λ/c = 0.016277; Δλ = λρ/(1 − ρ²/4) = 25.232006 nm; modes = Δν/f = 39354.1305; E = 0.1/80e6 = 1.25 nJ;
      // P_pk = ln(1+√2) E/τ = 0.881374 × 1.25e-9/1e-13 = 11.01717 kW; cycles = cτ/λ = 19.341449; duty = 100 fs × 80 MHz = 8e-4 %.
      source: HAUS,
      basis: "computed",
      inputs: { repRate: 80, pulseDuration: 100, wavelength: 1550, avgPower: 100 },
      expect: {
        cavityLength: 1.8737028625, bandwidthFrequency: 3.148330442950497, bandwidthWavelength: 25.232005520861992,
        modes: 39354.13053688121, pulseEnergy: 1.25, peakPower: 11.017169837744286, cycles: 19.341448903225807, duty: 8e-4,
      },
      tolerance: 1e-8,
    },
    {
      // Gaussian, ring, 250 MHz, 50 fs, 800 nm, 500 mW: perimeter = c/f = 1.199169832 m; K = 2 ln2/π = 0.4412712, Δν = 8.825424 THz;
      // Δλ = 18.843218 nm; modes = 35301.696; E = 0.5/250e6 = 2 nJ; P_pk = 2√(ln2/π) E/τ = 0.939437 × 2e-9/5e-14 = 37.577491 kW.
      source: HAUS,
      basis: "computed",
      inputs: { repRate: 250, pulseDuration: 50, wavelength: 800, avgPower: 500, shape: "gaussian", cavity: "ring" },
      expect: {
        cavityLength: 1.199169832, bandwidthFrequency: 8.825424006106064, bandwidthWavelength: 18.843218061190152,
        modes: 35301.69602442426, pulseEnergy: 2, peakPower: 37.57749114798605,
      },
      tolerance: 1e-8,
    },
  ],
});
