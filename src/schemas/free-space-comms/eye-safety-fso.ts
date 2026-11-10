import { eyeLimits, limitMaxPower, T_MAX, T_MIN } from "../../physics/laser-safety/eye-exposure-limits";
import { effectiveDiameterAt, nominalOcularHazardDistance, roundBeam } from "../../physics/laser-safety/hazard-distance";
import { defineSchema } from "../types";

const ICNIRP = "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and " +
  "1,000 µm. Health Phys. 105(3), 271–295, Table 5 (1500–1800 nm: 10⁴ J/m² up to 10 s, 1000 W/m² beyond; corneal " +
  "aperture 1 mm, 1.5 t^0.375 mm, 3.5 mm) and Table 8; Gaussian beam averaged over the aperture, growing as √(a² + (rφ)²): ANSI Z136.1 Appendix B's NOHD " +
  "(1/φ)√(4P/(π MPE) − a²) (Eq. B51 of the 2007 edition, quoted in Sandia report SAND2007-5052, p. 31).";

export default defineSchema({
  href: "/free-space-comms/eye-safety-fso",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 180, max: 1e6 },
    { key: "txPower", label: "TX power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 100, min: 0, max: 1e7 },
    { key: "beamDia", label: "Beam diameter at the aperture (1/e²)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0, max: 1000 },
    { key: "beamDivergence", label: "Beam divergence (1/e² full angle)", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 0.5, min: 0, max: 1000 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: T_MIN, max: T_MAX },
    { key: "distance", label: "Check distance", unit: "m", toSI: 1, siUnit: "m", default: 2, min: 0, max: 1e6 },
  ],
  outputs: [
    { key: "nohd", label: "Nominal ocular hazard distance (0: within every limit at the aperture)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "margin", label: "Margin at the check distance: largest power within every limit ÷ TX power (below 1 exceeds a limit)", unit: "", toSI: 1, siUnit: "" },
    { key: "maxPowerAtDistance", label: "Largest power within every limit at the check distance", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "beamDiameterAtDistance", label: "1/e² beam diameter at the check distance, √(a² + (rφ)²)", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ wavelength, txPower, beamDia, beamDivergence, exposureTime, distance }) {
    const beam = roundBeam(beamDia, beamDivergence);
    const limits = eyeLimits(wavelength);
    const nohd = nominalOcularHazardDistance(wavelength, txPower, beam, exposureTime).distance;
    const dr = effectiveDiameterAt(beam, distance);
    const perLimit = limits.map((limit) => limitMaxPower(limit, dr, exposureTime));
    const pMax = perLimit.length > 0 ? Math.min(...perLimit) : NaN;
    const margin = perLimit.length > 0 && txPower > 0 ? pMax / txPower : Infinity;
    const warnings: string[] = [];
    if (Number.isNaN(nohd)) warnings.push("No ICNIRP eye limit applies at this wavelength and time.");
    else if (nohd === Infinity) warnings.push("The beam doesn't spread (φ = 0): the hazard extends to any range.");
    else if (nohd === 0) warnings.push("Within every limit at the aperture: no hazard distance.");
    if (margin === Infinity) warnings.push("Zero TX power: no limit is approached, the margin is unbounded.");
    else if (margin < 1) warnings.push("The exposure at the check distance exceeds an eye limit (margin below 1).");
    return { values: { nohd, margin, maxPowerAtDistance: pMax, beamDiameterAtDistance: dr }, warnings };
  },
  checks: [
    {
      // 1550 nm, 100 s, 100 mW, a = 10 mm, φ = 0.5 mrad: the limit is 1000 W/m² over the 3.5 mm aperture, 1 − exp(−2r_a²/w²) =
      // E π r_a²/P gives w = 7.78125 mm (1/e² diameter 15.5625 mm), NOHD = √(15.5625² − 10²) mm/0.5 mrad = 23.849 m.
      // At 2 m the beam is √(10² + 1²) = 10.04988 mm: P_max = E π r_a²/(1 − exp(−2r_a²/w²)) = 9.62113 mW/0.215417
      // = 44.663 mW, margin 0.4467.
      // The 10 s end of the 1.5 t^0.375 mm aperture (15.549 mm) gives a slightly smaller diameter.
      source: ICNIRP,
      basis: "computed",
      inputs: { wavelength: 1550, txPower: 100, beamDia: 10, beamDivergence: 0.5, exposureTime: 100, distance: 2 },
      expect: { nohd: 23.84880792523596, margin: 0.44667467023707097, maxPowerAtDistance: 44.6674670237071, beamDiameterAtDistance: 10.049875621120888 },
      tolerance: 1e-6,
    },
    {
      // 1550 nm, 300 s, 500 mW, a = 25 mm, φ = 0.2 mrad, at 50 m: 3.5 mm aperture at 1000 W/m², diameter 35.50986 mm,
      // NOHD = √(35.50986² − 25²) mm/0.2 mrad = 126.09 m; beam at 50 m √(25² + 10²) = 26.92582 mm: P_max = 9.62113 mW/
      // (1 − exp(−2·1.75²/13.46291²)) = 289.55 mW, margin 0.5791.
      source: ICNIRP,
      basis: "computed",
      inputs: { wavelength: 1550, txPower: 500, beamDia: 25, beamDivergence: 0.2, exposureTime: 300, distance: 50 },
      expect: { nohd: 126.09023314833574, margin: 0.5790889828929346, beamDiameterAtDistance: 26.92582403567252 },
      tolerance: 1e-6,
    },
  ],
});
