import { coolingSummary } from "../../physics/detectors/cooling-benefit";
import { defineSchema } from "../types";

const SZE = "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329: n_i ∝ T^(3/2)·exp(−E_g/2k_BT), " +
  "depletion generation current ∝ n_i and diffusion current ∝ n_i² (ch. 1–2); Varshni Y. P. (1967), Physica 34, 149–154, " +
  "doi:10.1016/0031-8914(67)90062-6 for the E_g(T) form, with the Si coefficients E_g(0) = 1.17 eV, α = 4.73e-4 eV/K, β = 636 K of Thurmond C. D. (1975), J. Electrochem. Soc. 122, 1133–1141, doi:10.1149/1.2134410; Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001), " +
  "J. Appl. Phys. 89, 5815–5875, doi:10.1063/1.1368156 (Tables I, III, XIII) for the In₀.₅₃Ga₀.₄₇As gap.";

export default defineSchema({
  href: "/detectors/cooling-benefit",
  inputs: [
    { key: "egSi", label: "Si band gap (used when fixed)", unit: "eV", toSI: 1, siUnit: "eV", default: 1.12, min: 0.1, max: 6 },
    { key: "egInGaAs", label: "InGaAs band gap (used when fixed)", unit: "eV", toSI: 1, siUnit: "eV", default: 0.75, min: 0.1, max: 6 },
    { key: "coolTemp", label: "Cooling target", unit: "°C", toSI: 1, siUnit: "°C", default: -40, min: -150, max: 25 },
    { key: "darkCurrent25Si", label: "Si dark current at 25 °C", unit: "e⁻/s", toSI: 1, siUnit: "e⁻/s", default: 0.1, min: 1e-6, max: 1e9 },
    { key: "darkCurrent25InGaAs", label: "InGaAs dark current at 25 °C", unit: "e⁻/s", toSI: 1, siUnit: "e⁻/s", default: 1000, min: 1e-6, max: 1e9 },
    { key: "signal", label: "Signal per exposure", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 1000, min: 0, max: 1e9 },
    { key: "readNoise", label: "Read noise", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 3, min: 0, max: 1e4 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 1, min: 1e-6, max: 1e5 },
  ],
  choices: [
    {
      key: "siGap", label: "Si band gap",
      options: [{ value: "fixed", label: "Fixed E_g" }, { value: "varshni", label: "Varshni E_g(T)" }], default: "varshni",
    },
    {
      key: "ingaasGap", label: "InGaAs band gap",
      options: [{ value: "fixed", label: "Fixed E_g" }, { value: "vurgaftman", label: "In₀.₅₃Ga₀.₄₇As E_g(T) (Vurgaftman)" }], default: "vurgaftman",
    },
  ],
  outputs: [
    { key: "siReduction", label: "Si dark-current reduction", unit: "×", toSI: 1, siUnit: "" },
    { key: "inGaAsReduction", label: "InGaAs dark-current reduction", unit: "×", toSI: 1, siUnit: "" },
    { key: "siDarkCooled", label: "Si dark current when cooled", unit: "e⁻/s", toSI: 1, siUnit: "e⁻/s" },
    { key: "inGaAsDarkCooled", label: "InGaAs dark current when cooled", unit: "e⁻/s", toSI: 1, siUnit: "e⁻/s" },
    { key: "siSnr25", label: "Si SNR at 25 °C", unit: "", toSI: 1, siUnit: "" },
    { key: "siSnrCooled", label: "Si SNR cooled", unit: "", toSI: 1, siUnit: "" },
    { key: "inGaAsSnr25", label: "InGaAs SNR at 25 °C", unit: "", toSI: 1, siUnit: "" },
    { key: "inGaAsSnrCooled", label: "InGaAs SNR cooled", unit: "", toSI: 1, siUnit: "" },
    { key: "siGap25", label: "Si E_g at 25 °C", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "siGapCooled", label: "Si E_g cooled", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "inGaAsGap25", label: "InGaAs E_g at 25 °C", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "inGaAsGapCooled", label: "InGaAs E_g cooled", unit: "eV", toSI: 1, siUnit: "eV" },
  ],
  compute({ egSi, egInGaAs, coolTemp, darkCurrent25Si, darkCurrent25InGaAs, signal, readNoise, exposureTime, siGap, ingaasGap }) {
    const r = coolingSummary({
      siVarshni: siGap === "varshni", egSi, inGaAsVurgaftman: ingaasGap === "vurgaftman", egInGaAs,
      darkCurrent25Si, darkCurrent25InGaAs, signal, readNoise, exposureTime,
    }, coolTemp);
    return {
      values: r,
      warnings: ["InGaAs dark current is modelled as pure diffusion (∝ n_i²): the cooling reduction is an upper bound (generation current takes over when cold)."],
    };
  },
  checks: [
    {
      // Defaults, -40 C (233.15 K) vs 25 C (298.15 K). Si Varshni: E_g = 1.17 - 4.73e-4*T^2/(T + 636): 1.12498947 eV (298.15 K), 1.14041734 eV (233.15 K).
      // n_i ratio = (233.15/298.15)^1.5*exp(-(q/2k_B)(1.14041734/233.15 - 1.12498947/298.15)) = 1/949.9913; dark 0.1/949.9913 = 1.05264e-4 e-/s.
      // InGaAs E_g = 0.47*E_GaAs + 0.53*E_InAs - 0.53*0.47*0.477 (Varshni sets of GaAs, InAs): 0.73790475 eV, 0.76015018 eV; diffusion ratio = n_i ratio^2 = 1/18995.807.
      // SNR = S/sqrt(S + I*t + sigma^2) with S = 1000, sigma = 3, t = 1.
      source: SZE,
      basis: "computed",
      inputs: {},
      expect: {
        siReduction: 949.9913097988107, inGaAsReduction: 18995.807333082033, siDarkCooled: 0.00010526412080672404, inGaAsDarkCooled: 0.05264319554654863,
        siSnr25: 31.479867585881863, siSnrCooled: 31.48142585887504, inGaAsSnr25: 22.31053741265801, inGaAsSnrCooled: 31.480606282942208,
        siGap25: 1.1249894675988865, siGapCooled: 1.1404173383852039, inGaAsGap25: 0.73790474819947, inGaAsGapCooled: 0.7601501786647326,
      },
      tolerance: 1e-8,
    },
    {
      // Fixed gaps (Si 1.12 eV, InGaAs 0.75 eV), -20 C (253.15 K): n_i ratio = (253.15/298.15)^1.5*exp(-(q/2k_B)*E_g*(1/253.15 - 1/298.15)):
      // Si reduction 61.55401, dark 0.1/61.55401 = 1.62459e-3 e-/s; InGaAs reduction 292.91925 (n_i^2), dark 1000/292.91925 = 3.41391 e-/s.
      source: SZE,
      basis: "computed",
      inputs: { siGap: "fixed", ingaasGap: "fixed", coolTemp: -20 },
      expect: {
        siReduction: 61.55401033561636, inGaAsReduction: 292.9192533456522, siDarkCooled: 0.001624589518290704, inGaAsDarkCooled: 3.413910108599022,
        siSnrCooled: 31.481402156956882, inGaAsSnrCooled: 31.42830420918596, siGap25: 1.12, inGaAsGapCooled: 0.75,
      },
      tolerance: 1e-8,
    },
  ],
});
