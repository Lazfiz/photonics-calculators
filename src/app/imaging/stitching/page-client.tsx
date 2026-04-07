"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function StitchingPage() {
  const [gridCols, setGridCols] = useState(5);
  const [gridRows, setGridRows] = useState(5);
  const [tileWidth, setTileWidth] = useState(512);
  const [tileHeight, setTileHeight] = useState(512);
  const [overlapPercent, setOverlapPercent] = useState(10);
  const [blendWidth, setBlendWidth] = useState(50);
  const [blendMethod, setBlendMethod] = useState<"linear" | "feather" | "multiband">("linear");
  const [positionError, setPositionError] = useState(5);
  const [illuminationVar, setIlluminationVar] = useState(5);

  const overlapPx = Math.round(tileWidth * overlapPercent / 100);
  const stitchedWidth = gridCols * tileWidth - (gridCols - 1) * overlapPx;
  const stitchedHeight = gridRows * tileHeight - (gridRows - 1) * overlapPx;
  const totalTiles = gridCols * gridRows;
  const totalPixels = totalTiles * tileWidth * tileHeight;
  const stitchedPixels = stitchedWidth * stitchedHeight;
  const efficiency = (stitchedPixels / totalPixels * 100);
  const effectiveBlend = Math.min(blendWidth, overlapPx);

  // Position accuracy after stitching
  const cumulativeError = positionError * Math.sqrt(Math.max(gridCols, gridRows));
  const correctedError = positionError * 0.3; // After global optimization

  // Overlap quality score
  const overlapQuality = Math.max(0, 100 - positionError * 5 - illuminationVar * 2);

  // Blend profile visualization
  const blendProfile = useMemo(() => {
    const x = Array.from({ length: 100 }, (_, i) => i);
    let alpha1: number[], alpha2: number[];
    
    if (blendMethod === "linear") {
      alpha1 = x.map(i => Math.max(0, Math.min(1, 1 - i / 100)));
      alpha2 = x.map(i => Math.max(0, Math.min(1, i / 100)));
    } else if (blendMethod === "feather") {
      alpha1 = x.map(i => Math.max(0, Math.min(1, Math.cos((i / 100) * Math.PI / 2))));
      alpha2 = x.map(i => Math.max(0, Math.min(1, Math.sin((i / 100) * Math.PI / 2))));
    } else {
      // Multiband - smoother transition
      alpha1 = x.map(i => {
        const t = i / 100;
        return Math.max(0, Math.min(1, (1 - t) * (1 + 0.3 * Math.sin(t * Math.PI))));
      });
      alpha2 = x.map(i => {
        const t = i / 100;
        return Math.max(0, Math.min(1, t * (1 + 0.3 * Math.sin(t * Math.PI))));
      });
    }

    return [
      { x, y: alpha1, type: "scatter", mode: "lines" as const, name: "Tile A weight", line: { color: "#60a5fa", width: 2 }, fill: "tozeroy", fillcolor: "#60a5fa20" },
      { x, y: alpha2, type: "scatter", mode: "lines" as const, name: "Tile B weight", line: { color: "#f87171", width: 2 }, fill: "tozeroy", fillcolor: "#f8717120" },
    ];
  }, [blendMethod]);

  // Error accumulation across grid
  const errorAccumulation = useMemo(() => {
    const positions = Array.from({ length: Math.max(gridCols, gridRows) }, (_, i) => i + 1);
    const uncorrected = positions.map(p => positionError * Math.sqrt(p));
    const corrected = positions.map(() => correctedError);
    return [
      { x: positions, y: uncorrected, type: "scatter", mode: "lines" as const, name: "Uncorrected", line: { color: "#f87171", width: 2 } },
      { x: positions, y: corrected, type: "scatter", mode: "lines" as const, name: "After Global Opt.", line: { color: "#34d399", width: 2 } },
    ];
  }, [gridCols, gridRows, positionError, correctedError]);

  // Overlap vs efficiency tradeoff
  const overlapTradeoff = useMemo(() => {
    const overlaps = Array.from({ length: 20 }, (_, i) => 5 + i * 2.5);
    const efficiencies = overlaps.map(o => {
      const ovPx = Math.round(tileWidth * o / 100);
      const sw = gridCols * tileWidth - (gridCols - 1) * ovPx;
      const sh = gridRows * tileHeight - (gridRows - 1) * ovPx;
      return (sw * sh) / (totalTiles * tileWidth * tileHeight) * 100;
    });
    const quality = overlaps.map(o => Math.min(100, o * 3 + 50));
    return [
      { x: overlaps, y: efficiencies, type: "scatter", mode: "lines" as const, name: "Efficiency (%)", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: overlaps, y: quality, type: "scatter", mode: "lines" as const, name: "Registration Quality", line: { color: "#fbbf24", width: 2 }, yaxis: "y2" },
      { x: [overlapPercent], y: [efficiency], type: "scatter", mode: "markers" as const, name: "Current Eff.", marker: { color: "#60a5fa", size: 10 } },
    ];
  }, [gridCols, gridRows, tileWidth, tileHeight, totalTiles, overlapPercent, efficiency]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Image Stitching" description="Calculate tile grid parameters, overlap, blending profiles, and stitching accuracy for large-area microscopy.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stitched Size</p>
          <p className="text-2xl font-bold text-blue-400">{stitchedWidth}×{stitchedHeight}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Tiles</p>
          <p className="text-2xl font-bold text-green-400">{totalTiles}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stitching Efficiency</p>
          <p className="text-2xl font-bold text-yellow-400">{efficiency.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Position Error</p>
          <p className="text-2xl font-bold text-purple-400">{correctedError.toFixed(1)} px</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Grid Columns" value={gridCols} onChange={setGridCols} min={1} max={50} />
        <ValidatedNumberInput label="Grid Rows" value={gridRows} onChange={setGridRows} min={1} max={50} />
        <ValidatedNumberInput label="Tile Width (px)" value={tileWidth} onChange={setTileWidth} min={64} max={4096} />
        <ValidatedNumberInput label="Tile Height (px)" value={tileHeight} onChange={setTileHeight} min={64} max={4096} />
        <ValidatedNumberInput label="Overlap (%)" value={overlapPercent} onChange={setOverlapPercent} min={0} max={50} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Overlap (px)</span>
          <p className="mt-1 text-lg text-gray-300">{overlapPx} px</p>
        </label>
        <ValidatedNumberInput label="Blend Width (px)" value={blendWidth} onChange={setBlendWidth} min={0} max={200} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Blend Method</span>
          <select value={blendMethod} onChange={e => setBlendMethod(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="linear">Linear</option>
            <option value="feather">Feather (Cosine)</option>
            <option value="multiband">Multiband</option>
          </select>
        </label>
        <ValidatedNumberInput label="Position Error (px)" value={positionError} onChange={setPositionError} min={0} max={50} step="0.5" />
        <ValidatedNumberInput label="Illumination Variation (%)" value={illuminationVar} onChange={setIlluminationVar} min={0} max={30} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Cumulative Error (uncorrected)</p>
          <p className="text-xl font-bold text-red-400">{cumulativeError.toFixed(1)} px</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">After Global Optimization</p>
          <p className="text-xl font-bold text-green-400">{correctedError.toFixed(1)} px</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Overlap Quality Score</p>
          <p className="text-xl font-bold text-yellow-400">{overlapQuality.toFixed(0)}%</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Blend Weight Profiles</h3>
          <ChartPanel data={blendProfile} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Position in overlap", gridcolor: "#374151" }, yaxis: { title: "Weight", gridcolor: "#374151", range: [0, 1.1] },
            margin: { t: 30, r: 20, b: 50, l: 50 }, legend: { font: { size: 10 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Error Accumulation Across Grid</h3>
          <ChartPanel data={errorAccumulation} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Tile Position", gridcolor: "#374151" }, yaxis: { title: "Position Error (px)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Overlap vs Efficiency Tradeoff</h3>
        <ChartPanel data={overlapTradeoff} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Overlap (%)", gridcolor: "#374151" },
          yaxis: { title: "Efficiency (%)", gridcolor: "#374151", side: "left" },
          yaxis2: { title: "Quality Score", overlaying: "y", side: "right", gridcolor: "#374151" },
          margin: { t: 30, r: 60, b: 50, l: 60 }, legend: { font: { size: 9 } },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Stitched width:</span> W = N_col · w_tile − (N_col − 1) · overlap</p>
          <p><span className="text-blue-400">Efficiency:</span> η = (W · H) / (N_tiles · w · h) × 100%</p>
          <p><span className="text-blue-400">Linear blend:</span> I = (1 − t)·I_A + t·I_B, t ∈ [0,1]</p>
          <p><span className="text-blue-400">Feather blend:</span> α_A = cos(θ), α_B = sin(θ), θ ∈ [0, π/2]</p>
          <p><span className="text-blue-400">Cumulative error:</span> σ_cum = σ_stage · √N</p>
          <p><span className="text-blue-400">Global optimization:</span> min Σᵢⱼ ‖T_i(x_i) − T_j(x_j)‖² for overlapping pairs</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
