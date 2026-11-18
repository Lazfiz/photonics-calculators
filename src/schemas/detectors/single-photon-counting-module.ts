import { spcmSummary } from "../../physics/detectors/single-photon-counting-module";
import { defineSchema } from "../types";

const KNOLL = "Knoll G. F. (2010). Radiation Detection and Measurement, 4th ed., Wiley, ch. 4 §VII: non-paralyzable dead time m = R/(1 + Rτ). " +
  "Photon rate P·λ/(hc) × PDE plus the dark rate gives the avalanche rate R. Afterpulses: each recorded avalanche adds one with probability P_ap " +
  "(first order; Cova S., Lacaita A., Ripamonti G. (1991). Trapping phenomena in avalanche photodiodes on nanosecond scale. IEEE Electron Device " +
  "Lett. 12, 685–687, doi:10.1109/55.116955). Counting SNR from the renewal-process count variance Var N/N = 1/(1 + Rτ)² (Müller J. W. (1973). " +
  "Dead-time problems. Nucl. Instrum. Methods 112, 47–57, doi:10.1016/0029-554X(73)90773-8) with the Bernoulli afterpulse variance P_ap(1 − P_ap)/(1 + P_ap)².";

export default defineSchema({
  href: "/detectors/single-photon-counting-module",
  inputs: [
    { key: "deadTime", label: "Dead time", unit: "ns", toSI: 1e-9, siUnit: "s", default: 22, min: 1, max: 1e5 },
    { key: "darkCountRate", label: "Dark count rate", unit: "counts/s", toSI: 1, siUnit: "1/s", default: 100, min: 0, max: 1e7 },
    { key: "quantumEff", label: "Photon detection efficiency", unit: "", toSI: 1, siUnit: "", default: 0.65, min: 0, max: 1 },
    { key: "incidentPower", label: "Incident power", unit: "W", toSI: 1, siUnit: "W", default: 1e-12, min: 0, max: 1e-6 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 650, min: 200, max: 1100 },
    { key: "afterpulseProb", label: "Afterpulse probability", unit: "", toSI: 1, siUnit: "", default: 0.005, min: 0, max: 0.5 },
    { key: "gateTime", label: "Counting gate", unit: "s", toSI: 1, siUnit: "s", default: 1, min: 1e-6, max: 1e4 },
  ],
  outputs: [
    { key: "incidentPhotons", label: "Incident photons", unit: "1/s", toSI: 1, siUnit: "1/s" },
    { key: "avalancheRate", label: "Avalanche rate R (photons and dark)", unit: "1/s", toSI: 1, siUnit: "1/s" },
    { key: "recordedRate", label: "Recorded rate m", unit: "1/s", toSI: 1, siUnit: "1/s" },
    { key: "deadTimeLoss", label: "Avalanches lost to dead time", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "correction", label: "Dead-time correction R/m = 1 + Rτ", unit: "", toSI: 1, siUnit: "" },
    { key: "afterpulseRate", label: "Afterpulse rate m·P_ap", unit: "1/s", toSI: 1, siUnit: "1/s" },
    { key: "totalOutput", label: "Total output m(1 + P_ap)", unit: "1/s", toSI: 1, siUnit: "1/s" },
    { key: "snr", label: "SNR in the gate (corrected)", unit: "", toSI: 1, siUnit: "" },
    { key: "snrIdeal", label: "SNR without dead time or afterpulses", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ deadTime, darkCountRate, quantumEff, incidentPower, wavelength, afterpulseProb, gateTime }) {
    const r = spcmSummary({ deadTime, darkRate: darkCountRate, pde: quantumEff, power: incidentPower, wavelength, afterpulseProb, gate: gateTime });
    return {
      values: {
        incidentPhotons: r.photons, avalancheRate: r.rate, recordedRate: r.recorded, deadTimeLoss: r.loss, correction: r.correction,
        afterpulseRate: r.afterpulseRate, totalOutput: r.totalOutput, snr: r.snr, snrIdeal: r.snrIdeal,
      },
      warnings: r.warnings,
    };
  },
  checks: [
    {
      // Defaults: P = 1 pW at 650 nm: Φ = P·λ/(hc) = 1e-12·650e-9/(6.62607015e-34·299792458) = 3.2721758e6 /s; R_s = 0.65Φ = 2126914.25 /s; R = R_s + 100 dark = 2127014.25 /s;
      // τ = 22 ns, Rτ = 0.046794313: m = R/(1 + Rτ) = 2031931.41 /s; loss = Rτ/(1 + Rτ) = 4.4702491 %; afterpulses 0.005·m = 10159.657 /s; total 2042091.07 /s;
      // SNR = (R_s/R)·√(mT)/√(1 + (1 + Rτ)²·P(1 − P)/(1 + P)²) = 1421.5601; without dead time or afterpulses R_s·T/√(R·T) = 1458.3601.
      source: KNOLL,
      basis: "computed",
      inputs: {},
      expect: {
        incidentPhotons: 3272175.7689027614, avalancheRate: 2127014.249786795, recordedRate: 2031931.4141902109, deadTimeLoss: 4.470249111218464,
        correction: 1.0467943134953095, afterpulseRate: 10159.657070951054, totalOutput: 2042091.071261162, snr: 1421.5601070125836, snrIdeal: 1458.36012510224,
      },
      tolerance: 1e-8,
    },
    {
      // τ = 50 ns, DCR = 500 /s, PDE 0.5, P = 0.2 pW at 800 nm, P_ap = 0.02, T = 0.1 s: Φ = 2e-13·800e-9/(hc) = 805458.65 /s; R = 0.5Φ + 500 = 403229.325 /s; Rτ = 0.0201614662;
      // m = R/(1 + Rτ) = 395260.298 /s (mT = 39526 counts); loss 1.9763015 %; afterpulses 0.02·m = 7905.206 /s; total 403165.504 /s;
      // SNR = (R_s/R)·√(mT)/√(1 + (1 + Rτ)²·0.02·0.98/1.02²) = 196.64663; ideal 200.55671.
      source: KNOLL,
      basis: "computed",
      inputs: { deadTime: 50, darkCountRate: 500, quantumEff: 0.5, incidentPower: 2e-13, wavelength: 800, afterpulseProb: 0.02, gateTime: 0.1 },
      expect: {
        incidentPhotons: 805458.6508068335, avalancheRate: 403229.32540341676, recordedRate: 395260.2982326613, deadTimeLoss: 1.9763014911633063,
        correction: 1.0201614662701708, afterpulseRate: 7905.205964653227, totalOutput: 403165.50419731456, snr: 196.6466296148795, snrIdeal: 200.55671153018196,
      },
      tolerance: 1e-8,
    },
  ],
});
