import { wienerRestorationSummary } from "../../physics/imaging/deconvolution";
import { defineSchema } from "../types";

const GOODMAN = "Goodman J. W. (2005). Introduction to Fourier Optics, 3rd ed., Roberts & Company, §6.3 " +
  "(incoherent cutoff 2NA/λ; diffraction-limited MTF of a circular pupil).";
const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, " +
  "https://doi.org/10.1017/9781108769914, §8.5.2 (Rayleigh distance: the first zero of the Airy pattern at 0.6098 λ/NA, rounded to 0.61).";
const GONZALEZ = "Gonzalez R. C., Woods R. E. (2018). Digital Image Processing, 4th ed., Pearson, §5.8 " +
  "(Wiener filter H*/(|H|² + K) with a constant noise-to-signal ratio K).";

export default defineSchema({
  href: "/imaging/deconvolution",
  inputs: [
    { key: "na", label: "Numerical aperture NA", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 0.1, max: 1.7 },
    { key: "wavelengthNm", label: "Emission wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
    { key: "snrInput", label: "Signal-to-noise power ratio per frequency", unit: "dB", toSI: 1, siUnit: "dB", default: 30, min: 0, max: 80 },
  ],
  outputs: [
    { key: "cutoff", label: "OTF cutoff f_c = 2NA/λ", unit: "lp/µm", toSI: 1e6, siUnit: "1/m" },
    { key: "passbandPeriod", label: "Finest period passed, λ/(2NA)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "rayleighDistance", label: "Rayleigh distance 0.61λ/NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "nsr", label: "Noise-to-signal power ratio NSR", unit: "", toSI: 1, siUnit: "" },
    { key: "nuHalf", label: "Normalised frequency where H = √NSR (restored ½)", unit: "", toSI: 1, siUnit: "" },
    { key: "restoredPeriod", label: "Finest period restored to ½", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "peakGain", label: "Largest filter gain 1/(2√NSR)", unit: "×", toSI: 1, siUnit: "" },
  ],
  compute({ na, wavelengthNm, snrInput }) {
    const s = wienerRestorationSummary(na, wavelengthNm, snrInput);
    const noRestore = "At 0 dB the noise-to-signal ratio is 1, so the restored transfer H²/(H² + NSR) reaches ½ only at zero frequency: no finest period is restored.";
    return {
      values: { ...s, restoredPeriod: s.nuHalf > 0 ? s.restoredPeriod : NaN },
      reasons: { restoredPeriod: noRestore },
    };
  },
  checks: [
    {
      // NA 1.4, λ = 550 nm: f_c = 2·1.4/550e-9 = 5.090909e6 m⁻¹; period λ/(2NA) = 196.42857 nm.
      source: GOODMAN,
      basis: "computed",
      inputs: { na: 1.4, wavelengthNm: 550 },
      expect: { cutoff: 5.0909090909, passbandPeriod: 196.42857143 },
      tolerance: 1e-8,
    },
    {
      // Rayleigh distance 0.61·550/1.4 = 239.64286 nm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { na: 1.4, wavelengthNm: 550 },
      expect: { rayleighDistance: 239.64285714 },
      tolerance: 1e-8,
    },
    {
      // 30 dB: NSR = 1e-3, gain 1/(2√1e-3) = 15.811388; H(ν) = (2/π)(acos ν − ν√(1−ν²)) = √NSR = 0.0316228 at ν = 0.9106594
      // (bisection), so the restored period is 196.42857/0.9106594 = 215.69928 nm.
      source: GONZALEZ,
      basis: "computed",
      inputs: { na: 1.4, wavelengthNm: 550, snrInput: 30 },
      expect: { nsr: 0.001, peakGain: 15.811388301, nuHalf: 0.91065938487, restoredPeriod: 215.69927756 },
      tolerance: 1e-8,
    },
  ],
});
