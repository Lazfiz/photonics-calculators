import { peakPower, type PulseShape } from "../../physics/laser-safety/peak-power";
import { qSwitchedLaser } from "../../physics/wave-optics/pulsed-laser";
import { defineSchema } from "../types";

const SOURCE =
  "Wagner W. G., Lengyel B. A. (1963). Evolution of the giant pulse in a laser. J. Appl. Phys. 34, 2040–2046, doi:10.1063/1.1729732 " +
  "(rate equations: rη = −ln(1 − η), E = (hνA/2σ) ln(1/R) rη, P_p = (γ₂/2)(hνA/σ)(r − 1 − ln r)/τ_c, τ_c = L_e/(cγ)); " +
  "Degnan J. J. (1989). Theory of the optimally coupled Q-switched laser. IEEE J. Quantum Electron. 25, 214–220, doi:10.1109/3.16265 " +
  "(optimum coupling ln(1/R) = 2γ_i(z − 1 − ln z)/ln z, E_max = (hνA/2σ) 2γ_i(z − 1 − ln z), z = g₀l/γ_i); peak power of a measured " +
  "pulse: shape factor 2√(ln2/π) (Gaussian), ln(1 + √2) (sech²) times E/τ, Diels J.-C., Rudolph W. (2006). Ultrashort Laser Pulse " +
  "Phenomena, 2nd ed., ch. 1, Academic Press";

const SHAPES: Readonly<Record<string, PulseShape>> = { gaussian: "gaussian", sech2: "sech2", rectangular: "rectangular" };

export default defineSchema({
  href: "/wave-optics/q-switched-laser",
  inputs: [
    { key: "repRate", label: "Repetition rate", unit: "kHz", toSI: 1e3, siUnit: "Hz", default: 10, min: 1e-3, max: 1e5 },
    { key: "pulseEnergy", label: "Pulse energy (measured pulse)", unit: "mJ", toSI: 1e-3, siUnit: "J", default: 1, min: 1e-9, max: 1e6 },
    { key: "pulseWidth", label: "Pulse width, FWHM (measured pulse)", unit: "ns", toSI: 1e-9, siUnit: "s", default: 10, min: 1e-3, max: 1e6 },
    { key: "inversionRatio", label: "Initial inversion / threshold r (used when pump = ratio)", unit: "", toSI: 1, siUnit: "", default: 3, min: 1.01, max: 50 },
    { key: "g0l", label: "Initial single-pass gain g₀l, ln of the gain (used when pump = gain)", unit: "", toSI: 1, siUnit: "", default: 0.6, min: 1e-4, max: 20 },
    { key: "wavelength", label: "Laser wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 20000 },
    { key: "sigma", label: "Emission cross-section σ", unit: "1e-19 cm²", toSI: 1e-23, siUnit: "m²", default: 2.8, min: 1e-4, max: 1e4 },
    { key: "modeDiameter", label: "Mode diameter in the rod (top hat)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.01, max: 100 },
    { key: "R_oc", label: "Output coupler reflectance R (HR = 1)", unit: "", toSI: 1, siUnit: "", default: 0.7, min: 0.01, max: 0.9999 },
    { key: "internalLoss", label: "Internal loss per pass", unit: "%", toSI: 0.01, siUnit: "", default: 2, min: 0, max: 90 },
    { key: "cavityLength", label: "Mirror spacing L (raised to the rod length if shorter)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 300, min: 1, max: 10000 },
    { key: "rodLength", label: "Rod length l", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: 0.1, max: 1000 },
    { key: "n_rod", label: "Rod index n", unit: "", toSI: 1, siUnit: "", default: 1.82, min: 1, max: 4 },
  ],
  choices: [
    {
      key: "shape",
      label: "Pulse shape of the measured pulse",
      options: [
        { value: "gaussian", label: "Gaussian (0.939 E/τ)" },
        { value: "sech2", label: "sech² (0.881 E/τ)" },
        { value: "rectangular", label: "Rectangular (E/τ)" },
      ],
      default: "gaussian",
    },
    {
      key: "pump",
      label: "Pump given as",
      options: [
        { value: "ratio", label: "Inversion ratio r (held when R changes)" },
        { value: "gain", label: "Small-signal gain g₀l (fixed pump)" },
      ],
      default: "ratio",
    },
  ],
  outputs: [
    { key: "measuredPeakPower", label: "Peak power of the measured pulse (shape factor × E/τ)", unit: "kW", toSI: 1e3, siUnit: "W" },
    { key: "averagePower", label: "Average power E × f of the measured pulse", unit: "W", toSI: 1, siUnit: "W" },
    { key: "dutyCycle", label: "Duty cycle τ × f", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "inversionRatioUsed", label: "Inversion ratio r = g₀l/γ", unit: "", toSI: 1, siUnit: "" },
    { key: "smallSignalGain", label: "Initial single-pass gain g₀l = rγ", unit: "", toSI: 1, siUnit: "" },
    { key: "photonLifetime", label: "Photon lifetime τ_c = L_e/(cγ)", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "pulseEnergy", label: "Pulse energy from the cavity", unit: "mJ", toSI: 1e-3, siUnit: "J" },
    { key: "extraction", label: "Extraction efficiency η", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "fluence", label: "Output fluence in the mode", unit: "J/cm²", toSI: 1e4, siUnit: "J/m²" },
    { key: "cavityPeakPower", label: "Peak power of the cavity pulse", unit: "kW", toSI: 1e3, siUnit: "W" },
    { key: "pulseWidthFwhm", label: "Pulse width FWHM (integrated waveform; none for r above 50)", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "pulseWidthEstimate", label: "Pulse width estimate E/P_p", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "optimumReflectance", label: "Optimum output coupler reflectance (Degnan) at this g₀l", unit: "", toSI: 1, siUnit: "" },
    { key: "optimumEnergy", label: "Largest pulse energy at the optimum", unit: "mJ", toSI: 1e-3, siUnit: "J" },
    { key: "optimumWidthEstimate", label: "Width at the optimum (estimate E/P_p)", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "optimumPeakPower", label: "Peak power at the optimum", unit: "kW", toSI: 1e3, siUnit: "W" },
  ],
  compute(p) {
    const shape = SHAPES[p.shape] ?? "gaussian";
    const fixedGain = p.pump === "gain";
    const pk = peakPower(p.pulseEnergy, p.pulseWidth, shape);
    const op = qSwitchedLaser({
      fixedGain, g0l: p.g0l, ratio: p.inversionRatio, lambda: p.wavelength, sigma: p.sigma, modeDiameter: p.modeDiameter,
      R_oc: p.R_oc, internalLoss: p.internalLoss, cavityLength: p.cavityLength, rodLength: p.rodLength, n: p.n_rod,
    });
    const warnings: string[] = [];
    if (fixedGain && !(op.r > 1)) {
      warnings.push(`Below threshold: r = g₀l/γ = ${op.r.toPrecision(4)}. Raise g₀l above the single-pass loss γ = ${op.gamma.toPrecision(4)} or raise R.`);
    }
    if (op.r > 50) {
      warnings.push(`r = ${op.r.toPrecision(4)} is above 50: the pulse shape and its FWHM are not integrated; only the estimate E/P_p is given.`);
    }
    if (!(op.gammaI > 0)) warnings.push("No optimum without internal loss: the energy keeps rising as R → 0.");
    else if (!(op.g0l > op.gammaI)) warnings.push("No lasing at any coupling: g₀l must exceed the internal loss γ_i.");
    else if (op.opt.reflectance < 0.01) {
      warnings.push("The optimum R is below the 0.01 the input accepts; there the mean-field (uniform-intensity) model is poor anyway.");
    }
    if (1 / p.repRate < 230e-6) {
      warnings.push("The pulse period 1/f is shorter than a typical Nd:YAG upper-state lifetime (230 µs): the inversion does not recover between pulses, so r and E fall at high rates.");
    }
    return {
      values: {
        measuredPeakPower: pk,
        averagePower: p.pulseEnergy * p.repRate,
        dutyCycle: p.pulseWidth * p.repRate,
        inversionRatioUsed: op.r,
        smallSignalGain: op.g0l,
        photonLifetime: op.tauC,
        pulseEnergy: op.pulse.energy,
        extraction: op.pulse.extraction,
        fluence: op.fluence,
        cavityPeakPower: op.pulse.peak,
        pulseWidthFwhm: op.fwhm,
        pulseWidthEstimate: op.pulse.widthEstimate,
        optimumReflectance: op.opt.reflectance,
        optimumEnergy: op.opt.energy,
        optimumWidthEstimate: op.optPulse.widthEstimate,
        optimumPeakPower: op.optPulse.peak,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults, measured pulse: P_pk = 2√(ln2/π) E/τ = 0.939437 · 1 mJ/10 ns = 93.943728 kW; E f = 1 mJ · 10 kHz = 10 W; τ f = 10 ns · 10 kHz = 1e-4 = 0.01 %.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: { measuredPeakPower: 93.94372786996513, averagePower: 10, dutyCycle: 0.01 },
      tolerance: 1e-8,
    },
    {
      // Defaults, cavity: γ_i = −ln 0.98, γ₂ = −ln 0.7, γ = γ_i + γ₂/2 = 0.1985402, g₀l = rγ = 0.5956205, L_e = 300 + 0.82 · 50 = 341 mm,
      // τ_c = L_e/(cγ) = 5.729085 ns; η from rη = −ln(1 − η) at r = 3 (bisection): 94.047979 %; A = π(0.5 mm)², hν = hc/1064 nm;
      // E = (γ₂/2)(hνA/σ) rη = 2.634998 mJ, fluence E/A = 0.3354984 J/cm², P_p = (γ₂/2)(hνA/σ)(r − 1 − ln r)/τ_c = 146.938610 kW, E/P_p = 17.932645 ns.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        inversionRatioUsed: 3, smallSignalGain: 0.595620537860657, photonLifetime: 5.729085007937391, pulseEnergy: 2.6349979573249227,
        extraction: 94.04797907073596, fluence: 0.3354983599562468, cavityPeakPower: 146.93860995583347,
        pulseWidthEstimate: 17.932645191872616,
      },
      tolerance: 1e-8,
    },
    {
      // Degnan optimum at the default g₀l: z = g₀l/γ_i = 29.482214, z − 1 − ln z = 25.0903, ln(1/R_opt) = 2γ_i(z − 1 − ln z)/ln z, R_opt = 0.7410424,
      // E_max = (hνA/2σ) 2γ_i(z − 1 − ln z) = 2.655358 mJ; pulse at that coupling: r = g₀l/(γ_i + γ₂/2) = 3.502591, E/P_p = 18.120220 ns, P_p = 146.541135 kW.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: { optimumReflectance: 0.7410423992089924, optimumEnergy: 2.6553576543538657, optimumWidthEstimate: 18.120220345957623, optimumPeakPower: 146.5411349120951 },
      tolerance: 1e-8,
    },
  ],
});
