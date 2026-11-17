import { FWHM_PER_D1E2 } from "../../physics/laser-safety/beam-diameter";
import {
  axisDiameterAt, nominalOcularHazardDistance, requiredOpticalDensity, type BeamGeometry,
} from "../../physics/laser-safety/hazard-distance";
import { peakIrradiance } from "../../physics/laser-safety/visual-interference";
import { defineSchema } from "../types";
import { EXPOSURE, ICNIRP_2013, WAVELENGTH } from "./common";

const ANSI_NOHD = "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers, Appendix B: " +
  "NOHD = (1/φ)√(4P/(π MPE) − a²) (Eq. B51 of the 2007 edition, quoted in A. L. Augustoni, Sandia report SAND2007-5052, p. 31), each axis growing as √(a² + (rφ)²); " + `limits from ${ICNIRP_2013}, Table 5.`;

export default defineSchema({
  href: "/laser-safety/diode-laser-safety",
  choices: [
    {
      key: "angleDefinition",
      label: "Divergences are quoted at",
      options: [
        { value: "1/e2", label: "1/e² intensity" },
        { value: "fwhm", label: "FWHM (half maximum)" },
      ],
      default: "1/e2",
    },
  ],
  inputs: [
    { key: "power", label: "Power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 500, min: 0, max: 1e9 },
    { ...WAVELENGTH, default: 808 },
    { key: "beamDia", label: "Beam diameter at the emitting aperture, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.001, max: 1e4 },
    { key: "divergenceH", label: "Slow-axis divergence, full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 10, min: 0, max: 1000 },
    { key: "divergenceV", label: "Fast-axis divergence, full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 30, min: 0, max: 1000 },
    { ...EXPOSURE, key: "exposureTime", default: 10 },
  ],
  outputs: [
    { key: "nohd", label: "Nominal ocular hazard distance (0: within the limits at the aperture)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "slowSizeAtNohd", label: "Slow-axis 1/e² beam size at the NOHD", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "fastSizeAtNohd", label: "Fast-axis 1/e² beam size at the NOHD", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "opticalDensity", label: "Optical density needed at the aperture", unit: "", toSI: 1, siUnit: "" },
    { key: "peakIrradiance", label: "Peak irradiance at the aperture", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
  ],
  compute({ angleDefinition, power, wavelength, beamDia, divergenceH, divergenceV, exposureTime }) {
    // A 1/e² width is the FWHM / √(ln2/2).
    const toFullE2 = angleDefinition === "fwhm" ? 1 / FWHM_PER_D1E2 : 1;
    const phiSlow = divergenceH * toFullE2;
    const phiFast = divergenceV * toFullE2;
    const beam: BeamGeometry = { d: [beamDia, beamDia], phi: [phiSlow, phiFast], growth: "gaussian" };
    const nohd = nominalOcularHazardDistance(wavelength, power, beam, exposureTime);
    const od = requiredOpticalDensity(wavelength, power, beamDia, exposureTime);
    const warnings: string[] = [];
    if (Number.isNaN(nohd.distance) || Number.isNaN(od.od)) {
      warnings.push("The eye limits cover 180 nm to 1 mm.");
      return { values: { nohd: NaN, slowSizeAtNohd: NaN, fastSizeAtNohd: NaN, opticalDensity: NaN, peakIrradiance: NaN }, warnings };
    }
    if (nohd.distance === Infinity) warnings.push("The beam doesn't spread (φ = 0): the hazard extends to any range.");
    else if (nohd.distance === 0) warnings.push("Within the limits at the aperture: no hazard distance.");
    const finite = Number.isFinite(nohd.distance);
    return {
      values: {
        nohd: nohd.distance,
        slowSizeAtNohd: finite ? axisDiameterAt(beamDia, phiSlow, nohd.distance, "gaussian") : NaN,
        fastSizeAtNohd: finite ? axisDiameterAt(beamDia, phiFast, nohd.distance, "gaussian") : NaN,
        opticalDensity: od.od,
        peakIrradiance: peakIrradiance(power, beamDia),
      },
      warnings,
    };
  },
  checks: [
    {
      // 532 nm, 1 W, round 1 mm and 1 mrad (1/e²), 0.25 s: MPE 18 t^0.75/t = 25.46 W/m²; with the 1/e values a/√2 and
      // φ/√2 ANSI's (1/φ)√(4P/(π MPE) − a²) gives 316.28 m (as the NOHD page's check).
      source: ANSI_NOHD,
      basis: "computed",
      inputs: { power: 1000, wavelength: 532, exposureTime: 0.25, beamDia: 1, divergenceH: 1, divergenceV: 1 },
      expect: { nohd: 316.28 },
      tolerance: 5e-4,
    },
    {
      // Peak irradiance 8P/(πd²) at the defaults, P = 0.5 W, d = 1 mm: 8 × 0.5/(π × 1e-6) = 1.27324e6 W/m² = 127.324 W/cm².
      source: "Peak irradiance of a TEM₀₀ beam of 1/e² diameter d, 8P/(πd²) (the standards' 4P/(πd²) with 1/e diameters; ANSI Z136.1-2014 Appendix B).",
      basis: "computed",
      inputs: {},
      expect: { peakIrradiance: 127.32395447351628 },
      tolerance: 1e-8,
    },
  ],
});
