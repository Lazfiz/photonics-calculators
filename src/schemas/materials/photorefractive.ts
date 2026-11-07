import {
  POCKELS, balancedGratingPeriod, crystalMedium, customMedium, photorefractiveGrating, twoBeamSignalGain,
} from "../../physics/materials/pockels";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

const KUKHTAREV = "Kukhtarev N. V., Markov V. B., Odulov S. G., Soskin M. S., Vinetskii V. L. (1978). Holographic storage in electrooptic " +
  "crystals. I. Steady state. Ferroelectrics 22, 949–960, doi:10.1080/00150197908239450 (band-transport model, diffusion only: " +
  "E_D = k_B T K/q, E_q = q N_eff/(ε₀ ε K), E_sc = E_D/(1 + E_D/E_q), K = 2π/Λ, Λ = λ/(2 sin θ)); coupling gain " +
  "Γ = 2π n³ r_eff E_sc/(λ cos θ_in): Yeh P. (1989). Two-wave mixing in nonlinear media. IEEE J. Quantum Electron. 25, 484–519, " +
  "doi:10.1109/3.18564; index grating Δn = ½ n³ r_eff E_sc (Yariv A., Yeh P., Optical Waves in Crystals, ch. 7). Equation numbers not checked.";

export default defineSchema({
  href: "/materials/photorefractive",
  choices: [
    {
      key: "material",
      label: "Crystal (n, r_eff and ε apply only to \"custom\"; β only to BaTiO₃)",
      options: [
        { value: "linbo3", label: "LiNbO₃ (K ∥ c)" },
        { value: "batio3", label: "BaTiO₃ (unclamped)" },
        { value: "batio3-clamped", label: "BaTiO₃ (clamped)" },
        { value: "custom", label: "Custom" },
      ],
      default: "linbo3",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 532, min: 400, max: 2000 },
    { key: "angle", label: "Full crossing angle 2θ outside", unit: "°", toSI: DEG, siUnit: "rad", default: 20, min: 0.1, max: 170 },
    { key: "beta", label: "Angle β between K and c (BaTiO₃)", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: 0, max: 90 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 295, min: 1, max: 1000 },
    { key: "traps", label: "Effective trap density N_eff", unit: "10²² m⁻³", toSI: 1e22, siUnit: "m⁻³", default: 1, min: 0.001, max: 1e4 },
    { key: "length", label: "Crystal length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.01, max: 100 },
    { key: "ratio", label: "Pump / signal ratio β_I", unit: "", toSI: 1, siUnit: "", default: 1000, min: 1e-3, max: 1e9 },
    { key: "n", label: "Refractive index n (custom)", unit: "", toSI: 1, siUnit: "", default: 2.2, min: 1, max: 5 },
    { key: "r", label: "Effective coefficient r_eff (custom)", unit: "pm/V", toSI: 1e-12, siUnit: "m/V", default: 30.8, min: 0.01, max: 5000 },
    { key: "epsilon", label: "Static permittivity ε along K (custom)", unit: "", toSI: 1, siUnit: "", default: 28, min: 1, max: 100000 },
  ],
  outputs: [
    { key: "period", label: "Grating period Λ = λ/(2 sin θ)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "balancedPeriod", label: "Period where E_D = E_q", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "ED", label: "Diffusion field E_D", unit: "kV/m", toSI: 1e3, siUnit: "V/m" },
    { key: "Eq", label: "Trap-limited field E_q", unit: "kV/m", toSI: 1e3, siUnit: "V/m" },
    { key: "rEff", label: "Effective coefficient r_eff", unit: "pm/V", toSI: 1e-12, siUnit: "m/V" },
    { key: "Esc", label: "Space-charge field E_sc (per unit modulation)", unit: "kV/m", toSI: 1e3, siUnit: "V/m" },
    { key: "deltaN", label: "Index grating ½n³r_eff E_sc (per unit modulation)", unit: "", toSI: 1, siUnit: "" },
    { key: "gamma", label: "Two-beam coupling gain Γ", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "signalGain", label: "Signal gain after L", unit: "×", toSI: 1, siUnit: "" },
  ],
  compute({ material, wavelength, angle, beta, temperature, traps, length, ratio, n, r, epsilon }) {
    const custom = material === "custom";
    const id = material as "linbo3" | "batio3" | "batio3-clamped";
    const batio3 = id === "batio3" || id === "batio3-clamped";
    const Neff = traps;
    const m = custom ? customMedium(n, epsilon, r) : crystalMedium(id, wavelength, batio3 ? beta : 0);
    const g = photorefractiveGrating(wavelength, angle, m, temperature, Neff);
    const warnings: string[] = [];
    if (!custom && !Number.isFinite(m.n)) {
      const [lo, hi] = POCKELS[id].range;
      warnings.push(`${POCKELS[id].name}'s index fit covers ${Math.round(lo * 1e9)}–${Math.round(hi * 1e9)} nm: no result.`);
    }
    return {
      values: {
        period: g.period,
        balancedPeriod: balancedGratingPeriod(Neff, m.epsilon, temperature),
        ED: g.ED,
        Eq: g.Eq,
        rEff: g.rEff,
        Esc: g.Esc,
        deltaN: 0.5 * m.n ** 3 * g.rEff * g.Esc,
        gamma: g.gamma,
        signalGain: twoBeamSignalGain(g.gamma * length, ratio),
      },
      warnings,
    };
  },
  checks: [
    {
      // Custom crystal n = 2.2, ε = 28, r_eff = 30.8 pm/V, N_eff = 10²² m⁻³, T = 295 K, λ = 532 nm, 2θ = 20°, L = 5 mm, β_I = 1000.
      // Λ = 532 nm/(2 sin 10°) = 1.5318329 µm; E_D = k_B T 2π/(q Λ) = 104.27096 kV/m; E_q = q N_eff Λ/(2π ε₀ ε) = 1575.5608 kV/m;
      // E_sc = E_D/(1 + E_D/E_q) = 97.798624 kV/m; sin θ_in = sin 10°/2.2, Γ = 2π n³ r_eff E_sc/(λ cos θ_in) = 3.7999407 cm⁻¹;
      // signal gain (1 + β_I)/(1 + β_I e^(−ΓL)) = 1001/(1 + 1000 e^(−1.89997)) = 6.6479359.
      source: KUKHTAREV,
      basis: "computed",
      inputs: { material: "custom" },
      expect: {
        period: 1.531832948516207, ED: 104.27095871457072, Eq: 1575.5608125612468, Esc: 97.79862439087937,
        gamma: 3.7999407259336606, signalGain: 6.647935910945179,
      },
      tolerance: 1e-8,
    },
    {
      // Custom n = 2.3, ε = 100, r_eff = 10 pm/V, N_eff = 5 × 10²² m⁻³, T = 300 K, λ = 1064 nm, 2θ = 40°, L = 10 mm, β_I = 10:
      // Λ = 1064 nm/(2 sin 20°) = 1.5554639 µm; E_D = 104.42730 kV/m; E_q = 2239.8129 kV/m; E_sc = 99.775450 kV/m;
      // Γ = 0.72493841 cm⁻¹; signal gain 11/(1 + 10 e^(−0.72493841)) = 1.8824193.
      source: KUKHTAREV,
      basis: "computed",
      inputs: { material: "custom", wavelength: 1064, angle: 40, temperature: 300, traps: 5, n: 2.3, r: 10, epsilon: 100, length: 10, ratio: 10 },
      expect: {
        period: 1.5554639408867628, ED: 104.4273036163984, Eq: 2239.812928806625, Esc: 99.77545028252746,
        gamma: 0.7249384065722613, signalGain: 1.8824192954800343,
      },
      tolerance: 1e-8,
    },
  ],
});
