import { DOPANT_PRESETS } from "../../physics/fiber-optics/doped-fiber-gain";
import { ASE_WARNING_GAIN_DB, rareEarthSpec, rareEarthSummary } from "../../physics/fiber-optics/rare-earth-doped";
import { defineSchema } from "../types";

const GILES = "Giles C. R., Desurvire E. (1991). Modeling erbium-doped fiber amplifiers. Journal of Lightwave Technology 9, 271–283. " +
  "https://doi.org/10.1109/50.65886 (two-level rate equations, eqs. (6)–(9); intrinsic saturation power hνA/(Γ(σ_a + σ_e)τ)), solved in closed form by " +
  "Saleh A. A. M., Jopson R. M., Evankow J. D., Aspell J. (1990). Modeling of gain in erbium-doped fiber amplifiers. IEEE Photonics Technology Letters 2, 714–717. https://doi.org/10.1109/68.60769.";

const NOT_GUIDED = "V is below 0.5 at the pump or signal, or n₁ ≤ n₂: the mode is barely guided and the LP01 overlap is not defined.";
const NO_ABSORPTION = "The pump cross-section σ_a is 0, so the pump is not absorbed and there is no 90 % absorption length.";
const NO_PUMP_SATURATION = "The pump cross-sections σ_a and σ_e are both 0, so the pump has no saturation power.";
const NO_SIGNAL_SATURATION = "The signal cross-sections σ_a and σ_e are both 0, so the signal has no saturation power.";
const GAIN_ABSORBED = "The signal is absorbed to zero power (below the floating-point range): the gain is −∞ dB.";
const NF_ABSORBED = "The signal is absorbed to below 1e-300 of its input power, so the noise figure (1 + 2n_ASE)/G is undefined.";

export default defineSchema({
  href: "/fiber-optics/rare-earth-doped",
  choices: [
    {
      key: "dopant",
      label: "Dopant (two-level model)",
      options: DOPANT_PRESETS.map((d) => ({ value: d.id as string, label: d.name })),
      default: "Er",
    },
  ],
  inputs: [
    { key: "dopantConcentration", label: "Ion concentration", unit: "wt-ppm", toSI: 1, siUnit: "wt-ppm", default: 1000, min: 1, max: 50000 },
    { key: "fiberLength", label: "Fibre length", unit: "m", toSI: 1, siUnit: "m", default: 3, min: 0.01, max: 200 },
    { key: "coreRadius", label: "Core radius (doped to the edge)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1.6, min: 0.5, max: 20 },
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.474, min: 1.3, max: 2 },
    { key: "claddingIndex", label: "Cladding index n₂ (limited to n₁)", unit: "", toSI: 1, siUnit: "", default: 1.457, min: 1.3, max: 2 },
    { key: "pumpPower", label: "Pump power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 200, min: 0, max: 5000 },
    { key: "signalPower", label: "Input signal power", unit: "dBm", toSI: 1, siUnit: "dBm", default: -30, min: -60, max: 20 },
    { key: "pumpWavelength", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 980, min: 400, max: 2200 },
    { key: "signalWavelength", label: "Signal wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2200 },
    { key: "sigmaAPump", label: "Pump absorption cross-section σ_a", unit: "×1e-25 m²", toSI: 1e-25, siUnit: "m²", default: 1.7, min: 0, max: 1000 },
    { key: "sigmaEPump", label: "Pump emission cross-section σ_e", unit: "×1e-25 m²", toSI: 1e-25, siUnit: "m²", default: 0, min: 0, max: 1000 },
    { key: "sigmaASignal", label: "Signal absorption cross-section σ_a", unit: "×1e-25 m²", toSI: 1e-25, siUnit: "m²", default: 2.2, min: 0, max: 1000 },
    { key: "sigmaESignal", label: "Signal emission cross-section σ_e", unit: "×1e-25 m²", toSI: 1e-25, siUnit: "m²", default: 3, min: 0, max: 1000 },
    { key: "tau", label: "Upper-state lifetime τ", unit: "ms", toSI: 1e-3, siUnit: "s", default: 10.2, min: 0.01, max: 100 },
  ],
  outputs: [
    { key: "ionDensity", label: "Ion density N", unit: "1/m³", toSI: 1, siUnit: "1/m³" },
    { key: "NA", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "" },
    { key: "V", label: "V-number at the signal", unit: "", toSI: 1, siUnit: "" },
    { key: "cutoff", label: "LP11 cutoff wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "overlapPump", label: "Pump overlap Γ_p", unit: "", toSI: 1, siUnit: "" },
    { key: "overlapSignal", label: "Signal overlap Γ_s", unit: "", toSI: 1, siUnit: "" },
    { key: "pumpAbsorption", label: "Pump absorption", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "signalAbsorption", label: "Unpumped signal absorption", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "absorptionLength90", label: "Length absorbing 90 % of the pump (small-signal)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "saturationSignal", label: "Saturation power at the signal", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "saturationPump", label: "Saturation power at the pump", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "fullInversionGain", label: "Full-inversion gain bound", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "gain", label: "Signal gain", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "noiseFigure", label: "Noise figure", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute(i) {
    const spec = rareEarthSpec({
      dopant: i.dopant, ppm: i.dopantConcentration, L: i.fiberLength, a: i.coreRadius, n1: i.coreIndex, n2: i.claddingIndex,
      pump: i.pumpPower, signalDbm: i.signalPower, lp: i.pumpWavelength, ls: i.signalWavelength,
      sigmaAPump: i.sigmaAPump, sigmaEPump: i.sigmaEPump, sigmaASignal: i.sigmaASignal, sigmaESignal: i.sigmaESignal, tau: i.tau,
    });
    const s = rareEarthSummary(spec);
    const guided = Number.isFinite(s.gp) && Number.isFinite(s.gs);
    const warnings: string[] = [];
    if (!guided) warnings.push(NOT_GUIDED);
    else if (Number.isFinite(s.gain) && s.gain > ASE_WARNING_GAIN_DB) {
      warnings.push(`Above ≈ ${ASE_WARNING_GAIN_DB} dB, amplified spontaneous emission (not modelled) would saturate the gain; real EDFAs stay lower.`);
    }
    return {
      values: {
        ionDensity: s.N, NA: s.NA, V: s.V, cutoff: s.cutoff, overlapPump: s.gp, overlapSignal: s.gs,
        pumpAbsorption: s.alphaP, signalAbsorption: s.alphaS, absorptionLength90: s.L90,
        saturationSignal: s.pSatS, saturationPump: s.pSatP, fullInversionGain: s.fullInv, gain: s.gain, noiseFigure: s.nf,
      },
      warnings,
      reasons: guided
        ? {
            absorptionLength90: NO_ABSORPTION, saturationSignal: NO_SIGNAL_SATURATION, saturationPump: NO_PUMP_SATURATION,
            ...(Number.isFinite(s.gain) ? {} : { gain: GAIN_ABSORBED }),
            ...(Number.isFinite(s.nf) ? {} : { noiseFigure: NF_ABSORBED }),
          }
        : {
            V: NOT_GUIDED, cutoff: NOT_GUIDED, overlapPump: NOT_GUIDED, overlapSignal: NOT_GUIDED, pumpAbsorption: NOT_GUIDED,
            signalAbsorption: NOT_GUIDED, absorptionLength90: NOT_GUIDED, saturationSignal: NOT_GUIDED, saturationPump: NOT_GUIDED,
            fullInversionGain: NOT_GUIDED, gain: NOT_GUIDED, noiseFigure: NOT_GUIDED,
          },
    };
  },
  checks: [
    {
      // Defaults (Er, 1000 wt-ppm, 3 m, a = 1.6 µm, n₁ 1.474, n₂ 1.457, 200 mW at 980 nm, −30 dBm at 1550 nm), own Bessel/K integrals and bisection:
      // N = 1000e-6·2201·N_A/0.167259 = 7.92467479e24 /m³; NA = √(n₁² − n₂²) = 0.223219623; V(1550) = 1.44777317; λc = 2π a NA/2.40482556 = 933.143944 nm;
      // Γ_p = 0.807376314, Γ_s = 0.508859693; α_p = 4.3429448·Γ_p σ_a N = 4.72379113 dB/m, α_s = 3.85288896 dB/m, L90 = 10/α_p = 2.11694373 m;
      // P_sat = hνA/(Γ(σ_a + σ_e)τ), A = π a²: signal 0.381885620 mW, pump 1.16443539 mW; full inversion 4.3429448·Γ_s σ_e N L = 15.7618185 dB;
      // gain 15.5998019 dB and NF 2.96858850 dB from RK4 (20000 steps) of dQ/dz = ((α+g)n − α)Q with n = ΣαQ/(ζ + Σ(α+g)Q), ζ = N·A/τ, NF = (1 + 2n_ASE)/G.
      source: GILES,
      basis: "computed",
      inputs: {},
      expect: {
        ionDensity: 7.924674793440115e24, NA: 0.22321962279333693, V: 1.4477731656353696, cutoff: 933.1439444967468,
        overlapPump: 0.8073763142710941, overlapSignal: 0.5088596930510234, pumpAbsorption: 4.723791128582694,
        signalAbsorption: 3.852888959202953, absorptionLength90: 2.116943727569165, saturationSignal: 0.3818856199691147,
        saturationPump: 1.1644353921461055, fullInversionGain: 15.761818469466625, gain: 15.599801856964447, noiseFigure: 2.968588499776055,
      },
      tolerance: 1e-8,
    },
    {
      // Yb: 500 wt-ppm (M = 0.173045 kg/mol), 2 m, a = 3 µm, n₁ 1.46, n₂ 1.4555, 500 mW at 976 nm, −10 dBm at 1064 nm, σ_a/σ_e pump 26.9/29.7e-25 m²,
      // signal 0.057/3.1e-25 m², τ = 0.83 ms. N = 3.82985114e24 /m³; NA = 0.114541477; V(1064) = 2.02918795; λc = 897.801495 nm; Γ_p = 0.791936760, Γ_s = 0.748658114;
      // α_p = 35.4330868 dB/m, α_s = 0.0709781371 dB/m, L90 = 0.282222095 m; P_sat signal 26.9086108 mW, pump 1.54680038 mW; full inversion 7.72042895 dB;
      // gain 3.58286982 dB, NF 2.00079730 dB (same RK4 solution).
      source: GILES,
      basis: "computed",
      inputs: {
        dopant: "Yb", dopantConcentration: 500, fiberLength: 2, coreRadius: 3, coreIndex: 1.46, claddingIndex: 1.4555, pumpPower: 500,
        signalPower: -10, pumpWavelength: 976, signalWavelength: 1064, sigmaAPump: 26.9, sigmaEPump: 29.7, sigmaASignal: 0.057,
        sigmaESignal: 3.1, tau: 0.83,
      },
      expect: {
        ionDensity: 3.829851140674391e24, NA: 0.114541477203673, V: 2.0291879510209503, cutoff: 897.8014945728661,
        overlapPump: 0.7919367604355471, overlapSignal: 0.7486581138065418, pumpAbsorption: 35.43308679479714,
        signalAbsorption: 0.07097813712600048, absorptionLength90: 0.28222209535152215, saturationSignal: 26.90861075826317,
        saturationPump: 1.5468003817166553, fullInversionGain: 7.720428950547422, gain: 3.582869824422345, noiseFigure: 2.000797304724957,
      },
      tolerance: 1e-8,
    },
  ],
});
