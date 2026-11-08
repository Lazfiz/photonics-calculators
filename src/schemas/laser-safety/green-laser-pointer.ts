import { apertureIrradiance } from "../../physics/laser-safety/eye-exposure-limits";
import { effectiveDiameterAt, nominalOcularHazardDistance, roundBeam } from "../../physics/laser-safety/hazard-distance";
import { classifyCw, type LaserClass } from "../../physics/laser-safety/laser-classes";
import { ICAO_LEVELS, peakIrradiance, pointerEyeExposure, rangeToIrradiance } from "../../physics/laser-safety/visual-interference";
import { defineSchema } from "../types";
import { ICNIRP_2013, WAVELENGTH } from "./common";

const POINTER_SOURCES = `${ICNIRP_2013}, Tables 5 and 8 (eye limits, 0.25 s unintended view of a visible beam); ` +
  "IEC 60825-1:2014 Tables 3–9 (class limits); ICAO Annex 11 / Doc 9815 laser-free, critical and sensitive flight-zone " +
  "irradiances (50 nW/cm², 5 µW/cm², 100 µW/cm²); peak irradiance 8P/(πd²) of a TEM₀₀ beam, d(r) = d + rφ";

/** The class as a number, in the order of the standard's classes. */
const RANK: Record<LaserClass, number> = { "1": 1, "1M": 2, "2": 3, "2M": 4, "3R": 5, "3B": 6, "4": 7 };

/** Pupil diameter of the page's "into a 7 mm pupil" figure, m. */
const PUPIL = 7e-3;

export default defineSchema({
  href: "/laser-safety/green-laser-pointer",
  inputs: [
    { key: "power", label: "Power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 5, min: 0, max: 1e12 },
    WAVELENGTH,
    { key: "beamDia", label: "Beam diameter at the output, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1.5, min: 0.001, max: 1e6 },
    { key: "divergence", label: "Divergence, 1/e² full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1.2, min: 0, max: 1e6 },
    { key: "distance", label: "Viewing distance", unit: "m", toSI: 1, siUnit: "m", default: 10, min: 0, max: 1e9 },
  ],
  outputs: [
    { key: "classRank", label: "Class: 1 = Class 1, 2 = 1M, 3 = Class 2, 4 = 2M, 5 = 3R, 6 = 3B, 7 = Class 4", unit: "", toSI: 1, siUnit: "" },
    { key: "nohd", label: "Nominal ocular hazard distance (0: within the limit at the output)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "beamAtDistance", label: "Beam diameter at the viewing distance", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "pupilIrradiance", label: "Irradiance averaged over a 7 mm pupil at the viewing distance", unit: "mW/cm²", toSI: 10, siUnit: "W/m²" },
    { key: "peakIrradiance", label: "Peak irradiance at the viewing distance", unit: "µW/cm²", toSI: 0.01, siUnit: "W/m²" },
    { key: "flashBlindRange", label: "Range beyond which flash-blindness is unlikely (100 µW/cm²; visible beams only)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "glareRange", label: "Range beyond which glare is unlikely (5 µW/cm²; visible beams only)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "distractionRange", label: "Range beyond which visual disruption is unlikely (50 nW/cm²; visible beams only)", unit: "m", toSI: 1, siUnit: "m" },
  ],
  compute({ power, wavelength, beamDia, divergence, distance }) {
    const { visible, outsideRule, t } = pointerEyeExposure(wavelength);
    const beam = roundBeam(beamDia, divergence);
    const cls = classifyCw(wavelength, power, { d: beamDia, phi: divergence });
    const nohd = nominalOcularHazardDistance(wavelength, power, beam, t).distance;
    const dAtR = effectiveDiameterAt(beam, distance);
    const warnings: string[] = [];
    if (cls.laserClass === null || Number.isNaN(nohd)) warnings.push("The limits cover 180 nm to 1 mm.");
    if (outsideRule) warnings.push("Outside 400–1400 nm ICNIRP 2013 uses the longest exposure expected; 10 s is assumed.");
    if (!visible) warnings.push("Dazzle levels apply to visible beams only.");
    return {
      values: {
        classRank: cls.laserClass === null ? NaN : RANK[cls.laserClass],
        nohd,
        beamAtDistance: dAtR,
        pupilIrradiance: apertureIrradiance(power, dAtR, PUPIL),
        peakIrradiance: peakIrradiance(power, dAtR),
        flashBlindRange: visible ? rangeToIrradiance(power, beam, ICAO_LEVELS.sensitive) : NaN,
        glareRange: visible ? rangeToIrradiance(power, beam, ICAO_LEVELS.critical) : NaN,
        distractionRange: visible ? rangeToIrradiance(power, beam, ICAO_LEVELS.laserFree) : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // 5 mW at 532 nm, 1.5 mm, 1.2 mrad, 10 m: 5 mW is 5 × the 1 mW Class 2 limit, so Class 3R (rank 5).
      // Peak irradiance 8P/(πd²) with d = 1.5 mm + 10 m × 1.2 mrad = 13.5 mm: 0.04 W / 5.72555e-4 m² = 69.86225 W/m²
      // = 6986.2252 µW/cm².
      source: POINTER_SOURCES,
      basis: "computed",
      inputs: { power: 5, wavelength: 532, beamDia: 1.5, divergence: 1.2, distance: 10 },
      expect: { classRank: 5, peakIrradiance: 6986.225211 },
      tolerance: 1e-8,
    },
    {
      // The ICAO levels E: the beam is down to E at d = √(8P/(πE)) (0.112838 m, 0.504627 m, 5.046265 m for
      // 100 µW/cm², 5 µW/cm², 50 nW/cm² at 5 mW), reached at r = (d − 1.5 mm)/1.2 mrad.
      source: POINTER_SOURCES,
      basis: "computed",
      inputs: { power: 5, wavelength: 532, beamDia: 1.5, divergence: 1.2 },
      expect: { flashBlindRange: 92.78159726, glareRange: 419.272087, distractionRange: 4203.970871 },
      tolerance: 1e-8,
    },
  ],
});
