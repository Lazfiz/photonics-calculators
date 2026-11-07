import {
  FTIR_APODIZATIONS, FTIR_APODIZATION_NAMES, ilsFwhm, ilsHighestSidelobe, modulationFrequency, nominalResolution, scanTime,
  singleSidedPoints, type FtirApodization,
} from "../../physics/spectroscopy/ftir";
import { defineSchema } from "../types";

const GRIFFITHS = "Griffiths P. R., de Haseth J. A. (2007). Fourier Transform Infrared Spectrometry, 2nd ed., ch. 2 " +
  "(boxcar ILS 2L sinc(2πσL), FWHM 1.207/(2L), first sidelobe −22 %). Wiley.";

export default defineSchema({
  href: "/spectroscopy/ftir-resolution",
  choices: [
    {
      key: "apodization",
      label: "Apodization",
      options: FTIR_APODIZATION_NAMES.map((name) => ({ value: name, label: FTIR_APODIZATIONS[name].label })),
      default: "boxcar",
    },
  ],
  inputs: [
    { key: "maxOPD", label: "Maximum OPD L", unit: "cm", toSI: 1e-2, siUnit: "m", default: 1.0, min: 0.001, max: 500 },
    { key: "spectralRange", label: "Highest wavenumber σ_max (Nyquist)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 4000, min: 100, max: 20000 },
    { key: "mirrorVelocity", label: "Moving-mirror speed v", unit: "cm/s", toSI: 1e-2, siUnit: "m/s", default: 1.0, min: 0.001, max: 10 },
  ],
  outputs: [
    { key: "nominalResolution", label: "Nominal resolution 1/L", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "ilsFwhm", label: "Instrument line shape FWHM (apodized)", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "fwhmRatio", label: "ILS FWHM relative to boxcar", unit: "", toSI: 1, siUnit: "" },
    { key: "sidelobe", label: "Largest ILS sidelobe, signed, relative to the peak", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "points", label: "Points in a single-sided scan 2Lσ_max", unit: "", toSI: 1, siUnit: "" },
    { key: "sampleStep", label: "Sampling step Δx = 1/(2σ_max)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "scanTime", label: "Scan time L/(2v)", unit: "s", toSI: 1, siUnit: "s" },
    { key: "modulationFrequency", label: "Modulation frequency at σ_max, 2vσ_max", unit: "kHz", toSI: 1e3, siUnit: "Hz" },
  ],
  // The module's relations hold in any coherent units; here they get SI (m, m⁻¹, m/s).
  compute({ apodization, maxOPD, spectralRange, mirrorVelocity }) {
    const apod = apodization as FtirApodization;
    return {
      values: {
        nominalResolution: nominalResolution(maxOPD),
        ilsFwhm: ilsFwhm(apod) / maxOPD,
        fwhmRatio: ilsFwhm(apod) / ilsFwhm("boxcar"),
        sidelobe: ilsHighestSidelobe(apod),
        points: singleSidedPoints(maxOPD, spectralRange),
        sampleStep: 1 / (2 * spectralRange),
        scanTime: scanTime(maxOPD, mirrorVelocity),
        modulationFrequency: modulationFrequency(mirrorVelocity, spectralRange),
      },
    };
  },
  checks: [
    {
      // L = 1 cm, no apodization: FWHM 1.207/(2L) = 0.6035 cm⁻¹ and the sinc's first sidelobe −21.7 %.
      source: GRIFFITHS,
      basis: "printed",
      inputs: { apodization: "boxcar", maxOPD: 1 },
      expect: { ilsFwhm: 0.6035, sidelobe: -21.72 },
      tolerance: 5e-4,
    },
    {
      // Norton and Beer designed their medium window for an ILS 1.4 × as wide as the boxcar's.
      source: "Norton R. H., Beer R. (1976). New apodizing functions for Fourier spectrometry. J. Opt. Soc. Am. 66, " +
        "259–264; errata 67, 419 (1977). https://doi.org/10.1364/JOSA.66.000259",
      basis: "printed",
      inputs: { apodization: "nb-medium" },
      expect: { fwhmRatio: 1.4 },
      tolerance: 2e-4,
    },
  ],
});
