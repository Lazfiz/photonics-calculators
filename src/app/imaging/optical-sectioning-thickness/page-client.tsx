"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function OpticalSectioningPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [na, setNa] = useURLState("na", 0.75);
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.518);
  const [pinholeAU, setPinholeAU] = useURLState("pinholeAU", 1.0);

  // Axial extent of detection PSF
  const airyRadiusUm = 0.61 * wavelength / (na * 1000);
  const pinholeDiam = pinholeAU * 2 * airyRadiusUm;

  // Widefield optical section thickness (depth of field)
  const dof = refractiveIndex * wavelength / (na * na);

  // Confocal optical section thickness
  const confocalSection = 1.4 * refractiveIndex * wavelength / (na * na);

  // Multiphoton section thickness
  const multiPhotonSection = 2 * refractiveIndex * wavelength / (na * na) * 0.7;

  const chartData = useMemo(() => {
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.016);
    return [
      { x: nas, y: nas.map(n => refractiveIndex * wavelength / (n * n)), type: "scatter", mode: "lines", name: "Widefield", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(n => 1.4 * refractiveIndex * wavelength / (n * n)), type: "scatter", mode: "lines", name: "Confocal (1 AU)", line: { color: "#34d399" } },
      { x: nas, y: nas.map(n => 0.7 * 2 * refractiveIndex * wavelength / (n * n)), type: "scatter", mode: "lines", name: "Multiphoton", line: { color: "#fbbf24", dash: "dash" } },
      { x: [na], y: [confocalSection], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, na, refractiveIndex, confocalSection]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Optical Sectioning Thickness Calculator" description="Compare optical sectioning capability across widefield, confocal, and multiphoton microscopy techniques.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={2000} />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.001" />
        <ValidatedNumberInput label="Pinhole (Airy units)" value={pinholeAU} onChange={setPinholeAU} min={0.1} max={5} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Widefield Section</p>
          <p className="text-2xl font-bold text-blue-400">{dof.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Confocal Section</p>
          <p className="text-2xl font-bold text-green-400">{confocalSection.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Multiphoton Section</p>
          <p className="text-2xl font-bold text-yellow-400">{multiPhotonSection.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pinhole Diameter</p>
          <p className="text-2xl font-bold text-purple-400">{pinholeDiam.toFixed(2)} µm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
                              </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "NA", gridcolor: "#374151" },
          yaxis: { title: "Section Thickness (nm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
