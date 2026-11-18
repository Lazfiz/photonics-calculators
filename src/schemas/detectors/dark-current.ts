import { darkCurrentSummary } from "../../physics/detectors/dark-current-summary";
import { defineSchema } from "../types";

const SZE = "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 1–2: " +
  "n_i ∝ T^(3/2)·exp(−E_g/2k_BT), so a dark current ∝ n_i^m grows as 2^(ΔT/T_d) locally with ln 2/T_d = m·d ln n_i/dT, d ln n_i/dT = 3/(2T) + (E_g − T·dE_g/dT)/(2k_BT²) " +
  "(m = 1 depletion generation, 2 diffusion), Si E_g(T) = 1.17 − 4.73e-4·T²/(T + 636) eV (Thurmond 1975, below; functional form Varshni Y. P. (1967), Physica 34, 149–154, doi:10.1016/0031-8914(67)90062-6); " +
  "the dark shot noise √(D·t) meets the read noise σ_r where D₂₅·2^((T − 25 °C)/T_d)·t = σ_r², i.e. T* = 25 °C + T_d·log₂(σ_r²/(D₂₅·t)); Thurmond C. D. (1975). The standard thermodynamic functions for the formation of electrons and holes in Ge, Si, GaAs, and GaP. J. Electrochem. Soc. 122, 1133–1141, doi:10.1149/1.2134410 (Si 1.17 eV, 4.73e-4 eV/K, 636 K; Ge 0.7437 eV, 4.774e-4 eV/K, 235 K)";

export default defineSchema({
  href: "/detectors/dark-current",
  inputs: [
    { key: "darkCurrent25", label: "Dark current at 25 °C", unit: "e⁻/s", toSI: 1, siUnit: "e⁻/s", default: 0.1, min: 1e-6, max: 1e9 },
    { key: "tempFactor", label: "Doubling temperature T_d", unit: "K", toSI: 1, siUnit: "K", default: 6, min: 2, max: 20 },
    { key: "tempMin", label: "Coldest temperature", unit: "°C", toSI: 1, siUnit: "°C", default: -80, min: -150, max: 150 },
    { key: "tempMax", label: "Warmest temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 40, min: -150, max: 150 },
    { key: "readNoise", label: "Read noise", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 5, min: 0, max: 1e4 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 1, min: 1e-6, max: 1e5 },
  ],
  outputs: [
    { key: "dcAtMin", label: "Dark current at the coldest temperature", unit: "e⁻/s", toSI: 1, siUnit: "e⁻/s" },
    { key: "dcAtMax", label: "Dark current at the warmest temperature", unit: "e⁻/s", toSI: 1, siUnit: "e⁻/s" },
    { key: "ratio", label: "Dark-current ratio (warmest / coldest)", unit: "×", toSI: 1, siUnit: "" },
    { key: "crossoverTemp", label: "Temperature where dark noise = read noise", unit: "°C", toSI: 1, siUnit: "°C" },
    { key: "siGenTd", label: "Si doubling temperature, generation current (25 °C)", unit: "K", toSI: 1, siUnit: "K" },
    { key: "siDiffTd", label: "Si doubling temperature, diffusion current (25 °C)", unit: "K", toSI: 1, siUnit: "K" },
  ],
  compute({ darkCurrent25, tempFactor, tempMin, tempMax, readNoise, exposureTime }) {
    const r = darkCurrentSummary({ darkCurrent25, doublingT: tempFactor, readNoise, exposureTime, tempA: tempMin, tempB: tempMax });
    return {
      values: {
        dcAtMin: r.dcAtMin, dcAtMax: r.dcAtMax, ratio: r.ratio, crossoverTemp: r.crossoverTemp, siGenTd: r.siGenTd, siDiffTd: r.siDiffTd,
      },
      reasons: { crossoverTemp: "Without read noise (σ_r = 0) the dark shot noise never meets it, so there is no crossover temperature." },
    };
  },
  checks: [
    {
      // D₂₅ = 0.1 e⁻/s, T_d = 6 K, −80…100 °C, σ_r = 5 e⁻, t = 1 s. D(T) = 0.1·2^((T − 25)/6): D(−80) = 0.1·2^(−17.5) = 5.394797e-7, D(100) = 0.1·2^(12.5) = 579.2619, ratio 2^30.
      // T* = 25 + 6·log₂(25/0.1) = 25 + 6·7.965784 = 72.79471 °C. Si at 298.15 K: E_g − T·dE_g/dT = 1.17 + 4.73e-4·636·T²/(T + 636)² = 1.200645 eV;
      // d ln n_i/dT = 1.5/T + 1.2013·q/(2k_BT²) = 0.0833996 /K, T_d = ln 2/that = 8.311157 K (generation), 4.155578 K (diffusion).
      source: SZE,
      basis: "computed",
      inputs: { tempMax: 100 },
      expect: {
        dcAtMin: 5.394796609394437e-7, dcAtMax: 579.2618751480198, ratio: 1073741824, crossoverTemp: 72.79470570797253,
        siGenTd: Math.LN2 / 0.08339960464273641, siDiffTd: Math.LN2 / (2 * 0.08339960464273641), // generation T_d is twice the diffusion one (written as a product: 8.31 resembles R_gas)
      },
      tolerance: 1e-8,
    },
    {
      // D₂₅ = 10 e⁻/s, T_d = 8 K, the ends entered the wrong way round (30 and −20 °C), σ_r = 3 e⁻, t = 2 s.
      // D(−20) = 10·2^(−45/8) = 0.2026312, D(30) = 10·2^(5/8) = 15.42211, ratio 2^(50/8) = 76.10926; T* = 25 + 8·log₂(9/20) = 15.78398 °C.
      source: SZE,
      basis: "computed",
      inputs: { darkCurrent25: 10, tempFactor: 8, tempMin: 30, tempMax: -20, readNoise: 3, exposureTime: 2 },
      expect: { dcAtMin: 0.20263118041422026, dcAtMax: 15.422108254079408, ratio: 76.10925536017415, crossoverTemp: 15.7839752524396 },
      tolerance: 1e-8,
    },
  ],
});
