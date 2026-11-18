import { hologramSummary } from "../../physics/imaging/digital-holography";
import { defineSchema } from "../types";

const SCHNARS = "Schnars U., Jüptner W. P. O. (2002). Digital recording and numerical reconstruction of holograms. " +
  "Meas. Sci. Technol. 13, R85–R101. https://doi.org/10.1088/0957-0233/13/9/201";
const UM = 1e-6;
const MM = 1e-3;
const DEG = Math.PI / 180;
const ALIASED = "The recording distance is below the shortest in-line distance Δx(NΔx + D)/λ: the in-line hologram is aliased.";

export default defineSchema({
  href: "/imaging/digital-holography",
  inputs: [
    { key: "wavelengthNm", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 532, min: 350, max: 1100 },
    { key: "pixelSizeUm", label: "Sensor pixel pitch Δx", unit: "µm", toSI: UM, siUnit: "m", default: 6.5, min: 0.5, max: 20 },
    { key: "sensorWidth", label: "Pixels per axis N", unit: "", toSI: 1, siUnit: "", default: 2048, min: 64, max: 8192 },
    { key: "propagationDistanceMm", label: "Recording distance z", unit: "mm", toSI: MM, siUnit: "m", default: 200, min: 1, max: 2000 },
    { key: "objectSizeUm", label: "Object size D", unit: "µm", toSI: UM, siUnit: "m", default: 500, min: 0, max: 20000 },
  ],
  outputs: [
    { key: "sensorSize", label: "Sensor size NΔx", unit: "mm", toSI: MM, siUnit: "m" },
    { key: "na", label: "Numerical aperture sin(atan(NΔx/2z))", unit: "", toSI: 1, siUnit: "" },
    { key: "naEff", label: "Effective NA (pixel limit λ/2Δx)", unit: "", toSI: 1, siUnit: "" },
    { key: "pitch", label: "Reconstruction grid λz/(NΔx)", unit: "µm", toSI: UM, siUnit: "m" },
    { key: "resolution", label: "Resolution λ/(2NA_eff)", unit: "µm", toSI: UM, siUnit: "m" },
    { key: "field", label: "Reconstructed field λz/Δx", unit: "mm", toSI: MM, siUnit: "m" },
    { key: "depthOfFocus", label: "Depth of focus λ/NA_eff²", unit: "µm", toSI: UM, siUnit: "m" },
    { key: "maxAngle", label: "Largest reference angle 2 arcsin(λ/4Δx)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "fresnelNumber", label: "Fresnel number (D/2)²/(λz)", unit: "", toSI: 1, siUnit: "" },
    { key: "inlineMinDistance", label: "Shortest in-line distance Δx(NΔx + D)/λ", unit: "mm", toSI: MM, siUnit: "m" },
    { key: "matchedDistance", label: "Distance NΔx²/λ where the image pixel equals the sensor pixel", unit: "mm", toSI: MM, siUnit: "m" },
    { key: "inlineSampled", label: "In-line hologram sampled (1 = yes, 0 = aliased)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelengthNm: lambda, pixelSizeUm: dx, sensorWidth, propagationDistanceMm: z, objectSizeUm: objectSize }) {
    const { sampled, ...rest } = hologramSummary(lambda, Math.round(sensorWidth), dx, z, objectSize);
    return { values: { ...rest, inlineSampled: sampled ? 1 : 0 }, warnings: sampled ? [] : [ALIASED] };
  },
  checks: [
    {
      // λ = 532 nm, Δx = 6.5 µm, N = 2048, z = 0.2 m: NΔx = 13.312 mm; NA = sin(atan(13.312e-3/0.4)) = 0.0332616;
      // λz/(NΔx) = 532e-9·0.2/13.312e-3 = 7.99279 µm; λz/Δx = 532e-9·0.2/6.5e-6 = 16.36923 mm; 2 arcsin(532e-9/26e-6) = 2.344883°;
      // NA_eff = min(NA, λ/2Δx = 0.040923) = NA, so λ/(2NA_eff) = 0.532/0.0665231710 = 7.99721348 µm and λ/NA_eff² = 0.532/1.10633e-3 = 480.867845 µm.
      source: SCHNARS,
      basis: "computed",
      inputs: { wavelengthNm: 532, pixelSizeUm: 6.5, sensorWidth: 2048, propagationDistanceMm: 200, objectSizeUm: 500 },
      expect: { na: 0.03326158552314437, pitch: 7.992788461538463, field: 16.36923076923077, maxAngle: 2.3448832356201628, resolution: 7.997213476636872, depthOfFocus: 480.8678450443789 },
      tolerance: 1e-8,
    },
    {
      // λ = 633 nm, Δx = 5.2 µm, N = 1024, z = 0.3 m, D = 100 µm: NΔx = 5.3248 mm; NA = sin(atan(5.3248e-3/0.6)) = 0.00887432;
      // λz/(NΔx) = 633e-9·0.3/5.3248e-3 = 35.66331 µm; λz/Δx = 36.51923 mm; 2 arcsin(633e-9/20.8e-6) = 3.487868°.
      source: SCHNARS,
      basis: "computed",
      inputs: { wavelengthNm: 633, pixelSizeUm: 5.2, sensorWidth: 1024, propagationDistanceMm: 300, objectSizeUm: 100 },
      expect: { na: 0.008874317204229598, pitch: 35.66331129807692, field: 36.51923076923077, maxAngle: 3.4878681790440047 },
      tolerance: 1e-8,
    },
  ],
});
