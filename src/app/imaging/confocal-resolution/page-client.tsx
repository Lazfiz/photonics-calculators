"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function ConfocalResolutionPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [na, setNa] = useURLState("na", 1.4);
  const [pinholeAU, setPinholeAU] = useURLState("pinholeAU", 1.0);
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.518);

  // Lateral resolution (confocal ~0.4× widefield)
  const widefieldLateral = 0.61 * wavelength / na;
  const confocalLateral = 0.4 * wavelength / na;

  // Axial resolution
  const widefieldAxial = 2 * refractiveIndex * wavelength / (na * na);
  const confocalAxial = 1.4 * refractiveIndex * wavelength / (na * na);

  // Pinhole size in µm
  const airyRadiusUm = 0.61 * wavelength / (na * 1000);
  const pinholeUm = pinholeAU * airyRadiusUm;

  const chartData = useMemo(() => {
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.016);
    return [
      { x: nas, y: nas.map(n => 0.61 * wavelength / n), type: "scatter", mode: "lines", name: "Widefield Lateral", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(n => 0.4 * wavelength / n), type: "scatter", mode: "lines", name: "Confocal Lateral", line: { color: "#34d399" } },
      { x: nas, y: nas.map(n => 2 * refractiveIndex * wavelength / (n * n)), type: "scatter", mode: "lines", name: "Widefield Axial", line: { color: "#f87171", dash: "dash" } },
      { x: nas, y: nas.map(n => 1.4 * refractiveIndex * wavelength / (n * n)), type: "scatter", mode: "lines", name: "Confocal Axial", line: { color: "#fbbf24", dash: "dash" } },
      { x: [na], y: [confocalLateral], type: "scatter", mode: "markers", name: "Current Lateral", marker: { color: "#34d399", size: 12 } },
      { x: [na], y: [confocalAxial], type: "scatter", mode: "markers", name: "Current Axial", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [wavelength, na, refractiveIndex, confocalLateral, confocalAxial]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Confocal Resolution Calculator" description="Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={2000} />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Pinhole (Airy units)" value={pinholeAU} onChange={setPinholeAU} min={0.1} max={5} step="0.1" />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.001" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Confocal Lateral</p>
          <p className="text-2xl font-bold text-green-400">{confocalLateral.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Confocal Axial</p>
          <p className="text-2xl font-bold text-yellow-400">{confocalAxial.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Widefield Lateral</p>
          <p className="text-2xl font-bold text-blue-400">{widefieldLateral.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pinhole Diameter</p>
          <p className="text-2xl font-bold text-purple-400">{pinholeUm.toFixed(2)} µm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
                      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "NA", gridcolor: "#374151" },
          yaxis: { title: "Resolution (nm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
