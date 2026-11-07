import {
  bpskBer, qpskSer, requiredEbN0dB, requiredRxPower, shotNoiseN0, type CoherentReceiver,
} from "../../physics/free-space-comms/bpsk-qpsk";
import { defineSchema } from "../types";

const PROAKIS = "Proakis J. G., Salehi M. (2008). Digital Communications, 5th ed. McGraw-Hill. Binary antipodal " +
  "signalling, P_b = Q(√(2E_b/N₀)); Gray-coded QPSK, P_s = 1 − (1 − P_b)²; Q(x) table.";
const IP = "Ip E., Lau A. P. T., Barros D. J. F., Kahn J. M. (2008). Coherent detection in optical fiber systems. " +
  "Opt. Express 16(2), 753–791, Table 1 (SNR per symbol = detected photons per symbol, N₀ = hν/η); " +
  "P_req = (E_b/N₀)·N₀·R with P_b = Q(√(2E_b/N₀)) after Proakis & Salehi (2008).";

const dBm = (watts: number) => 10 * Math.log10(watts / 1e-3);

export default defineSchema({
  href: "/free-space-comms/bpsk-qpsk",
  choices: [
    {
      key: "modulation",
      label: "Modulation",
      options: [
        { value: "BPSK", label: "BPSK" },
        { value: "QPSK", label: "QPSK" },
        { value: "OQPSK", label: "OQPSK" },
      ],
      default: "BPSK",
    },
    {
      key: "receiver",
      label: "Coherent receiver (single-quadrature homodyne only helps BPSK)",
      options: [
        { value: "heterodyne", label: "Heterodyne / intradyne (two quadratures)" },
        { value: "homodyne", label: "Single-quadrature homodyne (BPSK only)" },
      ],
      default: "heterodyne",
    },
  ],
  inputs: [
    { key: "ebn0dB", label: "Eb/N0", unit: "dB", toSI: 1, siUnit: "dB", default: 10, min: -10, max: 30 },
    { key: "dataRate", label: "Data rate", unit: "Gbps", toSI: 1e9, siUnit: "bit/s", default: 1, min: 1e-6, max: 1e4 },
    { key: "rxPower", label: "Received power", unit: "dBm", toSI: 1, siUnit: "dBm", default: -50, min: -100, max: 30 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "eta", label: "Photodiode quantum efficiency η", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.01, max: 1 },
  ],
  outputs: [
    { key: "ber", label: "Bit error rate (BPSK, Gray QPSK, OQPSK)", unit: "", toSI: 1, siUnit: "" },
    { key: "ser", label: "Symbol error rate", unit: "", toSI: 1, siUnit: "" },
    { key: "spectralEfficiency", label: "Spectral efficiency", unit: "bit/s/Hz", toSI: 1, siUnit: "bit/s/Hz" },
    { key: "symbolRate", label: "Symbol rate", unit: "Gbaud", toSI: 1e9, siUnit: "baud" },
    { key: "bandwidth", label: "Required bandwidth (Nyquist)", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "shotNoiseN0", label: "Shot-noise N₀", unit: "dBm/Hz", toSI: 1, siUnit: "dBm/Hz" },
    { key: "photonsPerBit", label: "Photons per bit at the required power", unit: "", toSI: 1, siUnit: "" },
    { key: "requiredPower", label: "Required received power", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "ebn0AtRx", label: "Eb/N0 at the received power", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "berAtRx", label: "BER at that Eb/N0", unit: "", toSI: 1, siUnit: "" },
    { key: "margin", label: "Power margin", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "requiredEbN0For1e3", label: "Eb/N0 required for BER 1e-3", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "requiredEbN0For1e5", label: "Eb/N0 required for BER 1e-5", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "requiredEbN0For1e6", label: "Eb/N0 required for BER 1e-6", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "requiredEbN0For1e9", label: "Eb/N0 required for BER 1e-9", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ modulation, receiver, ebn0dB, dataRate, rxPower, wavelength, eta }) {
    // Single-quadrature homodyne only helps a one-quadrature signal (BPSK).
    const rx: CoherentReceiver = modulation === "BPSK" && receiver === "homodyne" ? "homodyne" : "heterodyne";
    const ebno = 10 ** (ebn0dB / 10);
    // Gray-coded QPSK/OQPSK have the same bit error rate as BPSK.
    const ber = bpskBer(ebno);
    const ser = modulation === "BPSK" ? ber : qpskSer(ebno);
    const specEff = modulation === "BPSK" ? 1 : 2;
    const symbolRate = dataRate / specEff;
    const n0 = shotNoiseN0(wavelength, eta, rx);
    const requiredPr = dBm(requiredRxPower(ebn0dB, dataRate, wavelength, eta, rx));
    const ebn0AtRx = rxPower - dBm(n0) - 10 * Math.log10(dataRate);
    const warnings: string[] = [];
    if (modulation !== "BPSK" && receiver === "homodyne") {
      warnings.push("QPSK and OQPSK need both quadratures: N₀ is the two-quadrature (heterodyne) value.");
    }
    return {
      values: {
        ber, ser, spectralEfficiency: specEff, symbolRate, bandwidth: symbolRate, shotNoiseN0: dBm(n0),
        photonsPerBit: (ebno * n0) / shotNoiseN0(wavelength, 1), requiredPower: requiredPr, ebn0AtRx,
        berAtRx: bpskBer(10 ** (ebn0AtRx / 10)), margin: rxPower - requiredPr,
        requiredEbN0For1e3: requiredEbN0dB(1e-3), requiredEbN0For1e5: requiredEbN0dB(1e-5),
        requiredEbN0For1e6: requiredEbN0dB(1e-6), requiredEbN0For1e9: requiredEbN0dB(1e-9),
      },
      warnings,
    };
  },
  checks: [
    {
      // Q(3) = 1.35e-3 and Q(4) = 3.167e-5 (Q-function table). P_b = Q(√(2E_b/N₀)): E_b/N₀ = 4.5 (6.532125 dB) gives x = 3,
      // E_b/N₀ = 8 (9.030900 dB) gives x = 4.
      source: PROAKIS,
      basis: "printed",
      inputs: { ebn0dB: 6.532125138 },
      expect: { ber: 1.35e-3 },
      tolerance: 2e-3,
    },
    {
      source: PROAKIS,
      basis: "printed",
      inputs: { ebn0dB: 9.030899870 },
      expect: { ber: 3.167e-5 },
      tolerance: 2e-3,
    },
    {
      // Gray QPSK at 12.5 dB, 1064 nm, η = 0.5, 10 Gbps: P_b = Q(√(2·17.7828)) = 1.233028e-9, P_s = P_b(2 − P_b) = 2.466057e-9;
      // N₀ = hc/(λη) = 3.7378e-19 W/Hz (−154.2783 dBm/Hz), P_req = 17.7828·N₀·1e10 = −41.7783 dBm, 35.5656 photons/bit;
      // QPSK carries 2 bit/symbol, so 10 Gbps is 5 Gbaud. Required E_b/N₀ for 1e-9: 12.5495 dB (Q(x) = 1e-9 at x = 5.9978).
      source: IP,
      basis: "computed",
      inputs: { modulation: "QPSK", ebn0dB: 12.5, dataRate: 10, wavelength: 1064, eta: 0.5 },
      expect: {
        ber: 1.23302845e-9, ser: 2.46605689e-9, shotNoiseN0: -154.2783490, requiredPower: -41.77834900, photonsPerBit: 35.56558820,
        symbolRate: 5, requiredEbN0For1e9: 12.54954980,
      },
      tolerance: 1e-6,
    },
  ],
});
