"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  type BlendProfile,
  blendWeight,
  globalStitchError,
  sequentialStitchError,
  tileGrid,
} from "../../../physics/imaging/registration";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const card = (label: string, value: string, sub: string, color: string) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{sub}</p>
  </div>
);

const buttonClass = (active: boolean) =>
  `px-3 py-2 rounded text-sm font-medium ${active ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`;

const PROFILES: BlendProfile[] = ["linear", "cosine"];
const PROFILE_LABELS: Record<BlendProfile, string> = { linear: "Linear ramp", cosine: "Raised cosine (cos²)" };
const MAX_SIDE = 50;
const SQUARE_GRIDS = [1, 2, 3, 4, 5, 7, 10, 14, 20, 28, 40, 50];

// The global solution costs (C·R)² operations (≈ 0.1 s at 50 × 50): cache it per grid size.
const globalCache = new Map<string, ReturnType<typeof globalStitchError>>();
const cachedGlobal = (cols: number, rows: number) => {
  const key = `${cols}x${rows}`;
  let r = globalCache.get(key);
  if (!r) globalCache.set(key, (r = globalStitchError(cols, rows)));
  return r;
};

export default function StitchingPage() {
  const [colsRaw, setGridCols] = useURLState("gridCols", 5);
  const [rowsRaw, setGridRows] = useURLState("gridRows", 5);
  const [widthRaw, setTileWidth] = useURLState("tileWidth", 512);
  const [heightRaw, setTileHeight] = useURLState("tileHeight", 512);
  const [overlapRaw, setOverlapPercent] = useURLState("overlapPercent", 10);
  const [blendRaw, setBlendWidth] = useURLState("blendWidth", 50);
  const [profileRaw, setProfile] = useURLState("blendMethod", "linear");
  const [sigmaRaw, setPositionError] = useURLState("positionError", 0.5);
  const [gainRaw, setIlluminationVar] = useURLState("illuminationVar", 5);
  const cols = Math.round(clamp(colsRaw, 1, MAX_SIDE, 5));
  const rows = Math.round(clamp(rowsRaw, 1, MAX_SIDE, 5));
  const tileWidth = Math.round(clamp(widthRaw, 16, 16384, 512));
  const tileHeight = Math.round(clamp(heightRaw, 16, 16384, 512));
  const overlapPercent = clamp(overlapRaw, 0, 90, 10);
  const profile: BlendProfile = PROFILES.find((p) => p === profileRaw) ?? "linear";
  const sigma = clamp(sigmaRaw, 0, 100, 0.5);
  const gain = clamp(gainRaw, 0, 100, 5);

  const g = tileGrid({ cols, rows, tileWidth, tileHeight, overlap: overlapPercent / 100 });
  const blend = Math.min(clamp(blendRaw, 0, 16384, 50), g.overlapX);
  const chain = sequentialStitchError(cols, rows);
  const globalErr = cachedGlobal(cols, rows);
  // Worst-tile error in σ units for square grids: chained √(2n − 2) against the global least-squares solution.
  const squares = SQUARE_GRIDS.map((n) => cachedGlobal(n, n).max);

  // A gain step Δ blended over w: the slope is Δ/w for the ramp and peaks at (π/2)·Δ/w mid-seam for cos².
  const seamSlope = ((profile === "cosine" ? Math.PI / 2 : 1) * gain) / blend;

  const ts = Array.from({ length: 101 }, (_, k) => k / 100);
  const xs = ts.map((t) => (t - 0.5) * blend);
  const wA = ts.map((t) => blendWeight(profile, t));
  const blendChart = [
    { x: xs, y: wA, type: "scatter" as const, mode: "lines" as const, name: "Tile A weight", line: { color: "#60a5fa", width: 2 } },
    { x: xs, y: wA.map((w) => 1 - w), type: "scatter" as const, mode: "lines" as const, name: "Tile B weight", line: { color: "#f87171", width: 2 } },
    { x: xs, y: wA.map((w) => 1 + gain / 100 * (1 - w) - gain / 100 / 2), type: "scatter" as const, mode: "lines" as const, name: "Blended intensity (gain step)", line: { color: "#fbbf24", width: 2, dash: "dash" } },
  ];
  const errorChart = [
    { x: SQUARE_GRIDS, y: SQUARE_GRIDS.map((n) => sigma * Math.sqrt(2 * n - 2)), type: "scatter" as const, mode: "lines+markers" as const, name: "Chained, worst tile", line: { color: "#f87171", width: 2 } },
    { x: SQUARE_GRIDS, y: squares.map((r) => sigma * r), type: "scatter" as const, mode: "lines+markers" as const, name: "Global optimisation, worst tile", line: { color: "#34d399", width: 2 } },
    ...(cols === rows && Number.isFinite(globalErr.max)
      ? [{ x: [cols], y: [sigma * globalErr.max], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } }]
      : []),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {card("Mosaic size", Number.isFinite(g.width) ? `${g.width} × ${g.height}` : "—", `${cols} × ${rows} = ${g.tiles} tiles, overlap ${g.overlapX} × ${g.overlapY} px`, "text-blue-400")}
        {card("Stitching efficiency", fmt(g.efficiency * 100, 2, " %"), "Mosaic pixels / acquired pixels", "text-yellow-400")}
        {card("Worst tile, global optimisation", fmt(sigma * globalErr.max, 2, " px"), `RMS over tiles ${fmt(sigma * globalErr.rms, 2, " px")}, per axis`, "text-green-400")}
        {card("Worst tile, chained", fmt(sigma * chain.max, 2, " px"), `σ√(C + R − 2); RMS over tiles ${fmt(sigma * chain.rms, 2, " px")}`, "text-red-400")}
      </div>

      <div role="group" aria-label="Blend profile" className="flex flex-wrap gap-2 mb-4">
        {PROFILES.map((p) => (
          <button key={p} onClick={() => setProfile(p)} className={buttonClass(profile === p)}>{PROFILE_LABELS[p]}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Grid columns C" value={colsRaw} onChange={setGridCols} min={1} max={MAX_SIDE} step="1" />
        <ValidatedNumberInput label="Grid rows R" value={rowsRaw} onChange={setGridRows} min={1} max={MAX_SIDE} step="1" />
        <ValidatedNumberInput label="Overlap (% of the tile)" value={overlapRaw} onChange={setOverlapPercent} min={0} max={90} step="any" />
        <ValidatedNumberInput label="Tile width (px)" value={widthRaw} onChange={setTileWidth} min={16} max={16384} step="1" />
        <ValidatedNumberInput label="Tile height (px)" value={heightRaw} onChange={setTileHeight} min={16} max={16384} step="1" />
        <ValidatedNumberInput label="Blend width (px, at most the overlap)" value={blendRaw} onChange={setBlendWidth} min={0} max={16384} step="1" />
        <ValidatedNumberInput label="Pairwise registration error σ (px, per axis)" value={sigmaRaw} onChange={setPositionError} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Gain mismatch between tiles (%)" value={gainRaw} onChange={setIlluminationVar} min={0} max={100} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {card("Seam without blending", fmt(gain, 1, " % step"), "A tile-to-tile gain mismatch shows as a sharp edge", "text-gray-200")}
        {card("Seam with blending, peak gradient", blend > 0 ? fmt(seamSlope, 3, " %/px") : "—", blend > 0 ? `The same step spread over ${fmt(blend, 0, " px")}${profile === "cosine" ? " (cos² peaks at π/2 × the mean slope)" : ""}: weights sum to 1, so no bright or dark band` : "Blend width 0: hard seam", "text-gray-200")}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Blend weights across the seam</h3>
          <ChartPanel data={blendChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Position from the seam centre (px)", gridcolor: "#374151" },
            yaxis: { title: "Weight / relative intensity", gridcolor: "#374151", range: [0, 1.1 + gain / 200] },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Worst-tile position error in an n × n grid</h3>
          <ChartPanel data={errorChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Tiles per side n", type: "log", gridcolor: "#374151" },
            yaxis: { title: "Position error (px, per axis)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Mosaic width:</span> W = C·w − (C − 1)·round(o·w), and the same for the height with h</p>
          <p><span className="text-blue-400">Efficiency:</span> η = W·H / (C·R·w·h)</p>
          <p><span className="text-blue-400">Blend:</span> I = α·I_A + (1 − α)·I_B, α = 1 − t or cos²(πt/2), t ∈ [0, 1]</p>
          <p><span className="text-blue-400">Chained:</span> σ_ij = σ·√(i + j) for tile (i, j) placed from tile (0, 0)</p>
          <p><span className="text-blue-400">Global:</span> σ_ij = σ·√R_eff(00, ij), the effective resistance of the tile grid with unit edges</p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Each pair of neighbouring tiles is registered with an independent error σ per axis, and the first tile is the
          anchor. Chaining adds errors like a random walk; a global least-squares fit over all pairwise offsets (as in
          Preibisch&apos;s stitching plugin) has the variance of an electrical network, which grows only logarithmically with
          the grid size. The blend sum shows a gain mismatch spread across the blend; multiband blending is not modelled.
        </p>
      </div>
    </>
  );
}
