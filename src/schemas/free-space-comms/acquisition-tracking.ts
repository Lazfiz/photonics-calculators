import { quadCellNea, rasterScan, squareCoverage, stareProbability } from "../../physics/free-space-comms/acquisition";
import { defineSchema } from "../types";

const TYLER_FRIED = "Tyler G. A., Fried D. L. (1982). Image-position error associated with a quadrant detector. " +
  "J. Opt. Soc. Am. 72(6), 804–808: rms error (3π/16)(λ/D)/SNR for a point source.";

export default defineSchema({
  href: "/free-space-comms/acquisition-tracking",
  inputs: [
    { key: "fov", label: "Receiver FOV, full angle", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1, min: 0.001, max: 100 },
    { key: "uncertainty", label: "Pointing uncertainty, 3σ radius", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 5, min: 0.001, max: 100 },
    { key: "scanRate", label: "Scan rate", unit: "°/s", toSI: Math.PI / 180, siUnit: "rad/s", default: 10, min: 0.001, max: 1000 },
    { key: "beaconPower", label: "Beacon power at the receiver", unit: "dBm", toSI: 1, siUnit: "dBm", default: -30, min: -150, max: 50 },
    { key: "rxSensitivity", label: "Receiver sensitivity", unit: "dBm", toSI: 1, siUnit: "dBm", default: -40, min: -150, max: 50 },
    { key: "detectorNoise", label: "Tracking noise NEP·√B", unit: "nW", toSI: 1e-9, siUnit: "W", default: 100, min: 0.000001, max: 1e9 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
    { key: "aperture", label: "Tracking aperture diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.01, max: 1000 },
  ],
  outputs: [
    { key: "stareProbability", label: "Stare acquisition probability", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "squareCoverage", label: "Fraction of targets inside the 2U square", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "scanLines", label: "Raster scan lines", unit: "", toSI: 1, siUnit: "" },
    { key: "scanTime", label: "Raster scan time", unit: "s", toSI: 1, siUnit: "s" },
    { key: "beaconMargin", label: "Beacon margin over the receiver sensitivity", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "trackingSnr", label: "Tracking SNR (voltage), P_beacon / (NEP·√B)", unit: "", toSI: 1, siUnit: "" },
    { key: "nea", label: "Quadrant-detector NEA (rms per axis)", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "diffractionAngle", label: "Diffraction angle λ/D", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
  ],
  compute({ fov, uncertainty, scanRate, beaconPower, rxSensitivity, detectorNoise, wavelength, aperture }) {
    const sigma = uncertainty / 3;
    const scan = rasterScan(uncertainty, fov, scanRate);
    const snr = (1e-3 * 10 ** (beaconPower / 10)) / detectorNoise;
    return {
      values: {
        stareProbability: stareProbability(fov, sigma),
        squareCoverage: squareCoverage(uncertainty, sigma),
        scanLines: scan.lines,
        scanTime: scan.time,
        beaconMargin: beaconPower - rxSensitivity,
        trackingSnr: snr,
        nea: quadCellNea(wavelength, aperture, snr),
        diffractionAngle: wavelength / aperture,
      },
    };
  },
  checks: [
    {
      // Beacon −30 dBm = 1 µW over NEP·√B = 100 nW: SNR = 10. NEA = (3π/16)(1.55 µm/0.1 m)/10 = 0.913025 µrad; λ/D = 15.5 µrad.
      source: TYLER_FRIED,
      basis: "computed",
      inputs: { beaconPower: -30, detectorNoise: 100, wavelength: 1550, aperture: 10 },
      expect: { trackingSnr: 10, nea: 0.9130253649, diffractionAngle: 15.5, beaconMargin: 10 },
      tolerance: 1e-8,
    },
    {
      // Θ = 2 mrad, U = 3 mrad (σ = 1 mrad): P = 1 − exp(−(Θ/2)²/2σ²) = 1 − e^(−1/2) = 39.346934 %; N = ⌈2U/Θ⌉ = 3 lines of
      // 2U = 6 mrad at 10 °/s = 0.174533 rad/s: T = 3 × 6e-3 / 0.174533 = 0.1031324 s.
      source: "Papoulis A., Pillai S. U. (2002). Probability, Random Variables and Stochastic Processes, 4th ed. " +
        "McGraw-Hill: Rayleigh distribution F(r) = 1 − exp(−r²/2σ²) of the radial error of a circular Gaussian; " +
        "raster time N·2U/ω as defined on the page.",
      basis: "computed",
      inputs: { fov: 2, uncertainty: 3, scanRate: 10 },
      expect: { stareProbability: 39.34693403, scanLines: 3, scanTime: 0.1031324031 },
      tolerance: 1e-8,
    },
  ],
});
