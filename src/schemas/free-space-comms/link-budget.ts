import {
  apertureGain, freeSpacePathLoss, friisReceivedPower, gaussianTxGain, toDb,
} from "../../physics/free-space-comms/link-budget";
import { pointingCapture } from "../../physics/free-space-comms/pointing-loss";
import { waistFromDivergence } from "../../physics/wave-optics/gaussian-beam";
import { defineSchema } from "../types";

const FRIIS = "Friis H. T. (1946). A note on a simple transmission formula. Proc. IRE 34(5), 254–256: " +
  "P_r = P_t G_t G_r (λ/(4πR))²; Gaussian-beam transmit gain G_t = 8/θ² for far-field 1/e² half-angle θ and receive gain " +
  "(πD/λ)² of an aperture (Degnan J. J., Klein B. J. (1974). Appl. Opt. 13(10), 2397–2401).";
const SIEGMAN = "Siegman A. E. (1986). Lasers. University Science Books, ch. 17 (Gaussian beams): w₀ = λ/(πθ), " +
  "w²(z) = w₀²[1 + (z/z_R)²], z_R = πw₀²/λ, and the power through a circular aperture of radius a, 1 − exp(−2a²/w²).";

export default defineSchema({
  href: "/free-space-comms/link-budget",
  inputs: [
    { key: "txPower", label: "TX power", unit: "dBm", toSI: 1, siUnit: "dBm", default: 10, min: -10, max: 30 },
    { key: "divergence", label: "TX divergence, full angle, 1/e²", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 2, min: 0.05, max: 10 },
    { key: "rxAperture", label: "RX aperture diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 1, max: 50 },
    { key: "range", label: "Range", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.05, max: 10 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 780, max: 1600 },
    { key: "atmosphere", label: "Atmospheric attenuation", unit: "dB/km", toSI: 1e-3, siUnit: "dB/m", default: 3, min: 0, max: 100 },
    { key: "misc", label: "Miscellaneous loss (optics, pointing)", unit: "dB", toSI: 1, siUnit: "dB", default: 2, min: 0, max: 20 },
    { key: "sensitivity", label: "RX sensitivity", unit: "dBm", toSI: 1, siUnit: "dBm", default: -30, min: -60, max: 0 },
  ],
  outputs: [
    { key: "txGain", label: "TX gain 8/θ²", unit: "dBi", toSI: 1, siUnit: "dBi" },
    { key: "rxGain", label: "RX gain (πD/λ)²", unit: "dBi", toSI: 1, siUnit: "dBi" },
    { key: "fspl", label: "Free-space path loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "atmosphericLoss", label: "Atmospheric loss over the range", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "receivedPower", label: "Received power (exact Gaussian capture)", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "friisPower", label: "Received power by Friis (capped at P_t)", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "margin", label: "Margin over the receiver sensitivity", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ txPower, divergence, rxAperture, range, wavelength, atmosphere, misc, sensitivity }) {
    // The page's atmosphere is dB/km and its range km; here both are SI (dB/m, m).
    const halfAngle = divergence / 2;
    const gt = gaussianTxGain(halfAngle), gr = apertureGain(rxAperture, wavelength);
    const friis = friisReceivedPower(1e-3 * 10 ** (txPower / 10), gt, gr, range, wavelength);
    const exact = pointingCapture(wavelength, waistFromDivergence(wavelength, halfAngle), range, rxAperture, 0, 0).alignedFraction;
    const atmos = atmosphere * range;
    const other = atmos + misc;
    const received = txPower + toDb(exact) - other;
    const warnings: string[] = [];
    if (friis.capped) warnings.push("The Friis value exceeds the transmit power: friisPower is capped at P_t.");
    const friisPower = toDb(friis.power / 1e-3) - other;
    if (friisPower - received > 0.1) {
      warnings.push("Friis overestimates this link by more than 0.1 dB: the receiver is inside the beam's Rayleigh range or catches a large part of it; receivedPower is the exact Gaussian capture.");
    }
    return {
      values: {
        txGain: toDb(gt),
        rxGain: toDb(gr),
        fspl: toDb(freeSpacePathLoss(range, wavelength)),
        atmosphericLoss: atmos,
        receivedPower: received,
        friisPower,
        margin: received - sensitivity,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: θ/2 = 1 mrad, G_t = 8/θ² = 69.03090 dBi; G_r = (π·0.1/1.55e-6)² = 106.13636 dBi; FSPL (4π·1e3/1.55e-6)² = 198.17756 dB.
      // Exact capture: w₀ = λ/(π·1e-3) = 0.49339 mm, z_R = πw₀²/λ = 0.49339 m, w = w₀√(1 + (1e3/z_R)²) = 1.0000 m,
      // 1 − exp(−2·0.05²/w²) = 4.98752e-3 → −23.02115 dB; P_r = 10 − 23.02115 − 3 − 2 = −18.02115 dBm. Friis, far-field limit
      // G_t G_r/FSPL = 2D²/(θR)² = 0.005 → −23.01030 dB → −18.01030 dBm; margin −18.02115 + 30 = 11.97885 dB.
      source: SIEGMAN,
      basis: "computed",
      inputs: {},
      expect: { txGain: 69.03089986991944, rxGain: 106.13636349047684, fspl: 198.1775633170361, atmosphericLoss: 3, receivedPower: -18.021153849324264, friisPower: -18.010299956639813, margin: 11.978846150675736 },
      tolerance: 1e-8,
    },
    {
      // θ = 0.2 mrad, 10 cm receiver, 0.5 km: Friis G_t G_r/FSPL = 2 > 1, so it is capped at P_t (0 dB) and the exact capture
      // is lower: w₀ = λ/(π·1e-4) = 4.9339 mm, z_R = 49.3 m, w = 0.05002 m, 1 − exp(−2a²/w²) = 0.8647 → −0.6310 dB:
      // exact P_r = 10 − 0.63 − 1.5 − 2 = 5.85522 dBm against Friis 10 − 1.5 − 2 = 6.5 dBm; margin 35.85522 dB.
      source: SIEGMAN,
      basis: "computed",
      inputs: { divergence: 0.2, range: 0.5 },
      expect: { txGain: 89.03089986991944, atmosphericLoss: 1.5, receivedPower: 5.855220221205785, friisPower: 6.5, margin: 35.855220221205784 },
      tolerance: 1e-8,
    },
    {
      // Campus preset: 13 dBm, 2 mrad, 10 cm, 1.5 km, 3 dB/km, misc 3 dB: G_t = 69.03090 dBi, FSPL = 201.69939 dB, atmosphere 4.5 dB;
      // exact Gaussian capture −26.53695 dB (w ≈ θR/2 = 1.5 m), P_r = 13 − 26.53695 − 4.5 − 3 = −21.03695 dBm;
      // Friis (far-field limit, 2D²/(θR)² = 2.2222e-3) gives −21.03213 dBm; margin −21.03695 + 30 = 8.96305 dB.
      source: FRIIS,
      basis: "computed",
      inputs: { txPower: 13, divergence: 2, rxAperture: 10, range: 1.5, wavelength: 1550, atmosphere: 3, misc: 3 },
      expect: { fspl: 201.69938849814972, atmosphericLoss: 4.5, receivedPower: -21.036950207721546, friisPower: -21.032125137753436, margin: 8.963049792278454 },
      tolerance: 1e-8,
    },
  ],
});
