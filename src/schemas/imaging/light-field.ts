import { lightFieldMicroscope } from "../../physics/imaging/light-field";
import { noAngleReason } from "../../physics/imaging/light-field-summary";
import { defineSchema } from "../types";

const LEVOY = "Levoy M., Ng R., Adams A., Footer M., Horowitz M. (2006). Light field microscopy. ACM Transactions on Graphics 25(3), 924–934. " +
  "https://doi.org/10.1145/1141911.1141976 (eq. 1 microlens f-number M/(2NA); eq. 2 Sparrow limit 0.47λM/NA; eq. 3 N_u = W/R_obj; eq. 5 depth of field).";

const PIXEL_LIMITED = "Pixel limited. A refocused slice still has e = W, so its depth of field uses the diffraction count W/R_obj; a single view uses the pixel-limited N_u.";

export default defineSchema({
  href: "/imaging/light-field",
  inputs: [
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.2, min: 0.01, max: 1.6 },
    { key: "magnification", label: "Objective magnification M", unit: "", toSI: 1, siUnit: "", default: 20, min: 1, max: 200 },
    { key: "n", label: "Medium index n", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 1.6 },
    { key: "pixelSize", label: "Sensor pixel pitch", unit: "µm", toSI: 1e-6, siUnit: "m", default: 6.5, min: 0.5, max: 50 },
    { key: "microlensPitch", label: "Microlens pitch W", unit: "µm", toSI: 1e-6, siUnit: "m", default: 150, min: 10, max: 1000 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
  ],
  outputs: [
    { key: "lateralSample", label: "Lateral sample on the specimen W/M", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "sparrowImage", label: "Sparrow limit in the image R_obj", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "spotsDiffraction", label: "Diffraction-limited spots per lenslet W/R_obj", unit: "", toSI: 1, siUnit: "" },
    { key: "spotsPixels", label: "Pixel-limited spots per lenslet W/(2p)", unit: "", toSI: 1, siUnit: "" },
    { key: "nu", label: "Resolvable spots per lenslet N_u", unit: "", toSI: 1, siUnit: "" },
    { key: "dofConventional", label: "Conventional depth of field λn/NA²", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "dofRefocused", label: "Refocused slice depth of field", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "dofView", label: "Single-view depth of field", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "lensletFNumber", label: "Matched microlens f-number M/(2NA)", unit: "", toSI: 1, siUnit: "" },
    { key: "lensletFocal", label: "Matched microlens focal length", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  validate({ na, n }) {
    if (!(na < n)) return `The NA must be below the medium index n (${n}).`;
    return undefined;
  },
  compute({ na, magnification, n, pixelSize, microlensPitch, wavelength }) {
    const r = lightFieldMicroscope({
      na, magnification, n, lensletPitch: microlensPitch, pixelPitch: pixelSize, lambda: wavelength,
    });
    const warnings: string[] = [];
    const noAngle = noAngleReason(r);
    if (noAngle) warnings.push(noAngle);
    if (r.pixelLimited) warnings.push(PIXEL_LIMITED);
    return {
      values: {
        lateralSample: r.lateralSample,
        sparrowImage: r.sparrowImage,
        spotsDiffraction: r.spotsDiffraction,
        spotsPixels: r.spotsPixels,
        nu: r.nu,
        dofConventional: r.dofConventional,
        dofRefocused: r.dofRefocused,
        dofView: r.dofView,
        lensletFNumber: r.lensletFNumber,
        lensletFocal: r.lensletFocal,
      },
      warnings,
      reasons: noAngle ? { dofRefocused: noAngle, dofView: noAngle } : {},
    };
  },
  checks: [
    {
      // NA 0.5, M 40, n 1.33, W 100 µm, p 6.5 µm, λ 550 nm: W/M = 2.5 µm; R_obj = 0.47·0.55·40/0.5 = 20.68 µm;
      // W/R_obj = 4.835590 (diffraction limited, W/2p = 7.692); f-number 40/(2·0.5) = 40; focal length 40·0.1 mm = 4 mm;
      // λn/NA² = 0.55·1.33/0.25 = 2.926 µm.
      source: LEVOY,
      basis: "computed",
      inputs: { na: 0.5, magnification: 40, n: 1.33, microlensPitch: 100, pixelSize: 6.5, wavelength: 550 },
      expect: {
        lateralSample: 2.5, sparrowImage: 20.68, spotsDiffraction: 4.835589941972922, spotsPixels: 7.692307692307693,
        nu: 4.835589941972922, lensletFNumber: 40, lensletFocal: 4, dofConventional: 2.926,
      },
      tolerance: 1e-8,
    },
    {
      // Same case, λn/(2NA²) = 1.463 µm: refocused (2 + W/R_obj) · 1.463 = 6.835590 · 1.463 = 10.000468 µm;
      // single view (2 + N_u²) · 1.463 = (2 + 23.382023) · 1.463 = 37.135227 µm.
      source: LEVOY,
      basis: "computed",
      inputs: { na: 0.5, magnification: 40, n: 1.33, microlensPitch: 100, pixelSize: 6.5, wavelength: 550 },
      expect: { dofRefocused: 10.000468085106386, dofView: 37.13522671714886 },
      tolerance: 1e-8,
    },
    {
      // NA 0.8, M 60, n 1.33, W 150 µm: R_obj = 0.47·0.55·60/0.8 = 19.3875 µm; W/R_obj = 7.736944; f-number 60/1.6 = 37.5;
      // focal length 37.5·0.15 mm = 5.625 mm; λn/NA² = 0.55·1.33/0.64 = 1.142969 µm.
      source: LEVOY,
      basis: "computed",
      inputs: { na: 0.8, magnification: 60, n: 1.33, microlensPitch: 150, pixelSize: 6.5, wavelength: 550 },
      expect: { sparrowImage: 19.3875, spotsDiffraction: 7.7369439071566735, lensletFNumber: 37.5, lensletFocal: 5.625, dofConventional: 1.14296875 },
      tolerance: 1e-8,
    },
  ],
});
