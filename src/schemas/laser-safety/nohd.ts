import { eyeLimits } from "../../physics/laser-safety/eye-exposure-limits";
import {
  limitSafeDiameter, nominalOcularHazardDistance, roundBeam, type BeamGrowth,
} from "../../physics/laser-safety/hazard-distance";
import { defineSchema } from "../types";
import { BEAM_DEFINITION, EXPOSURE, ICNIRP_2013, SAFETY_FACTOR, toOneOverESquared, WAVELENGTH } from "./common";

const ANSI_NOHD = "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers, Appendix B: " +
  "NOHD = (1/φ)√(4P/(π MPE) − a²) with 1/e diameter a and divergence φ (Eq. B51 of the 2007 edition, quoted in A. L. Augustoni, Sandia report SAND2007-5052, p. 31); " + `limits from ${ICNIRP_2013}, Table 5.`;

export default defineSchema({
  href: "/laser-safety/nohd",
  choices: [
    BEAM_DEFINITION,
    {
      key: "beamGrowth",
      label: "Beam growth with range r",
      options: [
        { value: "gaussian", label: "Gaussian √(a² + (rφ)²), waist at the aperture (ANSI Z136.1 NOHD)" },
        { value: "linear", label: "Linear a + rφ (shorter NOHD, less conservative)" },
      ],
      default: "gaussian",
    },
  ],
  inputs: [
    { key: "power", label: "Power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 100, min: 0, max: 1e9 },
    WAVELENGTH,
    EXPOSURE,
    { key: "beamDia", label: "Beam diameter at the aperture a", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.001, max: 1e4 },
    { key: "divergence", label: "Full-angle divergence φ", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1, min: 0, max: 1000 },
    SAFETY_FACTOR,
  ],
  outputs: [
    { key: "nohd", label: "Nominal ocular hazard distance (0: within the limits at the aperture)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "diameterAtNohd", label: "1/e² beam diameter at the NOHD (the smallest within the governing limit)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "rayleighRange", label: "a/φ: where a Gaussian beam is √2 wider than at the aperture", unit: "m", toSI: 1, siUnit: "m" },
  ],
  compute({ beamDefinition, beamGrowth, power, wavelength, exposure, beamDia, divergence, safetyFactor }) {
    const scale = toOneOverESquared(beamDefinition);
    const d = beamDia * scale;
    const phi = divergence * scale;
    // The safety factor divides every limit, which multiplies the power.
    const P = power * safetyFactor;
    const result = nominalOcularHazardDistance(wavelength, P, roundBeam(d, phi, beamGrowth as BeamGrowth), exposure);
    const governing = eyeLimits(wavelength).find((limit) => limit.kind === result.limiting);
    const nohd = result.distance;
    const warnings: string[] = [];
    if (Number.isNaN(nohd)) warnings.push("No ICNIRP limit applies at this wavelength and time.");
    else if (nohd === Infinity) warnings.push("The beam doesn't spread (φ = 0): the hazard extends to any range.");
    else if (nohd === 0) warnings.push("Within the limits at the aperture: no hazard distance.");
    const hazard = Number.isFinite(nohd) && nohd > 0 && governing !== undefined;
    return {
      values: {
        nohd,
        diameterAtNohd: hazard ? limitSafeDiameter(governing, P, exposure) : NaN,
        rayleighRange: d / phi,
      },
      warnings,
    };
  },
  checks: [
    {
      // 532 nm, 1 W, 1 mm and 1 mrad (1/e²), 0.25 s: MPE 18 t^0.75/t = 25.46 W/m²; with the 1/e values a/√2 and
      // φ/√2 ANSI's (1/φ)√(4P/(π MPE) − a²) gives 316.28 m. The page averages the Gaussian over 7 mm: 316.20 m.
      source: ANSI_NOHD,
      basis: "computed",
      inputs: { power: 1000, wavelength: 532, exposure: 0.25, beamDia: 1, divergence: 1, beamDefinition: "1/e2" },
      expect: { nohd: 316.28 },
      tolerance: 5e-4,
    },
    {
      // The same with linear growth a + rφ: (√(4P/(π MPE)) − a)/φ = 315.28 m, 1 m shorter; the page gives 315.21 m.
      source: `${ICNIRP_2013}, Tables 5 and 8; linear growth a + rφ, NOHD = (√(4P/(π MPE)) − a)/φ with 1/e values.`,
      basis: "computed",
      inputs: { power: 1000, wavelength: 532, exposure: 0.25, beamDia: 1, divergence: 1, beamDefinition: "1/e2", beamGrowth: "linear" },
      expect: { nohd: 315.28 },
      tolerance: 5e-4,
    },
    {
      // 10.6 µm, 10 W, 5 mm, 2 mrad, 10 s: the corneal 5.6×10³ t^0.25 J/m² at 10 s over 1.5 × 10^0.375 mm binds;
      // d = 0.15988 m (worked in tests/laser-safety-hazard-distance.test.ts), NOHD = √(d² − (5 mm)²)/2 mrad = 79.90 m.
      source: `${ICNIRP_2013}, Tables 5 and 8; Gaussian growth √(a² + (rφ)²), ANSI Z136.1 Appendix B's NOHD (Eq. B51 of the 2007 edition, quoted in A. L. Augustoni, Sandia report SAND2007-5052, p. 31).`,
      basis: "computed",
      inputs: { power: 1e4, wavelength: 10600, exposure: 10, beamDia: 5, divergence: 2 },
      expect: { nohd: 79.896, diameterAtNohd: 159.87 },
      tolerance: 2e-4,
    },
  ],
});
