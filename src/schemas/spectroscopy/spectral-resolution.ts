import { spectralResolutionByMode } from "../../physics/spectroscopy/spectral-resolution";
import { defineSchema } from "../types";

const PALMER = "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., Newport Corporation (Richardson Optics), ch. 2: " +
  "slit-limited bandpass w d cos α/(m f), diffraction limit λ/(mN), N = W/d illuminated grooves; for any disperser δλ_slit = w/(f dθ/dλ) " +
  "and δλ_diff = λ/(D dθ/dλ).";
const HECHT = "Hecht E. (2017). Optics, 5th ed., Pearson, §9.6.1 (Fabry-Pérot interferometer): resolution δλ ≈ FSR/ℱ, finesse ℱ = FSR/FWHM; " +
  "the exact Airy FWHM (2 FSR/π) asin(π/2ℱ) follows from T = 1/(1 + (2ℱ/π)² sin²(πΔλ/FSR)) = 1/2.";
const DEG = Math.PI / 180;

export default defineSchema({
  href: "/spectroscopy/spectral-resolution",
  inputs: [
    { key: "grooveDensity", label: "Groove density (grating)", unit: "lines/mm", toSI: 1e3, siUnit: "1/m", default: 1200, min: 10, max: 10000 },
    { key: "focalLength", label: "Focal length (grating, prism)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 500, min: 10, max: 10000 },
    { key: "slitWidth", label: "Slit width (grating, prism)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 25, min: 1, max: 10000 },
    { key: "order", label: "Diffraction order (grating)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 10 },
    { key: "gratingWL", label: "Central wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 500, min: 100, max: 100000 },
    { key: "centralAngle", label: "Incidence angle α (grating)", unit: "°", toSI: DEG, siUnit: "rad", default: 10, min: -80, max: 80 },
    { key: "gratingWidth", label: "Illuminated grating width", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: 0.1, max: 1000 },
    { key: "dispersion", label: "Prism angular dispersion dθ/dλ", unit: "rad/nm", toSI: 1e9, siUnit: "rad/m", default: 1e-4, min: 1e-7, max: 1 },
    { key: "beamWidth", label: "Beam width leaving the prism", unit: "mm", toSI: 1e-3, siUnit: "m", default: 25, min: 0.1, max: 1000 },
    { key: "finesse", label: "Finesse ℱ (Fabry-Pérot)", unit: "", toSI: 1, siUnit: "", default: 50, min: 2, max: 1e6 },
    { key: "fsrNm", label: "Free spectral range (Fabry-Pérot)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0.05, min: 1e-6, max: 1000 },
  ],
  choices: [
    {
      key: "mode", label: "Instrument type",
      options: [
        { value: "grating", label: "Diffraction grating" },
        { value: "prism", label: "Prism" },
        { value: "fabry-perot", label: "Fabry-Pérot" },
      ],
      default: "grating",
    },
  ],
  outputs: [
    { key: "resolution", label: "Spectral resolution δλ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "resolvingPower", label: "Resolving power λ/δλ", unit: "", toSI: 1, siUnit: "" },
    { key: "wavenumberResolution", label: "Resolution (wavenumber) δλ/λ²", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "slitLimit", label: "Slit-limited bandpass", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "diffractionLimit", label: "Diffraction limit", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "reciprocalDispersion", label: "Reciprocal linear dispersion", unit: "nm/mm", toSI: 1e-6, siUnit: "m/m" },
    { key: "diffractionAngle", label: "Grating diffraction angle β", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "airyFwhm", label: "Exact Airy FWHM (Fabry-Pérot)", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute(si) {
    const order = Math.round(si.order);
    const r = spectralResolutionByMode({
      mode: si.mode, lambda: si.gratingWL, slitWidth: si.slitWidth, focalLength: si.focalLength, grooveSpacing: 1 / si.grooveDensity, order,
      incidence: si.centralAngle, gratingWidth: si.gratingWidth, angularDispersion: si.dispersion, beamWidth: si.beamWidth, fsr: si.fsrNm, finesse: si.finesse,
    });
    const warnings: string[] = [];
    if (r.kind === "unreachable") {
      warnings.push(r.maxOrder >= 1
        ? `Order ${order} does not propagate at this incidence angle; the highest order is ${r.maxOrder}.`
        : "No diffracted order propagates at this wavelength; use fewer lines/mm.");
    }
    if (r.kind === "fp") warnings.push("Fabry-Pérot: the slit limit, diffraction limit, dispersion and grating angle do not apply.");
    // Exact Airy FWHM = (2 FSR/π) asin(π/(2ℱ)); no half maximum exists for ℱ < π/2 (the input range starts at 2).
    const airyFwhm = si.mode === "fabry-perot" ? ((2 * si.fsrNm) / Math.PI) * Math.asin(Math.PI / (2 * si.finesse)) : NaN;
    if (si.mode !== "fabry-perot") warnings.push("The Airy FWHM applies to the Fabry-Pérot mode only.");
    return {
      values: {
        resolution: r.res, resolvingPower: si.gratingWL / r.res, wavenumberResolution: r.res / si.gratingWL ** 2,
        slitLimit: r.slit, diffractionLimit: r.diff, reciprocalDispersion: r.recipLinear, diffractionAngle: r.beta, airyFwhm,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults (grating): d = 1/1200 mm = 833.333 nm, α = 10°, N = 50 mm · 1200/mm = 60000. Slit term w d cos α/(m f) =
      // 25 µm · 833.333 nm · 0.984808/0.5 m = 0.0410337 nm; diffraction term λ/(mN) = 500 nm/60000 = 0.00833333 nm;
      // δλ is the larger, 0.0410337 nm.
      source: PALMER,
      basis: "computed",
      inputs: {},
      expect: { resolution: 0.04103365637550867, slitLimit: 0.04103365637550867, diffractionLimit: 0.008333333333333334 },
      tolerance: 1e-8,
    },
    {
      // Prism: dθ/dλ = 1e-4 rad/nm = 1e5 rad/m. Slit w/(f dθ/dλ) = 25 µm/(0.5 m · 1e5 rad/m) = 0.5 nm; diffraction
      // λ/(D dθ/dλ) = 500 nm/(25 mm · 1e5 rad/m) = 0.2 nm; δλ = 0.5 nm, R = 1000, reciprocal dispersion 1/(f dθ/dλ) = 20 nm/mm.
      source: PALMER,
      basis: "computed",
      inputs: { mode: "prism" },
      expect: { resolution: 0.5, slitLimit: 0.5, diffractionLimit: 0.2, resolvingPower: 1000, reciprocalDispersion: 20 },
      tolerance: 1e-8,
    },
    {
      // Fabry-Pérot, FSR = 0.05 nm, ℱ = 50: δλ = FSR/ℱ = 0.001 nm, R = 500 nm/0.001 nm = 5e5; exact Airy FWHM
      // (2 · 0.05 nm/π) asin(π/100) = 0.00100016457 nm.
      source: HECHT,
      basis: "computed",
      inputs: { mode: "fabry-perot" },
      expect: { resolution: 0.001, resolvingPower: 500000, airyFwhm: 0.0010001645665064511 },
      tolerance: 1e-8,
    },
  ],
});
