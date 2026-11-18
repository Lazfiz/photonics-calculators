import { BYTES_PER_MIB, HYPERSPECTRAL_BIT_DEPTHS, hyperspectralSummary } from "../../physics/imaging/hyperspectral-microscopy";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer. SPIE Press. https://doi.org/10.1117/3.725073 " +
  "(pixel SNR = S/√(S + D + σ_r²) for Poisson signal S, dark charge D and read noise σ_r; n summed frames give signal n·S and variance n(S + D + σ_r²)).";
const IEC = "IEC 80000-13:2008, Quantities and units, Part 13: Information science and technology " +
  "(1 MiB = 2²⁰ byte); cube size N_x N_y N_λ · bits · N_frames/8 bytes and acquisition time N_frames N_λ t follow from the definitions.";

export default defineSchema({
  href: "/imaging/hyperspectral-microscopy",
  inputs: [
    { key: "startNm", label: "Start wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 400, min: 300, max: 1000 },
    { key: "endNm", label: "End wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 720, min: 400, max: 1200 },
    { key: "spectralBands", label: "Spectral bands", unit: "", toSI: 1, siUnit: "", default: 32, min: 1, max: 512 },
    { key: "spatialPixels", label: "Spatial pixels per side", unit: "", toSI: 1, siUnit: "", default: 256, min: 16, max: 4096 },
    { key: "bitDepth", label: "Bit depth (packed; 8, 10, 12, 14 or 16)", unit: "bit", toSI: 1, siUnit: "bit", default: 16, min: 8, max: 16 },
    { key: "exposureMs", label: "Exposure per band", unit: "ms", toSI: 1e-3, siUnit: "s", default: 100, min: 0.01, max: 1e5 },
    { key: "numFrames", label: "Frames (cubes) summed", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 1e4 },
    { key: "compression", label: "Compression ratio", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 100 },
    { key: "spectralFlux", label: "Spectral photon flux", unit: "photons/pixel/s/nm", toSI: 1, siUnit: "photons/pixel/s/nm", default: 1000, min: 0, max: 1e9 },
    { key: "quantumEff", label: "Quantum efficiency", unit: "%", toSI: 0.01, siUnit: "", default: 80, min: 1, max: 100 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 1.5, min: 0, max: 100 },
    { key: "darkCurrent", label: "Dark current", unit: "e⁻/pixel/s", toSI: 1, siUnit: "e⁻/pixel/s", default: 0.5, min: 0, max: 1e4 },
  ],
  outputs: [
    { key: "bandwidth", label: "Band width Δλ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "rawSize", label: "Raw data, all frames", unit: "MiB", toSI: BYTES_PER_MIB, siUnit: "byte" },
    { key: "cubeSize", label: "One cube", unit: "MiB", toSI: BYTES_PER_MIB, siUnit: "byte" },
    { key: "acquisitionTime", label: "Acquisition time", unit: "s", toSI: 1, siUnit: "s" },
    { key: "signal", label: "Signal per band and frame", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "snrFrame", label: "SNR per band, one frame", unit: "", toSI: 1, siUnit: "" },
    { key: "snrSummed", label: "SNR per band, frames summed", unit: "", toSI: 1, siUnit: "" },
    { key: "compressedSize", label: "Compressed size", unit: "MiB", toSI: BYTES_PER_MIB, siUnit: "byte" },
    { key: "dataRate", label: "Raw data rate (exposure-limited)", unit: "MiB/s", toSI: BYTES_PER_MIB, siUnit: "byte/s" },
  ],
  validate({ bitDepth }) {
    if (!(HYPERSPECTRAL_BIT_DEPTHS as readonly number[]).includes(bitDepth)) {
      return `Bit depth must be one of ${HYPERSPECTRAL_BIT_DEPTHS.join(", ")}.`;
    }
    return undefined;
  },
  compute(si) {
    const start_nm = si.startNm / 1e-9;
    const end = si.endNm / 1e-9;
    const warnings: string[] = [];
    // The page raises an end wavelength at or below the start to start + 1 nm.
    // start_nm and end come from si / 1e-9, so compare with a tolerance (478 and 479 nm must not warn).
    const tooClose = end < start_nm + 1 - 1e-9;
    const end_nm = tooClose ? start_nm + 1 : end;
    if (tooClose) warnings.push("The end wavelength is less than 1 nm above the start; it was raised to start + 1 nm, as the page does.");
    const r = hyperspectralSummary({
      start_nm, end_nm, bands: Math.round(si.spectralBands), pixels: Math.round(si.spatialPixels), bitDepth: si.bitDepth,
      exposure_s: si.exposureMs, frames: Math.round(si.numFrames), compression: si.compression, flux: si.spectralFlux,
      qe: si.quantumEff, readNoise: si.readNoise, dark: si.darkCurrent,
    });
    const noNoise = "No signal and no noise (zero photon flux, read noise and dark current), so the SNR is undefined.";
    const reasons: Record<string, string> = {};
    if (!Number.isFinite(r.snrFrame)) reasons.snrFrame = noNoise;
    if (!Number.isFinite(r.snrSum)) reasons.snrSummed = noNoise;
    return {
      values: {
        bandwidth: r.bandwidth_nm * 1e-9, rawSize: r.sizeMiB * BYTES_PER_MIB, cubeSize: r.cubeMiB * BYTES_PER_MIB,
        acquisitionTime: r.totalTime, signal: r.signal, snrFrame: r.snrFrame, snrSummed: r.snrSum,
        compressedSize: r.compressedMiB * BYTES_PER_MIB, dataRate: r.dataRate * BYTES_PER_MIB,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Defaults: Δλ = (720 − 400)/32 = 10 nm; V = 256·256·32·16·10/8 = 41 943 040 byte = 40 MiB (cube 4 MiB); T = 10·32·0.1 s = 32 s;
      // data rate 40/32 = 1.25 MiB/s.
      source: IEC,
      basis: "computed",
      inputs: {},
      expect: { bandwidth: 10, rawSize: 40, cubeSize: 4, acquisitionTime: 32, dataRate: 1.25, compressedSize: 40 },
      tolerance: 1e-8,
    },
    {
      // Defaults: S = 1000 · 10 · 0.1 · 0.8 = 800 e⁻; dark = 0.5 · 0.1 = 0.05 e⁻; noise = √(800 + 0.05 + 1.5²) = √802.3;
      // SNR(1 frame) = 800/√802.3 = 28.2437; summed over 10 frames: √10 · 28.2437 = 89.3144.
      source: JANESICK,
      basis: "computed",
      inputs: {},
      expect: { signal: 800, snrFrame: 28.24370006822, snrSummed: 89.31442176623 },
      tolerance: 1e-8,
    },
    {
      // 500–800 nm in 60 bands (Δλ = 5 nm), 512² pixels, 12 bit, 4 frames, 20 ms, compression 4, 2000 photons/pixel/s/nm, QE 50 %, read 3 e⁻, dark 2 e⁻/pixel/s:
      // V = 512²·60·12·4/8 = 94 371 840 byte = 90 MiB (compressed 22.5 MiB); T = 4·60·0.02 = 4.8 s; rate 90/4.8 = 18.75 MiB/s;
      // S = 2000·5·0.02·0.5 = 100 e⁻; noise = √(100 + 2·0.02 + 9) = √109.04; SNR = 100/√109.04 = 9.5765; summed 4 frames ×2.
      source: JANESICK,
      basis: "computed",
      inputs: {
        startNm: 500, endNm: 800, spectralBands: 60, spatialPixels: 512, bitDepth: 12, exposureMs: 20, numFrames: 4, compression: 4,
        spectralFlux: 2000, quantumEff: 50, readNoise: 3, darkCurrent: 2,
      },
      expect: { rawSize: 90, compressedSize: 22.5, acquisitionTime: 4.8, dataRate: 18.75, signal: 100, snrFrame: 9.576505856351, snrSummed: 19.15301171270 },
      tolerance: 1e-8,
    },
  ],
});
