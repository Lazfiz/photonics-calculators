import { sndrSummary } from "../../physics/detectors/sndr";
import { defineSchema } from "../types";

const IEEE_1241 = "IEEE Std 1241-2010 (2011). IEEE Standard for Terminology and Test Methods for Analog-to-Digital Converters, doi:10.1109/IEEESTD.2011.5692956: " +
  "SNR = S/N, SINAD = S/(N + D) with quantisation noise added as power, 1/SINAD = 1/SQNR + (N + D)/S, ideal SQNR = 6.02·N + 1.76 dB, ENOB = (SINAD − 1.76)/6.02.";

export default defineSchema({
  href: "/detectors/sndr",
  inputs: [
    { key: "signalPower", label: "Signal power (normalised)", unit: "W", toSI: 1, siUnit: "W", default: 1, min: 1e-30, max: 1e30 },
    { key: "noisePower", label: "Noise power", unit: "W", toSI: 1, siUnit: "W", default: 1e-7, min: 0, max: 1e30 },
    { key: "distortionPower", label: "Distortion power", unit: "W", toSI: 1, siUnit: "W", default: 1e-8, min: 0, max: 1e30 },
    { key: "bits", label: "ADC bits (rounded to an integer)", unit: "bit", toSI: 1, siUnit: "bit", default: 12, min: 1, max: 24 },
  ],
  outputs: [
    { key: "snr", label: "SNR", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "sinad", label: "SINAD, analog only (no quantisation)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "sinadQuantized", label: "SINAD including quantisation", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "sdr", label: "SDR (signal / total distortion)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "thd", label: "THD (distortion / signal)", unit: "dBc", toSI: 1, siUnit: "dBc" },
    { key: "enob", label: "ENOB (SINAD including quantisation − 1.76)/6.02", unit: "bit", toSI: 1, siUnit: "bit" },
    { key: "sqnr", label: "Ideal SQNR 6.02·N + 1.76", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ signalPower, noisePower, distortionPower, bits }) {
    const r = sndrSummary({ signalPower, noisePower, distortionPower, bits });
    const reasons: Record<string, string> = {};
    if (noisePower === 0) reasons.snr = "The noise power is zero: the SNR is infinite.";
    if (noisePower + distortionPower === 0) reasons.sinad = "The noise and distortion powers are both zero: the analog SINAD is infinite.";
    if (distortionPower === 0) {
      reasons.sdr = "The distortion power is zero: the signal-to-distortion ratio is infinite.";
      reasons.thd = "The distortion power is zero: the THD is −∞ dBc.";
    }
    return {
      values: {
        snr: r.snr, sinad: r.sinad, sinadQuantized: r.sinadQuantized, sdr: r.sdr, thd: r.thd, enob: r.enob, sqnr: r.sqnr,
      },
      reasons,
    };
  },
  checks: [
    {
      // S = 1, N = 1e-4, D = 1e-5, 12 bit: SNR = 10·log₁₀(1e4) = 40 dB; SINAD = 10·log₁₀(1/1.1e-4) = 39.586073 dB; SDR = 50 dB; THD = −50 dBc;
      // SQNR = 10·log₁₀(1.5·4¹²) = 74.008112 dB; SINAD_Q = −10·log₁₀(1/(1.5·4¹²) + 1.1e-4) = 39.584505 dB; ENOB = (39.584505 − 10·log₁₀1.5)/(20·log₁₀2) = 6.282363 bit.
      source: IEEE_1241,
      basis: "computed",
      inputs: { signalPower: 1, noisePower: 1e-4, distortionPower: 1e-5, bits: 12 },
      expect: {
        snr: 40, sinad: 39.58607314841775, sinadQuantized: 39.58450458514985, sdr: 50, thd: -50, enob: 6.2823626448197665, sqnr: 74.0081115499123,
      },
      tolerance: 1e-8,
    },
    {
      // S = 2, N = 1e-3, D = 4e-4, 10 bit: SNR = 10·log₁₀(2000) = 33.0103 dB; SINAD = 10·log₁₀(2/1.4e-3) = 31.54902 dB; SDR = 10·log₁₀(5000) = 36.9897 dB; THD = −36.9897 dBc;
      // SQNR = 10·log₁₀(1.5·4¹⁰) = 61.966912 dB; SINAD_Q = −10·log₁₀(1/(1.5·4¹⁰) + 7e-4) = 31.545077 dB; ENOB = 4.947043 bit.
      source: IEEE_1241,
      basis: "computed",
      inputs: { signalPower: 2, noisePower: 1e-3, distortionPower: 4e-4, bits: 10 },
      expect: {
        snr: 33.01029995663981, sinad: 31.54901959985743, sinadQuantized: 31.545076861598535, sdr: 36.98970004336019, thd: -36.98970004336019,
        enob: 4.947042603735693, sqnr: 61.96691172335306,
      },
      tolerance: 1e-8,
    },
  ],
});
