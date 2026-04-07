"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function GratingEfficiencyPage() {
  const [groovesPerMm, setGroovesPerMm] = useState(1200);
  const [blazeAngle, setBlazeAngle] = useState(17.5);
  const [wavelength, setWavelength] = useState(500);

  const blazeRad = blazeAngle * Math.PI / 180;
  const blazeWavelength = (2 / groovesPerMm) * Math.sin(blazeRad) * 1000; // nm in Littrow

  const efficiency = (wl: number) => {
    const delta = wl - blazeWavelength;
    const sigma = blazeWavelength * 0.3;
    return Math.max(0, Math.exp(-0.5 * Math.pow(delta / sigma, 2)));
  };

  const currentEff = efficiency(wavelength);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => blazeWavelength - 300 + i * 3);
    return [
      { x: wls, y: wls.map(efficiency), type: "scatter" as const, mode: "lines" as const, name: "Efficiency", line: { color: "#c084fc" } },
      { x: [wavelength], y: [currentEff], type: "scatter" as const, mode: "markers" as const, name: "Selected", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, blazeWavelength]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Grating Efficiency Calculator" description="Estimate diffraction grating efficiency based on groove density, blaze angle, and wavelength.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Grooves/mm" value={groovesPerMm} onChange={setGroovesPerMm} min={50} max={6000} />
        <ValidatedNumberInput label="Blaze Angle (°)" value={blazeAngle} onChange={setBlazeAngle} min={1} max={89} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={100} max={5000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Blaze Wavelength (Littrow)</p>
          <p className="text-2xl font-bold text-purple-400">{blazeWavelength.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Est. Efficiency</p>
          <p className="text-2xl font-bold text-green-400">{(currentEff * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Groove Spacing</p>
          <p className="text-2xl font-bold text-blue-400">{(1000 / groovesPerMm).toFixed(3)} µm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Relative Efficiency", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
