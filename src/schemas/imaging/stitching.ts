import type { BlendProfile } from "../../physics/imaging/registration";
import { stitchingSummary } from "../../physics/imaging/stitching";
import { defineSchema } from "../types";

const PREIBISCH = "Preibisch S., Saalfeld S., Tomancak P. (2009). Globally optimal stitching of tiled 3D microscopic image acquisitions. " +
  "Bioinformatics 25, 1463–1465, doi:10.1093/bioinformatics/btp184 (global least-squares placement from pairwise offsets); " +
  "Barooah P., Hespanha J. P. (2007). Estimation on graphs from relative measurements. IEEE Control Syst. Mag. 27(4), 57–74, " +
  "doi:10.1109/MCS.2007.384125: the variance of the best linear estimate relative to the anchor is σ²·R_eff, the effective resistance of the graph with unit edges.";
const CHAIN = "Chained placement sums the k independent pairwise offsets between the anchor tile (0, 0) and tile (i, j), k = i + j, so its variance is kσ² " +
  "(sum of independent variances); the worst tile (C − 1, R − 1) has σ√(C + R − 2), the rms over tiles σ√((C − 1)/2 + (R − 1)/2).";
const GEOMETRY = "Mosaic geometry of a C × R grid of w × h tiles with neighbour overlap o_x = round(o·w): width C·w − (C − 1)·o_x, " +
  "height likewise, efficiency = mosaic pixels / (C·R·w·h) (elementary counting, worked by hand).";
const SEAM = "Blend of a gain step Δ over width w with weight α(t) = cos²(πt/2), t = x/w across the seam: the blended gradient is Δ·|dα/dt|/w, " +
  "dα/dt = −(π/2) sin(πt), peaking at π/2 for t = ½, so the peak gradient is (π/2)·Δ/w (elementary calculus, worked by hand).";

/** SI fraction back to the page's %, without the 1e-16 rounding noise of × 100. */
const percent = (fraction: number) => Number((fraction * 100).toPrecision(12));
const PROFILES = ["linear", "cosine"] as const;
const noOverlap = "There is no overlap between neighbouring tiles (0 % or less than half a pixel), so they can't be registered and the position errors are undefined.";
const noBlend = "The blend width is 0 px (set to 0, or there is no overlap to blend over), so the seam is a hard edge and has no gradient.";

export default defineSchema({
  href: "/imaging/stitching",
  inputs: [
    { key: "gridCols", label: "Grid columns C", unit: "", toSI: 1, siUnit: "", default: 5, min: 1, max: 50 },
    { key: "gridRows", label: "Grid rows R", unit: "", toSI: 1, siUnit: "", default: 5, min: 1, max: 50 },
    { key: "tileWidth", label: "Tile width", unit: "px", toSI: 1, siUnit: "px", default: 512, min: 16, max: 16384 },
    { key: "tileHeight", label: "Tile height", unit: "px", toSI: 1, siUnit: "px", default: 512, min: 16, max: 16384 },
    { key: "overlapPercent", label: "Overlap (% of the tile)", unit: "%", toSI: 0.01, siUnit: "", default: 10, min: 0, max: 90 },
    { key: "blendWidth", label: "Blend width (at most the overlap)", unit: "px", toSI: 1, siUnit: "px", default: 50, min: 0, max: 16384 },
    { key: "positionError", label: "Pairwise registration error σ (per axis)", unit: "px", toSI: 1, siUnit: "px", default: 0.5, min: 0, max: 100 },
    { key: "illuminationVar", label: "Gain mismatch between tiles", unit: "%", toSI: 0.01, siUnit: "", default: 5, min: 0, max: 100 },
  ],
  choices: [
    {
      key: "blendMethod",
      label: "Blend profile",
      options: [
        { value: "linear", label: "Linear ramp" },
        { value: "cosine", label: "Raised cosine (cos²)" },
      ],
      default: "linear",
    },
  ],
  outputs: [
    { key: "mosaicWidth", label: "Mosaic width", unit: "px", toSI: 1, siUnit: "px" },
    { key: "mosaicHeight", label: "Mosaic height", unit: "px", toSI: 1, siUnit: "px" },
    { key: "tiles", label: "Number of tiles", unit: "", toSI: 1, siUnit: "" },
    { key: "overlapX", label: "Overlap in x", unit: "px", toSI: 1, siUnit: "px" },
    { key: "overlapY", label: "Overlap in y", unit: "px", toSI: 1, siUnit: "px" },
    { key: "efficiency", label: "Stitching efficiency (mosaic pixels / acquired pixels)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "blendUsed", label: "Blend width used", unit: "px", toSI: 1, siUnit: "px" },
    { key: "globalMax", label: "Worst tile, global optimisation (per axis)", unit: "px", toSI: 1, siUnit: "px" },
    { key: "globalRms", label: "RMS over tiles, global optimisation (per axis)", unit: "px", toSI: 1, siUnit: "px" },
    { key: "chainMax", label: "Worst tile, chained (per axis)", unit: "px", toSI: 1, siUnit: "px" },
    { key: "chainRms", label: "RMS over tiles, chained (per axis)", unit: "px", toSI: 1, siUnit: "px" },
    { key: "seamSlope", label: "Seam with blending, peak gradient of the gain mismatch", unit: "%/px", toSI: 0.01, siUnit: "1/px" },
  ],
  compute(i) {
    const profile: BlendProfile = PROFILES.find((p) => p === i.blendMethod) ?? "linear";
    const s = stitchingSummary({
      cols: Math.round(i.gridCols), rows: Math.round(i.gridRows), tileWidth: Math.round(i.tileWidth), tileHeight: Math.round(i.tileHeight),
      overlapPercent: percent(i.overlapPercent), blendWidth: i.blendWidth, profile, gain: percent(i.illuminationVar),
    });
    const sigma = i.positionError;
    const noReg = s.noOverlap;
    const warnings = noReg ? [noOverlap] : [];
    const reasons: Record<string, string> = {};
    if (noReg) for (const key of ["globalMax", "globalRms", "chainMax", "chainRms"]) reasons[key] = noOverlap;
    if (!(s.blend > 0)) reasons.seamSlope = noBlend;
    return {
      values: {
        mosaicWidth: s.grid.width,
        mosaicHeight: s.grid.height,
        tiles: s.grid.tiles,
        overlapX: s.grid.overlapX,
        overlapY: s.grid.overlapY,
        efficiency: s.grid.efficiency,
        blendUsed: s.blend,
        globalMax: noReg ? NaN : sigma * s.global.max,
        globalRms: noReg ? NaN : sigma * s.global.rms,
        chainMax: noReg ? NaN : sigma * s.chain.max,
        chainRms: noReg ? NaN : sigma * s.chain.rms,
        seamSlope: s.seamSlope * 0.01,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Defaults: o_x = o_y = round(0.1·512) = round(51.2) = 51; W = H = 5·512 − 4·51 = 2356 px; 25 tiles;
      // η = 2356²/(25·512²) = 5550736/6553600 = 0.84699...; chained, σ = 0.5 px: worst √(5 + 5 − 2)·0.5 = 0.5·√8 = 1.4142135623730951 px,
      // rms 0.5·√(4/2 + 4/2) = 0.5·2 = 1 px. Blend 50 px ≤ 51 px overlap.
      source: GEOMETRY + " " + CHAIN,
      basis: "computed",
      inputs: {},
      expect: { mosaicWidth: 2356, mosaicHeight: 2356, overlapX: 51, efficiency: 84.697509765625, blendUsed: 50, chainMax: 1.4142135623730951, chainRms: 1 },
      tolerance: 1e-8,
    },
    {
      // 2 × 2 grid, σ = 2 px: unit-resistor square, R_eff = 3/4 (an edge: 1 ∥ 3) for the two neighbours and 1 (2 ∥ 2) for the opposite corner,
      // so global worst = 2·√1 = 2 px and rms = 2·√((0 + 3/4 + 3/4 + 1)/4) = 2·√(5/8) = 1.5811388300841898 px;
      // chained: worst 2·√2 = 2.8284271247461903 px, rms 2·√(1/2 + 1/2) = 2 px.
      source: PREIBISCH,
      basis: "computed",
      inputs: { gridCols: 2, gridRows: 2, positionError: 2 },
      expect: { globalMax: 2, globalRms: 1.5811388300841898, chainMax: 2.8284271247461903, chainRms: 2 },
      tolerance: 1e-8,
    },
    {
      // Raised-cosine blend, gain step 5 % over w = 50 px (overlap 51 px): peak gradient (π/2)·5/50 = 0.15707963267948966 %/px.
      source: SEAM,
      basis: "computed",
      inputs: { blendMethod: "cosine" },
      expect: { seamSlope: 0.15707963267948966 },
      tolerance: 1e-8,
    },
  ],
});
