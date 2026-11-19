import { palmStormSummary } from "../../physics/imaging/palm-storm";
import { defineSchema } from "../types";

const MORTENSEN = "Mortensen K. I., Churchman L. S., Spudich J. A., Flyvbjerg H. (2010). Optimized localization analysis for " +
  "single-molecule tracking and super-resolution microscopy. Nat. Methods 7, 377–381, eqs. 5 and 6 with σ_a² = σ² + a²/12. " +
  "https://doi.org/10.1038/nmeth.1447";
const ZHANG = "Zhang B., Zerubia J., Olivo-Marin J.-C. (2007). Gaussian approximations of fluorescence microscope point-spread " +
  "function models. Appl. Opt. 46, 1819–1829 (Gaussian fit of the Airy pattern, σ = 0.21 λ/NA). https://doi.org/10.1364/AO.46.001819";
const LEGANT = "Legant W. R. et al. (2016). High-density three-dimensional localization microscopy across large volumes. " +
  "Nat. Methods 13, 359–365, effective resolution √((2.355 σ_loc)² + d_Nyquist²), with Nyquist resolution 2/ρ^(1/D) " +
  "(Shroff H. et al. (2008) Nat. Methods 5, 417–423). https://doi.org/10.1038/nmeth.3797";

export default defineSchema({
  href: "/imaging/palm-storm",
  inputs: [
    { key: "wavelength", label: "Emission wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 647, min: 400, max: 900 },
    { key: "na", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "", default: 1.49, min: 0.5, max: 1.7 },
    { key: "photons", label: "Detected photons per localization N", unit: "", toSI: 1, siUnit: "", default: 1000, min: 10, max: 1e6 },
    { key: "background", label: "Background b² (photons per pixel)", unit: "", toSI: 1, siUnit: "", default: 10, min: 0, max: 1e4 },
    { key: "pixelSize", label: "Pixel size in the sample", unit: "nm", toSI: 1e-9, siUnit: "m", default: 100, min: 10, max: 300 },
    { key: "dim", label: "Dimensions D in which the label density is counted (1, 2 or 3)", unit: "", toSI: 1, siUnit: "", default: 2, min: 1, max: 3 },
    { key: "density", label: "Label density (per µm^D, D = dim)", unit: "µm⁻ᴰ", toSI: 1, siUnit: "µm⁻ᴰ", default: 2500, min: 1e-3, max: 1e7 },
    { key: "numFrames", label: "Number of frames", unit: "", toSI: 1, siUnit: "", default: 20000, min: 100, max: 1e6 },
    { key: "fps", label: "Frame rate", unit: "frames/s", toSI: 1, siUnit: "1/s", default: 100, min: 1, max: 10000 },
  ],
  choices: [
    {
      key: "estimator", label: "Fit", default: "ls",
      options: [{ value: "ls", label: "Least-squares Gaussian fit" }, { value: "mle", label: "Maximum-likelihood Gaussian fit" }],
    },
    {
      key: "camera", label: "Camera", default: "scmos",
      options: [{ value: "scmos", label: "sCMOS or CCD (no excess noise)" }, { value: "emccd", label: "EMCCD (excess noise doubles the variance)" }],
    },
  ],
  outputs: [
    { key: "psfSigma", label: "PSF σ = 0.21 λ/NA", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "sigmaLoc", label: "Localization precision σ_loc", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "shotLimit", label: "Shot-noise limit σ/√N", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "localizationFwhm", label: "Localization FWHM 2.355 σ_loc", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "labelSpacing", label: "Label spacing ρ^(−1/D) (Nyquist convention, not the nearest-neighbour distance)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "nyquist", label: "Nyquist resolution 2/ρ^(1/D)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "effective", label: "Effective resolution", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "diffraction", label: "Diffraction limit λ/(2NA)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "acquisitionTime", label: "Acquisition time", unit: "s", toSI: 1, siUnit: "s" },
  ],
  validate({ dim }) {
    if (dim !== 1 && dim !== 2 && dim !== 3) return `The dimension D must be 1, 2 or 3 (got ${dim}).`;
    return undefined;
  },
  compute(si) {
    const dim = si.dim === 1 ? 1 : si.dim === 3 ? 3 : 2;
    const r = palmStormSummary(
      si.wavelength, si.na, si.photons, si.background, si.pixelSize,
      si.estimator === "mle" ? "mle" : "ls", si.camera === "emccd", si.density, dim, si.numFrames, si.fps,
    );
    const warnings: string[] = [];
    if (r.undersampled) {
      warnings.push(`The pixel is more than twice the PSF σ (${(r.psfSigma * 1e9).toFixed(0)} nm): the spot is undersampled and the a²/12 pixel correction is no longer small.`);
    }
    if (dim === 3) warnings.push("Axial precision is typically 2–3× worse (astigmatic or biplane 3D); σ_loc is the lateral precision.");
    return {
      values: {
        psfSigma: r.psfSigma,
        sigmaLoc: r.sigmaLoc,
        shotLimit: r.shotLimit,
        localizationFwhm: r.localizationFwhm,
        labelSpacing: r.labelSpacing,
        nyquist: r.nyquist,
        effective: r.effective,
        diffraction: r.diffraction,
        acquisitionTime: r.acquisitionTime,
      },
      warnings,
    };
  },
  checks: [
    {
      // 647 nm, NA 1.49: σ = 0.21 · 647/1.49 = 91.18792 nm; a = 100 nm, σ_a² = σ² + a²/12; N = 1000, b² = 10:
      // σ_loc² = σ_a²/N (16/9 + 8π σ_a² b²/(N a²)) → σ_loc = 4.285749 nm (eq. 6).
      source: `${ZHANG} ${MORTENSEN}`,
      basis: "computed",
      inputs: {},
      expect: { psfSigma: 91.18791946, sigmaLoc: 4.285748791 },
      tolerance: 1e-8,
    },
    {
      // Maximum likelihood, eq. 5, same inputs: τ = N a²/(2π σ_a² b²) = 17.3967 and, in closed form, ∫₀¹ ln t/(1 + τt) dt = Li₂(−τ)/τ
      // = −0.325776 (Li₂(−τ) = −π²/6 − ½ ln²τ − Li₂(−1/τ)): σ_loc = √(σ_a²/N/(1 − 0.325776)) = 3.683617161 nm.
      source: MORTENSEN,
      basis: "computed",
      inputs: { estimator: "mle" },
      expect: { sigmaLoc: 3.6836171612629847 },
      tolerance: 1e-9,
    },
    {
      // ρ = 2500 µm⁻² in 2D: d_Nyquist = 2/√2500 µm = 40 nm; effective = √((2.35482 · 4.285749)² + 40²) = 41.253507 nm.
      source: LEGANT,
      basis: "computed",
      inputs: {},
      expect: { nyquist: 40, effective: 41.25350698 },
      tolerance: 1e-8,
    },
  ],
});
