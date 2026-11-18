import { WILHELM_MIN_PINHOLE_AU, opticalSectioningSummary } from "../../physics/imaging/optical-sectioning-thickness-summary";
import { defineSchema } from "../types";

const WILHELM = "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. " +
  "Carl Zeiss (geometric optical-section formula for pinholes of at least 1 Airy unit, 0.64 λ/(n − √(n² − NA²)) for a point-like pinhole; Airy unit 1.22 λ/NA).";
const ZIPFEL = "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. " +
  "Nature Biotechnology 21, 1369–1377. https://doi.org/10.1038/nbt899 (axial 1/e radius of the squared PSF, ω_z = 0.532 λ/(√2 (n − √(n² − NA²))); FWHM = 2√(ln 2) ω_z).";
const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, https://doi.org/10.1017/9781108769914, " +
  "§8.8 paraxial sinc²(u/4) (first axial zero u = 4π, i.e. 2nλ/NA²); the high-NA scale n − √(n² − NA²) is as in Wilhelm et al.";

const WILHELM_WARNING = "Below 1 Airy unit Wilhelm's geometric formula overestimates the confocal section; the point-pinhole limit is the lower bound.";

export default defineSchema({
  href: "/imaging/optical-sectioning-thickness",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 300, max: 2000 },
    { key: "na", label: "Numerical Aperture", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 0.1, max: 1.7 },
    { key: "refractiveIndex", label: "Refractive Index", unit: "", toSI: 1, siUnit: "", default: 1.518, min: 1, max: 1.8 },
    { key: "pinholeAU", label: "Pinhole (Airy units)", unit: "AU", toSI: 1, siUnit: "", default: 1, min: 0.1, max: 5 },
  ],
  outputs: [
    { key: "widefield", label: "Widefield (focus to first axial zero)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "confocal", label: "Confocal section, Wilhelm", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "waveOptical", label: "Confocal section, wave-optical", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "pointPinhole", label: "Confocal section, point-pinhole limit", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "twoPhoton", label: "Two-photon axial FWHM (point object, at 2λ)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "pinholeDiameter", label: "Pinhole diameter (object side)", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  validate({ na, refractiveIndex }) {
    if (!(na < refractiveIndex)) return `NA ${na} is not possible in a medium of n = ${refractiveIndex}: NA = n sin α must stay below n.`;
    return undefined;
  },
  compute({ wavelength, na, refractiveIndex, pinholeAU }) {
    const values = opticalSectioningSummary(wavelength, refractiveIndex, na, pinholeAU);
    const warnings: string[] = [];
    if (pinholeAU < WILHELM_MIN_PINHOLE_AU) warnings.push(WILHELM_WARNING);
    return { values, warnings };
  },
  checks: [
    {
      // 600 nm, n 1.33, NA 1.0, 2 AU: D = n − √(n² − NA²) = 1.33 − √0.7689 = 0.4531306; PH = 2·1.22·0.6/1.0 = 1.464 µm;
      // confocal = √[(0.886·0.6/D)² + (√2·1.33·1.464/1.0)²] = 2.993140 µm; point pinhole 0.64·0.6/D = 0.847438 µm.
      // The wave-optical output (Wilson T. (2011) Resolution and optical sectioning in the confocal microscope,
      // J. Microsc. 244, 113–121, https://doi.org/10.1111/j.1365-2818.2011.03549.x) is not asserted here.
      source: WILHELM,
      basis: "computed",
      inputs: { wavelength: 600, na: 1.0, refractiveIndex: 1.33, pinholeAU: 2 },
      expect: { confocal: 2.9931395953446644, pointPinhole: 0.8474378617180859, pinholeDiameter: 1.464 },
      tolerance: 1e-8,
    },
    {
      // Same case, excitation at 2λ = 1200 nm: 2√(ln 2)·0.532·1.2/(√2·D) = 1.658812 µm.
      source: ZIPFEL,
      basis: "computed",
      inputs: { wavelength: 600, na: 1.0, refractiveIndex: 1.33, pinholeAU: 2 },
      expect: { twoPhoton: 1.6588122954439037 },
      tolerance: 1e-8,
    },
    {
      // Same case: widefield focus-to-first-zero λ/D = 0.6/0.4531306 = 1.324122 µm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { wavelength: 600, na: 1.0, refractiveIndex: 1.33, pinholeAU: 2 },
      expect: { widefield: 1.324121658934509 },
      tolerance: 1e-8,
    },
  ],
});
