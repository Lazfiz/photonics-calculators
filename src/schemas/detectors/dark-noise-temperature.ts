import type { DarkCurrentMechanism } from "../../physics/detectors/dark-current";
import { darkNoiseSummary, GAP_MODELS, type GapModel } from "../../physics/detectors/dark-noise-temperature";
import { defineSchema } from "../types";

const SOURCE = "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 1–2: " +
  "n_i ∝ T^(3/2)·exp(−E_g(T)/2k_BT), dark current ∝ n_i (depletion generation) or n_i² (diffusion); Varshni Y. P. (1967), Physica 34, 149–154, " +
  "doi:10.1016/0031-8914(67)90062-6, E_g(T) = E_g(0) − αT²/(T + β), with the coefficients of Thurmond C. D. (1975). The standard thermodynamic functions for the formation of electrons and holes in Ge, Si, GaAs, and GaP. J. Electrochem. Soc. 122, 1133–1141, doi:10.1149/1.2134410 (Si 1.17 eV, 4.73e-4 eV/K, 636 K; Ge 0.7437 eV, 4.774e-4 eV/K, 235 K); " +
  "Schottky W. (1918), Ann. Phys. 362, 541–567, doi:10.1002/andp.19183622304: shot noise √(2q·I·Δf).";

export default defineSchema({
  href: "/detectors/dark-noise-temperature",
  inputs: [
    { key: "darkCurrent25", label: "Dark current at 25 °C", unit: "nA", toSI: 1e-9, siUnit: "A", default: 0.5, min: 1e-6, max: 1e6 },
    { key: "eg", label: "Band gap E_g (used when fixed)", unit: "eV", toSI: 1, siUnit: "eV", default: 1.12, min: 0.1, max: 6 },
    { key: "bandwidth", label: "Noise bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1, min: 1e-3, max: 1e10 },
  ],
  choices: [
    {
      key: "gapModel", label: "Band gap",
      options: [{ value: "fixed", label: "Fixed E_g" }, { value: "si", label: "Si, Varshni E_g(T)" }, { value: "ge", label: "Ge, Varshni E_g(T)" }], default: "si",
    },
    {
      key: "mechanism", label: "Dark-current mechanism",
      options: [{ value: "generation", label: "Depletion generation (∝ n_i)" }, { value: "diffusion", label: "Diffusion (∝ n_i²)" }], default: "generation",
    },
  ],
  outputs: [
    { key: "dark25", label: "Dark current at 25 °C", unit: "nA", toSI: 1e-9, siUnit: "A" },
    { key: "noise25", label: "Dark shot noise at 25 °C", unit: "fA", toSI: 1e-15, siUnit: "A" },
    { key: "darkCold", label: "Dark current at −40 °C", unit: "nA", toSI: 1e-9, siUnit: "A" },
    { key: "darkHot", label: "Dark current at 80 °C", unit: "nA", toSI: 1e-9, siUnit: "A" },
    { key: "ratio", label: "Dark-current ratio (80 / −40 °C)", unit: "×", toSI: 1, siUnit: "" },
    { key: "gap25", label: "E_g at 25 °C", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "gapCold", label: "E_g at −40 °C", unit: "eV", toSI: 1, siUnit: "eV" },
  ],
  compute({ darkCurrent25, eg, bandwidth, gapModel, mechanism }) {
    const model: GapModel = GAP_MODELS.find((m) => m === gapModel) ?? "si";
    const mech: DarkCurrentMechanism = mechanism === "diffusion" ? "diffusion" : "generation";
    return { values: darkNoiseSummary({ darkCurrent25, eg, bandwidth, gapModel: model, mechanism: mech }) };
  },
  checks: [
    {
      // Expected values are in the page units (nA for dark currents, fA for the noise): the SI values below times 1e9 and 1e15.
      // Defaults: Si Varshni, generation, I₂₅ = 0.5 nA, Δf = 1 Hz. E_g(298.15 K) = 1.17 − 4.73e-4·298.15²/(298.15 + 636) = 1.1249895 eV, E_g(233.15 K) = 1.1404173 eV, E_g(353.15 K) from the same law.
      // I(T) = I₂₅·(T/298.15)^1.5·exp(−(q/2k_B)(E_g(T)/T − E_g(298.15)/298.15)): −40 °C 5.263206e-13 A, 80 °C 2.479888e-8 A; noise √(2q·0.5e-9·1) = 1.265771e-14 A.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        dark25: 0.5, noise25: 12.657711617824132, darkCold: 0.0005263206040336201, darkHot: 24.798883208581394,
        ratio: 47117.44708173594, gap25: 1.1249894675988865, gapCold: 1.1404173383852039,
      },
      tolerance: 1e-8,
    },
    {
      // Fixed E_g = 1.0 eV, diffusion (r²), I₂₅ = 2 nA, Δf = 1 MHz: r(T) = (T/298.15)^1.5·exp(−(q/2k_B)·1.0·(1/T − 1/298.15)); I = 2e-9·r². −40 °C 1.853947e-14 A, 80 °C 1.426179e-6 A; noise √(2q·2e-9·1e6) = 2.531542e-11 A.
      source: SOURCE,
      basis: "computed",
      inputs: { gapModel: "fixed", eg: 1, mechanism: "diffusion", darkCurrent25: 2, bandwidth: 1e6 },
      expect: {
        dark25: 2, noise25: 25315.42323564826, darkCold: 0.000018539468645288842, darkHot: 1426.1793843431776,
        ratio: 76926659.09848453, gap25: 1, gapCold: 1,
      },
      tolerance: 1e-8,
    },
    {
      // Ge Varshni (0.7437 eV, 4.774e-4 eV/K, 235 K), generation, I₂₅ = 0.2 nA, Δf = 100 Hz: E_g(298.15 K) = 0.6641019 eV, E_g(233.15 K) = 0.6882670 eV; −40 °C 2.064678e-12 A, 80 °C 2.753112e-9 A.
      source: SOURCE,
      basis: "computed",
      inputs: { gapModel: "ge", darkCurrent25: 0.2, bandwidth: 100 },
      expect: {
        dark25: 0.2, noise25: 80.054397355798, darkCold: 0.0020646784720758284, darkHot: 2.753111842383236,
        ratio: 1333.4336942135385, gap25: 0.664101913342399, gapCold: 0.6882670199690271,
      },
      tolerance: 1e-8,
    },
  ],
});
