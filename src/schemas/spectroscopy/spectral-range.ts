import { anamorphicMagnification, overlapFreeLimit, spectrometerRange } from "../../physics/spectroscopy/spectral-resolution";
import { defineSchema } from "../types";

const PALMER = "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., Newport Corporation (Richardson Optics), ch. 2: " +
  "grating equation mλ = d(sin α + sin β), reciprocal linear dispersion d cos β/(m f), anamorphic magnification cos α/cos β, " +
  "resolving power mN; the detector edges see β₀ ± atan(W/2f); the resolution is the largest of the slit, two-pixel and diffraction terms.";

const DEG = Math.PI / 180;

export default defineSchema({
  href: "/spectroscopy/spectral-range",
  inputs: [
    { key: "grooveDensity", label: "Groove density", unit: "lines/mm", toSI: 1e3, siUnit: "1/m", default: 1200, min: 10, max: 6000 },
    { key: "order", label: "Diffraction order m", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 10 },
    { key: "centreWL", label: "Centre wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 500, min: 100, max: 20000 },
    { key: "deviation", label: "Deviation angle α − β (0 = Littrow)", unit: "°", toSI: DEG, siUnit: "rad", default: 30, min: 0, max: 90 },
    { key: "focalLength", label: "Focal length (collimator = camera)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: 10, max: 5000 },
    { key: "detectorWidth", label: "Detector width", unit: "mm", toSI: 1e-3, siUnit: "m", default: 25.6, min: 0.1, max: 200 },
    { key: "detectorPixels", label: "Detector pixels", unit: "", toSI: 1, siUnit: "", default: 2048, min: 16, max: 20000 },
    { key: "slitWidth", label: "Slit width", unit: "µm", toSI: 1e-6, siUnit: "m", default: 25, min: 1, max: 5000 },
    { key: "gratingWidth", label: "Illuminated grating width", unit: "mm", toSI: 1e-3, siUnit: "m", default: 25, min: 1, max: 1000 },
  ],
  outputs: [
    { key: "lambdaLow", label: "λ at the short edge of the detector", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "lambdaHigh", label: "λ at the long edge of the detector", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "range", label: "Spectral range", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "reciprocalDispersion", label: "Reciprocal dispersion at the centre", unit: "nm/mm", toSI: 1e-6, siUnit: "m/m" },
    { key: "incidence", label: "Incidence angle α", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "diffraction", label: "Diffraction angle β₀ at the detector centre", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "anamorphic", label: "Anamorphic magnification r = cos α/cos β₀", unit: "", toSI: 1, siUnit: "" },
    { key: "resolution", label: "Resolution δλ at the centre", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "resolvingPower", label: "Resolving power λ/δλ", unit: "", toSI: 1, siUnit: "" },
    { key: "slitLimit", label: "Slit-limited bandpass", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "pixelLimit", label: "Two-pixel limit", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "diffractionLimit", label: "Diffraction limit", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute(si) {
    const order = Math.round(si.order);
    const d = 1 / si.grooveDensity;
    const s = spectrometerRange(
      si.centreWL, d, order, si.deviation, si.detectorWidth, si.focalLength, Math.round(si.detectorPixels), si.slitWidth, si.gratingWidth,
    );
    const { cov } = s;
    const nm = (m: number) => (m * 1e9).toPrecision(4);
    const warnings: string[] = [];
    if (!Number.isFinite(cov.incidence)) {
      warnings.push("The grating cannot send the centre wavelength to the detector centre in this order (mλ must stay below d(1 + cos D_v)); use fewer lines/mm, a lower order or a smaller deviation angle.");
    } else {
      if (!Number.isFinite(cov.lambdaLow)) warnings.push(`The short-wavelength edge lies beyond the zero order: the zero order and order ${order + 1} fall on the detector.`);
      if (!Number.isFinite(cov.lambdaHigh)) warnings.push("The long-wavelength edge lies past grazing diffraction (β ≥ 90°).");
      if (order >= 2 && Number.isFinite(cov.lambdaLow) && Number.isFinite(cov.lambdaHigh)) {
        warnings.push(`Order ${order - 1} also lands on the detector (${nm((cov.lambdaLow * order) / (order - 1))}–${nm((cov.lambdaHigh * order) / (order - 1))} nm); block it with a short-pass filter.`);
      }
      if (Number.isFinite(cov.lambdaHigh) && cov.lambdaHigh > overlapFreeLimit(cov.lambdaLow, order)) {
        warnings.push(`Order overlap: above ${nm(overlapFreeLimit(cov.lambdaLow, order))} nm the detector also sees order ${order + 1}; use an order-sorting filter.`);
      }
    }
    return {
      values: {
        lambdaLow: cov.lambdaLow, lambdaHigh: cov.lambdaHigh, range: s.range, reciprocalDispersion: s.recip,
        incidence: cov.incidence, diffraction: cov.beta0, anamorphic: anamorphicMagnification(cov.incidence, cov.beta0),
        resolution: s.resolution, resolvingPower: si.centreWL / s.resolution,
        slitLimit: s.slitLimit, pixelLimit: s.pixelLimit, diffractionLimit: s.diffLimit,
      },
      warnings,
    };
  },
  checks: [
    {
      // Littrow (D_v = 0), m = 1, λ_c = 500 nm, d = 1/1200 mm = 833.333 nm: sin α = mλ/2d = 0.3 exactly, α = β₀ = 17.4576031°, r = 1.
      // Reciprocal dispersion d cos β₀/(m f) = 833.333 nm · 0.953939/0.1 m = 7.94949 nm/mm; slit limit w d cos α/(m f) =
      // 25 µm · 7.94949 nm/mm = 0.198737 nm; the two-pixel limit 2 · (25.6 mm/2048) · 7.94949 nm/mm equals it.
      source: PALMER,
      basis: "computed",
      inputs: { deviation: 0 },
      expect: { incidence: 17.457603123722095, diffraction: 17.457603123722095, anamorphic: 1, reciprocalDispersion: 7.949493345141213, slitLimit: 0.19873733362853035 },
      tolerance: 1e-8,
    },
    {
      // Page defaults (D_v = 30°): ψ = asin(500/(2 · 833.333 · cos 15°)) = 18.0944°, α = ψ + 15° = 33.0944°, β₀ = 3.0944°;
      // edges at β₀ ± atan(12.8/100): 393.987 and 605.285 nm; range 211.298 nm; r = cos α/cos β₀ = 0.838996;
      // two-pixel limit 0.208030 nm exceeds the slit limit 0.174536 nm (25 µm · d cos α/(m f)) and the diffraction limit
      // λ/(mN) = 0.0166667 nm (N = 25 mm · 1200/mm = 30000).
      source: PALMER,
      basis: "computed",
      inputs: {},
      expect: {
        incidence: 33.09435948798007, diffraction: 3.0943594879800704, lambdaLow: 393.9867766398891, lambdaHigh: 605.2851439696296,
        range: 211.29836732974056, resolution: 0.20802958110492847, slitLimit: 0.17453593205103815, diffractionLimit: 0.016666666666666666,
        anamorphic: 0.8389957386060573,
      },
      tolerance: 1e-8,
    },
  ],
});
