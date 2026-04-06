"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function FOVCalculatorPage() {
  const [sensorW, setSensorW] = useState(13.336);
  const [sensorH, setSensorH] = useState(10.016);
  const [mag, setMag] = useState(20);
  const [pixelSize, setPixelSize] = useState(6.5);

  const fovW = sensorW / mag;
  const fovH = sensorH / mag;
  const fovDiag = Math.sqrt(fovW * fovW + fovH * fovH);
  const pixelFOV = pixelSize / (mag * 1000); // µm

  const chartData = useMemo(() => {
    const mags = Array.from({ length: 50 }, (_, i) => 1 + i * 2);
    return [
      { x: mags, y: mags.map(m => sensorW / m), type: "scatter" as const, mode: "lines" as const, name: "FOV Width", line: { color: "#60a5fa" } },
      { x: mags, y: mags.map(m => sensorH / m), type: "scatter" as const, mode: "lines" as const, name: "FOV Height", line: { color: "#34d399" } },
      { x: [mag], y: [fovW], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [sensorW, sensorH, mag, fovW]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Field of View Calculator" description="Calculate sample FOV from sensor dimensions and system magnification.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Sensor Width (mm)</span>
          <input type="number" value={sensorW} onChange={e => setSensorW(+e.target.value)} min={1} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Sensor Height (mm)</span>
          <input type="number" value={sensorH} onChange={e => setSensorH(+e.target.value)} min={1} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Magnification (×)</span>
          <input type="number" value={mag} onChange={e => setMag(+e.target.value)} min={0.5} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pixel Size (µm)</span>
          <input type="number" value={pixelSize} onChange={e => setPixelSize(+e.target.value)} min={0.5} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FOV Width</p>
          <p className="text-2xl font-bold text-blue-400">{fovW.toFixed(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FOV Height</p>
          <p className="text-2xl font-bold text-green-400">{fovH.toFixed(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FOV Diagonal</p>
          <p className="text-2xl font-bold text-yellow-400">{fovDiag.toFixed(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pixel FOV</p>
          <p className="text-2xl font-bold text-purple-400">{(pixelFOV * 1000).toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Magnification (×)", gridcolor: "#374151" },
          yaxis: { title: "FOV (mm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
