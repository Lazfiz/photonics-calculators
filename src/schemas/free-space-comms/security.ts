import { divergenceHalfAngle } from "../../physics/wave-optics/gaussian-beam";
import { linkSecurity } from "../../physics/free-space-comms/physical-layer-security";
import { defineSchema } from "../types";

const SALEH_TEICH = "Saleh B. E. A., Teich M. C. (2019). Fundamentals of Photonics, 3rd ed. Wiley, §3.1 (Gaussian beam): " +
  "W(z) = W₀√(1 + (z/z₀)²), z₀ = πW₀²/λ, and the power within a circle of radius ρ centred on the axis, P[1 − exp(−2ρ²/W²)].";
const LEUNG_HELLMAN = "Leung-Yan-Cheong S. K., Hellman M. E. (1978). The Gaussian wire-tap channel. IEEE Trans. Inf. Theory 24(4), " +
  "451–456: C_s = B[log₂(1 + SNR_B) − log₂(1 + SNR_E)]⁺, with SNR = (P/(NEP·√B))² for NEP-limited receivers; Eve's power is the " +
  "beam's 2-D Gaussian intensity (σ = w/2 per axis) integrated over her offset aperture.";

export default defineSchema({
  href: "/free-space-comms/security",
  inputs: [
    { key: "txPower", label: "Transmit power", unit: "dBm", toSI: 1, siUnit: "dBm", default: 10, min: -60, max: 60 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
    { key: "txBeam", label: "Transmit beam diameter, 1/e² at the waist", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.01, max: 10000 },
    { key: "linkRange", label: "Bob's range", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 1e-6, max: 1e5 },
    { key: "rxAperture", label: "Bob's aperture diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.01, max: 1000 },
    { key: "eveDistance", label: "Eve's distance from the transmitter (at most Bob's range)", unit: "m", toSI: 1, siUnit: "m", default: 1000, min: 0, max: 1e8 },
    { key: "eveOffset", label: "Eve's offset from the beam axis", unit: "m", toSI: 1, siUnit: "m", default: 0.3, min: 0, max: 1e6 },
    { key: "eveAperture", label: "Eve's aperture diameter", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.01, max: 1000 },
    { key: "nep", label: "Receiver NEP (both receivers)", unit: "pW/√Hz", toSI: 1e-12, siUnit: "W/√Hz", default: 20, min: 1e-6, max: 1e9 },
    { key: "bandwidth", label: "Electrical bandwidth", unit: "GHz", toSI: 1e9, siUnit: "Hz", default: 1, min: 1e-9, max: 1e4 },
  ],
  outputs: [
    { key: "bobPower", label: "Bob's received power", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "evePower", label: "Eve's received power", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "bobBeamRadius", label: "Beam radius at Bob", unit: "m", toSI: 1, siUnit: "m" },
    { key: "eveBeamRadius", label: "Beam radius at Eve", unit: "m", toSI: 1, siUnit: "m" },
    { key: "powerRatioDb", label: "Bob / Eve power ratio", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "snrBob", label: "Bob's electrical SNR (linear)", unit: "", toSI: 1, siUnit: "" },
    { key: "snrEve", label: "Eve's electrical SNR (linear)", unit: "", toSI: 1, siUnit: "" },
    { key: "snrBobDb", label: "Bob's electrical SNR", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "snrEveDb", label: "Eve's electrical SNR", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "secrecy", label: "Secrecy capacity", unit: "Gb/s", toSI: 1e9, siUnit: "b/s" },
    { key: "divergence", label: "Beam divergence (full angle 2λ/(πw₀))", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
  ],
  compute(si) {
    const waist = si.txBeam / 2;
    const eveDistance = Math.min(si.eveDistance, si.linkRange); // Eve between the transmitter and Bob
    const r = linkSecurity({
      power: 1e-3 * 10 ** (si.txPower / 10), lambda: si.wavelength, waist, range: si.linkRange, bobAperture: si.rxAperture,
      eveDistance, eveOffset: si.eveOffset, eveAperture: si.eveAperture, nep: si.nep, bandwidth: si.bandwidth,
    });
    const warnings: string[] = [];
    if (si.eveDistance > si.linkRange) warnings.push("Eve's distance exceeds Bob's range: she is placed at Bob's range, as the page does.");
    if (!(r.evePower > 0)) warnings.push("Eve is outside the beam (received power 0): powerRatioDb and snrEveDb are null (Eve's SNR is 0).");
    return {
      values: {
        bobPower: r.bobPower,
        evePower: r.evePower,
        bobBeamRadius: r.bobBeamRadius,
        eveBeamRadius: r.eveBeamRadius,
        powerRatioDb: r.evePower > 0 && r.bobPower > 0 ? 10 * Math.log10(r.bobPower / r.evePower) : NaN,
        snrBob: r.snrBob,
        snrEve: r.snrEve,
        snrBobDb: r.snrBob > 0 ? 10 * Math.log10(r.snrBob) : NaN,
        snrEveDb: r.snrEve > 0 ? 10 * Math.log10(r.snrEve) : NaN,
        secrecy: r.secrecy,
        divergence: 2 * divergenceHalfAngle({ lambda: si.wavelength, w0: waist }),
      },
      warnings,
    };
  },
  checks: [
    {
      // 10 dBm, w₀ = 2.5 mm, z_R = πw₀²/λ = 12.668 m. Bob at 1 km on axis, 10 cm aperture: W = 0.1973680 m, fraction
      // 1 − exp(−2·0.05²/W²) = 0.1204599 → 1.204599 mW. Eve at 400 m on axis, 2 cm aperture: W = 0.0789804 m, fraction
      // 1 − exp(−2·0.01²/W²) = 0.0315535 → 0.3155349 mW (5.8180 dB below Bob). SNR = (P/(NEP√B))², NEP 20 pW/√Hz,
      // B = 1 GHz: 3.627648e6 and 2.489057e5; C_s = B[log₂(1 + 3.627648e6) − log₂(1 + 2.489057e5)] = 3.865358 Gb/s.
      source: SALEH_TEICH,
      basis: "computed",
      inputs: { eveDistance: 400, eveOffset: 0, eveAperture: 2 },
      expect: {
        bobPower: 1.2045992551127126, evePower: 0.3155349314842226, bobBeamRadius: 0.1973679634391423,
        eveBeamRadius: 0.07898042845375264, powerRatioDb: 5.817951452069654, snrBob: 3627648.4135452555, snrEve: 248905.7324668827,
        secrecy: 3.8653578782197366, divergence: 0.39470425886790045,
      },
      tolerance: 1e-7,
    },
    {
      // Defaults: Eve at 1 km (Bob's plane, W = 0.1973680 m, σ = W/2), 0.3 m off axis, 5 cm aperture radius. Her power is
      // P × ∫∫_disc exp(−|x|²/2σ²)/(2πσ²) dA, integrated over the disc in polar coordinates (3000 × 3000 midpoints):
      // fraction 1.565410e-3 → 0.01565410 mW, 18.86214 dB below Bob; SNR_E = 612.627 (27.87196 dB), SNR_B 65.59625 dB;
      // C_s = 1 GHz × [log₂(1 + 3.627648e6) − log₂(1 + 612.627)] = 12.52938 Gb/s.
      source: LEUNG_HELLMAN,
      basis: "computed",
      inputs: {},
      expect: { evePower: 0.015654103990527322, powerRatioDb: 18.86214375759822, snrEveDb: 27.8719643771287, snrBobDb: 65.59625189232513, secrecy: 12.52938444269516 },
      tolerance: 1e-5,
    },
  ],
});
