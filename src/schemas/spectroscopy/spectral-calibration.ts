import { createRng, gaussian } from "../../physics/random";
import {
  czernyTurner, evalPolynomial, fitPolynomial, maxCalibrationError, pixelToWavelength, polynomialSlope, wavelengthToPixel,
} from "../../physics/spectroscopy/spectral-calibration";
import { gratingReciprocalLinearDispersion } from "../../physics/spectroscopy/spectral-resolution";
import { defineSchema } from "../types";

const PALMER = "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., Newport, ch. 2 (grating equation " +
  "mλ = d(sin α + sin β), angular and linear dispersion).";
const DEG = Math.PI / 180;
// Hg I air wavelengths in nm, the page's default list. The page's `lines` is free text; the schema offers this list and a four-line subset as the choices.
// NIST ASD, from Sansonetti, Salit & Reader (1996) Appl. Opt. 35, 74, doi:10.1364/AO.35.000074.
const HG_LINES = "404.6565, 407.7837, 435.8335, 546.0750, 576.9610, 579.0670";
const HG_FOUR = "404.6565, 435.8335, 546.0750, 576.9610"; // a subset of the same NIST lines
const DEGREES = [1, 2, 3] as const;

// The page draws centroid noise from createRng(seed) in line order; the schema does the same with the same `seed` input,
// so the fit outputs equal the page's.
export default defineSchema({
  href: "/spectroscopy/spectral-calibration",
  choices: [
    { key: "lines", label: "Calibration line wavelengths (nm, air)", options: [
      { value: HG_LINES, label: "Mercury lines (NIST)" },
      { value: HG_FOUR, label: "Four Hg lines (404.7, 435.8, 546.1, 577.0 nm)" },
    ], default: HG_LINES },
  ],
  inputs: [
    { key: "grooveDensity", label: "Groove density", unit: "lines/mm", toSI: 1e3, siUnit: "lines/m", default: 1200, min: 10, max: 6000 },
    { key: "order", label: "Diffraction order m", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 10 },
    { key: "centerWl", label: "Centre wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 500, min: 100, max: 20000 },
    { key: "deviation", label: "Deviation angle α − β₀", unit: "°", toSI: DEG, siUnit: "rad", default: 30, min: 0, max: 120 },
    { key: "focalLength", label: "Focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: 10, max: 5000 },
    { key: "pixelPitch", label: "Pixel pitch", unit: "µm", toSI: 1e-6, siUnit: "m", default: 12.5, min: 1, max: 100 },
    { key: "pixelCount", label: "Pixel count", unit: "", toSI: 1, siUnit: "", default: 2048, min: 64, max: 16384 },
    { key: "centroidNoise", label: "Line centroid noise, 1σ", unit: "px", toSI: 1, siUnit: "px", default: 0.05, min: 0, max: 5 },
    { key: "seed", label: "Noise seed", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 1000000 },
  ],
  outputs: [
    { key: "lambdaLow", label: "Detector range, pixel 0", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "lambdaHigh", label: "Detector range, last pixel", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "incidence", label: "Angle of incidence α", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "beta0", label: "Diffraction angle at the centre β₀", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "theorySlope", label: "Dispersion at centre (theory)", unit: "nm/px", toSI: 1e-9, siUnit: "m/px" },
    { key: "linearSlope", label: "Linear fit slope a in λ = a·i + b", unit: "nm/px", toSI: 1e-9, siUnit: "m/px" },
    { key: "linearIntercept", label: "Linear fit intercept b at pixel 0", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "linesOnDetector", label: "Calibration lines on the detector", unit: "", toSI: 1, siUnit: "" },
    { key: "rms1", label: "RMS residual at the lines, degree 1", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "rms2", label: "RMS residual at the lines, degree 2", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "rms3", label: "RMS residual at the lines, degree 3", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "maxError1", label: "Max |fit − true| over the detector, degree 1", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "maxError2", label: "Max |fit − true| over the detector, degree 2", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "maxError3", label: "Max |fit − true| over the detector, degree 3", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ grooveDensity, order, centerWl, deviation, focalLength, pixelPitch, pixelCount, centroidNoise, seed, lines }) {
    const lineList = lines.split(/[\s,;]+/).filter((t) => t !== "").map(Number).filter((x) => Number.isFinite(x) && x > 0);
    const m = Math.round(order);
    const pixels = Math.round(pixelCount);
    const d = 1 / grooveDensity;
    const sp = czernyTurner(centerWl, d, m, deviation, focalLength, pixelPitch, pixels);
    const reachable = Number.isFinite(sp.incidence);
    const c = (pixels - 1) / 2;
    const warnings: string[] = [];
    if (!reachable) {
      warnings.push(`Order ${m} cannot reach ${centerWl * 1e9} nm at this deviation (needs mλ < d(1 + cos D_v) = ${d * (1 + Math.cos(deviation)) * 1e9} nm).`);
    }
    const rng = createRng(Math.round(seed));
    const onDetector = lineList
      .map((nm) => ({ nm, truePx: reachable ? wavelengthToPixel(nm * 1e-9, sp) : NaN }))
      .filter((l) => Number.isFinite(l.truePx))
      .map((l) => ({ ...l, px: l.truePx + centroidNoise * gaussian(rng) }));
    if (reachable && onDetector.length < lineList.length) {
      warnings.push(`${lineList.length - onDetector.length} line(s) fall outside the detector range and are not used.`);
    }
    const fits = DEGREES.map((k) => fitPolynomial(onDetector.map((l) => l.px), onDetector.map((l) => l.nm * 1e-9), k, c, c));
    fits.forEach((fit, j) => {
      if (!fit) warnings.push(`Degree ${DEGREES[j]} needs ${DEGREES[j] + 1} lines on the detector; its outputs are left out.`);
    });
    const linear = fits[0];
    return {
      values: {
        lambdaLow: reachable ? pixelToWavelength(0, sp) : NaN,
        lambdaHigh: reachable ? pixelToWavelength(pixels - 1, sp) : NaN,
        incidence: sp.incidence,
        beta0: sp.beta0,
        theorySlope: reachable ? gratingReciprocalLinearDispersion(d, m, sp.beta0, focalLength) * pixelPitch : NaN,
        linearSlope: linear ? polynomialSlope(linear, 0) : NaN,
        linearIntercept: linear ? evalPolynomial(linear, 0) : NaN,
        linesOnDetector: onDetector.length,
        rms1: fits[0] ? fits[0].rms : NaN,
        rms2: fits[1] ? fits[1].rms : NaN,
        rms3: fits[2] ? fits[2].rms : NaN,
        maxError1: fits[0] ? maxCalibrationError(fits[0], sp) : NaN,
        maxError2: fits[1] ? maxCalibrationError(fits[1], sp) : NaN,
        maxError3: fits[2] ? maxCalibrationError(fits[2], sp) : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // d = 1/1200 mm = 833.333 nm, m = 1, centre 500 nm, D = 30 deg. sin(a) + sin(b0) = 2 sin(b0 + D/2) cos(D/2) = m lambda/d = 0.6,
      // so b0 = asin(0.6/(2 cos 15 deg)) - 15 deg = asin(0.3105830) - 15 deg = 18.0944 - 15 = 3.09436 deg, a = b0 + D = 33.09436 deg.
      // Linear dispersion at the centre: d cos(b0) p/(m f) = 833.333 nm * 0.998543 * 12.5e-6/0.1 = 0.1040148 nm/px.
      source: PALMER,
      basis: "computed",
      inputs: {},
      expect: { incidence: 33.09435948798007, beta0: 3.0943594879800704, theorySlope: 0.10401479055246424 },
      tolerance: 1e-8,
    },
    {
      // Flat detector: pixel 0 and N - 1 sit at x = -/+ (2047/2) * 12.5 um = -/+ 12.794 mm, so
      // lambda = d (sin a + sin(b0 + atan(x/f)))/m = 394.0379 nm and 605.2347 nm.
      source: PALMER,
      basis: "computed",
      inputs: {},
      expect: { lambdaLow: 394.03788330749876, lambdaHigh: 605.2347395460973 },
      tolerance: 1e-8,
    },
  ],
});
