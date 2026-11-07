import { beamRadius } from "../../physics/free-space-comms/pointing-loss";
import {
  beamWanderDiffractionFactor, beamWanderLossDb, beamWanderVariance, friedParameter, rytovVariance,
} from "../../physics/free-space-comms/turbulence";
import { defineSchema } from "../types";

const ANDREWS = "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE, " +
  "ch. 6: ⟨r_c²⟩ = 2.42 C_n² L³ W₀^(−1/3), σ_R² = 1.23 C_n² k^(7/6) L^(11/6), r₀ = (0.423 k² C_n² L)^(−3/5); " +
  "diffraction factor F from Berman G. P., Chumak A. A., Gorshkov V. N. (2007). Phys. Rev. E 76, 056606, eqs. (12)–(13).";

export default defineSchema({
  href: "/free-space-comms/beam-wander",
  inputs: [
    { key: "cn2", label: "Refractive-index structure constant Cn²", unit: "m⁻²ᐟ³", toSI: 1, siUnit: "m^(−2/3)", default: 1e-14, min: 1e-18, max: 1e-11 },
    { key: "pathLength", label: "Path length", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 1000 },
    { key: "beamRadius", label: "Transmit beam radius W₀", unit: "cm", toSI: 1e-2, siUnit: "m", default: 2, min: 0.01, max: 100 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
  ],
  outputs: [
    { key: "variance", label: "Wander variance ⟨r_c²⟩", unit: "m²", toSI: 1, siUnit: "m²" },
    { key: "rmsWander", label: "RMS wander √⟨r_c²⟩", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "angularWander", label: "Angular RMS wander", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "beamRadiusAtRx", label: "Beam radius W(L)", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "lossDb", label: "Mean on-axis loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "rytovVariance", label: "Rytov variance σ_R² (plane wave)", unit: "", toSI: 1, siUnit: "" },
    { key: "friedParameter", label: "Fried parameter r₀ (plane wave)", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "diffractionFactor", label: "Diffraction factor F", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ cn2, pathLength: L, beamRadius: W0, wavelength: lambda }) {
    const zR = (Math.PI * W0 ** 2) / lambda;
    const factor = beamWanderDiffractionFactor(L / zR);
    const variance = beamWanderVariance(cn2, L, W0) * factor;
    const rms = Math.sqrt(variance);
    const W = beamRadius(W0, lambda, L);
    const sigmaR2 = rytovVariance(cn2, lambda, L);
    const r0 = friedParameter(cn2, lambda, L);
    const warnings: string[] = [];
    if (sigmaR2 > 1 || 2 * W0 > r0) {
      warnings.push("Outside weak fluctuations (σ_R² > 1 or 2W₀ > r₀): the 2.42 Cn² L³ W₀^(−1/3) wander law overestimates the wander.");
    }
    return {
      values: {
        variance, rmsWander: rms, angularWander: rms / L, beamRadiusAtRx: W, lossDb: beamWanderLossDb(variance, W),
        rytovVariance: sigmaR2, friedParameter: r0, diffractionFactor: factor,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: z_R = πW₀²/λ = 810.7336 m, L/z_R = 1.233451, F = 3∫₀¹ ξ²(1 + ((1−ξ)L/z_R)²)^(−1/6) dξ = 0.9791963;
      // ⟨r_c²⟩ = 2.42·1e−14·1e9·0.02^(−1/3)·F = 8.729884e−5 m², √ = 9.343385 mm; W(L) = 3.175784 cm; loss 10 log(1 + 2⟨r_c²⟩/W²) = 0.6934086 dB.
      source: ANDREWS,
      basis: "computed",
      inputs: {},
      expect: { diffractionFactor: 0.9791962691, variance: 8.729883554e-5, rmsWander: 0.9343384587, angularWander: 9.343384587, beamRadiusAtRx: 3.175783934, lossDb: 0.6934086120 },
      tolerance: 1e-7,
    },
    {
      // Same case: σ_R² = 1.23·1e−14·k^(7/6)·1000^(11/6) with k = 2π/1550 nm = 4.053667e6 m⁻¹ gives 0.1990954;
      // r₀ = (0.423 k² Cn² L)^(−3/5) = 7.848343 cm.
      source: ANDREWS,
      basis: "computed",
      inputs: {},
      expect: { rytovVariance: 0.1990954385, friedParameter: 7.848343007 },
      tolerance: 1e-8,
    },
  ],
});
