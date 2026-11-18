import { FLUOROPHORES } from "../../physics/imaging/fluorophores";
import { type AcquisitionMode, type BinMode, type Channel, multicolorSummary } from "../../physics/imaging/simultaneous-multicolor";
import { defineSchema } from "../types";

const ROEDERER = "Roederer M. (2001). Spectral compensation for flow cytometry: visualization artifacts, limitations, and caveats. " +
  "Cytometry 45, 194–205, doi:10.1002/1097-0320(20011101)45:3<194::AID-CYTO1163>3.0.CO;2-C (spillover = signal in a secondary detector over that in the primary one); " +
  "Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073 (pixel SNR = S/√(S + B + D + σ_read²)); " +
  "spectra: Lambert T. J. (2019). FPbase: a community-editable fluorescent protein database. Nat. Methods 16, 277–278, doi:10.1038/s41592-019-0352-8 " +
  "(www.fpbase.org, CC BY-SA 4.0): L_ij = R_ij/R_jj with R_ij ∝ ε_j Σ_lasers f_ex,j(λ_k) Φ_j ∫_filter i F_j dλ.";

const dyeOptions = FLUOROPHORES.map((f) => ({ value: f.name, label: f.name }));
const DEFAULTS: readonly Channel[] = [
  { dye: "EGFP", laser: 488, center: 525, width: 50 },
  { dye: "mCherry", laser: 561, center: 610, width: 40 },
  { dye: "miRFP670", laser: 640, center: 700, width: 75 },
  { dye: "mTagBFP2", laser: 405, center: 450, width: 50 },
];
/** Metres back to the page's nm, without the 1e-16 rounding noise of × 1e9. */
const nm = (m: number) => Number((m * 1e9).toPrecision(12));
const MODES = ["simultaneous", "sequential"] as const;
const BIN_MODES = ["charge", "digital"] as const;

// Per channel (1–3 only: channel 4 is unused at the page defaults, so its results are left to the aggregate outputs).
const SHOWN = [0, 1, 2] as const;
// Literal key types: a bare template literal widens the key to string, which erases the input and output names.
type Ch = 1 | 2 | 3 | 4;
type Shown = 1 | 2 | 3;
const channelInputs = DEFAULTS.flatMap((d, k) => [
  { key: `laser${k + 1}` as `laser${Ch}`, label: `Laser ${k + 1}`, unit: "nm", toSI: 1e-9, siUnit: "m", default: d.laser, min: 350, max: 800 },
  { key: `center${k + 1}` as `center${Ch}`, label: `Filter ${k + 1} centre`, unit: "nm", toSI: 1e-9, siUnit: "m", default: d.center, min: 350, max: 900 },
  { key: `width${k + 1}` as `width${Ch}`, label: `Filter ${k + 1} width`, unit: "nm", toSI: 1e-9, siUnit: "m", default: d.width, min: 1, max: 300 },
]);
const percent = <K extends string>(key: K, label: string) => ({ key, label, unit: "%", toSI: 0.01, siUnit: "" });
const spillKeys = SHOWN.flatMap((i) => SHOWN.filter((j) => j !== i).map((j) => ({ i, j, key: `spill${i + 1}${j + 1}` as `spill${Shown}${Shown}` })));

const notInUse = (n: number) => `Channel ${n} is not in use (the number of channels is below ${n}), so it has no result.`;
const noOwnSignal = (j: number) =>
  `The dye of channel ${j} gives no detected signal in its own channel (no excitation, or no emission inside the filter), so the spillover ratio to it is undefined.`;
const noBackground = "A dye gives no detected signal in its own channel, so its bleed-through into this channel (the background term) is undefined.";
const needsTwo = "A spillover needs at least two channels.";
const noNoise = "Signal, dark current and read noise are all zero, so the SNR is 0/0.";

export default defineSchema({
  href: "/imaging/simultaneous-multicolor",
  choices: [
    ...DEFAULTS.map((d, k) => ({ key: `dye${k + 1}` as `dye${Ch}`, label: `Fluorophore ${k + 1}`, options: dyeOptions, default: d.dye })),
    {
      key: "acquisition",
      label: "Acquisition",
      options: [
        { value: "simultaneous", label: "Simultaneous: all lasers, one frame" },
        { value: "sequential", label: "Sequential: laser i only in frame i" },
      ],
      default: "simultaneous",
    },
    {
      key: "binMode",
      label: "Binning mode",
      options: [
        { value: "charge", label: "Charge binning (CCD): one read" },
        { value: "digital", label: "Digital sum (CMOS): B² reads" },
      ],
      default: "charge",
    },
  ],
  inputs: [
    { key: "numChannels", label: "Number of channels", unit: "", toSI: 1, siUnit: "", default: 3, min: 1, max: 4 },
    ...channelInputs,
    { key: "photonFlux", label: "Own-dye photon flux at the camera", unit: "photons/pixel/s", toSI: 1, siUnit: "1/s", default: 25000, min: 0, max: 1e9 },
    { key: "exposureMs", label: "Exposure", unit: "ms", toSI: 1e-3, siUnit: "s", default: 20, min: 0.01, max: 10000 },
    { key: "readoutMs", label: "Readout time", unit: "ms", toSI: 1e-3, siUnit: "s", default: 2, min: 0, max: 1000 },
    { key: "pixelSize", label: "Pixel size", unit: "µm", toSI: 1e-6, siUnit: "m", default: 6.5, min: 0.5, max: 50 },
    { key: "binning", label: "Binning (1, 2 or 4)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 4 },
    { key: "quantumEff", label: "Quantum efficiency", unit: "%", toSI: 0.01, siUnit: "", default: 90, min: 1, max: 100 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 1.5, min: 0, max: 100 },
    { key: "darkCurrent", label: "Dark current", unit: "e⁻/pixel/s", toSI: 1, siUnit: "1/s", default: 0.01, min: 0, max: 1e4 },
  ],
  outputs: [
    { key: "binnedPixel", label: "Binned pixel", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "fpsSimultaneous", label: "Frame rate, simultaneous", unit: "fps", toSI: 1, siUnit: "1/s" },
    { key: "fpsSequential", label: "Frame rate, sequential", unit: "fps", toSI: 1, siUnit: "1/s" },
    { key: "snrOwn", label: "SNR, own dye only", unit: "", toSI: 1, siUnit: "" },
    ...SHOWN.map((i) => ({ key: `snr${i + 1}` as `snr${Shown}`, label: `SNR of channel ${i + 1} with bleed-through`, unit: "", toSI: 1, siUnit: "" })),
    { key: "worstSnr", label: "Lowest channel SNR with bleed-through (all channels in use)", unit: "", toSI: 1, siUnit: "" },
    ...spillKeys.map(({ i, j, key }) => percent(key, `Spillover of dye ${j + 1} into channel ${i + 1} (% of its signal in channel ${j + 1})`)),
    percent("maxSpill", "Largest spillover (all channels in use)"),
  ],
  validate: (i) => ([1, 2, 4].includes(Number(i.binning)) ? undefined : "Binning must be 1, 2 or 4."),
  compute(raw) {
    // The keys are generated for the four channels, so the inputs are read by name rather than by a literal type.
    const num = (key: string) => Number((raw as Record<string, number | string>)[key]);
    const str = (key: string) => String((raw as Record<string, number | string>)[key]);
    const n = Math.round(num("numChannels"));
    const channels: Channel[] = DEFAULTS.slice(0, n).map((_, k) => ({
      dye: str(`dye${k + 1}`), laser: nm(num(`laser${k + 1}`)), center: nm(num(`center${k + 1}`)), width: nm(num(`width${k + 1}`)),
    }));
    const mode: AcquisitionMode = MODES.find((m) => m === str("acquisition")) ?? "simultaneous";
    const s = multicolorSummary({
      channels, mode, flux: num("photonFlux"), exposure: num("exposureMs"), readout: num("readoutMs"), binning: num("binning"),
      binMode: BIN_MODES.find((m): m is BinMode => m === str("binMode")) ?? "charge", readNoise: num("readNoise"), dark: num("darkCurrent"), qe: num("quantumEff"),
    });
    const values: Record<string, number> = {
      binnedPixel: num("pixelSize") * num("binning"),
      fpsSimultaneous: s.fpsSimultaneous,
      fpsSequential: s.fpsSequential,
      snrOwn: s.snrOwn,
    };
    const reasons: Record<string, string> = {};
    if (!Number.isFinite(s.snrOwn)) reasons.snrOwn = noNoise;
    for (const c of SHOWN) {
      values[`snr${c + 1}`] = c < n ? s.snr[c] : NaN;
      if (c >= n) reasons[`snr${c + 1}`] = notInUse(c + 1);
      else if (!Number.isFinite(s.snr[c])) {
        reasons[`snr${c + 1}`] = s.spill[c].some((v, j) => j !== c && !Number.isFinite(v)) ? noBackground : noNoise;
      }
    }
    for (const { i: r, j: c, key } of spillKeys) {
      values[key] = r < n && c < n ? s.spill[r][c] : NaN;
      if (r >= n || c >= n) reasons[key] = notInUse(Math.max(r, c) + 1);
      else if (!Number.isFinite(s.spill[r][c])) reasons[key] = noOwnSignal(c + 1);
    }
    const spills = s.spill.flatMap((row, r) => row.filter((_, c) => c !== r));
    values.worstSnr = s.snr.every(Number.isFinite) ? Math.min(...s.snr) : NaN;
    if (!Number.isFinite(values.worstSnr)) reasons.worstSnr = s.spill.some((row, r) => row.some((v, c) => c !== r && !Number.isFinite(v))) ? noBackground : noNoise;
    values.maxSpill = spills.length > 0 && spills.every(Number.isFinite) ? Math.max(...spills) : NaN;
    if (!Number.isFinite(values.maxSpill)) reasons.maxSpill = spills.length === 0 ? needsTwo : "A dye gives no detected signal in its own channel, so a spillover ratio to it is undefined.";
    return { values, warnings: s.warnings, reasons };
  },
  checks: [
    {
      // Binning 2 × 2 with digital summing, defaults otherwise: S = 25000·0.02·0.9·4 = 1800 e⁻, D = 0.01·0.02·4 = 8e-4 e⁻, read noise 2·1.5 = 3 e⁻:
      // SNR_own = 1800/√(1800 + 8e-4 + 9) = 42.32072759369988. Frames: 1/(0.02 + 0.002) = 45.45454545454545 fps, sequential 1/(3·0.022) = 15.151515151515152 fps;
      // binned pixel 2·6.5 = 13 µm. Channel SNR = S/√(S + D + Σ_j L_ij S + 9) with the spillovers of the next check (scratch script, own trapezoid integrals).
      source: ROEDERER,
      basis: "computed",
      inputs: { binning: 2, binMode: "digital" },
      expect: {
        binnedPixel: 13, fpsSimultaneous: 45.45454545454545, fpsSequential: 15.151515151515152, snrOwn: 42.32072759369988,
        snr1: 42.32034690189156, snr2: 41.23348634385805, snr3: 35.26412335393651, worstSnr: 35.26412335393651,
      },
      tolerance: 1e-8,
    },
    {
      // Defaults (EGFP/488/525±25, mCherry/561/610±20, miRFP670/640/700±37.5 nm, simultaneous): all lasers are on in every frame, so the excitation cancels
      // and L_ij = (emission of dye j over filter i)/(emission of dye j over filter j), each a trapezoid sum of the 1 nm FPbase samples (scratch script):
      // L21 = 3.7999623638706037 %, L23 = 1.5698661879275675 %, L31 = 0.8113480972041504 %, L32 = 43.43452416827386 % (the largest), L12 = 0.0018081002892960463 %.
      // SNR_i = 450/√(450 + 2e-4 + Σ_j L_ij·450 + 2.25): 21.16017345094578, 20.616743171929024, 17.632061676968256.
      source: ROEDERER,
      basis: "computed",
      inputs: {},
      expect: {
        spill21: 3.7999623638706037, spill23: 1.5698661879275675, spill31: 0.8113480972041504, spill32: 43.43452416827386, maxSpill: 43.43452416827386,
        snr1: 21.16017345094578, snr2: 20.616743171929024, snr3: 17.632061676968256,
      },
      tolerance: 1e-8,
    },
    {
      // Sequential, defaults otherwise: frame i has laser i only, so L_ij = [f_ex,j(λ_i)·emission of dye j over filter i]/[f_ex,j(λ_j)·emission of dye j over filter j],
      // f_ex the FPbase excitation samples at the laser lines (scratch script): L21 = 0.01636930290988138 %, L23 = 0.35459800703263805 % (the largest),
      // L31 = 0.0025197145875905293 %, L32 = 0.29209955258613957 %; SNR_i as above: 21.160341112254564, 21.121417851981445, 21.12941566458012.
      source: ROEDERER,
      basis: "computed",
      inputs: { acquisition: "sequential" },
      expect: {
        spill21: 0.01636930290988138, spill23: 0.35459800703263805, spill31: 0.0025197145875905293, spill32: 0.29209955258613957, maxSpill: 0.35459800703263805,
        snr1: 21.160341112254564, snr2: 21.121417851981445, snr3: 21.12941566458012,
      },
      tolerance: 1e-8,
    },
  ],
});
