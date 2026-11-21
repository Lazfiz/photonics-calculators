import { type Dlpc900Dmd, dmdTiming } from "../../physics/spatial-light-modulators/dmd-timing";
import { defineSchema } from "../types";

const DLPC900 = "Texas Instruments (2024). DLPC900 Digital Controller for Advanced Light Control, datasheet DLPS037H, Sec. 6.3: " +
  "a 120 Hz 24-bit RGB frame gives each colour a 2.78 ms time slot, divided into binary-weighted bit planes; Table 6-4: minimum " +
  "pattern time by bit depth (DLP6500: 105 µs at 1 bit, 4046 µs at 8 bits). https://www.ti.com/lit/ds/symlink/dlpc900.pdf";
const DLP6500 = "Texas Instruments (2016). DLP6500FYE 0.65 1080p MVSP Type A DMD, datasheet DLPS053B, Features: 1920 × 1080 array; " +
  "with the DLPC900 up to 9523 Hz and 19.7 Gbit/s for 1-bit binary patterns. https://www.ti.com/lit/ds/symlink/dlp6500fye.pdf";

const DMDS: readonly Dlpc900Dmd[] = ["DLP5500", "DLP6500", "DLP9000", "DLP670S", "DLP500YX"];

export default defineSchema({
  href: "/spatial-light-modulators/dmd-timing",
  choices: [
    {
      key: "dmd",
      label: "DMD for TI's DLPC900 minimum-pattern-time table",
      options: [...DMDS.map((d) => ({ value: d, label: `DLPC900 + ${d}` })), { value: "none", label: "No table (another controller)" }],
      default: "DLP6500",
    },
  ],
  inputs: [
    { key: "bits", label: "Bit depth b of each pattern", unit: "bit", toSI: 1, siUnit: "", default: 8, min: 1, max: 16 },
    { key: "exposure", label: "Exposure per pattern (all bit planes)", unit: "µs", toSI: 1e-6, siUnit: "s", default: 4046, min: 1, max: 1e7 },
    { key: "dark", label: "Dark time after each pattern", unit: "µs", toSI: 1e-6, siUnit: "s", default: 0, min: 0, max: 1e7 },
    { key: "grey", label: "Grey level g (0 … 2^b − 1)", unit: "", toSI: 1, siUnit: "", default: 200, min: 0, max: 65535 },
    { key: "binaryRate", label: "Binary (1-bit) pattern rate R₁ of the DMD", unit: "Hz", toSI: 1, siUnit: "Hz", default: 9523, min: 1, max: 100000 },
    { key: "mirrorsX", label: "Mirrors across", unit: "", toSI: 1, siUnit: "", default: 1920, min: 1, max: 8192 },
    { key: "mirrorsY", label: "Mirrors down", unit: "", toSI: 1, siUnit: "", default: 1080, min: 1, max: 8192 },
    { key: "frameRate", label: "Video frame rate f", unit: "Hz", toSI: 1, siUnit: "Hz", default: 120, min: 1, max: 1000 },
    { key: "colours", label: "Colours per video frame N_c (1 mono, 3 RGB)", unit: "", toSI: 1, siUnit: "", default: 3, min: 1, max: 3 },
  ],
  outputs: [
    { key: "greyLevels", label: "Grey levels 2^b", unit: "", toSI: 1, siUnit: "" },
    { key: "lsb", label: "Least significant bit plane, exposure/(2^b − 1)", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "msb", label: "Most significant bit plane, 2^(b−1) LSB", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "onTime", label: "Mirror on-time for grey level g, g·LSB", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "onFraction", label: "On fraction of the exposure, g/(2^b − 1)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "meanFraction", label: "On fraction of the pattern period (exposure + dark time)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "period", label: "Pattern period, exposure + dark time", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "patternRate", label: "Pattern rate, 1/(exposure + dark time)", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "tiMinPattern", label: "TI's minimum pattern time on the DLPC900 at this bit depth (Table 6-4)", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "tiMaxRate", label: "Fastest pattern rate that allows, 1/(minimum pattern time)", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "binaryTime", label: "Shortest binary pattern, 1/R₁", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "dataRate", label: "Binary data rate, mirrors × R₁", unit: "Gbit/s", toSI: 1e9, siUnit: "bit/s" },
    { key: "colourSlot", label: "Video: time slot per colour, 1/(f N_c)", unit: "ms", toSI: 1e-3, siUnit: "s" },
    { key: "videoLsb", label: "Video: least significant bit plane in that slot, slot/(2^b − 1)", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "patternsPerFrame", label: "Video pattern mode: patterns per frame, min(⌊1/(f·period)⌋, ⌊24/b⌋) (24 bits per pixel per frame)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ dmd, bits, exposure, dark, grey, binaryRate, mirrorsX, mirrorsY, frameRate, colours }) {
    const device = DMDS.find((d) => d === dmd) ?? null;
    const b = Math.round(bits);
    const g = Math.round(grey);
    const r = dmdTiming({
      bits: b, exposure, dark, grey: g, dmd: device, binaryRate,
      mirrorsX: Math.round(mirrorsX), mirrorsY: Math.round(mirrorsY), frameRate, colours: Math.round(colours),
    });
    const warnings: string[] = [];
    type Key = "onTime" | "onFraction" | "meanFraction" | "tiMinPattern" | "tiMaxRate";
    const reasons: Partial<Record<Key, string>> = {};
    if (g > 2 ** b - 1) {
      reasons.onTime = reasons.onFraction = reasons.meanFraction = `Grey level ${g} needs more than ${b} bits: a ${b}-bit pattern has levels 0 to ${2 ** b - 1}.`;
    }
    if (!device) {
      reasons.tiMinPattern = reasons.tiMaxRate = "No DLPC900 table selected: take the minimum pattern time from your controller's documentation.";
    } else if (!Number.isFinite(r.tiMinPattern)) {
      reasons.tiMinPattern = reasons.tiMaxRate = `TI's table lists no ${b}-bit patterns for the DLPC900 + ${device}${device === "DLP500YX" ? " (bit depths 1–8, 10, 12, 14 and 16 only)" : " (bit depths 1–8 only)"}.`;
    } else if (exposure < r.tiMinPattern * (1 - 1e-9)) {
      warnings.push(`The exposure is shorter than TI's minimum ${b}-bit pattern time on the DLPC900 + ${device}, ${Math.round(r.tiMinPattern * 1e6)} µs: expect an "exposure time out of range" error (DLPU018J Sec. 2.1.6).`);
    }
    return {
      values: {
        greyLevels: r.greyLevels, lsb: r.lsb, msb: r.msb, onTime: r.onTime, onFraction: r.onFraction, meanFraction: r.meanFraction,
        period: r.period, patternRate: r.patternRate, tiMinPattern: r.tiMinPattern, tiMaxRate: r.tiMaxRate, binaryTime: r.binaryTime,
        dataRate: r.dataRate, colourSlot: r.colourSlot, videoLsb: r.videoLsb, patternsPerFrame: r.patternsPerFrame,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Sec. 6.3: 120 Hz, three colours: "each color has a 2.78ms time slot allocated".
      source: DLPC900,
      basis: "printed",
      inputs: { frameRate: 120, colours: 3 },
      expect: { colourSlot: 2.78 },
      tolerance: 0.005,
    },
    {
      // Features: 9523 Hz on the 1920 × 1080 array, "up to 19.7 Giga-bits per second": 2 073 600 × 9523 = 19.7469 Gbit/s.
      source: DLP6500,
      basis: "printed",
      inputs: { binaryRate: 9523, mirrorsX: 1920, mirrorsY: 1080 },
      expect: { dataRate: 19.7 },
      tolerance: 0.005,
    },
    {
      // Table 6-4, DLP6500, 8 bits: 4046 µs, so at most 1/4046 µs = 247.158 Hz. At that exposure the LSB is 4046/255 =
      // 15.8667 µs, the MSB 128 × that = 2030.93 µs; g = 200 is on 200/255 = 78.4314 % of it, 3173.33 µs. A 120 Hz frame
      // (8333.33 µs) holds two such patterns (⌊24/8⌋ = 3 would be allowed).
      source: DLPC900,
      basis: "computed",
      inputs: {},
      expect: { tiMinPattern: 4046, tiMaxRate: 247.158, lsb: 15.8667, msb: 2030.93, onTime: 3173.33, onFraction: 78.4314, patternsPerFrame: 2 },
      tolerance: 1e-5,
    },
    {
      // Sec. 6.3: the 2.78 ms slot (exactly 1/360 s) holds 8 bit planes of weights 1 … 128, so its LSB is 1/(360 × 255) s = 10.8932 µs.
      source: DLPC900,
      basis: "computed",
      inputs: { frameRate: 120, colours: 3, bits: 8 },
      expect: { colourSlot: 2.77778, videoLsb: 10.8932 },
      tolerance: 1e-5,
    },
  ],
});
