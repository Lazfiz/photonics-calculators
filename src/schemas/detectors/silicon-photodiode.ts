import { siliconPhotodiodeSummary } from "../../physics/detectors/silicon-photodiode";
import { defineSchema } from "../types";

const REFS =
  "Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. Phys. Rev. 116, 84–87, doi:10.1103/PhysRev.116.84: η = (1 − R)·[1 − e^(−αW)/(1 + αL)]; " +
  "α = 4π·k/λ from Green M. A. (2008). Self-consistent optical parameters of intrinsic silicon at 300 K including temperature coefficients. " +
  "Sol. Energy Mater. Sol. Cells 92, 1305–1310, doi:10.1016/j.solmat.2008.06.009, Table 1 (300 K at every temperature); E_g(T) = 1.170 − 4.73e-4·T²/(T + 636) eV (form: Varshni Y. P. (1967). Physica 34, 149–154, doi:10.1016/0031-8914(67)90062-6; coefficients: Thurmond C. D. (1975). J. Electrochem. Soc. 122, 1133–1141, doi:10.1149/1.2134410); " +
  "ℛ = η·q·λ/(h·c); I_dark = q·n_i·W·A/τ_g (Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 2) with " +
  "n_i(300 K) = 9.65e9 cm⁻³ (Altermatt P. P. et al. (2003). J. Appl. Phys. 93, 1598, doi:10.1063/1.1529297) scaled with T^(3/2)·exp(−E_g/2k_BT); C = ε₀·11.9·A/W (Sze & Ng, appendix G).";

export default defineSchema({
  href: "/detectors/silicon-photodiode",
  inputs: [
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 293, min: 200, max: 400 },
    { key: "depletionWidth", label: "Depletion width W", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 1, max: 500 },
    { key: "diffusionLength", label: "Diffusion length L (0 = none)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 0, max: 1000 },
    { key: "area", label: "Active area", unit: "mm²", toSI: 1e-6, siUnit: "m²", default: 1, min: 0.01, max: 1000 },
    { key: "surfaceReflectivity", label: "Surface reflectivity", unit: "", toSI: 1, siUnit: "", default: 0.05, min: 0, max: 0.5 },
    { key: "lifetime", label: "Generation lifetime τ_g", unit: "ms", toSI: 1e-3, siUnit: "s", default: 1, min: 0.001, max: 100 },
  ],
  outputs: [
    { key: "bandGap", label: "Band gap E_g", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "bandGapWavelength", label: "h·c/E_g", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "peakResponsivity", label: "Peak responsivity (300–1200 nm, 4 nm steps)", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "peakWavelength", label: "Wavelength of the peak responsivity", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "qe700", label: "QE at 700 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "responsivity900", label: "Responsivity at 900 nm", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "qe900", label: "QE at 900 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "darkCurrent", label: "Dark current (generation)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "capacitance", label: "Junction capacitance", unit: "pF", toSI: 1e-12, siUnit: "F" },
  ],
  compute({ temperature, depletionWidth, diffusionLength, area, surfaceReflectivity, lifetime }) {
    const r = siliconPhotodiodeSummary({
      T: temperature, W: depletionWidth, L: diffusionLength, area, reflectance: surfaceReflectivity, lifetime,
    });
    return {
      values: {
        bandGap: r.bandGap,
        bandGapWavelength: r.bandGapWavelength * 1e-9,
        peakResponsivity: r.peakResponsivity,
        peakWavelength: r.peakWavelength * 1e-9,
        qe700: r.qe700,
        responsivity900: r.responsivity900,
        qe900: r.qe900,
        darkCurrent: r.darkCurrent,
        capacitance: r.capacitance,
      },
      warnings: [],
    };
  },
  checks: [
    {
      // Defaults: T = 293 K, W = 10 µm, L = 100 µm, A = 1 mm² = 1e-6 m², R = 0.05, τ_g = 1 ms.
      // E_g = 1.17 − 4.73e-4·293²/(293 + 636) = 1.126290 eV, hc/E_g = 1100.819 nm; QE(700) = 0.95·(1 − e^(−αW)/(1 + αL)) with α = 4π·k/λ from Green's k at 700 nm (node) = 0.942788,
      // QE(900) = 0.775890, ℛ(900) = QE·q·900e-9/(hc) = 0.563218 A/W; peak ℛ = 0.591924 A/W on the 4 nm grid at 840 nm (Green's table interpolated linearly in n and in ln k);
      // n_i(293 K) = 9.65e15·(293/300)^1.5·exp(−(q/2k_B)(E_g(293)/293 − E_g(300)/300)) m⁻³, I_dark = q·n_i·W·A/τ_g = 8.5697e-12 A; C = ε₀·11.9·1e-6/10e-6 = 10.5365 pF.
      source: REFS,
      basis: "computed",
      inputs: {},
      expect: {
        bandGap: 1.1262900139935415, bandGapWavelength: 1100.819477157428, peakResponsivity: 0.5919236526279316, peakWavelength: 840,
        qe700: 94.27878356955178, responsivity900: 0.5632180606398561, qe900: 77.58904421281571, darkCurrent: 8.569716939553903e-12,
        capacitance: 10.536483504372,
      },
      tolerance: 1e-8,
    },
    {
      // T = 330 K, W = 30 µm, L = 50 µm, A = 4 mm², R = 0.1, τ_g = 10 ms: E_g = 1.116677 eV, hc/E_g = 1110.296 nm; QE(700) = 0.8997030, QE(900) = 0.7558137, ℛ(900) = 0.548644 A/W;
      // peak ℛ = 0.583493 A/W at 844 nm; I_dark = q·n_i(330 K)·30e-6·4e-6/10e-3 = 1.7745e-10 A; C = ε₀·11.9·4e-6/30e-6 = 14.0486 pF.
      source: REFS,
      basis: "computed",
      inputs: { temperature: 330, depletionWidth: 30, diffusionLength: 50, area: 4, surfaceReflectivity: 0.1, lifetime: 10 },
      expect: {
        bandGap: 1.1166773291925465, bandGapWavelength: 1110.2956529336138, peakResponsivity: 0.5834933668540738, peakWavelength: 844,
        qe700: 89.9703036217181, responsivity900: 0.5486443557123201, qe900: 75.58136740876846, darkCurrent: 1.7744956556554906e-10,
        capacitance: 14.048644672496001,
      },
      tolerance: 1e-8,
    },
  ],
});
