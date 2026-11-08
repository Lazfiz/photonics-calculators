import {
  blazeAngleFromLittrow, blazeWavelength, gratingAngularDispersion, gratingDiffractionAngle,
  gratingReciprocalLinearDispersion, overlapFreeLimit, scalarBlazeEfficiency,
} from "../../physics/spectroscopy/spectral-resolution";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

const PALMER =
  "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., Newport Corporation, ch. 2: grating equation " +
  "mλ = d(sin α + sin β), angular dispersion dβ/dλ = m/(d cos β), reciprocal linear dispersion d cos β/(m f), R = mN.";
const CASINI =
  "Casini R., Nelson P. G. (2014). On the intensity distribution function of blazed reflective diffraction gratings. " +
  "J. Opt. Soc. Am. A 31, 2179–2184, doi:10.1364/JOSAA.31.002179, eq. 19 (blaze wavelength d[sin α + sin(2φ − α)]/m).";

export default defineSchema({
  href: "/spectroscopy/dispersive-element",
  inputs: [
    { key: "grooveDensity", label: "Groove density", unit: "lines/mm", toSI: 1e3, siUnit: "1/m", default: 1200, min: 10, max: 6000 },
    { key: "order", label: "Diffraction order m", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 10 },
    { key: "incidentAngle", label: "Incidence angle α", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: 0, max: 85 },
    { key: "wavelengthMin", label: "λ min", unit: "nm", toSI: 1e-9, siUnit: "m", default: 400, min: 100, max: 20000 },
    { key: "wavelengthMax", label: "λ max", unit: "nm", toSI: 1e-9, siUnit: "m", default: 700, min: 100, max: 20000 },
    { key: "blazeWavelength", label: "Blaze wavelength, 1st-order Littrow", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 100, max: 20000 },
    { key: "focalLength", label: "Camera focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: 10, max: 5000 },
  ],
  outputs: [
    { key: "grooveSpacing", label: "Groove spacing d", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "betaCentre", label: "Diffraction angle β at the band centre", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "angularDispersion", label: "Angular dispersion at the centre", unit: "°/nm", toSI: DEG * 1e9, siUnit: "rad/m" },
    { key: "reciprocalDispersion", label: "Reciprocal linear dispersion at the centre", unit: "nm/mm", toSI: 1e-6, siUnit: "" },
    { key: "blazeAngle", label: "Blaze angle φ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "blazeAtIncidence", label: "Blaze wavelength at α (order m)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "efficiency", label: "Scalar efficiency at the centre", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "resolvingPowerPerMm", label: "Resolving power per mm of illuminated width", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ wavelengthMin, wavelengthMax }) {
    return wavelengthMax > wavelengthMin ? undefined : "wavelengthMax must be larger than wavelengthMin.";
  },
  compute({ grooveDensity, order: orderRaw, incidentAngle, wavelengthMin, wavelengthMax, blazeWavelength: blazeLambda, focalLength }) {
    const order = Math.round(orderRaw);
    const d = 1 / grooveDensity;
    const centre = (wavelengthMin + wavelengthMax) / 2;
    const betaC = gratingDiffractionAngle(centre, d, order, incidentAngle);
    const phi = blazeAngleFromLittrow(blazeLambda, d);
    const lambdaB = Number.isFinite(phi) ? blazeWavelength(d, order, phi, incidentAngle) : NaN;
    const eff = Number.isFinite(phi) ? scalarBlazeEfficiency(centre, d, order, phi, incidentAngle) : NaN;
    const cutoff = (d * (1 + Math.sin(incidentAngle))) / order; // β = 90°
    const overlapFree = overlapFreeLimit(wavelengthMin, order);

    const warnings: string[] = [];
    if (wavelengthMax > cutoff) warnings.push(`Order ${order} grazes the grating at ${(cutoff * 1e9).toPrecision(4)} nm (β = 90°) and does not propagate above it.`);
    if (wavelengthMax > overlapFree) warnings.push(`Order overlap: the band is clean only up to ${(overlapFree * 1e9).toPrecision(4)} nm (λ_min (m + 1)/m); use an order-sorting filter.`);
    if (!Number.isFinite(betaC)) warnings.push("Order does not propagate at the band centre.");
    if (!Number.isFinite(phi)) warnings.push("Blaze wavelength exceeds 2d: no blaze angle.");
    if (centre / d >= 0.2) warnings.push("λ/d ≥ 0.2: the scalar efficiency is only an estimate; real efficiency depends on polarization.");

    return {
      values: {
        grooveSpacing: d,
        betaCentre: betaC,
        angularDispersion: gratingAngularDispersion(d, order, betaC),
        reciprocalDispersion: gratingReciprocalLinearDispersion(d, order, betaC, focalLength),
        blazeAngle: phi,
        blazeAtIncidence: lambdaB,
        efficiency: eff,
        resolvingPowerPerMm: (order * grooveDensity) / 1e3,
      },
      warnings,
    };
  },
  checks: [
    {
      // d = 1 mm/1200 = 0.8333333 µm, centre λ = 550 nm: sin β = mλ/d − sin α = 0.66 − 0.7071068 = −0.0471068, β = −2.70002°;
      // dβ/dλ = 1/(d cos β) = 1/(833.333 nm · 0.998890) = 1.20133e-3 rad/nm = 0.068831 °/nm;
      // dλ/dx = d cos β/(m f) = 833.333 nm · 0.998890/100 mm = 8.32408 nm/mm.
      source: PALMER,
      basis: "computed",
      inputs: {},
      expect: { grooveSpacing: 0.8333333333333334, betaCentre: -2.700018955975521, angularDispersion: 0.06883134789112719, reciprocalDispersion: 8.324082161475168 },
      tolerance: 1e-8,
    },
    {
      // sin φ = λ_B/(2d) = 550/1666.667 = 0.33, φ = 19.26878°; at α = 45°: λ_b = d[sin 45° + sin(2φ − 45°)]
      // = 833.333 nm · (0.7071068 + sin(−6.46245°) = −0.1125) = 495.462 nm.
      source: CASINI,
      basis: "computed",
      inputs: {},
      expect: { blazeAngle: 19.26877549148377, blazeAtIncidence: 495.46230586996137 },
      tolerance: 1e-8,
    },
  ],
});
