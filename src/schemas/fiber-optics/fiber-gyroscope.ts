import { gyroSummary } from "../../physics/fiber-optics/sagnac";
import { defineSchema } from "../types";

const LEFEVRE = "Lefèvre H. C. (2014). The Fiber-Optic Gyroscope, 2nd ed., Artech House, §2.1 (Sagnac phase Δφ = 2πLDΩ/(λc), " +
  "transit time n_g L/c), §3.1 (shot-noise limit σ_φ = √(2hν/(η P_d)) at the ±π/2 bias), §3.2 (proper frequency 1/(2τ)); " +
  "Arditty H. J., Lefèvre H. C. (1981). Sagnac effect in fiber gyroscopes. Opt. Lett. 6, 401–403, doi:10.1364/OL.6.000401; " +
  "IEEE Std 952-1997 (Allan-variance angle random walk, σ²(τ) = N²/τ); Earth rate: IERS Conventions 2010, ω = 7.292115e-5 rad/s";

export default defineSchema({
  href: "/fiber-optics/fiber-gyroscope",
  inputs: [
    { key: "coilDiameter", label: "Coil diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: 1, max: 1000 },
    { key: "fiberLength", label: "Fiber length", unit: "m", toSI: 1, siUnit: "m", default: 500, min: 1, max: 10000 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "n_g", label: "Group index n_g (transit time only)", unit: "", toSI: 1, siUnit: "", default: 1.4682, min: 1, max: 2 },
    { key: "sourcePower", label: "Source power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 10, min: 0.001, max: 1000 },
    { key: "losses", label: "Loss, source to detector at the bias point", unit: "dB", toSI: 1, siUnit: "dB", default: 10, min: 0, max: 60 },
    { key: "qe", label: "Detector quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.01, max: 1 },
  ],
  outputs: [
    { key: "scaleFactor", label: "Scale factor S = Δφ/Ω", unit: "s", toSI: 1, siUnit: "s" },
    { key: "arw", label: "Angle random walk (shot noise)", unit: "°/√h", toSI: Math.PI / 180 / 60, siUnit: "rad/√s" },
    { key: "rateNoise", label: "One-sided rate noise ASD", unit: "(°/h)/√Hz", toSI: Math.PI / 180 / 3600, siUnit: "(rad/s)/√Hz" },
    { key: "phaseEarth", label: "Earth-rate Sagnac phase (axis at the pole)", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "phaseNoise", label: "Phase noise σ_φ", unit: "nrad/√Hz", toSI: 1e-9, siUnit: "rad/√Hz" },
    { key: "detectedPower", label: "Detected power P_d", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "transitTime", label: "Transit time n_g L/c", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "properFrequency", label: "Proper frequency 1/(2τ)", unit: "kHz", toSI: 1e3, siUnit: "Hz" },
    { key: "maxRate", label: "Rate at which the Sagnac phase reaches π/2", unit: "°/s", toSI: Math.PI / 180, siUnit: "rad/s" },
    { key: "turns", label: "Turns L/(πD)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ coilDiameter, fiberLength, wavelength, n_g, sourcePower, losses, qe }) {
    const r = gyroSummary(fiberLength, coilDiameter, wavelength, n_g, sourcePower, losses, qe);
    return {
      values: {
        scaleFactor: r.S,
        // gyroSummary returns the ARW in °/√h and the rate ASD in (°/h)/√Hz; the API outputs are in the page's units.
        arw: r.arw * (Math.PI / 180 / 60),
        rateNoise: r.rateDegH * (Math.PI / 180 / 3600),
        phaseEarth: r.phaseEarth,
        phaseNoise: r.sigma,
        detectedPower: r.Pd,
        transitTime: r.tau,
        properFrequency: r.fp,
        maxRate: r.maxRateDegS * (Math.PI / 180),
        turns: r.turns,
      },
    };
  },
  checks: [
    {
      // Defaults: L = 500 m, D = 0.1 m, λ = 1550 nm, n_g = 1.4682, P = 10 mW, loss 10 dB, η = 1.
      // S = 2πLD/(λc) = 2π · 500 · 0.1/(1550e-9 · 299792458) = 314.159265/464677.3 = 0.6760790 s.
      // P_d = 10e-3 · 10^(−1) = 1.0e-3 W; σ_φ = √(2hc/(λ η P_d)) = √(2 · 6.62607015e-34 · 299792458/(1550e-9 · 1e-3)) = 1.600986e-8 rad/√Hz.
      // Rate ASD = σ_φ/S = 2.368046e-8 rad/s/√Hz = 2.368046e-8 · 206264.806 °/h per rad/s = 4.884444e-3 (°/h)/√Hz; N = ASD/60/√2 = 5.756373e-5 °/√h.
      // Earth phase = S · 7.292115e-5 = 4.930046e-5 rad; τ = 1.4682 · 500/299792458 = 2.448694 µs, f_p = 1/(2τ) = 204.1905 kHz;
      // turns = 500/(π · 0.1) = 1591.549; π/(2S) = 2.323392 rad/s = 133.1205 °/s.
      source: LEFEVRE,
      basis: "computed",
      inputs: {},
      expect: {
        scaleFactor: 0.6760790393392522,
        phaseNoise: 16.00985928953873,
        detectedPower: 1,
        rateNoise: 0.004884444469136875,
        arw: 5.756373010759684e-5,
        phaseEarth: 4.930046103951351e-5,
        transitTime: 2.4486940228496343,
        properFrequency: 204.19047677428141,
        turns: 1591.5494309189535,
        maxRate: 133.1205299427107,
      },
      tolerance: 1e-8,
    },
    {
      // L = 1000 m, D = 0.05 m, λ = 850 nm: S = 2π · 1000 · 0.05/(850e-9 · 299792458) = 314.159265/254.82359 = 1.232850 s.
      source: LEFEVRE,
      basis: "computed",
      inputs: { fiberLength: 1000, coilDiameter: 50, wavelength: 850 },
      expect: { scaleFactor: 1.232850012912754 },
      tolerance: 1e-8,
    },
  ],
});
