"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function FOVCalculatorPage() {
  const [sensorW, setSensorW] = useURLState("sensorW", 13.336);
  const [sensorH, setSensorH] = useURLState("sensorH", 10.016);
  const [mag, setMag] = useURLState("mag", 20);
  const [pixelSize, setPixelSize] = useURLState("pixelSize", 6.5);

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
        <ValidatedNumberInput label="Sensor Width (mm)" value={sensorW} onChange={setSensorW} min={1} step="any" />
        <ValidatedNumberInput label="Sensor Height (mm)" value={sensorH} onChange={setSensorH} min={1} step="any" />
        <ValidatedNumberInput label="Magnification (×)" value={mag} onChange={setMag} min={0.5} step="any" />
        <ValidatedNumberInput label="Pixel Size (µm)" value={pixelSize} onChange={setPixelSize} min={0.5} step="any" />
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
