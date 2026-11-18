import { APD_GAIN_MAX, linearApdIonizationRatio, LINEAR_APD_MATERIALS, linearApdSummary, type LinearApdMaterial } from "../../physics/detectors/linear-mode-avalanche";
import { defineSchema } from "../types";

const SOURCE = "McIntyre R. J. (1966). Multiplication noise in uniform avalanche diodes. IEEE Trans. Electron Devices ED-13, 164–168, " +
  "doi:10.1109/T-ED.1966.15651: F = kM + (1 − k)(2 − 1/M). Personick S. D. (1977). Receiver design for optical fiber systems. Proc. IEEE 65, " +
  "1670–1678, doi:10.1109/PROC.1977.10808: σ² = 2q(I_p + I_d)M²F·B + 4k_B·T·B/R, SNR = (M·I_p)²/σ², and the optimum gain k·M³ + (1 − k)·M = " +
  "4k_B·T/[q·R·(I_p + I_d)] (Agrawal G. P. (2010), Fiber-Optic Communication Systems, 4th ed., Wiley, §4.4; k values Table 4.2). " +
  "Responsivity ℛ₀ = η·qλ/(hc), I_p = ℛ₀·P.";

const MATERIAL_LABELS: Record<LinearApdMaterial, string> = { si: "Si (k = 0.02)", ingaas: "InGaAs/InP (k = 0.5)", ge: "Ge (k = 0.85)", custom: "Custom k" };

export default defineSchema({
  href: "/detectors/linear-mode-avalanche",
  inputs: [
    { key: "gain", label: "Gain M", unit: "", toSI: 1, siUnit: "", default: 100, min: 1, max: 1e4 },
    { key: "ionizationRatio", label: "Ionization ratio k (used when the material is custom)", unit: "", toSI: 1, siUnit: "", default: 0.02, min: 0, max: 1 },
    { key: "quantumEff", label: "Quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 1 },
    { key: "bandwidth", label: "Bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz", default: 100e6, min: 1, max: 1e11 },
    { key: "darkCurrent", label: "Bulk dark current, unmultiplied", unit: "A", toSI: 1, siUnit: "A", default: 2.2e-13, min: 0, max: 1e-3 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 200, max: 2000 },
    { key: "incidentPower", label: "Incident power", unit: "W", toSI: 1, siUnit: "W", default: 1e-9, min: 0, max: 1 },
    { key: "loadResistance", label: "Load resistance", unit: "Ω", toSI: 1, siUnit: "Ω", default: 1000, min: 1, max: 1e9 },
    { key: "temperature", label: "Load temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 1, max: 500 },
  ],
  choices: [
    {
      key: "material", label: "Multiplication material", default: "si",
      options: LINEAR_APD_MATERIALS.map((m) => ({ value: m, label: MATERIAL_LABELS[m] })),
    },
  ],
  outputs: [
    { key: "responsivity", label: "Unity-gain responsivity ℛ₀", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "primaryPhotocurrent", label: "Primary photocurrent", unit: "A", toSI: 1, siUnit: "A" },
    { key: "signalCurrent", label: "Multiplied signal current", unit: "A", toSI: 1, siUnit: "A" },
    { key: "multipliedDarkCurrent", label: "Multiplied dark current", unit: "A", toSI: 1, siUnit: "A" },
    { key: "excessNoise", label: "Excess noise F(M)", unit: "", toSI: 1, siUnit: "" },
    { key: "shotNoise", label: "Shot noise (rms)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "thermalNoise", label: "Thermal noise (rms)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "totalNoise", label: "Total noise (rms)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "snr", label: "SNR (electrical)", unit: "", toSI: 1, siUnit: "" },
    { key: "optimumGain", label: "Optimum gain M_opt", unit: "", toSI: 1, siUnit: "" },
    { key: "snrAtOptimum", label: "SNR at M_opt", unit: "", toSI: 1, siUnit: "" },
    { key: "nep", label: "NEP (no light)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "nepDensity", label: "NEP density", unit: "W/√Hz", toSI: 1, siUnit: "W/√Hz" },
  ],
  compute({ gain, ionizationRatio, quantumEff, bandwidth, darkCurrent, wavelength, incidentPower, loadResistance, temperature, material }) {
    const m = LINEAR_APD_MATERIALS.find((x) => x === material) ?? "si";
    const k = linearApdIonizationRatio(m, ionizationRatio);
    const r = linearApdSummary({ gain, k, qe: quantumEff, bandwidth, darkCurrent, wavelength, power: incidentPower, loadResistance, temperature });
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (r.optimumGain > APD_GAIN_MAX) {
      warnings.push(`The optimum gain is above ${APD_GAIN_MAX}, the largest gain this model takes: the SNR at M_opt is evaluated at M = ${APD_GAIN_MAX}.`);
    }
    if (!Number.isFinite(r.optimumGain)) reasons.optimumGain = "There is no current to multiply (primary photocurrent and dark current are both zero), so the optimum gain is unbounded.";
    if (!Number.isFinite(r.nep)) {
      const noResponsivity = "The responsivity is zero (quantum efficiency 0), so the noise-equivalent power is undefined.";
      reasons.nep = noResponsivity;
      reasons.nepDensity = noResponsivity;
    }
    return {
      values: {
        responsivity: r.responsivity, primaryPhotocurrent: r.receiver.photocurrent, signalCurrent: r.r.signal,
        multipliedDarkCurrent: darkCurrent * gain, excessNoise: r.excessNoise, shotNoise: Math.sqrt(r.r.shot),
        thermalNoise: Math.sqrt(r.r.thermal), totalNoise: r.totalNoise, snr: r.r.snr, optimumGain: r.optimumGain,
        snrAtOptimum: r.snrAtOptimum, nep: r.nep, nepDensity: r.nep / Math.sqrt(bandwidth),
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Defaults: Si k = 0.02, M = 100, η = 0.8, 800 nm, P = 1 nW, I_d = 2.2e-13 A, B = 100 MHz, R = 1 kΩ, T = 300 K.
      // ℛ₀ = 0.8·q·800e-9/(h·c) = 0.51619481 A/W; I_p = 5.1619481e-10 A; F = 0.02·100 + 0.98·(2 − 0.01) = 3.9502.
      // σ²_shot = 2q(I_p + I_d)·M²·F·B; σ²_th = 4k_B·T·B/R = 1.6567794e-15 A²; SNR = (M·I_p)²/(σ²_shot + σ²_th) = 1.1532701.
      // M_opt solves 0.02·M³ + 0.98·M = 4k_B·T/(q·R·(I_p + I_d)) (bisection) = 215.45459; NEP = √(2q·I_d·M²·F·B + σ²_th)/(M·ℛ₀).
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        responsivity: 0.5161948119903497, primaryPhotocurrent: 5.161948119903497e-10, signalCurrent: 5.1619481199034966e-8,
        multipliedDarkCurrent: 2.1999999999999998e-11, excessNoise: 3.9501999999999997, shotNoise: 2.5566959424920623e-8,
        thermalNoise: 4.0703547756921635e-8, totalNoise: 4.806712196746897e-8, snr: 1.153270098347197, optimumGain: 215.4545921824958,
        snrAtOptimum: 1.9120787592979585, nep: 7.88597006523313e-10, nepDensity: 7.88597006523313e-14,
      },
      tolerance: 1e-8,
    },
    {
      // InGaAs k = 0.5, M = 10, η = 0.7, 1550 nm, P = 100 nW, I_d = 1 nA, B = 1 GHz, R = 500 Ω, T = 290 K.
      // ℛ₀ = 0.7·q·1550e-9/(h·c) = 0.87511152 A/W; I_p = 8.7511152e-8 A; F = 0.5·10 + 0.5·(2 − 0.1) = 5.95.
      // SNR = (M·I_p)²/(2q(I_p + I_d)M²F·B + 4k_B·T·B/R) = 15.658861; M_opt from 0.5·M³ + 0.5·M = 4k_B·T/(q·R·(I_p + I_d)) = 16.510779.
      source: SOURCE,
      basis: "computed",
      inputs: { material: "ingaas", gain: 10, quantumEff: 0.7, wavelength: 1550, incidentPower: 1e-7, darkCurrent: 1e-9, bandwidth: 1e9, loadResistance: 500, temperature: 290 },
      expect: {
        responsivity: 0.8751115172023894, primaryPhotocurrent: 8.751115172023894e-8, signalCurrent: 8.751115172023895e-7,
        multipliedDarkCurrent: 1e-8, excessNoise: 5.95, shotNoise: 1.2990554028607436e-7, thermalNoise: 1.7897222354320796e-7,
        totalNoise: 2.2114815440563118e-7, snr: 15.658860693405657, optimumGain: 16.510778707753907, snrAtOptimum: 20.198720143404753,
        nep: 2.0512138108973362e-8, nepDensity: 6.486507610429493e-13,
      },
      tolerance: 1e-8,
    },
  ],
});
