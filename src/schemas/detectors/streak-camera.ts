import { STREAK_FASTEST_SWEEP_MM_NS, streakSummary } from "../../physics/detectors/streak-camera";
import { defineSchema } from "../types";

const SOURCE = "Streak-camera temporal resolution as the FWHM of the streak image of a delta pulse: Hamamatsu Photonics (2008), Guide to Streak Cameras, " +
  "cat. no. SHSS0006E (slit image, pixel and tube terms, trigger jitter in summed sweeps). Parameters of the defaults: Hamamatsu Photonics, Streak camera " +
  "C16910 data sheet, cat. no. SHSS0026E06 (temporal resolution < 800 fs, Ø18 mm P-43 screen, 35 lp/mm at the photocathode). Slit and pixel terms are " +
  "rectangles of width w·M/v and p/v, the tube, blur and jitter terms Gaussians added in quadrature; the FWHM of rect ⊗ rect ⊗ Gauss is found numerically " +
  "from the error-function profile (convolution theorem; equation numbers not verified against a printed source).";

const PS = 1e-12;

export default defineSchema({
  href: "/detectors/streak-camera",
  inputs: [
    { key: "sweepSpeed", label: "Sweep speed on the screen", unit: "mm/ns", toSI: 1e6, siUnit: "m/s", default: STREAK_FASTEST_SWEEP_MM_NS, min: 1e-6, max: 1000 },
    { key: "slitWidth", label: "Slit width (imaged 1:1 on the cathode)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 1, max: 5000 },
    { key: "magnification", label: "Tube magnification (cathode to screen)", unit: "", toSI: 1, siUnit: "", default: 2.77, min: 0.1, max: 10 },
    { key: "ccdPixelSize", label: "Pixel size on the screen", unit: "µm", toSI: 1e-6, siUnit: "m", default: 9.75, min: 1, max: 100 },
    { key: "pixels", label: "Pixels along the sweep", unit: "px", toSI: 1, siUnit: "px", default: 968, min: 64, max: 8192 },
    { key: "temporalResolution", label: "Tube spread FWHM (transit time + deflection)", unit: "ps", toSI: PS, siUnit: "s", default: 0.5, min: 0, max: 1e9 },
    { key: "screenLength", label: "Screen length along the sweep", unit: "mm", toSI: 1e-3, siUnit: "m", default: 18, min: 1, max: 100 },
    { key: "jitter", label: "Trigger jitter, summed sweeps (FWHM)", unit: "ps", toSI: PS, siUnit: "s", default: 0, min: 0, max: 1e9 },
    { key: "lpmm", label: "Limiting resolution at the cathode", unit: "lp/mm", toSI: 1e3, siUnit: "lp/m", default: 35, min: 1, max: 1000 },
    { key: "spec", label: "Data-sheet temporal resolution", unit: "ps", toSI: PS, siUnit: "s", default: 0.8, min: 0, max: 1e9 },
  ],
  outputs: [
    { key: "slitTerm", label: "Slit-image term w·M/v", unit: "ps", toSI: PS, siUnit: "s" },
    { key: "pixelTerm", label: "Pixel term p/v", unit: "ps", toSI: PS, siUnit: "s" },
    { key: "resolution", label: "Temporal resolution (FWHM)", unit: "ps", toSI: PS, siUnit: "s" },
    { key: "blurTerm", label: "Screen blur term", unit: "ps", toSI: PS, siUnit: "s" },
    { key: "tubeAllowance", label: "Tube spread the data sheet allows", unit: "ps", toSI: PS, siUnit: "s" },
    { key: "timeWindow", label: "Time window", unit: "ps", toSI: PS, siUnit: "s" },
  ],
  compute({ sweepSpeed, slitWidth, magnification, ccdPixelSize, pixels, temporalResolution, screenLength, jitter, lpmm, spec }) {
    const r = streakSummary({
      slitWidth, magnification, pixelSize: ccdPixelSize, pixels: Math.round(pixels), tube: temporalResolution, screenLength, jitter,
      limitingResolution: lpmm, spec,
    }, sweepSpeed);
    const warnings: string[] = [];
    if (r.undersampled) warnings.push("Under 2 pixels per FWHM the pulse shape is not resolved; sampling sets the reading.");
    if (r.overSpec) warnings.push("The resolution exceeds the data-sheet value.");
    if (r.screenLimited) warnings.push("The readout overfills the screen: the screen length sets the time window.");
    return {
      values: {
        slitTerm: r.slit, pixelTerm: r.pixel, resolution: r.total, blurTerm: r.blurTime, tubeAllowance: r.allowance, timeWindow: r.window,
      },
      warnings,
      reasons: {
        tubeAllowance: "The slit, pixel, blur and jitter terms alone already exceed the data-sheet resolution (or it is 0): no tube spread fits under it.",
      },
    };
  },
  checks: [
    {
      // Defaults (scratch script, rect ⊗ rect ⊗ Gauss FWHM bisected on the erf profile): v = 9.44/0.06 mm/ns; slit = 10 µm·2.77/v = 0.17605932 ps;
      // pixel = 9.75 µm/v = 0.06197034 ps; blur = 2.3548·√(ln 20/2)/(π·35 lp/mm)·2.77 = 72.6 µm → 0.46146135 ps (MTF 5 %);
      // Gaussian = √(0.5² + 0.46146²) ps; FWHM = 0.69228028 ps; allowance 0.64093787 ps; window = 968·9.75 µm/v = 59.9872881 ps.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        slitTerm: 0.1760593220338983, pixelTerm: 0.06197033898305085, resolution: 0.6922802753610796, blurTerm: 0.4614613511853910,
        tubeAllowance: 0.6409378683134527, timeWindow: 59.98728813559322,
      },
      tolerance: 1e-8,
    },
    {
      // v = 20 mm/ns, slit 50 µm, M = 2, tube 2 ps, jitter 1 ps, 20 lp/mm, spec 8 ps, 512 px: slit = 50 µm·2/v = 5 ps; pixel = 9.75 µm/v = 0.4875 ps;
      // blur term 4.58684809 ps; FWHM = 6.32982200 ps; allowance 5.39302629 ps; window = 512·9.75 µm/v = 249.6 ps (inside the 18 mm screen).
      source: SOURCE,
      basis: "computed",
      inputs: { sweepSpeed: 20, slitWidth: 50, magnification: 2, temporalResolution: 2, jitter: 1, spec: 8, pixels: 512, lpmm: 20 },
      expect: {
        slitTerm: 5, pixelTerm: 0.4875, resolution: 6.329821995798694, blurTerm: 4.586848087594862, tubeAllowance: 5.393026288769095, timeWindow: 249.6,
      },
      tolerance: 1e-8,
    },
  ],
});
