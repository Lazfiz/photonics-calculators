import {
  actuatorPitch, aoResidualVariance, dmFittingVariance, friedParameter, greenwoodFrequency, isoplanaticAngle,
  rytovVariance, servoLagVariance, strehlRatio, uncorrectedPhaseVariance,
} from "../../physics/free-space-comms/turbulence";
import { defineSchema } from "../types";

const ANDREWS_PHILLIPS = "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. " +
  "SPIE: plane-wave r₀ = (0.423 k² Cn² L)^(−3/5), θ₀, σ_R² = 1.23 Cn² k^(7/6) L^(11/6).";
const AO_MODEL = "Noll R. J. (1976), J. Opt. Soc. Am. 66, 207 (σ² = 1.0299 (D/r₀)^(5/3)); Hudgin R. H. (1977), J. Opt. Soc. Am. 67, " +
  "393 (σ²_fit = 0.28 (d/r₀)^(5/3)); Greenwood D. P. (1977), J. Opt. Soc. Am. 67, 390 (f_G = 0.427 v/r₀, σ²_servo = (f_G/f₃dB)^(5/3)); " +
  "Parenti R. R., Sasiela R. J. (1994), J. Opt. Soc. Am. A 11, 288 (S = e^(−σ²) + (1 − e^(−σ²))/(1 + (D/r₀)²)).";

export default defineSchema({
  href: "/free-space-comms/adaptive-optics",
  inputs: [
    { key: "c2n", label: "Cn²", unit: "m^(−2/3)", toSI: 1, siUnit: "m^(−2/3)", default: 1e-14, min: 1e-18, max: 1e-11 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "range", label: "Range", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 1000 },
    { key: "diameter", label: "Aperture diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.1, max: 1000 },
    { key: "aoActuators", label: "DM actuators in the pupil", unit: "", toSI: 1, siUnit: "", default: 127, min: 10, max: 100000 },
    { key: "aoBandwidth", label: "AO closed-loop bandwidth f₃dB", unit: "Hz", toSI: 1, siUnit: "Hz", default: 500, min: 1, max: 100000 },
    { key: "windSpeed", label: "Wind speed", unit: "m/s", toSI: 1, siUnit: "m/s", default: 10, min: 0.1, max: 100 },
  ],
  outputs: [
    { key: "friedParameter", label: "Fried parameter r₀", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "diameterOverR0", label: "D/r₀", unit: "", toSI: 1, siUnit: "" },
    { key: "greenwoodFrequency", label: "Greenwood frequency f_G", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "isoplanaticAngle", label: "Isoplanatic angle θ₀", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "actuatorPitch", label: "Actuator pitch d", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "phaseVarianceOpen", label: "Uncorrected phase variance", unit: "rad²", toSI: 1, siUnit: "rad²" },
    { key: "phaseVarianceFitting", label: "DM fitting variance", unit: "rad²", toSI: 1, siUnit: "rad²" },
    { key: "phaseVarianceServo", label: "Servo-lag variance", unit: "rad²", toSI: 1, siUnit: "rad²" },
    { key: "phaseVarianceAo", label: "Residual variance with AO", unit: "rad²", toSI: 1, siUnit: "rad²" },
    { key: "strehlNoAo", label: "Strehl ratio, no AO", unit: "", toSI: 1, siUnit: "" },
    { key: "strehlAo", label: "Strehl ratio, with AO", unit: "", toSI: 1, siUnit: "" },
    { key: "aoImprovement", label: "AO improvement (Strehl ratio)", unit: "×", toSI: 1, siUnit: "" },
    { key: "rytovVariance", label: "Rytov variance σ_R²", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ c2n, wavelength, range, diameter, aoActuators, aoBandwidth, windSpeed }) {
    const r0 = friedParameter(c2n, wavelength, range);
    const fG = greenwoodFrequency(windSpeed, r0);
    const sigma2Open = uncorrectedPhaseVariance(diameter, r0);
    const pitch = actuatorPitch(diameter, aoActuators);
    const sigma2Fit = dmFittingVariance(pitch, r0);
    const sigma2Servo = servoLagVariance(fG, aoBandwidth);
    const sigma2AO = aoResidualVariance(sigma2Fit, sigma2Servo, sigma2Open);
    const rytov = rytovVariance(c2n, wavelength, range);
    const strehlNoAo = strehlRatio(sigma2Open, diameter, r0);
    const strehlAo = strehlRatio(sigma2AO, diameter, r0);
    const warnings: string[] = [];
    if (aoBandwidth < fG) {
      warnings.push("Loop bandwidth below the Greenwood frequency: (f_G/f₃dB)^(5/3) is a high-bandwidth asymptote, so the " +
        "residual is capped at the open-loop variance.");
    }
    if (rytov > 0.5) {
      warnings.push("Strong scintillation (σ_R² > 0.5): amplitude fluctuations are not modelled and the Strehl is optimistic.");
    }
    return {
      values: {
        friedParameter: r0,
        diameterOverR0: diameter / r0,
        greenwoodFrequency: fG,
        isoplanaticAngle: isoplanaticAngle(c2n, wavelength, range),
        actuatorPitch: pitch,
        phaseVarianceOpen: sigma2Open,
        phaseVarianceFitting: sigma2Fit,
        phaseVarianceServo: sigma2Servo,
        phaseVarianceAo: sigma2AO,
        strehlNoAo,
        strehlAo,
        aoImprovement: strehlAo / strehlNoAo,
        rytovVariance: rytov,
      },
      warnings,
    };
  },
  checks: [
    {
      // Cn² = 1e-14, λ = 1550 nm, L = 1 km: r₀ = (0.423 k² Cn² L)^(−3/5) = 7.848343 cm; θ₀ = (2.91·(3/8) k² Cn² L^(8/3))^(−3/5) =
      // 44.44548 µrad; σ_R² = 1.23 Cn² k^(7/6) L^(11/6) = 0.1990954; f_G = 0.427·10/r₀ = 54.40639 Hz; σ² = 1.0299 (D/r₀)^(5/3), D = 10 cm.
      source: ANDREWS_PHILLIPS + " Noll (1976), J. Opt. Soc. Am. 66, 207; Greenwood (1977), J. Opt. Soc. Am. 67, 390.",
      basis: "computed",
      inputs: { c2n: 1e-14, wavelength: 1550, range: 1, diameter: 10, windSpeed: 10 },
      expect: {
        friedParameter: 7.848343007, isoplanaticAngle: 44.44548419, rytovVariance: 0.1990954385,
        greenwoodFrequency: 54.40638866, phaseVarianceOpen: 1.54228665,
      },
      tolerance: 1e-8,
    },
    {
      // Defaults (D = 10 cm, N = 127, f₃dB = 500 Hz): d = D√(π/4N) = 7.863992 mm; σ²_fit = 0.28 (d/r₀)^(5/3) = 0.0060525;
      // σ²_servo = (54.40639/500)^(5/3) = 0.0248008; σ²_AO = 0.0308533; S = e^(−σ²) + (1 − e^(−σ²))/(1 + (D/r₀)²):
      // no AO 0.5135361, with AO 0.9811987.
      source: AO_MODEL,
      basis: "computed",
      inputs: {},
      expect: {
        actuatorPitch: 7.863992311, phaseVarianceFitting: 0.006052477813, phaseVarianceServo: 0.02480084581,
        phaseVarianceAo: 0.03085332362, strehlNoAo: 0.5135361152, strehlAo: 0.9811987143, aoImprovement: 1.910671295,
      },
      tolerance: 1e-8,
    },
    {
      // Cn² = 1e-15, λ = 1064 nm, L = 2 km, D = 30 cm, N = 500, f₃dB = 1 kHz, v = 20 m/s: r₀ = 13.12478 cm, f_G = 65.06778 Hz,
      // σ² open = 4.084861, residual = fit 0.0051165 + servo 0.0105263 = 0.0156428, Strehl 0.1747736 → 0.9869724.
      source: AO_MODEL,
      basis: "computed",
      inputs: { c2n: 1e-15, wavelength: 1064, range: 2, diameter: 30, aoActuators: 500, aoBandwidth: 1000, windSpeed: 20 },
      expect: {
        friedParameter: 13.12477581, greenwoodFrequency: 65.06777810, phaseVarianceOpen: 4.084861410,
        phaseVarianceAo: 0.01564282795, strehlNoAo: 0.1747735711, strehlAo: 0.9869723701,
      },
      tolerance: 1e-8,
    },
  ],
});
