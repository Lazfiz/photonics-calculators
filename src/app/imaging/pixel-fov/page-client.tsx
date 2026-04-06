"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function PixelFovPage() {
  const [pixelSizeUm, setPixelSizeUm] = useState(6.5);
  const [focalLengthMm, setFocalLengthMm] = useState(50);
  const [binning, setBinning] = useState(1);

  const effectivePixelUm = pixelSizeUm * binning;
  const pixelSizeMm = effectivePixelUm / 1000;
  const fovRad = pixelSizeMm / focalLengthMm;
  const fovDeg = fovRad * (180 / Math.PI) * 3600; // arcseconds
  const fovMrad = fovRad * 1000;
  const samplingNyquist = 2 * pixelSizeUm; // µm — max spatial freq sampled

  const chartData = useMemo(() => {
    const fls = Array.from({ length: 150 }, (_, i) => 5 + i * 2);
    return [
      {
        x: fls,
        y: fls.map(fl => (effectivePixelUm / 1000 / fl) * (180 / Math.PI) * 3600),
        type: "scatter" as const, mode: "lines" as const,
        name: "Pixel FOV",
        line: { color: "#60a5fa", width: 2 },
      },
      {
        x: [focalLengthMm], y: [fovDeg],
        type: "scatter" as const, mode: "markers" as const,
        name: "Current",
        marker: { color: "#f87171", size: 12 },
      },
    ];
  }, [effectivePixelUm, focalLengthMm, fovDeg]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Pixel Field of View" description="Calculate the angular field of view per pixel from pixel size and focal length.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">θ_pixel = arctan(p / f) ≈ p / f</p>
        <p className="text-gray-500 text-xs mt-1">where p = pixel pitch, f = focal length (small angle approx.)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pixel Size (µm)</span>
          <input type="number" value={pixelSizeUm} onChange={e => setPixelSizeUm(+e.target.value)} min={1} max={50} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Focal Length (mm)</span>
          <input type="number" value={focalLengthMm} onChange={e => setFocalLengthMm(+e.target.value)} min={1} max={10000} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Binning</span>
          <select value={binning} onChange={e => setBinning(+e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={1}>1×1</option>
            <option value={2}>2×2</option>
            <option value={3}>3×3</option>
            <option value={4}>4×4</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pixel FOV</p>
          <p className="text-2xl font-bold text-blue-400">{fovDeg.toFixed(2)}&quot;</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pixel FOV (mrad)</p>
          <p className="text-2xl font-bold text-green-400">{fovMrad.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Pixel</p>
          <p className="text-2xl font-bold text-yellow-400">{effectivePixelUm.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nyquist (lp/mm)</p>
          <p className="text-2xl font-bold text-purple-400">{(500 / effectivePixelUm).toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Focal Length (mm)", gridcolor: "#374151" },
          yaxis: { title: "Pixel FOV (arcsec)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
