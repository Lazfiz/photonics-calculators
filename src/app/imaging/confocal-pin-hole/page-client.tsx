"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ConfocalPinholePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 488); // nm
  const [na, setNA] = useURLState("na", 1.4);
  const [magnification, setMagnification] = useURLState("magnification", 60);

  const chartData = useMemo(() => {
    const ratios = Array.from({ length: 200 }, (_, i) => (i * 3) / 200);
    // Axial resolution vs pinhole size (in Airy units)
    const airyDiam = 1.22 * wavelength / na;
    const axialIdeal = 1.4 * wavelength / (na * na); // nm, ideal confocal
    const axial = ratios.map(r => {
      // Larger pinhole → worse axial resolution, approaching widefield
      const widefield = 2 * wavelength / (na * na);
      return axialIdeal + (widefield - axialIdeal) * (1 - Math.exp(-r * r));
    });
    // Signal throughput vs pinhole size
    const throughput = ratios.map(r => 1 - Math.exp(-r * r * 2));
    return [
      { x: ratios, y: axial, type: "scatter" as const, mode: "lines" as const, name: "Axial Resolution", line: { color: "#60a5fa" } },
      { x: ratios, y: throughput, type: "scatter" as const, mode: "lines" as const, name: "Throughput", line: { color: "#f87171" } },
    ];
  }, [wavelength, na, magnification]);

  const airyDiam = 1.22 * wavelength / na;
  const optimalPinhole = airyDiam / magnification;
  const axialRes = 1.4 * wavelength / (na * na);
  const lateralRes = 0.61 * wavelength / na;

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Confocal Pinhole Size" description="Optimal pinhole ≈ 1 Airy unit (dAU/M). Trade-off: resolution vs signal.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="NA" value={na} onChange={setNA} step="0.01" />
        <ValidatedNumberInput label="Magnification" value={magnification} onChange={setMagnification} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Airy disk diameter = <span className="text-blue-400 font-mono">{airyDiam.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Optimal pinhole = <span className="text-blue-400 font-mono">{optimalPinhole.toFixed(2)} nm</span></p>
        <p className="text-gray-300">Lateral resolution = <span className="text-blue-400 font-mono">{lateralRes.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Axial resolution = <span className="text-blue-400 font-mono">{axialRes.toFixed(1)} nm</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Pinhole Size (Airy Units)", gridcolor: "#374151" }, yaxis: { title: "Normalized Value", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true }} />
    </CalculatorShell>
  );
}
