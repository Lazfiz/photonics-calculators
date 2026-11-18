import {
  type LensletShape, MARECHAL_VALID_STREHL, PIXEL_LOCKING_FWHM_PIXELS, centroidPrecision, centroidWavefrontNoise,
  dynamicRangeAngle, dynamicRangeOverPupil, fresnelNumber, lensletsInPupil, spotFirstZeroRadius, spotFwhm, wavefrontPerPixel,
} from "../../physics/imaging/shack-hartmann";
import { marechalStrehl } from "../../physics/imaging/wavefront";
import { defineSchema } from "../types";

const AKONDI = "Akondi V., Dubra A. (2021). Shack-Hartmann wavefront sensor optical dynamic range. Optics Express 29(6), 8417–8429. " +
  "https://doi.org/10.1364/OE.419311 (lenslet-bound dynamic range θ_max = (d − 2ρ₀)/(2f), spot radius to the first zero ρ₀ = λf/d for a square lenslet).";
const MAHAJAN = "Mahajan V. N. (1983). Strehl ratio for primary aberrations in terms of their aberration variance. J. Opt. Soc. Am. 73, 860–861. " +
  "https://doi.org/10.1364/JOSA.73.000860 (extended Maréchal approximation S ≈ exp(−(2πσ/λ)²)).";
const BORN_WOLF = "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §8.5 (Airy pattern of a circular aperture: " +
  "first zero at 1.22 λf/d for an aperture of diameter d, FWHM 1.029 λf/d).";

const NO_FIT = "The diffraction spot is not narrower than the lenslet (2ρ₀ ≥ d), so the lenslet-bound dynamic range is zero: increase the pitch or shorten the focal length or wavelength.";

export default defineSchema({
  href: "/imaging/shack-hartmann",
  inputs: [
    { key: "wavelengthNm", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 632.8, min: 200, max: 2000 },
    { key: "apertureDiameterMm", label: "Pupil diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 8, min: 0.5, max: 100 },
    { key: "lensletPitchUm", label: "Lenslet pitch", unit: "µm", toSI: 1e-6, siUnit: "m", default: 300, min: 50, max: 2000 },
    { key: "lensletFocalMm", label: "Lenslet focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 20, min: 0.5, max: 200 },
    { key: "detectorPixelUm", label: "Detector pixel", unit: "µm", toSI: 1e-6, siUnit: "m", default: 5.5, min: 1, max: 30 },
    { key: "rmsWavefrontNm", label: "RMS wavefront error", unit: "nm", toSI: 1e-9, siUnit: "m", default: 50, min: 0, max: 2000 },
    { key: "photons", label: "Photons per lenslet", unit: "", toSI: 1, siUnit: "", default: 1000, min: 1, max: 1000000 },
  ],
  choices: [
    {
      key: "lensletShape",
      label: "Lenslet aperture",
      options: [
        { value: "square", label: "Square (sinc² spot)" },
        { value: "circular", label: "Circular (Airy spot)" },
      ],
      default: "square",
    },
  ],
  outputs: [
    { key: "lensletsFull", label: "Lenslets fully inside the pupil", unit: "", toSI: 1, siUnit: "" },
    { key: "lensletsPartial", label: "Lenslets partly inside the pupil", unit: "", toSI: 1, siUnit: "" },
    { key: "spotDiameter", label: "Spot diameter (zero to zero)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "spotFwhm", label: "Spot FWHM", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "thetaMax", label: "Dynamic range θ_max", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "tiltPV", label: "PV tilt over the pupil at θ_max", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "defocusPV", label: "PV defocus over the pupil at θ_max", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "defocusDiopters", label: "Largest defocus", unit: "D", toSI: 1, siUnit: "m⁻¹" },
    { key: "perPixel", label: "Wavefront step per pixel shift p·d/f", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "tiltPerPixel", label: "Tilt per pixel shift p/f", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "fresnelNumber", label: "Fresnel number d²/(λf) (full pitch d)", unit: "", toSI: 1, siUnit: "" },
    { key: "centroidNoise", label: "Photon-limited centroid noise", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "wavefrontNoise", label: "Wavefront noise per lenslet", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "strehl", label: "Strehl ratio (Maréchal)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({
    wavelengthNm, apertureDiameterMm, lensletPitchUm, lensletFocalMm, detectorPixelUm, rmsWavefrontNm, photons, lensletShape,
  }) {
    // The inputs arrive in SI under the page's key names: lambda, D, d, f, p, σ in m.
    const lambda = wavelengthNm, D = apertureDiameterMm, d = lensletPitchUm, f = lensletFocalMm, p = detectorPixelUm;
    const shape: LensletShape = lensletShape === "circular" ? "circular" : "square";
    const fwhm = spotFwhm(lambda, f, d, shape);
    const thetaMax = dynamicRangeAngle(lambda, f, d, shape);
    const fits = thetaMax > 0;
    const range = dynamicRangeOverPupil(thetaMax, D);
    const layout = lensletsInPupil(D, d);
    const sigmaC = centroidPrecision(lambda, f, d, shape, photons);
    const strehl = marechalStrehl(rmsWavefrontNm, lambda);
    const warnings: string[] = [];
    if (Number.isFinite(strehl) && strehl < MARECHAL_VALID_STREHL) {
      warnings.push("Maréchal's exp(−(2πσ/λ)²) is good to ≈ 10 % only down to S ≈ 0.3.");
    }
    if (fits && fwhm < PIXEL_LOCKING_FWHM_PIXELS * p) {
      warnings.push("The spot FWHM is under 2 pixels: centroiding is biased toward pixel centres (pixel locking).");
    }
    return {
      values: {
        lensletsFull: layout.full,
        lensletsPartial: layout.partial,
        spotDiameter: 2 * spotFirstZeroRadius(lambda, f, d, shape),
        spotFwhm: fwhm,
        thetaMax: fits ? thetaMax : NaN,
        tiltPV: fits ? range.tiltPV : NaN,
        defocusPV: fits ? range.defocusPV : NaN,
        defocusDiopters: fits ? range.defocusDiopters : NaN,
        perPixel: wavefrontPerPixel(p, f, d),
        tiltPerPixel: p / f,
        fresnelNumber: fresnelNumber(lambda, f, d),
        centroidNoise: sigmaC,
        wavefrontNoise: centroidWavefrontNoise(sigmaC, f, d),
        strehl,
      },
      warnings,
      reasons: fits ? {} : { thetaMax: NO_FIT, tiltPV: NO_FIT, defocusPV: NO_FIT, defocusDiopters: NO_FIT },
    };
  },
  checks: [
    {
      // 632.8 nm, f = 20 mm, d = 300 µm, square, pupil 8 mm: ρ₀ = λf/d = 42.186667 µm (diameter 84.373333 µm);
      // θ_max = (d − 2ρ₀)/(2f) = (300 − 84.373333) µm/40 mm = 5.390667 mrad; PV tilt θ_max·D = 43.125333 µm;
      // defocus 2θ_max/D = 1.3476667 D; N_F = d²/(λf) = 9e-8/(1.2656e-8) = 7.11125158.
      source: AKONDI,
      basis: "computed",
      inputs: { lensletShape: "square" },
      expect: { spotDiameter: 84.37333333333335, thetaMax: 5.390666666666665, tiltPV: 43.12533333333332, defocusDiopters: 1.3476666666666663, fresnelNumber: 7.111251580278127 },
      tolerance: 1e-8,
    },
    {
      // σ = 50 nm at 632.8 nm: S = exp(−(2π × 50/632.8)²) = exp(−(0.4964472)²) = 0.78155359.
      source: MAHAJAN,
      basis: "computed",
      inputs: { rmsWavefrontNm: 50, wavelengthNm: 632.8 },
      expect: { strehl: 0.7815535928087219 },
      tolerance: 1e-8,
    },
    {
      // Circular lenslet, same geometry: first Airy zero 3.8317060/π = 1.2196699 λf/d gives ρ₀ = 51.453807 µm (diameter 102.907614 µm);
      // FWHM 2·1.61633995/π = 1.0289940 λf/d = 43.409826 µm; θ_max = (300 − 102.907614) µm/40 mm = 4.9273096 mrad.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { lensletShape: "circular" },
      expect: { spotDiameter: 102.90761429245921, spotFwhm: 43.409825612804845, thetaMax: 4.9273096426885195 },
      tolerance: 1e-8,
    },
  ],
});
