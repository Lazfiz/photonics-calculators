import { frapSummary } from "../../physics/imaging/fluorescence-dynamics";
import { defineSchema } from "../types";

const SOUMPASIS = "Soumpasis D. M. (1983). Theoretical analysis of fluorescence photobleaching recovery experiments. " +
  "Biophys. J. 41, 95–97. https://doi.org/10.1016/S0006-3495(83)84410-5 (uniformly bleached disk: " +
  "f(t) = e^(−2τ_D/t)[I₀(2τ_D/t) + I₁(2τ_D/t)], τ_D = w²/(4D)).";
const AXELROD = "Axelrod D., Koppel D. E., Schlessinger J., Elson E., Webb W. W. (1976). Mobility measurement by analysis of " +
  "fluorescence photobleaching recovery kinetics. Biophys. J. 16, 1055–1069. https://doi.org/10.1016/S0006-3495(76)85755-4 " +
  "(Gaussian beam: F(t)/F_i = Σ (−K)ⁿ/n! / (1 + n(1 + 2t/τ_D)), F(0)/F_i = (1 − e^(−K))/K).";

export default defineSchema({
  href: "/imaging/frap",
  choices: [
    {
      key: "model",
      label: "Bleach profile",
      options: [
        { value: "disk", label: "Uniform disk (Soumpasis 1983)" },
        { value: "gaussian", label: "Gaussian beam (Axelrod 1976)" },
      ],
      default: "disk",
    },
  ],
  inputs: [
    { key: "w0", label: "Bleach disk radius or beam 1/e² radius w", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1, min: 0.1, max: 50 },
    { key: "tauHalf", label: "Half-recovery time τ½", unit: "s", toSI: 1, siUnit: "s", default: 2, min: 0.001, max: 10000 },
    { key: "mobileFrac", label: "Mobile fraction", unit: "", toSI: 1, siUnit: "", default: 0.7, min: 0, max: 1 },
    { key: "postBleach", label: "Post-bleach intensity F(0)/F_i (disk only)", unit: "", toSI: 1, siUnit: "", default: 0.3, min: 0, max: 0.99 },
    { key: "bleachK", label: "Bleach depth K (Gaussian only)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.01, max: 20 },
  ],
  outputs: [
    { key: "diffusionCoefficient", label: "Diffusion coefficient D", unit: "µm²/s", toSI: 1e-12, siUnit: "m²/s" },
    { key: "gamma", label: "γ = τ½/τ_D", unit: "", toSI: 1, siUnit: "" },
    { key: "diffusionTime", label: "Diffusion time τ_D = w²/(4D)", unit: "s", toSI: 1, siUnit: "s" },
    { key: "postBleachOut", label: "Post-bleach F(0)/F_i", unit: "", toSI: 1, siUnit: "" },
    { key: "plateau", label: "Plateau F(∞)/F_i", unit: "", toSI: 1, siUnit: "" },
    { key: "immobile", label: "Immobile fraction", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ model, w0, tauHalf, mobileFrac, postBleach, bleachK }) {
    const r = frapSummary({
      model: model === "gaussian" ? "gaussian" : "disk", w: w0, tHalf: tauHalf, mobile: mobileFrac, postBleach, bleachK,
    });
    return {
      values: {
        diffusionCoefficient: r.D, gamma: r.gamma, diffusionTime: r.tauD, postBleachOut: r.F0, plateau: r.plateau, immobile: r.immobile,
      },
    };
  },
  checks: [
    {
      // Disk: γ solves e^(−x)(I₀(x) + I₁(x)) = ½ with x = 2/u, u = τ½/τ_D (power series for I₀, I₁, bisection) → γ = 0.8945911510.
      // w = 1 µm, τ½ = 2 s: D = γ w²/(4τ½) = 0.8945911510/8 = 0.1118238939 µm²/s, τ_D = 2/γ = 2.235 s;
      // F(∞) = 0.3 + 0.7 · 0.7 = 0.79, immobile 30 %.
      source: SOUMPASIS,
      basis: "computed",
      inputs: {},
      expect: { gamma: 0.8945911509910, diffusionCoefficient: 0.1118238938739, plateau: 0.79, immobile: 30, postBleachOut: 0.3 },
      tolerance: 1e-8,
    },
    {
      // Gaussian, K = 1: F(0)/F_i = 1 − e^(−1) = 0.6321205588; γ (series, bisection on f = ½) = 1.096693324;
      // D = γ/8 µm²/s = 0.1370866655; plateau = F0 + 0.7 (1 − F0) = 0.6321205588 + 0.7 · 0.3678794412 = 0.8896361676.
      source: AXELROD,
      basis: "computed",
      inputs: { model: "gaussian" },
      expect: { postBleachOut: 0.6321205588286, gamma: 1.096693324122, diffusionCoefficient: 0.13708666551525, plateau: 0.88963616764858 },
      tolerance: 1e-8,
    },
    {
      // Gaussian, K = 3 (w = 2 µm, τ½ = 5 s): F(0)/F_i = (1 − e^(−3))/3 = 0.3167376439, γ = 1.286094356,
      // D = γ · 4 µm² / (4 · 5 s) = 0.2572188712 µm²/s.
      source: AXELROD,
      basis: "computed",
      inputs: { model: "gaussian", bleachK: 3, w0: 2, tauHalf: 5 },
      expect: { postBleachOut: 0.3167376438774, gamma: 1.286094355780, diffusionCoefficient: 0.257218871156 },
      tolerance: 1e-8,
    },
  ],
});
