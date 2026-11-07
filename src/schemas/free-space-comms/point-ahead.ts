import { airyHalfAngle, lightTime, pointAheadAngle } from "../../physics/free-space-comms/point-ahead";
import { defineSchema } from "../types";

const CARRASCO = "Carrasco-Casado A., Mata-Calvo R. (2020). Space optical links for communication networks. In: Springer Handbook of " +
  "Optical Networks, pp. 1057–1103 (arXiv:2012.13166), §8.1.2 eq. (8.4): θ_PA = 2v/c, v the tangential velocity; §8.3 " +
  "(printed example): a 500 km LEO satellite at the zenith moves at 7.62 km/s, requiring a point-ahead angle of 51 µrad.";

export default defineSchema({
  href: "/free-space-comms/point-ahead",
  inputs: [
    { key: "range", label: "Link range", unit: "km", toSI: 1e3, siUnit: "m", default: 1000, min: 0.001, max: 1e9 },
    { key: "relVelocity", label: "Transverse relative velocity v⊥ (inertial)", unit: "km/s", toSI: 1e3, siUnit: "m/s", default: 7, min: 0, max: 100 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
    { key: "txAperture", label: "TX aperture diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.01, max: 1000 },
  ],
  outputs: [
    { key: "pointAhead", label: "Point-ahead angle 2v⊥/c", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "airyHalfAngle", label: "Diffraction half-angle 1.22λ/D", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "ratio", label: "Point-ahead / half-angle", unit: "", toSI: 1, siUnit: "" },
    { key: "missDistance", label: "Miss distance without point-ahead θ_PA R", unit: "m", toSI: 1, siUnit: "m" },
    { key: "lightTime", label: "One-way light time R/c", unit: "ms", toSI: 1e-3, siUnit: "s" },
  ],
  compute({ range, relVelocity, wavelength, txAperture }) {
    const theta = pointAheadAngle(relVelocity);
    const airy = airyHalfAngle(wavelength, txAperture);
    return {
      values: { pointAhead: theta, airyHalfAngle: airy, ratio: theta / airy, missDistance: theta * range, lightTime: lightTime(range) },
    };
  },
  checks: [
    {
      // 2 · 7.62 km/s / 299 792 458 m/s = 50.835 µrad, which the chapter prints as "51 µrad".
      source: CARRASCO,
      basis: "printed",
      inputs: { relVelocity: 7.62 },
      expect: { pointAhead: 51 },
      tolerance: 0.01,
    },
    {
      // v = 7.62 km/s, R = 1000 km, 1550 nm, D = 10 cm: θ = 50.835168 µrad; 1.22 · 1.55 µm / 0.1 m = 18.91 µrad, ratio 2.688269;
      // miss θ R = 50.835168 m; R/c = 3.3356410 ms.
      source: CARRASCO,
      basis: "computed",
      inputs: { range: 1000, relVelocity: 7.62, wavelength: 1550, txAperture: 10 },
      expect: { pointAhead: 50.835168108198374, airyHalfAngle: 18.91, ratio: 2.6882690697090625, missDistance: 50.835168108198374, lightTime: 3.3356409519815204 },
      tolerance: 1e-8,
    },
  ],
});
