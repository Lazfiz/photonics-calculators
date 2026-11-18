import { plenopticCamera } from "../../physics/imaging/light-field";
import { MICRO_IMAGE_OVERLAP_FILL } from "../../physics/imaging/plenoptic-camera";
import { defineSchema } from "../types";

const NG = "Ng R., Levoy M., Brédif M., Duval G., Horowitz M., Hanrahan P. (2005). Light Field Photography with a Hand-held Plenoptic Camera. " +
  "Stanford Tech Report CTSR 2005-02: one lenslet per spatial sample, N pixels across its micro-image of the main-lens aperture (diameter f_µ/N_w), " +
  "the microlens f-number matched to the main lens's image-side f-number, and refocusing within ±N·N_w·p_µ on the image side (§3.1, §3.2, §4.2). " +
  "https://graphics.stanford.edu/papers/lfcamera/lfcamera-150dpi.pdf";
const THIN_LENS = "Thin-lens equation 1/s + 1/s′ = 1/f (Hecht E., Optics, 5th ed., Pearson 2017, §5.2.3) applied to the image-side refocus range: " +
  "object distances s = f·s′/(s′ − f) for the image distances s′ ± N·N_w·p_µ.";

const noFocus = "The focus distance must exceed the main-lens focal length: there is no real image of the object, so the refocus distances are undefined.";
const beyondInfinity = "The far end of the refocus range lies beyond infinity focus (its image distance is at or inside f): it is at infinity.";

export default defineSchema({
  href: "/imaging/plenoptic-camera",
  inputs: [
    { key: "wavelengthNm", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
    { key: "mainLensFocalMm", label: "Main lens focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 140, min: 1, max: 2000 },
    { key: "mainFNumber", label: "Main lens image-side f-number N_w", unit: "", toSI: 1, siUnit: "", default: 4, min: 0.5, max: 64 },
    { key: "focusDistanceM", label: "Focus distance", unit: "m", toSI: 1, siUnit: "m", default: 1, min: 0.001, max: 10000 },
    { key: "microLensFocalMm", label: "Microlens focal length f_µ", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.5, min: 0.01, max: 20 },
    { key: "microLensPitchUm", label: "Microlens pitch p_µ", unit: "µm", toSI: 1e-6, siUnit: "m", default: 125, min: 5, max: 2000 },
    { key: "pixelPitchUm", label: "Pixel pitch", unit: "µm", toSI: 1e-6, siUnit: "m", default: 9, min: 0.5, max: 50 },
    { key: "sensorWidthPx", label: "Sensor width", unit: "px", toSI: 1, siUnit: "px", default: 4000, min: 1, max: 50000 },
    { key: "sensorHeightPx", label: "Sensor height", unit: "px", toSI: 1, siUnit: "px", default: 4000, min: 1, max: 50000 },
  ],
  outputs: [
    { key: "lensletsX", label: "Lenslets across the width", unit: "", toSI: 1, siUnit: "" },
    { key: "lensletsY", label: "Lenslets across the height", unit: "", toSI: 1, siUnit: "" },
    { key: "pixelsAcross", label: "Pixels across a micro-image N", unit: "px", toSI: 1, siUnit: "px" },
    { key: "views", label: "Views N × N", unit: "", toSI: 1, siUnit: "" },
    { key: "samples", label: "4D light-field samples", unit: "", toSI: 1, siUnit: "" },
    { key: "lensletFNumber", label: "Microlens f-number f_µ/p_µ", unit: "", toSI: 1, siUnit: "" },
    { key: "microImageFill", label: "Micro-image diameter over the pitch", unit: "", toSI: 1, siUnit: "" },
    { key: "angularStep", label: "Angle per pixel at the lenslet", unit: "arcmin", toSI: Math.PI / 10800, siUnit: "rad" },
    { key: "lensletAiry", label: "Lenslet Airy diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "spacingTolerance", label: "Lenslet-to-sensor spacing tolerance ±", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "imageDofConventional", label: "Conventional image-side half depth of field", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "imageRefocusRange", label: "Image-side refocus range ±", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "refocusNear", label: "Nearest refocusable object distance", unit: "m", toSI: 1, siUnit: "m" },
    { key: "refocusFar", label: "Farthest refocusable object distance", unit: "m", toSI: 1, siUnit: "m" },
  ],
  compute(i) {
    const r = plenopticCamera({
      lensletPitch: i.microLensPitchUm, lensletFocal: i.microLensFocalMm, pixelPitch: i.pixelPitchUm,
      sensorWidthPx: Math.round(i.sensorWidthPx), sensorHeightPx: Math.round(i.sensorHeightPx), mainFNumber: i.mainFNumber,
      mainFocal: i.mainLensFocalMm, focusDistance: i.focusDistanceM, lambda: i.wavelengthNm,
    });
    const focusTooClose = !(i.focusDistanceM > i.mainLensFocalMm);
    const warnings: string[] = [];
    if (focusTooClose) warnings.push(noFocus);
    if (r.microImageFill > MICRO_IMAGE_OVERLAP_FILL) {
      warnings.push("The micro-image diameter f_µ/N_w exceeds the lenslet pitch by more than 2 % (fill > 1.02): neighbouring views mix in a band D − p_µ wide, so N counts only the 2p_µ − D clean pixels.");
    }
    return {
      values: {
        lensletsX: r.lensletsX,
        lensletsY: r.lensletsY,
        pixelsAcross: r.pixelsAcross,
        views: r.views,
        samples: r.samples,
        lensletFNumber: r.lensletFNumber,
        microImageFill: r.microImageFill,
        angularStep: r.angularStep,
        lensletAiry: r.lensletAiry,
        spacingTolerance: r.spacingTolerance,
        imageDofConventional: r.imageDofConventional,
        imageRefocusRange: r.imageRefocusRange,
        refocusNear: r.refocusNear,
        refocusFar: r.refocusFar,
      },
      warnings,
      reasons: {
        refocusNear: noFocus,
        refocusFar: focusTooClose ? noFocus : beyondInfinity,
      },
    };
  },
  checks: [
    {
      // Defaults (Ng-like parameters): D = f_µ/N_w = 0.5 mm/4 = 125 µm = p_µ (fill 1); N = ⌊125/9⌋ = 13, views 169; lenslets ⌊4000·9/125⌋ = 288 per side,
      // samples 288²·169 = 14 017 536; f_µ/p_µ = 4; atan(9 µm/0.5 mm) = 61.87276 arcmin; Airy 2.44·0.55 µm·4 = 5.368 µm; tolerance p_px·f_µ/p_µ = 36 µm.
      source: NG,
      basis: "computed",
      inputs: {},
      expect: {
        lensletsX: 288, pixelsAcross: 13, views: 169, samples: 14017536, lensletFNumber: 4, microImageFill: 1,
        angularStep: 61.87276019327717, lensletAiry: 5.368, spacingTolerance: 36,
      },
      tolerance: 1e-8,
    },
    {
      // Defaults: image-side half depth of field N_w·p_µ = 4·125 µm = 0.5 mm, refocus range N·0.5 mm = 6.5 mm;
      // s′ = f·s/(s − f) = 0.14·1/0.86 = 0.1627907 m; near s = f·(s′ + 6.5 mm)/(s′ + 6.5 mm − f) = 0.80915443 m; far s = f·(s′ − 6.5 mm)/(s′ − 6.5 mm − f) = 1.34314061 m.
      source: THIN_LENS,
      basis: "computed",
      inputs: {},
      expect: { imageDofConventional: 0.5, imageRefocusRange: 6.500000000000001, refocusNear: 0.8091544263596666, refocusFar: 1.3431406138472528 },
      tolerance: 1e-8,
    },
    {
      // Under-filled micro-images: λ 633 nm, f = 100 mm, N_w = 4, focus 3 m, f_µ = 0.3 mm, p_µ = 100 µm, 10 µm pixels, 2000 × 1500 px:
      // D = 75 µm (fill 0.75), N = ⌊75/10⌋ = 7, lenslets 200 × 150, samples 200·150·49 = 1 470 000; atan(10 µm/0.3 mm) = 114.54915 arcmin;
      // range 7·4·100 µm = 2.8 mm; s′ = 0.1·3/2.9 = 0.10344828 m; near 1.70044150 m, far 15.52553191 m.
      source: NG,
      basis: "computed",
      inputs: {
        wavelengthNm: 633, mainLensFocalMm: 100, mainFNumber: 4, focusDistanceM: 3, microLensFocalMm: 0.3, microLensPitchUm: 100,
        pixelPitchUm: 10, sensorWidthPx: 2000, sensorHeightPx: 1500,
      },
      expect: {
        pixelsAcross: 7, lensletsX: 200, lensletsY: 150, samples: 1470000, microImageFill: 0.75,
        angularStep: 114.54914597978258, imageRefocusRange: 2.7999999999999994, refocusNear: 1.7004415011037521, refocusFar: 15.525531914893383,
      },
      tolerance: 1e-8,
    },
  ],
});
