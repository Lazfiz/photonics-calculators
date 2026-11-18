import { inoueDepthOfField, quarterWaveDepth } from "../../physics/imaging/optical-sectioning-thickness";
import { defineSchema } from "../types";

const INOUE = "Inoué S., Spring K. R. (1997). Microscope Image Formation. In: Video Microscopy, 2nd ed., ch. 2, pp. 13–117, " +
  "Plenum, total depth of field d = λ₀n/NA² + n·e/(M·NA). https://doi.org/10.1007/978-1-4615-5859-0_2";
const UM = 1e-6;

export default defineSchema({
  href: "/imaging/dof",
  inputs: [
    { key: "na", label: "Numerical aperture NA", unit: "", toSI: 1, siUnit: "", default: 0.4, min: 0.01, max: 1.7 },
    { key: "wavelength", label: "Vacuum wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
    { key: "magnification", label: "Lateral magnification M", unit: "×", toSI: 1, siUnit: "", default: 40, min: 1, max: 200 },
    { key: "pixelSize", label: "Detector resolution e in the image plane (e.g. pixel pitch)", unit: "µm", toSI: UM, siUnit: "m", default: 6.5, min: 0.1, max: 50 },
    { key: "n", label: "Immersion medium index n", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 2 },
  ],
  outputs: [
    { key: "waveTerm", label: "Wave term λ₀n/NA²", unit: "µm", toSI: UM, siUnit: "m" },
    { key: "detectorTerm", label: "Detector term n·e/(M·NA)", unit: "µm", toSI: UM, siUnit: "m" },
    { key: "total", label: "Total depth of field", unit: "µm", toSI: UM, siUnit: "m" },
    { key: "waveTermNonParaxial", label: "Wave term without the paraxial step", unit: "µm", toSI: UM, siUnit: "m" },
  ],
  validate({ na, n }) {
    if (!(na < n)) return `The NA (${na}) must be smaller than the refractive index n (${n}).`;
    return undefined;
  },
  compute({ na, wavelength, magnification, pixelSize, n }) {
    const dof = inoueDepthOfField(wavelength, n, na, pixelSize, magnification);
    return {
      values: {
        waveTerm: dof.wave,
        detectorTerm: dof.detector,
        total: dof.total,
        waveTermNonParaxial: quarterWaveDepth(wavelength, n, na),
      },
    };
  },
  checks: [
    {
      // λ₀n/NA² = 550e-9·1/0.16 = 3.4375 µm; n·e/(M·NA) = 6.5e-6/(40·0.4) = 0.40625 µm; sum 3.84375 µm.
      // Non-paraxial λ₀/(2(n − √(n² − NA²))) = 550e-9/(2·(1 − √0.84)) = 3.29401 µm (√0.84 = 0.9165151390).
      source: INOUE,
      basis: "computed",
      inputs: { na: 0.4, wavelength: 550, magnification: 40, pixelSize: 6.5, n: 1 },
      expect: { waveTerm: 3.4375, detectorTerm: 0.40625, total: 3.84375, waveTermNonParaxial: 3.2940103951410698 },
      tolerance: 1e-8,
    },
    {
      // Water immersion, NA 1.0, 100×, e = 6.5 µm: 550e-9·1.333/1 = 0.73315 µm; 1.333·6.5e-6/(100·1.0) = 0.086645 µm.
      // Non-paraxial 0.55/(2·(1.333 − √(1.333² − 1))) = 0.55/(2·(1.333 − √0.776889)) = 0.55/(2·0.4516) = 0.608964 µm (√0.776889 = 0.88141).
      source: INOUE,
      basis: "computed",
      inputs: { na: 1, wavelength: 550, magnification: 100, pixelSize: 6.5, n: 1.333 },
      expect: { waveTerm: 0.73315, detectorTerm: 0.086645, total: 0.819795, waveTermNonParaxial: 0.6089635942551752 },
      tolerance: 1e-8,
    },
  ],
});
