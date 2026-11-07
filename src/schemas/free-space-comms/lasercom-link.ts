import {
  apertureGain, fraunhoferDistance, freeSpacePathLoss, friisReceivedPower, toDb,
} from "../../physics/free-space-comms/link-budget";
import { defineSchema } from "../types";

const FRIIS = "Friis H. T. (1946). A note on a simple transmission formula. Proc. IRE 34(5), 254–256: " +
  "P_r = P_t G_t G_r (λ/(4πR))², with the aperture directivity G = (πD/λ)² η (Degnan J. J., Klein B. J. (1974). " +
  "Optical antenna gain. 2: Receiving antennas. Appl. Opt. 13(10), 2397–2401).";

export default defineSchema({
  href: "/free-space-comms/lasercom-link",
  inputs: [
    { key: "txPower", label: "TX power", unit: "dBm", toSI: 1, siUnit: "dBm", default: 20, min: -10, max: 50 },
    { key: "txAperture", label: "TX aperture diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 5, min: 0.1, max: 100 },
    { key: "rxAperture", label: "RX aperture diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.1, max: 1000 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 11000 },
    { key: "range", label: "Range", unit: "km", toSI: 1e3, siUnit: "m", default: 500, min: 0.001, max: 4e5 },
    { key: "txEfficiency", label: "TX antenna efficiency", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.01, max: 1 },
    { key: "rxEfficiency", label: "RX antenna efficiency", unit: "", toSI: 1, siUnit: "", default: 0.7, min: 0.01, max: 1 },
    { key: "pointingLoss", label: "Pointing loss", unit: "dB", toSI: 1, siUnit: "dB", default: 3, min: 0, max: 30 },
    { key: "atmosLoss", label: "Atmospheric loss", unit: "dB", toSI: 1, siUnit: "dB", default: 2, min: 0, max: 30 },
  ],
  outputs: [
    { key: "txGain", label: "TX gain", unit: "dBi", toSI: 1, siUnit: "dBi" },
    { key: "rxGain", label: "RX gain", unit: "dBi", toSI: 1, siUnit: "dBi" },
    { key: "fspl", label: "Free-space path loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "spotRadius", label: "Equivalent Gaussian spot radius (1/e²) at the receiver", unit: "m", toSI: 1, siUnit: "m" },
    { key: "receivedPower", label: "Received power", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "farFieldDistance", label: "TX far-field distance 2D²/λ", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "captured", label: "Share of the beam caught by the receiver, before the efficiencies", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ txPower, txAperture, rxAperture, wavelength, range, txEfficiency, rxEfficiency, pointingLoss, atmosLoss }) {
    const gt = apertureGain(txAperture, wavelength, 0, txEfficiency);
    const gr = apertureGain(rxAperture, wavelength, 0, rxEfficiency);
    const friis = friisReceivedPower(1e-3 * 10 ** (txPower / 10), gt, gr, range, wavelength, txEfficiency * rxEfficiency);
    const farField = fraunhoferDistance(txAperture, wavelength);
    const captured = friis.fraction / (txEfficiency * rxEfficiency);
    const warnings: string[] = [];
    if (friis.capped) warnings.push("The Friis value exceeds the transmit power times the efficiencies: the received power is capped there.");
    if (range < farField) warnings.push("The range is inside the far-field distance 2D²/λ of the transmitter, where the Friis formula overestimates the received power.");
    else if (captured > 0.1 && !friis.capped) warnings.push("The receiver catches more than 10 % of the beam by Friis, which only holds while it catches a small part.");
    return {
      values: {
        txGain: toDb(gt),
        rxGain: toDb(gr),
        fspl: toDb(freeSpacePathLoss(range, wavelength)),
        spotRadius: Math.sqrt(8 / gt) * range,
        receivedPower: toDb(friis.power / 1e-3) - pointingLoss - atmosLoss,
        farFieldDistance: farField,
        captured,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: G_t = (π·0.05/1.55e-6)² · 0.8 = 99.14666 dBi, G_r = (π·0.1/1.55e-6)² · 0.7 = 104.58734 dBi, FSPL = (4π·5e5/1.55e-6)² =
      // 252.15696 dB; P_r = 20 dBm + 99.14666 + 104.58734 − 252.15696 − 3 − 2 = −33.42296 dBm. Spot √(8/G_t) · R = 15.60206 m,
      // far field 2 · 0.05²/1.55e-6 = 3.22581 km, share caught G_t G_r/FSPL/(η_t η_r) = 2.567535e-5 = 2.567535e-3 %.
      source: FRIIS,
      basis: "computed",
      inputs: {},
      expect: { txGain: 99.14666344711665, rxGain: 104.58734389061942, fspl: 252.15696340375646, receivedPower: -33.4229560660204, spotRadius: 15.602055752390983, farFieldDistance: 3.2258064516129035, captured: 0.002567534963862996 },
      tolerance: 1e-8,
    },
    {
      // 1064 nm, 10 cm to 30 cm, 40 000 km, η = 1, no extra losses, 10 dBm: G_t = (π·0.1/1.064e-6)² = 109.40416 dBi,
      // G_r = (π·0.3/1.064e-6)² = 118.94659 dBi, FSPL (4π·4e7/1.064e-6)² = 293.48656 dB; P_r = 10 + 109.40416 + 118.94659 − 293.48656 = −55.13581 dBm.
      source: FRIIS,
      basis: "computed",
      inputs: { txPower: 10, txAperture: 10, rxAperture: 30, wavelength: 1064, range: 4e4, txEfficiency: 1, rxEfficiency: 1, pointingLoss: 0, atmosLoss: 0 },
      expect: { txGain: 109.40416489470209, rxGain: 118.94658998909534, fspl: 293.4865645478206, receivedPower: -55.13580966402316, spotRadius: 383.17462415646435, farFieldDistance: 18.79699248120301 },
      tolerance: 1e-8,
    },
  ],
});
