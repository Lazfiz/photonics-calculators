import { photodiodeSpeedSummary } from "../../physics/detectors/photodiode-speed";
import { defineSchema } from "../types";

const BOWERS = "Bowers J. E., Burrus C. A. (1987). Ultrawide-band long-wavelength p-i-n photodetectors. J. Lightwave Technol. 5, 1339–1350, " +
  "doi:10.1109/JLT.1987.1075419: f_RC = 1/(2π·R·C_j), f_tr = 0.443·v/W (the root of sin x/x = 1/√2, x = 1.3916), 1/f² = 1/f_RC² + 1/f_tr²; depletion width W = ε₀ε_r/C'' " +
  "(Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 2); " +
  "drift share (1 − e^(−αW))/(1 − e^(−αW)/(1 + αL)) and diffusion current e^(−αW)·αL/(1 + αL): Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. " +
  "Phys. Rev. 116, 84–87, doi:10.1103/PhysRev.116.84, with L → L/√(1 + iωτ), τ = L²/D, for the frequency dependence; ℛ = η·q·λ/(h·c).";
const NO_ABSORPTION = "There is no silicon absorption data at this wavelength (the table covers 250–1450 nm): enter an absorption depth 1/α.";
const NO_DIFFUSION_CORNER = "The drift share is at least 70.7 %, so the diffusion tail never pulls the response below −3 dB and there is no diffusion −3 dB point.";

export default defineSchema({
  href: "/detectors/photodiode-speed",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 850, min: 200, max: 20000 },
    { key: "qe", label: "Quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.01, max: 1 },
    { key: "capacitanceDensity", label: "Capacitance density C''", unit: "pF/mm²", toSI: 1e-6, siUnit: "F/m²", default: 10, min: 0.01, max: 1e4 },
    { key: "epsR", label: "Relative permittivity ε_r", unit: "", toSI: 1, siUnit: "", default: 11.9, min: 1, max: 100 },
    { key: "velocity", label: "Slower-carrier velocity", unit: "m/s", toSI: 1, siUnit: "m/s", default: 8.4e4, min: 1e3, max: 1e6 },
    { key: "loadResistance", label: "Load resistance", unit: "Ω", toSI: 1, siUnit: "Ω", default: 50, min: 1, max: 1e9 },
    { key: "absorptionDepth", label: "Absorption depth 1/α (0 = silicon at λ)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0, min: 0, max: 1e5 },
    { key: "diffusionLength", label: "Substrate diffusion length L", unit: "µm", toSI: 1e-6, siUnit: "m", default: 35, min: 0, max: 1e4 },
    { key: "diffusivity", label: "Minority-carrier diffusivity D", unit: "cm²/s", toSI: 1e-4, siUnit: "m²/s", default: 36, min: 0.01, max: 1e4 },
    { key: "areaMin", label: "Area min (chart only)", unit: "mm²", toSI: 1e-6, siUnit: "m²", default: 0.001, min: 1e-6, max: 1e4 },
    { key: "areaMax", label: "Area max (chart only)", unit: "mm²", toSI: 1e-6, siUnit: "m²", default: 10, min: 1e-6, max: 1e4 },
  ],
  outputs: [
    { key: "responsivity", label: "Responsivity", unit: "mA/W", toSI: 1e-3, siUnit: "A/W" },
    { key: "depletionWidth", label: "Depletion width W", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "transitLimit", label: "Transit limit", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "capacitance", label: "Capacitance at 1 mm²", unit: "pF", toSI: 1e-12, siUnit: "F" },
    { key: "rcBandwidth", label: "RC bandwidth at 1 mm²", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "combinedBandwidth", label: "Combined RC and transit bandwidth at 1 mm²", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "driftShare", label: "Drift share of the DC photocurrent", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "diffusionBandwidth", label: "Diffusion −3 dB (intrinsic)", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "totalBandwidth", label: "Total −3 dB at 1 mm²", unit: "Hz", toSI: 1, siUnit: "Hz" },
  ],
  compute({ wavelength, qe, capacitanceDensity, epsR, velocity, loadResistance, absorptionDepth, diffusionLength, diffusivity }) {
    const r = photodiodeSpeedSummary({
      wavelength_nm: wavelength * 1e9, qe, capacitanceDensity, epsR, velocity, loadResistance,
      absorptionDepth_um: absorptionDepth * 1e6, diffusionLength, diffusivity,
    });
    const noAlpha = !(r.alpha > 0) || !Number.isFinite(r.alpha);
    const noCorner = !noAlpha && r.fDiffusion === Infinity;
    const warnings: string[] = [];
    if (r.diffusionLimited) {
      warnings.push(
        `Only ${(r.driftShare * 100).toFixed(1)} % of the photocurrent is generated inside W, so the response drops to that plateau above the diffusion corner: ` +
        "diffusion caps the −3 dB bandwidth at the diffusion corner, whatever the RC and transit limits.",
      );
    }
    return {
      values: {
        responsivity: r.responsivity,
        depletionWidth: r.W,
        transitLimit: r.fTransit,
        capacitance: r.capacitance1,
        rcBandwidth: r.fRC1,
        combinedBandwidth: r.f1,
        driftShare: r.driftShare,
        diffusionBandwidth: r.fDiffusion, // Infinity (no corner) goes out as null
        totalBandwidth: r.fTotal,
      },
      warnings,
      reasons: {
        ...(noAlpha ? { driftShare: NO_ABSORPTION, diffusionBandwidth: NO_ABSORPTION, totalBandwidth: NO_ABSORPTION } : {}),
        ...(noCorner ? { diffusionBandwidth: NO_DIFFUSION_CORNER } : {}),
      },
    };
  },
  checks: [
    {
      // Drift-dominated: 850 nm, η = 0.8, C'' = 10 pF/mm² = 1e-5 F/m², ε_r = 11.9, v = 8.4e4 m/s, R = 50 Ω, 1/α = 5 µm (α = 2e5 /m), L = 35 µm, D = 36 cm²/s.
      // ℛ = 0.8·q·850e-9/(hc) = 0.548457 A/W; W = ε₀·11.9/1e-5 = 10.5365 µm; f_tr = 0.44294647·8.4e4/W = 3.531302e9 Hz; C = 1e-5·1e-6 = 10 pF;
      // f_RC = 1/(2π·50·1e-11) = 3.183099e8 Hz; f = 1/√(1/f_RC² + 1/f_tr²) = 3.170246e8 Hz; αW = 2.10730, αL = 7: share = (1 − e^(−αW))/(1 − e^(−αW)/8) = 0.891988
      // (no diffusion corner: share ≥ 1/√2); total −3 dB: first crossing of |H_diff|·|sinc|/√(1 + (f/f_RC)²) = 1/√2 by 0.01-decade scan and bisection: 2.613288e8 Hz.
      source: BOWERS,
      basis: "computed",
      inputs: { absorptionDepth: 5 },
      expect: {
        responsivity: 548.4569877397465, depletionWidth: 10.536483504372001, transitLimit: 3531301829.9284716, capacitance: 10,
        rcBandwidth: 318309886.1837907, combinedBandwidth: 317024558.13053876, driftShare: 89.19882958144911, totalBandwidth: 261328779.73896664,
      },
      tolerance: 1e-8,
    },
    {
      // Diffusion-limited: C'' = 5 pF/mm², v = 1e5 m/s, R = 100 Ω, 1/α = 100 µm (α = 1e4 /m), L = 50 µm, D = 30 cm²/s, other inputs at their defaults.
      // W = ε₀·11.9/5e-6 = 21.0730 µm; f_tr = 0.44294647·1e5/W = 2.101965e9 Hz; C = 5 pF, f_RC = 1/(2π·100·5e-12) = 3.183099e8 Hz; f = 3.147217e8 Hz;
      // αW = 0.210730, αL = 0.5: share = (1 − e^(−αW))/(1 − e^(−αW)/1.5) = 0.413055; diffusion corner and total −3 dB by the same scan and bisection: 1.006110e6 Hz and 1.006084e6 Hz.
      source: BOWERS,
      basis: "computed",
      inputs: { capacitanceDensity: 5, velocity: 1e5, loadResistance: 100, absorptionDepth: 100, diffusionLength: 50, diffusivity: 30 },
      expect: {
        responsivity: 548.4569877397465, depletionWidth: 21.072967008744002, transitLimit: 2101965374.9574232, capacitance: 5,
        rcBandwidth: 318309886.1837907, combinedBandwidth: 314721682.4056934, driftShare: 41.30545011089523,
        diffusionBandwidth: 1006110.4384392053, totalBandwidth: 1006083.8038965729,
      },
      tolerance: 1e-8,
    },
  ],
});
