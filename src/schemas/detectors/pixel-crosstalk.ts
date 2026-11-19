import { pixelCrosstalkSummary } from "../../physics/detectors/pixel-crosstalk";
import { defineSchema } from "../types";

const SEIB = "Seib D. H. (1974). Carrier diffusion degradation of modulation transfer function in charge coupled imagers. IEEE Trans. Electron " +
  "Devices 21, 210–217, doi:10.1109/T-ED.1974.17898: front-illuminated field-free diffusion, collected fraction η(f) = 1 − e^(−αW)/(1 + α L_f) with " +
  "1/L_f² = 1/L₀² + (2π f)², MTF = η(f)/η(0). Absorption α = 4πk/λ with k of intrinsic silicon at 300 K from Green M. A. (2008). Self-consistent " +
  "optical parameters of intrinsic silicon at 300 K including temperature coefficients. Sol. Energy Mater. Sol. Cells 92, 1305–1310, " +
  "doi:10.1016/j.solmat.2008.06.009, Table 1. Pixel aperture |sinc(π f p)| and the three-tap kernel [X/2, 1 − X, X/2] (MTF 1 − X + X cos 2π f p): " +
  "Holst G. C., Lomheim T. S. (2011). CMOS/CCD Sensors and Camera Systems, 2nd ed. SPIE Press, ch. 10 \"MTF\", doi:10.1117/3.2524677.ch10.";

export default defineSchema({
  href: "/detectors/pixel-crosstalk",
  inputs: [
    { key: "pixelPitch", label: "Pixel pitch p", unit: "µm", toSI: 1e-6, siUnit: "m", default: 5, min: 1, max: 50 },
    { key: "depletionDepth", label: "Depletion depth W", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 0, max: 100 },
    { key: "diffusionLength", label: "Diffusion length L₀ below the depletion layer", unit: "µm", toSI: 1e-6, siUnit: "m", default: 20, min: 1, max: 200 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 300, max: 1100 },
    { key: "crosstalkCoeff", label: "Kernel crosstalk X (both neighbours)", unit: "", toSI: 1, siUnit: "", default: 0.03, min: 0, max: 0.5 },
  ],
  outputs: [
    { key: "absorptionDepth", label: "Absorption depth 1/α", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "belowDepletion", label: "Absorbed below the depletion layer e^(−αW)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "collected", label: "Collected fraction of the absorbed charge", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "diffusionCrosstalk", label: "Diffusion crosstalk to the two neighbouring columns", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "beyondNeighbours", label: "Charge landing beyond the first neighbours", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "totalCrosstalk", label: "Total neighbour crosstalk (diffusion and kernel)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "nyquist", label: "Nyquist frequency", unit: "lp/mm", toSI: 1000, siUnit: "cycles/m" },
    { key: "mtfNyquist", label: "MTF at Nyquist", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ pixelPitch, depletionDepth, diffusionLength, wavelength, crosstalkCoeff }) {
    const r = pixelCrosstalkSummary({ pitch: pixelPitch, depletion: depletionDepth, diffusionLength, kernel: crosstalkCoeff, wavelength });
    return {
      values: {
        absorptionDepth: r.absorptionDepth, belowDepletion: r.belowDepletion, collected: r.collected, diffusionCrosstalk: r.diffusionCrosstalk,
        beyondNeighbours: r.beyond, totalCrosstalk: r.total, nyquist: r.nyquist, mtfNyquist: r.atNyquist.total,
      },
    };
  },
  checks: [
    {
      // Defaults: k(550 nm) = 0.027968, α = 4π·0.027968/550e-9 = 6.3901137e5 /m, 1/α = 1.5649174 µm; αW = 6.390114: e^(−αW) = 0.16780654 %;
      // η(0) = 1 − e^(−αW)/(1 + α L₀) = 1 − 0.0016780654/(1 + 12.780227) = 0.99987823 = 99.987823 %; f_N = 1/(2·5e-6) = 100 lp/mm;
      // pixel |sinc(π/2)| = 2/π = 0.63661977; L_f = L₀/√(1 + (2π f_N L₀)²), η(f_N)/η(0) = 0.99928841;
      // kernel 1 − 2X = 0.94: MTF = 0.63661977·0.99928841·0.94 = 59.799675 %.
      // Diffusion shares: the Seib column integral evaluated independently by composite Simpson on u ∈ [0, 4000] plus the analytic
      // 1/u³ tail (converged to ≈ 1e-11). The page integrates to u = 100 (sensor-mtf.ts U_MAX) and adds the tail beyond in v = 1/u.
      source: SEIB,
      basis: "computed",
      inputs: {},
      expect: { absorptionDepth: 1.5649173823752582, belowDepletion: 0.16780653993152286, collected: 99.98782265813688, nyquist: 100, mtfNyquist: 59.79967540134521,
        diffusionCrosstalk: 0.037062171384463, beyondNeighbours: 0.01257896782699, totalCrosstalk: 3.0345652450493 },
      tolerance: 1e-8,
    },
    {
      // p = 4 µm, W = 5 µm, L₀ = 30 µm, 650 nm (k = 0.014431), X = 0.1: α = 2.7899276e5 /m, 1/α = 3.5843224 µm; e^(−αW) = 24.784201 %;
      // η(0) = 1 − 0.24784201/(1 + 8.3697828) = 0.97354880 = 97.35488 %; f_N = 125 lp/mm; pixel 2/π; η(f_N)/η(0) = 0.83927787; kernel 0.8:
      // MTF = 0.63661977·0.83927787·0.8 = 42.744071 %.
      source: SEIB,
      basis: "computed",
      inputs: { pixelPitch: 4, depletionDepth: 5, diffusionLength: 30, wavelength: 650, crosstalkCoeff: 0.1 },
      expect: { absorptionDepth: 3.584322396567528, belowDepletion: 24.78420074453046, collected: 97.35487991210073, nyquist: 125, mtfNyquist: 42.74407083820127 },
      tolerance: 1e-8,
    },
    {
      // W = 90 µm at 550 nm: e^(−αW) = e^(−57.5) ≈ 1e-25, so every carrier is collected where it lands and the diffusion shares are [1, 0, 0];
      // the kernel [X/2, 1 − X, X/2] alone sends X = 0.03 to the neighbours: total = 2·(C₁(1 − X) + (C₀ + C₂)·X/2) = X = 3 %.
      source: SEIB,
      basis: "computed",
      inputs: { depletionDepth: 90 },
      expect: { totalCrosstalk: 3 },
      tolerance: 1e-8,
    },
  ],
});
