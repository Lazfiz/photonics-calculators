import { BOXCAR_BAND_LIMIT_BF, boxcarSummary } from "../../physics/detectors/boxcar";
import { defineSchema } from "../types";

const PAPOULIS = "Papoulis A., Pillai S. U. (2002). Probability, Random Variables and Stochastic Processes, 4th ed. McGraw-Hill: " +
  "variance of the time average of a stationary process, Var = (2/T)∫₀ᵀ(1 − u/T)R(u)du, with the single-pole input noise " +
  "R(u) = e_n²·B·exp(−4B|u|); gate average of a Gaussian pulse from ∫exp(−t²/2σ²)dt = σ√(π/2)·erf(t/σ√2), FWHM = 2√(2 ln 2)·σ.";

export default defineSchema({
  href: "/detectors/boxcar-integrator",
  inputs: [
    { key: "gateWidth", label: "Gate width", unit: "ns", toSI: 1e-9, siUnit: "s", default: 100, min: 0.01, max: 1e9 },
    { key: "pulseWidth", label: "Pulse width FWHM", unit: "ns", toSI: 1e-9, siUnit: "s", default: 500, min: 0.01, max: 1e9 },
    { key: "gateDelay", label: "Gate delay from the pulse peak", unit: "ns", toSI: 1e-9, siUnit: "s", default: 0, min: -1e9, max: 1e9 },
    { key: "signalPeak", label: "Signal peak", unit: "mV", toSI: 1e-3, siUnit: "V", default: 1, min: 0, max: 1e6 },
    { key: "noiseDensity", label: "Noise density", unit: "nV/√Hz", toSI: 1e-9, siUnit: "V/√Hz", default: 100, min: 0, max: 1e9 },
    { key: "inputBandwidth", label: "Input noise bandwidth", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 100, min: 1e-6, max: 1e6 },
    { key: "repRate", label: "Repetition rate", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1000, min: 1e-3, max: 1e9 },
    { key: "averages", label: "Averages N", unit: "", toSI: 1, siUnit: "", default: 100, min: 1, max: 1e9 },
  ],
  outputs: [
    { key: "gateSignal", label: "Gate-averaged signal", unit: "mV", toSI: 1e-3, siUnit: "V" },
    { key: "gateNoise", label: "Gate noise (rms)", unit: "µV", toSI: 1e-6, siUnit: "V" },
    { key: "inputNoise", label: "Input noise (rms)", unit: "mV", toSI: 1e-3, siUnit: "V" },
    { key: "snrSingle", label: "Single-shot SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "snrAveraged", label: "SNR after N averages", unit: "", toSI: 1, siUnit: "" },
    { key: "measureTime", label: "Measurement time N / f_rep", unit: "s", toSI: 1, siUnit: "s" },
    { key: "neb", label: "Gate noise-equivalent bandwidth 1/(2T)", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "optimalGate", label: "Optimum centred gate width", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "optimalGateRatio", label: "Optimum gate / FWHM", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ gateWidth, pulseWidth, gateDelay, signalPeak, noiseDensity, inputBandwidth, repRate, averages }) {
    const r = boxcarSummary({
      gateWidth, fwhm: pulseWidth, gateDelay, signalPeak, noiseDensity, inputBandwidth, repRate, averages: Math.round(averages),
    });
    const warnings: string[] = [];
    if (r.bandLimited) {
      warnings.push(`B·FWHM = ${(inputBandwidth * pulseWidth).toPrecision(3)} < ${BOXCAR_BAND_LIMIT_BF}: a real input this slow would also smear the pulse, ` +
        "which this model does not do (only the noise is band-limited), so the SNR and the short optimum gate are optimistic.");
    }
    const reasons: Record<string, string> = {};
    if (!(noiseDensity > 0)) {
      reasons.snrSingle = "The noise density is 0, so the gate noise is 0 and the SNR is unbounded.";
      reasons.snrAveraged = reasons.snrSingle;
    }
    return {
      values: {
        gateSignal: r.gateSignal, gateNoise: r.gateNoise, inputNoise: r.inputNoise, snrSingle: r.snrSingle, snrAveraged: r.snrAveraged,
        measureTime: r.measureTime, neb: r.neb, optimalGate: r.optimalGate, optimalGateRatio: r.optimalGateRatio,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Page defaults: sigma = 500 ns/2.354820 = 212.3 ns; erf series for +-50 ns gives <s> = 0.99083441 mV; x = 4*B*T = 40, bracket 1 + (e^-40 - 1)/40;
      // sigma_gate = 100 nV/sqrt(Hz)*sqrt(1e8*(2/40)*0.975) = 220.794022 uV; SNR = 4.48759617, x sqrt(100) = 44.8759617; NEB = 1/(2*100 ns) = 5 MHz; N/f = 0.1 s.
      source: PAPOULIS,
      basis: "computed",
      inputs: {},
      expect: {
        gateSignal: 0.9908344053320838, gateNoise: 220.79402165819614, inputNoise: 1, snrSingle: 4.487596167191345,
        snrAveraged: 44.87596167191345, measureTime: 0.1, neb: 5e6,
      },
      tolerance: 1e-8,
    },
    {
      // T = 50 ns, FWHM = 200 ns, delay 80 ns, S = 2 mV, e_n = 50 nV/sqrt(Hz), B = 20 MHz, N = 400, f = 500 Hz: x = 4*B*T = 4;
      // erf-series gate average 1.28121478 mV, gate noise 50 nV*sqrt(2e7*(2/4)*(1 + (e^-4 - 1)/4)) = 137.347999 uV; SNR 9.32823771, x20 = 186.564754;
      // input noise 50 nV*sqrt(2e7) = 0.2236068 mV; NEB 10 MHz; 400/500 = 0.8 s.
      source: PAPOULIS,
      basis: "computed",
      inputs: { gateWidth: 50, pulseWidth: 200, gateDelay: 80, signalPeak: 2, noiseDensity: 50, inputBandwidth: 20, repRate: 500, averages: 400 },
      expect: {
        gateSignal: 1.281214780091411, gateNoise: 137.34799868601866, inputNoise: 0.22360679774997898, snrSingle: 9.32823770530726,
        snrAveraged: 186.5647541061452, measureTime: 0.8, neb: 1e7,
      },
      tolerance: 1e-8,
    },
    {
      // Optimum centred gate at the defaults (FWHM 500 ns, B = 100 MHz): maximiser of SNR(T) = <s>(T)/sigma_gate(T) by an independent ternary search
      // on ln T gives T = 592.795039 ns = 1.185590 x FWHM. Tolerance 1e-6: the SNR is flat at its maximum, so a maximiser is only
      // defined to about the square root of machine epsilon.
      source: PAPOULIS,
      basis: "computed",
      inputs: {},
      expect: { optimalGate: 592.7950392040161, optimalGateRatio: 1.1855900784080322 },
      tolerance: 1e-6,
    },
  ],
});
