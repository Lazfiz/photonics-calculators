import { airyPeakWidth } from "../../physics/thin-film/interference";
import {
  regularRingIncidence, ringCoefficientOfFinesse, ringFinesse, ringFsr, ringPhotonLifetime, ringPlaneMode,
  tiltedMirrorRadius,
} from "../../physics/wave-optics/ring-cavity";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

export default defineSchema({
  href: "/wave-optics/ring-cavity",
  inputs: [
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 11000 },
    { key: "roundTripLength", label: "Round-trip length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 300, min: 10, max: 1e5 },
    { key: "mirrorR", label: "Mirror radius of curvature R (concave)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1000, min: 1, max: 1e7 },
    { key: "numMirrors", label: "Number of mirrors N (regular polygon; rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 3, min: 3, max: 8 },
    { key: "outputCouplerR", label: "Output coupler reflectance R_oc", unit: "", toSI: 1, siUnit: "", default: 0.95, min: 0.01, max: 0.9999 },
    { key: "intracavityLoss", label: "Other loss per round trip (power fraction)", unit: "", toSI: 1, siUnit: "", default: 0.01, min: 0, max: 0.99 },
  ],
  outputs: [
    { key: "fsr", label: "Free spectral range c/L", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
    { key: "roundTripFactor", label: "Round-trip power factor ρ = R_oc(1 − loss)", unit: "", toSI: 1, siUnit: "" },
    { key: "finesse", label: "Finesse ℱ = π ρ^¼/(1 − √ρ)", unit: "", toSI: 1, siUnit: "" },
    { key: "linewidth", label: "Linewidth (FWHM)", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
    { key: "photonLifetime", label: "Photon lifetime", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "incidenceAngle", label: "Angle of incidence on each mirror", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "radiusTangential", label: "Effective radius R_t = R cos α", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "radiusSagittal", label: "Effective radius R_s = R/cos α", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "mirrorSpotTangential", label: "Spot on mirrors, tangential", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "mirrorSpotSagittal", label: "Spot on mirrors, sagittal", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "waistTangential", label: "Waist mid-segment, tangential", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "waistSagittal", label: "Waist mid-segment, sagittal", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ wavelength, roundTripLength, mirrorR, numMirrors, outputCouplerR, intracavityLoss }) {
    const N = Math.round(numMirrors);
    const d = roundTripLength / N;
    const alpha = regularRingIncidence(N);
    const tan = ringPlaneMode(wavelength, d, mirrorR, alpha, "tangential");
    const sag = ringPlaneMode(wavelength, d, mirrorR, alpha, "sagittal");
    const rho = outputCouplerR * (1 - intracavityLoss);
    const fsr = ringFsr(roundTripLength);
    const fwhm = (fsr * airyPeakWidth(ringCoefficientOfFinesse(rho))) / (2 * Math.PI);
    const warnings: string[] = [];
    if (!(Number.isFinite(tan.w) && Number.isFinite(sag.w))) {
      warnings.push("No Gaussian mode: each plane needs 0 < d/R_eff < 2. The tangential plane fails first, at d = 2R cos α.");
    }
    return {
      values: {
        fsr,
        roundTripFactor: rho,
        finesse: ringFinesse(rho),
        linewidth: fwhm,
        photonLifetime: ringPhotonLifetime(roundTripLength, rho),
        incidenceAngle: alpha,
        radiusTangential: tiltedMirrorRadius(mirrorR, alpha, "tangential"),
        radiusSagittal: tiltedMirrorRadius(mirrorR, alpha, "sagittal"),
        mirrorSpotTangential: tan.w,
        mirrorSpotSagittal: sag.w,
        waistTangential: tan.w0,
        waistSagittal: sag.w0,
      },
      warnings,
    };
  },
  checks: [
    {
      // FSR = c/L = 299 792 458 m/s / 0.3 m = 999.3081933 MHz; ρ = 0.95 × 0.99 = 0.9405;
      // ℱ = π ρ^¼/(1 − √ρ) = 102.42203; τ = (L/c)/(−ln ρ) = 1.0007 ns/0.061346 = 16.312896 ns.
      source: "Siegman A. E. (1986). Lasers. University Science Books, ch. 11 (Fabry–Perot/ring resonator: FSR = c/L, finesse, photon lifetime).",
      basis: "computed",
      inputs: { roundTripLength: 300, outputCouplerR: 0.95, intracavityLoss: 0.01 },
      expect: { fsr: 999.3081933, finesse: 102.4220282, photonLifetime: 16.31289641 },
      tolerance: 1e-8,
    },
    {
      // N = 3: α = 90° − 60° = 30°, d = 100 mm, R_t = 1000 cos30° = 866.0254 mm, R_s = 1000/cos30° = 1154.7005 mm.
      // Spot on a mirror w² = (λd/π)/√(1 − m²), m = 1 − d/R_eff.
      source: "Kogelnik H. W., Ippen E. P., Dienes A., Shank C. V. (1972). Astigmatically compensated cavities for CW dye lasers. IEEE J. Quantum Electron. 8, 373–379, doi:10.1109/JQE.1972.1076964.",
      basis: "computed",
      inputs: { wavelength: 1064, roundTripLength: 300, mirrorR: 1000, numMirrors: 3 },
      expect: { incidenceAngle: 30, radiusTangential: 866.0254038, radiusSagittal: 1154.700538, mirrorSpotTangential: 269.4497437, mirrorSpotSagittal: 288.4442736 },
      tolerance: 1e-8,
    },
  ],
});
