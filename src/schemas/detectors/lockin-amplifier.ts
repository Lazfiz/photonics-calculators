import { lockinSummary, type LockinFilter, type LockinReference } from "../../physics/detectors/lockin";
import { defineSchema } from "../types";

const SCOFIELD = "Scofield J. H. (1994). Frequency-domain description of a lock-in amplifier. Am. J. Phys. 62(2), 129–133, doi:10.1119/1.17629: " +
  "output X = g·(A/√2)·cos φ·|H(Δf)| for a unit-power reference (g = 1 sine, 2√2/π ±1 square), white-noise output e_n·√ENBW, " +
  "SNR_out/SNR_in = g·|cos φ|·|H(Δf)|·√(B_in/ENBW); N cascaded RC stages |H|² = (1 + (2πfτ)²)^(−N), ENBW = (1/4τ)·(2N − 3)!!/(2N − 2)!!, " +
  "Butterworth ENBW = (1/4Nτ)/sin(π/2N); a detuned output is a beat of amplitude (A/√2)·g·|H(Δf)|.";

export default defineSchema({
  href: "/detectors/lockin-amplifier",
  inputs: [
    { key: "signalFreq", label: "Signal frequency", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1000, min: 0.001, max: 1000000000 },
    { key: "refFreq", label: "Reference frequency", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1000, min: 0.001, max: 1000000000 },
    { key: "phaseShift", label: "Phase shift", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 0, min: -180, max: 180 },
    { key: "signalAmp", label: "Signal amplitude (peak)", unit: "µV", toSI: 1e-6, siUnit: "V", default: 1, min: 0, max: 1000000000 },
    { key: "noiseDensity", label: "Input noise density", unit: "nV/√Hz", toSI: 1e-9, siUnit: "V/√Hz", default: 10, min: 0.001, max: 1000000000 },
    { key: "inputBandwidth", label: "Input noise bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz", default: 100000, min: 1, max: 10000000000 },
    { key: "timeConstant", label: "Time constant τ", unit: "s", toSI: 1, siUnit: "s", default: 1, min: 0.000001, max: 100000 },
    { key: "filterOrder", label: "Filter order", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 4 },
  ],
  choices: [
    {
      key: "filter",
      label: "Output filter",
      options: [
        { value: "rc", label: "Cascaded RC stages (lock-in standard)" },
        { value: "butterworth", label: "Butterworth, f_c = 1/2πτ" },
      ],
      default: "rc",
    },
    {
      key: "reference",
      label: "Reference waveform",
      options: [
        { value: "sine", label: "Sine (DSP lock-in)" },
        { value: "square", label: "Square (analog switching)" },
      ],
      default: "sine",
    },
  ],
  outputs: [
    { key: "enbw", label: "Equivalent noise bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "detuning", label: "Detuning Δf", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "outputSignal", label: "Output X (matched) or beat amplitude", unit: "µV", toSI: 1e-6, siUnit: "V" },
    { key: "outputNoise", label: "Output noise", unit: "nV rms", toSI: 1e-9, siUnit: "V" },
    { key: "snrInput", label: "SNR in", unit: "", toSI: 1, siUnit: "" },
    { key: "snrOutput", label: "SNR out", unit: "", toSI: 1, siUnit: "" },
    { key: "snrGain", label: "SNR improvement", unit: "×", toSI: 1, siUnit: "" },
  ],
  compute({ signalFreq, refFreq, phaseShift, signalAmp, noiseDensity, inputBandwidth, timeConstant, filterOrder, filter, reference }) {
    const r = lockinSummary({
      phase_rad: phaseShift, signal_Hz: signalFreq, reference_Hz: refFreq, tau: timeConstant, order: Math.round(filterOrder),
      filter: filter as LockinFilter, reference: reference as LockinReference, inputBandwidth_Hz: inputBandwidth,
      amplitude_V: signalAmp, noiseDensity_VrtHz: noiseDensity,
    });
    return {
      values: {
        enbw: r.enbw_Hz, detuning: r.match.detuning_Hz, outputSignal: r.outputSignal_V, outputNoise: r.outputNoise_V,
        snrInput: r.snrInput, snrOutput: r.snrOutput, snrGain: r.snrGain,
      },
    };
  },
  checks: [
    {
      // Defaults: sine, matched, φ = 0, τ = 1 s, N = 1 RC: ENBW = 1/4τ = 0.25 Hz; X = (1 µV/√2)·1 = 0.70710678 µV; noise = 10 nV·√0.25 = 5 nV;
      // SNR in = (1e-6/√2)/(10e-9·√1e5) = 0.22360680; gain = √(1e5/0.25) = 632.45553; SNR out = 141.42136.
      source: SCOFIELD,
      basis: "computed",
      inputs: {},
      expect: { enbw: 0.25, outputSignal: 0.7071067811865475, outputNoise: 5, snrInput: 0.22360679774997894, snrOutput: 141.4213562373095, snrGain: 632.4555320336759 },
      tolerance: 1e-8,
    },
    {
      // Square reference g = 2√2/π, matched at f_s = f_r = 1 kHz, φ = 60°, A = 2 µV, e_n = 5 nV/√Hz, B_in = 1e4 Hz, τ = 0.1 s, Butterworth N = 2:
      // ENBW = 1/(4·2·0.1·sin(π/4)) = 1.76776695 Hz; X = (2/√2)·g·cos 60° = 2/π = 0.63661977 µV; noise = 5·√1.76776695 = 6.64786987 nV;
      // SNR in = (2e-6/√2)/(5e-9·√1e4) = 2.82842712; gain = g·cos 60°·√(1e4/1.76776695) = 33.8573232; SNR out = 95.7629714.
      source: SCOFIELD,
      basis: "computed",
      inputs: { reference: "square", filter: "butterworth", phaseShift: 60, signalAmp: 2, noiseDensity: 5, inputBandwidth: 10000, timeConstant: 0.1, filterOrder: 2 },
      expect: { enbw: 1.7677669529663689, outputSignal: 0.6366197723675815, outputNoise: 6.647869871181236, snrInput: 2.82842712474619, snrOutput: 95.76297140341931, snrGain: 33.85732323296562 },
      tolerance: 1e-8,
    },
    {
      // Sine, detuned: f_s = 1000.2 Hz, f_r = 1000 Hz (Δf = 0.2 Hz), φ = 30° (no effect on a beat), τ = 1 s, N = 3 RC, A = 1 µV, e_n = 10 nV/√Hz, B_in = 1e5 Hz:
      // ENBW = 3/(32τ) = 0.09375 Hz; |H| = (1 + (2π·0.2)²)^(−3/2) = 0.2414344; beat = 0.70710678·|H| = 0.17071570 µV; noise = 10·√0.09375 = 3.06186218 nV;
      // SNR in = 0.22360680; gain = |H|·√(1e5/0.09375) = 249.346237; SNR out = 55.7555136.
      source: SCOFIELD,
      basis: "computed",
      inputs: { signalFreq: 1000.2, phaseShift: 30, filterOrder: 3 },
      expect: { enbw: 0.09375, detuning: 0.2, outputSignal: 0.17071569840831546, outputNoise: 3.0618621784789726, snrInput: 0.22360679774997894, snrOutput: 55.75551362443137, snrGain: 249.3462371692885 },
      tolerance: 1e-8,
    },
  ],
});
