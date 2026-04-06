"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

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
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={900} />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.5} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Localization Precision (nm)" value={localizationPrecision} onChange={setLocalizationPrecision} min={1} max={100} />
        <ValidatedNumberInput label="Label Density (labels/100nm)" value={labelDensity} onChange={setLabelDensity} min={0.5} max={50} step="0.5" />
        <ValidatedNumberInput label="Number of Frames" value={numFrames} onChange={setNumFrames} min={1000} max={100000} step="1000" />
        <ValidatedNumberInput label="Pixel Size (nm)" value={pixelSize} onChange={setPixelSize} min={50} max={300} step="10" />
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
