import { INGAAS_WINDOWS, siVsIngaasSummary, type IngaasWindow } from "../../physics/detectors/si-vs-ingaas";
import { defineSchema } from "../types";

const REFS =
  "Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. Phys. Rev. 116, 84–87, doi:10.1103/PhysRev.116.84 (Si: η = (1 − R)[1 − e^(−αW)/(1 + αL)], " +
  "W = 20 µm, L = 100 µm, R = 5 %; α = 4π·k/λ from Green M. A. (2008). Sol. Energy Mater. Sol. Cells 92, 1305–1310, doi:10.1016/j.solmat.2008.06.009, Table 1; InGaAs: η = (1 − R)(1 − e^(−αd)), " +
  "d = 3 µm, R = 2 %, α = 2.4e4 cm⁻¹·eV^−½·√(E − E_g), a fit to Adachi S. (1989). J. Appl. Phys. 66, 6030, doi:10.1063/1.343580, with E_g(x, T) and the InP gap from " +
  "Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001). J. Appl. Phys. 89, 5815–5875, doi:10.1063/1.1368156); dark current I = q·n_i·W·A/τ_g " +
  "(Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 2) with n_i(Si, 300 K) = 9.65e9 cm⁻³ " +
  "(Altermatt P. P. et al. (2003). J. Appl. Phys. 93, 1598, doi:10.1063/1.1529297) and n_i(In₀.₅₃Ga₀.₄₇As, 300 K) = 6.3e11 cm⁻³ (Paul S., Roy J. B., Basu P. K. (1991). " +
  "J. Appl. Phys. 69, 827–829, doi:10.1063/1.348919), both ∝ T^(3/2)·exp(−E_g/2k_BT), " +
  "Si E_g(T) = 1.17 − 4.73e-4·T²/(T + 636) eV (form: Varshni Y. P. (1967). Physica 34, 149–154, doi:10.1016/0031-8914(67)90062-6; coefficients: Thurmond C. D. (1975). J. Electrochem. Soc. 122, 1133–1141, doi:10.1149/1.2134410); the Si absorption stays at its 300 K values at every temperature; ℛ = η·q·λ/(h·c); SNR = I_s/√((2q(I_s + I_dark) + i_amp²)·B).";

const SI_BEYOND = "Silicon is transparent beyond 1450 nm (the end of its absorption table), so its QE is 0 there.";
const INGAAS_WINDOW = "The InP cap absorbs this wavelength (opaque above its band gap), so the InGaAs QE is 0.";
const INGAAS_BEYOND = "This wavelength is beyond the InGaAs cutoff (the band-gap edge), so the QE is 0.";

export default defineSchema({
  href: "/detectors/si-vs-ingaas",
  choices: [
    {
      key: "window",
      label: "InGaAs window",
      options: [
        { value: "inp", label: "InP cap (standard, opaque below the InP edge)" },
        { value: "none", label: "None (visible-extended)" },
      ],
      default: "inp",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 1800 },
    { key: "powerDbm", label: "Optical power", unit: "dBm", toSI: 1, siUnit: "dBm", default: -40, min: -90, max: 10 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 250, max: 350 },
    { key: "area", label: "Detector area", unit: "mm²", toSI: 1e-6, siUnit: "m²", default: 1, min: 0.001, max: 100 },
    { key: "bandwidth", label: "Bandwidth", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 1, min: 1e-6, max: 1e4 },
    { key: "ampNoise", label: "Amplifier noise", unit: "pA/√Hz", toSI: 1e-12, siUnit: "A/√Hz", default: 1, min: 0, max: 100 },
  ],
  outputs: [
    { key: "siQe", label: "Si QE", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "ingaasQe", label: "InGaAs QE", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "siResponsivity", label: "Si responsivity", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "ingaasResponsivity", label: "InGaAs responsivity", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "siDark", label: "Si dark current (generation)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "ingaasDark", label: "InGaAs dark current (generation)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "siSnr", label: "Si SNR (current amplitude ratio)", unit: "", toSI: 1, siUnit: "" },
    { key: "ingaasSnr", label: "InGaAs SNR (current amplitude ratio)", unit: "", toSI: 1, siUnit: "" },
    { key: "inpEdge", label: "InP window edge h·c/E_g,InP", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "niRatio", label: "Intrinsic density ratio n_i(InGaAs)/n_i(Si)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, powerDbm, temperature, area, bandwidth, ampNoise, window }) {
    const cap: IngaasWindow = INGAAS_WINDOWS.find((w) => w === window) ?? "inp";
    const r = siVsIngaasSummary({
      lambda: wavelength, power: 10 ** (powerDbm / 10) * 1e-3, T: temperature, area, bandwidth, ampNoise, window: cap,
    });
    const warnings: string[] = [];
    if (r.siQe === 0) warnings.push(SI_BEYOND);
    if (r.ingaasQe === 0) warnings.push(cap === "inp" && wavelength <= r.inpEdge ? INGAAS_WINDOW : INGAAS_BEYOND);
    return {
      values: {
        siQe: r.siQe,
        ingaasQe: r.ingaasQe,
        siResponsivity: r.siResponsivity,
        ingaasResponsivity: r.ingaasResponsivity,
        siDark: r.siDark,
        ingaasDark: r.ingaasDark,
        siSnr: r.siSnr,
        ingaasSnr: r.ingaasSnr,
        inpEdge: r.inpEdge,
        niRatio: r.niRatio,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults except λ = 950 nm (−40 dBm = 1e-7 W, 300 K, A = 1 mm², B = 1 MHz, i_amp = 1 pA/√Hz, InP cap). Si: α(950) = 4π·k(950)/λ, QE = 0.95·(1 − e^(−α·20 µm)/(1 + α·100 µm)) = 0.678358;
      // InGaAs: E_g = 0.737257 eV, α = 2.4e6·√(hc/950 nm − E_g), QE = 0.98·(1 − e^(−α·3 µm)) = 0.975686 (950 nm is above the InP edge 916.44 nm); ℛ = QE·q·λ/(hc);
      // I_dark = q·n_i·W·A/τ_g: Si q·9.65e15·20e-6·1e-6/1e-3 = 3.0922e-11 A, InGaAs q·6.3e17·3e-6·1e-6/100e-6 = 3.0281e-9 A (T = 300 K: n_i ratio 1); SNR = ℛP/√((2q(ℛP + I_dark) + i_amp²)B).
      source: REFS,
      basis: "computed",
      inputs: { wavelength: 950 },
      expect: {
        siQe: 67.83581380788112, ingaasQe: 97.568550459968, siResponsivity: 0.5197760999536403, ingaasResponsivity: 0.7475962591064282,
        siDark: 3.09220090362e-11, ingaasDark: 3.0281138382599995e-9, siSnr: 51.54983631066937, ingaasSnr: 73.84496298589004,
        inpEdge: 916.442513391905, niRatio: 65.28497409326425,
      },
      tolerance: 1e-8,
    },
    {
      // λ = 1000 nm, −30 dBm = 1e-6 W, T = 320 K, A = 2 mm², B = 10 MHz, i_amp = 2 pA/√Hz, no InP cap. n_i(T) = n_i(300 K)·(T/300)^(3/2)·exp(−(q/2k_B)(E_g(T)/T − E_g(300)/300))
      // with Varshni E_g(Si) = 1.17 − 4.73e-4·T²/(T + 636) and the Vurgaftman InGaAs gap; QE, ℛ, I_dark and SNR as in the first case.
      source: REFS,
      basis: "computed",
      inputs: { wavelength: 1000, powerDbm: -30, temperature: 320, area: 2, bandwidth: 10, ampNoise: 2, window: "none" },
      expect: {
        siQe: 44.03310041925663, ingaasQe: 97.42593992082178, siResponsivity: 0.3551509061292244, ingaasResponsivity: 0.7857931990689325,
        siDark: 2.9141169008719927e-10, ingaasDark: 1.848428499805448e-8, siSnr: 55.371496137675585, ingaasSnr: 120.42586434509653,
        inpEdge: 920.8014687860556, niRatio: 42.28676159725192,
      },
      tolerance: 1e-8,
    },
  ],
});
