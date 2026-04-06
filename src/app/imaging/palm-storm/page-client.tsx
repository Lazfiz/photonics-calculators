"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function PALMSTORMPage() {
  const [wavelength, setWavelength] = useState(647);
  const [na, setNa] = useState(1.49);
  const [localizationPrecision, setLocalizationPrecision] = useState(20);
  const [labelDensity, setLabelDensity] = useState(5);
  const [numFrames, setNumFrames] = useState(20000);
  const [pixelSize, setPixelSize] = useState(100);

  // Nyquist sampling
  const nyquist = wavelength / (2 * na * 2);
  // Localization precision (σ) as fraction of diffraction limit
  const diffractionLimit = 0.61 * wavelength / na;
  const localizationFactor = localizationPrecision / diffractionLimit;
  // Effective resolution (approximation: depends on labeling density & precision)
  const effectiveRes = localizationPrecision > 0 && labelDensity > 0
    ? localizationPrecision + diffractionLimit / labelDensity
    : localizationPrecision;
  // Minimum label density for Nyquist sampling
  const minLabelDensity = 2 / diffractionLimit; // labels per nm
  // Total acquisition time at 100fps
  const acqTime = numFrames / 100;

  const chartData = useMemo(() => {
    const densities = Array.from({ length: 80 }, (_, i) => 1 + i * 0.5);
    return [
      { x: densities, y: densities.map(d => localizationPrecision + diffractionLimit / d), type: "scatter", mode: "lines", name: "Effective Resolution", line: { color: "#34d399" } },
      { x: [labelDensity], y: [effectiveRes], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
      { x: [densities[0], densities[densities.length - 1]], y: [localizationPrecision, localizationPrecision], type: "scatter", mode: "lines", name: "Precision Limit", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [localizationPrecision, diffractionLimit, labelDensity, effectiveRes]);

  const precisionData = useMemo(() => {
    const precisions = Array.from({ length: 60 }, (_, i) => 5 + i * 1.5);
    return [
      { x: precisions, y: precisions.map(p => p / diffractionLimit * 100), type: "scatter", mode: "lines", name: "Precision / Diffraction (%)", line: { color: "#a78bfa" } },
      { x: [localizationPrecision], y: [localizationPrecision / diffractionLimit * 100], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [localizationPrecision, diffractionLimit]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="PALM/STORM Localization Calculator" description="Estimate effective resolution for single-molecule localization microscopy (PALM/STORM) based on localization precision and labeling density.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={400} max={900}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Numerical Aperture</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.5} max={1.7} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Localization Precision (nm)</span>
          <input type="number" value={localizationPrecision} onChange={e => setLocalizationPrecision(+e.target.value)} min={1} max={100}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Label Density (labels/100nm)</span>
          <input type="number" value={labelDensity} onChange={e => setLabelDensity(+e.target.value)} min={0.5} max={50} step="0.5"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Number of Frames</span>
          <input type="number" value={numFrames} onChange={e => setNumFrames(+e.target.value)} min={1000} max={100000} step="1000"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pixel Size (nm)</span>
          <input type="number" value={pixelSize} onChange={e => setPixelSize(+e.target.value)} min={50} max={300} step="10"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Diffraction Limit</p>
          <p className="text-2xl font-bold text-blue-400">{diffractionLimit.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Resolution</p>
          <p className="text-2xl font-bold text-green-400">{effectiveRes.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Precision / Diffraction</p>
          <p className="text-2xl font-bold text-yellow-400">{(localizationFactor * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Acq. Time (100 fps)</p>
          <p className="text-2xl font-bold text-purple-400">{acqTime.toFixed(0)} s</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
                              </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Label Density (per 100nm)", gridcolor: "#374151" },
            yaxis: { title: "Effective Resolution (nm)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={precisionData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Localization Precision (nm)", gridcolor: "#374151" },
            yaxis: { title: "Precision / Diffraction (%)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
