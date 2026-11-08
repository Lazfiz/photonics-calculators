import { interlockTiming } from "../../physics/laser-safety/interlock";
import { defineSchema } from "../types";
import { ICNIRP_2013 } from "./common";

const ISO_13855 = "ISO 13855:2010, Safety of machinery – Positioning of safeguards with respect to the approach speeds of parts of the " +
  "human body, S = K·T (without the intrusion allowance C); K = 2.0 m/s for hands and arms; time to the first eye limit " +
  `from ${ICNIRP_2013}, Table 5.`;

export default defineSchema({
  href: "/laser-safety/interlock-design",
  inputs: [
    { key: "laserPower", label: "Laser power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 5000, min: 0, max: 1e9 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 180, max: 1e6 },
    { key: "beamDiam", label: "Beam diameter where it can be reached, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0, max: 1e4 },
    { key: "shutterTime", label: "Stopping time: guard opens → emission off", unit: "ms", toSI: 1e-3, siUnit: "s", default: 50, min: 0, max: 1e7 },
    { key: "accessDistance", label: "Distance from the opening to the beam", unit: "cm", toSI: 1e-2, siUnit: "m", default: 50, min: 0, max: 1e5 },
    { key: "approachSpeed", label: "Approach speed K", unit: "m/s", toSI: 1, siUnit: "m/s", default: 2, min: 0.01, max: 100 },
  ],
  outputs: [
    { key: "tMax", label: "Limit reached after (beam held on the eye)", unit: "s", toSI: 1, siUnit: "s" },
    { key: "accessTime", label: "Time to reach the beam, S/K", unit: "s", toSI: 1, siUnit: "s" },
    { key: "exposure", label: "Time the eye is in the beam before the stop, max(0, T − S/K)", unit: "s", toSI: 1, siUnit: "s" },
    { key: "latestStop", label: "Longest stopping time, S/K + t_max", unit: "s", toSI: 1, siUnit: "s" },
    { key: "minDistance", label: "Shortest distance for your stopping time, K·max(0, T − t_max)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "withinLimit", label: "1 if the eye's time in the beam is within the limit, else 0", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ laserPower, wavelength, beamDiam, shutterTime, accessDistance, approachSpeed }) {
    const r = interlockTiming(wavelength, laserPower, beamDiam, shutterTime, accessDistance, approachSpeed);
    const warnings: string[] = [];
    if (Number.isNaN(r.accessTime)) warnings.push("The eye limits cover 180 nm to 1 mm.");
    else if (r.tMax === Infinity) warnings.push("This beam stays within the eye limits for 30 000 s: the eye needs no interlock (skin and reflections aside).");
    else if (Number.isNaN(r.tMax)) warnings.push("The beam exceeds the eye limit within 1 ns: the shutter has to close before the beam can be reached (T ≤ S/K).");
    return {
      values: {
        tMax: r.tMax, accessTime: r.accessTime, exposure: r.exposure, latestStop: r.latestStop,
        minDistance: r.minDistance, withinLimit: r.within ? 1 : 0,
      },
      warnings,
    };
  },
  checks: [
    {
      // 1064 nm, 5 W, 5 mm (1/e²): retinal thermal limit H = 2×10⁻² C_C J/m² (C_C = 1 below 1150 nm) up to 13 µs, over a 7 mm aperture:
      // E = P(1 − exp(−2·7²/5²))/(π·3.5² mm²) = 1.27337×10⁵ W/m², t_max = 0.02/E = 1.5705417×10⁻⁷ s. S/K = 0.5 m / 2 m/s = 0.25 s;
      // T = 0.05 s < S/K, so no exposure; latest stop 0.25 + t_max = 0.2500001570542 s; minimum distance 2·(0.05 − t_max) = 0.0999996858917 m.
      source: ISO_13855,
      basis: "computed",
      inputs: {},
      expect: { tMax: 1.5705416663e-7, accessTime: 0.25, latestStop: 0.2500001570542, minDistance: 0.0999996858917, withinLimit: 1 },
      tolerance: 1e-8,
    },
    {
      // Same beam, S = 5 cm: S/K = 0.025 s, so the eye is in the beam T − S/K = 0.05 − 0.025 = 0.025 s, far over t_max: too slow.
      // Latest stop 0.025 + t_max = 0.0250001570542 s.
      source: ISO_13855,
      basis: "computed",
      inputs: { accessDistance: 5 },
      expect: { accessTime: 0.025, exposure: 0.025, latestStop: 0.0250001570542 },
      tolerance: 1e-8,
    },
  ],
});
