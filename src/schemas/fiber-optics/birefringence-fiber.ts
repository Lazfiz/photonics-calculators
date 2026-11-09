import { fiberBirefringence } from "../../physics/fiber-optics/fiber-birefringence";
import { defineSchema } from "../types";

const SAKAI_KIMURA = "Sakai J., Kimura T. (1981). Birefringence and polarization characteristics of single-mode optical fibers under elastic deformations, " +
  "IEEE J. Quantum Electron. 17, 1041–1051, doi:10.1109/JQE.1981.1071213, as given in Rashleigh S. C. (1983), Origins and control of polarization effects in " +
  "single-mode fibers, J. Lightwave Technol. 1, 312, doi:10.1109/JLT.1983.1072121; B = ε n₁ Δ² G(V), ε = 1 − b/a, Δ = (n₁ − n₂)/n₁, " +
  "G(V) = (W²/V⁴)[U² + (U² − W²)(J₀(U)/J₁(U))² + U W² (J₀(U)/J₁(U))³]; beat length L_B = λ/B; DGD per length = B_g/c.";

export default defineSchema({
  href: "/fiber-optics/birefringence-fiber",
  inputs: [
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.468, min: 1.3, max: 2 },
    { key: "claddingIndex", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "", default: 1.463, min: 1.3, max: 2 },
    { key: "coreRadius", label: "Mean core radius", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4.5, min: 0.5, max: 50 },
    { key: "ellipticity", label: "Core axis ratio b/a", unit: "", toSI: 1, siUnit: "", default: 0.98, min: 0.5, max: 1 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "stressB", label: "Stress birefringence (same axes)", unit: "×10⁻⁴", toSI: 1e-4, siUnit: "", default: 0, min: -20, max: 20 },
  ],
  outputs: [
    { key: "NA", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "" },
    { key: "V", label: "Normalized frequency V", unit: "", toSI: 1, siUnit: "" },
    { key: "delta", label: "Relative index difference Δ = (n₁ − n₂)/n₁", unit: "", toSI: 1, siUnit: "" },
    { key: "geometricB", label: "Geometric birefringence", unit: "", toSI: 1, siUnit: "" },
    { key: "totalB", label: "Total birefringence (geometric + stress)", unit: "", toSI: 1, siUnit: "" },
    { key: "beatLength", label: "Beat length λ/|B|", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "groupB", label: "Group birefringence", unit: "", toSI: 1, siUnit: "" },
    { key: "dgd", label: "DGD per length (uncoupled fibre)", unit: "fs/m", toSI: 1e-15, siUnit: "s/m" },
  ],
  compute({ coreIndex, claddingIndex, coreRadius, ellipticity, wavelength, stressB }) {
    const fiber = { a: coreRadius, n1: coreIndex, n2: claddingIndex, ellipticity: 1 - ellipticity };
    const r = fiberBirefringence(fiber, wavelength, stressB);
    const warnings: string[] = [];
    if (!Number.isFinite(r.geo.B)) warnings.push("Needs n₁ > n₂ and V ≥ 0.5: below that the mode is barely guided and the perturbation result does not apply.");
    else if (r.geo.multimode) warnings.push("V > 2.405: the fibre also guides LP11. The values are for the fundamental mode only.");
    if (r.beatLength === Infinity) warnings.push("No birefringence (B = 0): the beat length is infinite.");
    return {
      values: {
        NA: r.NA,
        V: r.geo.V,
        delta: r.geo.delta,
        geometricB: r.geo.B,
        totalB: r.B,
        beatLength: r.beatLength,
        groupB: r.groupB,
        dgd: r.dgd,
      },
      warnings,
    };
  },
  checks: [
    {
      // Round core (b/a = 1, ε = 0) and a stress term of 5e-4: the geometric part vanishes, so B = B_g = 5e-4,
      // L_B = 1550e-9/5e-4 = 3.1e-3 m = 3.1 mm, DGD = B_g/c = 5e-4/299792458 = 1.667820e-12 s/m = 1667.820 fs/m.
      source: SAKAI_KIMURA,
      basis: "computed",
      inputs: { ellipticity: 1, stressB: 5 },
      expect: { totalB: 5e-4, groupB: 5e-4, beatLength: 3.1, dgd: 1667.8204759907603 },
      tolerance: 1e-8,
    },
    {
      // Defaults: V = (2π · 4.5e-6/1.55e-6) √(1.468² − 1.463²) = 18.24151 · √0.014655 = 2.208277, NA = 0.121058, Δ = 0.005/1.468 = 3.405995e-3.
      // LP01 eigenvalues solved by bisection on U J₁(U) K₀(W) = J₀(U) W K₁(W): U = 1.593463, W = 1.528844, J₀/J₁ = 0.806561,
      // G = (W²/V⁴)[U² + (U² − W²) q² + U W² q³] = 0.454557; B = ε n₁ Δ² G = 0.02 · 1.468 · (3.405995e-3)² · 0.454557 = 1.54822e-7.
      // L_B = λ/B = 10.0115 m.
      source: SAKAI_KIMURA,
      basis: "computed",
      inputs: {},
      expect: { V: 2.2082772349606326, delta: 0.003405994550408647, geometricB: 1.5482202241323816e-7, beatLength: 10011.495624717186 },
      tolerance: 1e-8,
    },
  ],
});
