import { evaluateSensor, SENSORS } from "../../physics/detectors/ccd-vs-cmos";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press, doi:10.1117/3.725073: pixel SNR = S/√(S + D·t + σ_read²) " +
  "and dynamic range 20·log₁₀(S_max/σ_read); sensor parameters are the representative values listed on the page.";
const ROBBINS = "Robbins M. S., Hadwen B. J. (2003). The noise performance of electron multiplying charge-coupled devices. IEEE Trans. Electron Devices " +
  "50(5), 1227–1232, doi:10.1109/TED.2003.813462: F² = 2(G − 1)·G^(−(N+1)/N) + 1/G with N = 536 elements (Teledyne e2v CCD97-00 data sheet), " +
  "SNR = S/√(F²(S + D·t) + (σ_read/G)²); Andor iXon Ultra 897 specifications for the EMCCD wells and read noise.";

const KEYS = { ccd: "Ccd", scmos: "Scmos", phone: "Phone", emccd: "Emccd" } as const;

export default defineSchema({
  href: "/detectors/ccd-vs-cmos",
  inputs: [
    { key: "photons", label: "Signal (photons per pixel)", unit: "", toSI: 1, siUnit: "", default: 1000, min: 0, max: 1e7 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 1, min: 1e-6, max: 1e4 },
    { key: "emGain", label: "EMCCD gain", unit: "", toSI: 1, siUnit: "", default: 300, min: 1, max: 1000 },
  ],
  outputs: [
    { key: "snrCcd", label: "CCD SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "snrScmos", label: "sCMOS SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "snrPhone", label: "Phone CMOS SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "snrEmccd", label: "EMCCD SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "drCcd", label: "CCD dynamic range", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "drScmos", label: "sCMOS dynamic range", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "drPhone", label: "Phone CMOS dynamic range", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "drEmccd", label: "EMCCD dynamic range", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "emccdFloor", label: "EMCCD read noise referred to the input σ_read/G", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
  ],
  compute({ photons, exposureTime, emGain }) {
    const reasons: Record<string, string> = {};
    const snr: Record<string, number> = {};
    const dr: Record<string, number> = {};
    let emccdFloor = NaN;
    for (const s of SENSORS) {
      const r = evaluateSensor(s, photons, exposureTime, emGain);
      snr[s.id] = r.snr;
      dr[s.id] = r.dynamicRange;
      if (r.saturated) reasons[`snr${KEYS[s.id]}`] = `${s.name} is saturated: the signal and dark charge exceed its full well (EMCCD: the gain-register well / G).`;
      if (s.id === "emccd") emccdFloor = r.floor;
    }
    return {
      values: {
        snrCcd: snr.ccd, snrScmos: snr.scmos, snrPhone: snr.phone, snrEmccd: snr.emccd,
        drCcd: dr.ccd, drScmos: dr.scmos, drPhone: dr.phone, drEmccd: dr.emccd, emccdFloor,
      },
      reasons,
    };
  },
  checks: [
    {
      // Defaults (1000 photons, 1 s, G = 300). CCD: S = 0.95*1000 = 950, D = 0.001: 950/sqrt(950.001 + 9) = 30.67708398; DR = 20*log10(1e5/3) = 90.4575749 dB.
      // sCMOS: S = 900, D = 0.01: 900/sqrt(900.01 + 2.25) = 29.9624041; DR = 20*log10(5e4/1.5) = 90.4575749. Phone: S = 650, D = 5, read 2:
      // 650/sqrt(655 + 4) = 25.3204051; DR = 20*log10(6000/2) = 69.5424251. EMCCD: F^2 = 2*299*300^(-537/536) + 1/300 = 1.9755673, floor 89/300 = 0.2966667,
      // SNR = 950/sqrt(1.9755673*950.00011 + 0.0880111) = 21.9283361; S_max = min(180000, 800000/300) = 2666.67, DR = 20*log10(2666.67/0.2966667) = 79.0739996.
      source: JANESICK,
      basis: "computed",
      inputs: {},
      expect: {
        snrCcd: 30.677083982425287, snrScmos: 29.962404124101464, snrPhone: 25.320405081777643, snrEmccd: 21.928336149997257,
        drCcd: 90.45757490560675, drScmos: 90.45757490560675, drPhone: 69.54242509439325, drEmccd: 79.07399960694062, emccdFloor: 0.2966666666666667,
      },
      tolerance: 1e-8,
    },
    {
      // 200 photons, 10 s, G = 100. CCD: S = 190, D = 0.01: 190/sqrt(190.01 + 9) = 13.4684045; phone: S = 130, D = 50: 130/sqrt(180 + 4) = 9.58372715;
      // EMCCD: F^2 = 2*99*100^(-537/536) + 1/100 = 1.9730612, S = 190, D = 0.0011: 190/sqrt(1.9730612*190.0011 + 0.7921) = 9.8027275.
      source: ROBBINS,
      basis: "computed",
      inputs: { photons: 200, exposureTime: 10, emGain: 100 },
      expect: { snrCcd: 13.468404497286512, snrPhone: 9.583727150068313, snrEmccd: 9.80272750456029, emccdFloor: 0.89 },
      tolerance: 1e-8,
    },
  ],
});
