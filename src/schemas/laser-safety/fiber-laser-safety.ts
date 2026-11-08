import {
  effectiveDiameterAt, fiberModeNonParaxial, fiberOutputDivergence, nominalOcularHazardDistance, requiredOpticalDensity, roundBeam,
} from "../../physics/laser-safety/hazard-distance";
import { peakIrradiance } from "../../physics/laser-safety/visual-interference";
import { defineSchema } from "../types";
import { EXPOSURE, ICNIRP_2013, WAVELENGTH } from "./common";

const GAUSSIAN = "Gaussian beam divergence φ = 2λ/(πw₀) from the waist w₀ = d/2 (Siegman, Lasers, University Science Books, 1986, ch. 17); " +
  `multimode output filling the numerical aperture, φ = 2 tan(asin NA); limits from ${ICNIRP_2013}, Table 5.`;

export default defineSchema({
  href: "/laser-safety/fiber-laser-safety",
  choices: [
    {
      key: "fiberType",
      label: "Fiber type",
      options: [
        { value: "single", label: "Single-mode" },
        { value: "multi", label: "Multimode" },
      ],
      default: "single",
    },
  ],
  inputs: [
    { key: "power", label: "Launched power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 1000, min: 0, max: 1e9 },
    { ...WAVELENGTH, default: 1064 },
    { key: "fiberCoreDia", label: "Mode-field / core diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 1, max: 1e4 },
    { key: "fiberLength", label: "Fiber length", unit: "m", toSI: 1, siUnit: "m", default: 10, min: 0, max: 1e6 },
    { key: "attenuation", label: "Attenuation", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 0.2, min: 0, max: 1e4 },
    { key: "na", label: "Numerical aperture (multimode only)", unit: "", toSI: 1, siUnit: "", default: 0.12, min: 0, max: 0.99 },
    { ...EXPOSURE, key: "exposureTime", default: 10 },
    { key: "viewingDistance", label: "Viewing distance", unit: "m", toSI: 1, siUnit: "m", default: 0.1, min: 0, max: 1e4 },
  ],
  outputs: [
    { key: "outputPower", label: "Power out of the fiber", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "lossDb", label: "Fiber loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "divergence", label: "Beam divergence, 1/e² full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "nohd", label: "Nominal ocular hazard distance (0: within the limits at the fiber end)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "peakIrradiance", label: "Peak irradiance at the fiber end", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "opticalDensity", label: "Optical density needed at the viewing distance", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ fiberType, power, wavelength, fiberCoreDia, fiberLength, attenuation, na, exposureTime, viewingDistance }) {
    const multimode = fiberType === "multi";
    const lossDb = (attenuation * fiberLength) / 1000;
    const P = power * Math.pow(10, -lossDb / 10);
    const phi = fiberOutputDivergence(wavelength, fiberCoreDia, na, multimode);
    const beam = roundBeam(fiberCoreDia, phi, "gaussian");
    const nohd = nominalOcularHazardDistance(wavelength, P, beam, exposureTime);
    const od = requiredOpticalDensity(wavelength, P, effectiveDiameterAt(beam, viewingDistance), exposureTime);
    const warnings: string[] = [];
    if (!multimode && fiberModeNonParaxial(wavelength, fiberCoreDia)) {
      warnings.push("MFD close to the wavelength: the paraxial divergence λ/(πw₀) overstates the spread, so the NOHD is understated.");
    }
    if (Number.isNaN(nohd.distance) || Number.isNaN(od.od)) {
      warnings.push("The eye limits cover 180 nm to 1 mm.");
      return { values: { outputPower: P, lossDb, divergence: phi, nohd: NaN, peakIrradiance: NaN, opticalDensity: NaN }, warnings };
    }
    if (nohd.distance === Infinity) warnings.push("The beam doesn't spread: the hazard extends to any range.");
    else if (nohd.distance === 0) warnings.push("Within the limits at the fiber end: no hazard distance.");
    return {
      values: {
        outputPower: P,
        lossDb,
        divergence: phi,
        nohd: nohd.distance,
        peakIrradiance: peakIrradiance(P, fiberCoreDia),
        opticalDensity: od.od,
      },
      warnings,
    };
  },
  checks: [
    {
      // λ = 1064 nm, MFD 10 µm (w₀ = 5 µm): φ = 2 × 1.064e-6/(π × 5e-6) = 0.135473 rad = 135.473 mrad.
      // Loss 0.2 dB/km × 10 m = 0.002 dB: 1000 mW × 10^(−0.0002) = 999.540 mW.
      source: GAUSSIAN,
      basis: "computed",
      inputs: {},
      expect: { divergence: 135.4726875598213, lossDb: 0.002, outputPower: 999.5395890030878 },
      tolerance: 1e-8,
    },
    {
      // Multimode, NA 0.12: φ = 2 tan(asin 0.12) = 2 × 0.12/√(1 − 0.12²) = 0.241747 rad = 241.747 mrad.
      source: GAUSSIAN,
      basis: "computed",
      inputs: { fiberType: "multi", na: 0.12 },
      expect: { divergence: 241.7468892076141 },
      tolerance: 1e-8,
    },
  ],
});
