import {
  diffuseExposure, diffuseHazardDistance, nominalOcularHazardDistance, requiredOpticalDensity, roundBeam,
} from "../../physics/laser-safety/hazard-distance";
import { defineSchema } from "../types";
import { EXPOSURE, ICNIRP_2013, WAVELENGTH } from "./common";

const DIFFUSE = "ANSI Z136.1-2014 and IEC TR 60825-14: Lambertian reflected power ρP, α = d₆₃/r with d₆₃ = d/√2 " +
  `(IEC 60825-1); limits from ${ICNIRP_2013}, Table 5.`;

export default defineSchema({
  href: "/laser-safety/industrial-laser-safety",
  inputs: [
    { key: "power", label: "Power", unit: "W", toSI: 1, siUnit: "W", default: 4000, min: 0, max: 1e9 },
    { ...WAVELENGTH, default: 1070 },
    { key: "beamDia", label: "Beam diameter at the exit, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.001, max: 1e4 },
    { key: "divergence", label: "Divergence, 1/e² full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 2, min: 0, max: 1000 },
    { key: "materialReflectivity", label: "Workpiece diffuse reflectance", unit: "%", toSI: 0.01, siUnit: "", default: 30, min: 0, max: 100 },
    { key: "workingDistance", label: "Viewing distance from the spot", unit: "m", toSI: 1, siUnit: "m", default: 0.3, min: 0.01, max: 1e4 },
    { ...EXPOSURE, key: "exposureTime", default: 10 },
    { key: "spotDia", label: "Focused spot on the workpiece, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.3, min: 0.001, max: 1e4 },
  ],
  outputs: [
    { key: "nohdDirect", label: "NOHD of the direct beam (0: within the limits at the exit)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "odDirect", label: "Optical density for the direct beam", unit: "", toSI: 1, siUnit: "" },
    { key: "reflectedPower", label: "Reflected power ρP", unit: "W", toSI: 1, siUnit: "W" },
    { key: "diffuseDistance", label: "Diffuse hazard distance (0: none)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "diffuseRatio", label: "Diffuse exposure / limit at the viewing distance", unit: "", toSI: 1, siUnit: "" },
    { key: "alpha", label: "Spot subtense α at the viewing distance", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "odDiffuse", label: "Optical density for the diffuse reflection", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ power, wavelength, beamDia, divergence, materialReflectivity, workingDistance, exposureTime, spotDia }) {
    const reflectedP = materialReflectivity * power;
    const beam = roundBeam(beamDia, divergence);
    const direct = nominalOcularHazardDistance(wavelength, power, beam, exposureTime);
    const odDirect = requiredOpticalDensity(wavelength, power, beamDia, exposureTime);
    const diffuseDistance = diffuseHazardDistance(wavelength, reflectedP, spotDia, exposureTime);
    const diffuse = diffuseExposure(wavelength, reflectedP, spotDia, workingDistance, exposureTime);
    const warnings: string[] = [];
    if (Number.isNaN(direct.distance) || Number.isNaN(odDirect.od) || Number.isNaN(diffuseDistance.distance) || diffuse.limits.length === 0) {
      warnings.push("The eye limits cover 180 nm to 1 mm.");
      return {
        values: {
          nohdDirect: NaN, odDirect: NaN, reflectedPower: reflectedP, diffuseDistance: NaN, diffuseRatio: NaN, alpha: NaN, odDiffuse: NaN,
        },
        warnings,
      };
    }
    if (direct.distance === Infinity) warnings.push("The beam doesn't spread (φ = 0): the direct hazard extends to any range.");
    else if (direct.distance === 0) warnings.push("Within the limits at the exit: no direct hazard distance.");
    const diffuseRatio = Math.max(...diffuse.limits.map((l) => l.ratio));
    return {
      values: {
        nohdDirect: direct.distance,
        odDirect: odDirect.od,
        reflectedPower: reflectedP,
        diffuseDistance: diffuseDistance.distance,
        diffuseRatio,
        alpha: diffuse.alpha,
        odDiffuse: Math.max(0, Math.log10(diffuseRatio)),
      },
      warnings,
    };
  },
  checks: [
    {
      // ρP = 0.30 × 4000 W = 1200 W; d₆₃ = 0.3 mm/√2, α = d₆₃/r = 0.3e-3/(√2 × 0.3 m) = 0.70711 mrad.
      source: DIFFUSE,
      basis: "computed",
      inputs: {},
      expect: { reflectedPower: 1200, alpha: 0.7071067811865475 },
      tolerance: 1e-8,
    },
  ],
});
