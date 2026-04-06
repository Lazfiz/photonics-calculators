"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function MicroBendPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [period, setPeriod] = useState(1);
  const [amplitude, setAmplitude] = useState(1);
  const [length, setLength] = useState(100);

  const loss = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const p = period * 1e-3;
    const amp = amplitude * 1e-6;
    const L = length * 1e-3;
    const couplingCoeff = Math.pow(amp / lambda, 2) * 1e4;
    return couplingCoeff * L / p * 0.1;
  }, [wavelength, period, amplitude, length]);

  const chartData = useMemo(() => {
    const periods = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.05);
    return [
      { x: periods, y: periods.map(p => {
        const lambda = wavelength * 1e-9;
        const amp = amplitude * 1e-6;
        const L = length * 1e-3;
        return Math.pow(amp / lambda, 2) * 1e4 * L / (p * 1e-3) * 0.1;
      }), type: "scatter" as const, mode: "lines" as const, name: "Microbend Loss", line: { color: "#a78bfa" } },
      { x: [period], y: [loss], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, amplitude, length, period, loss]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Micro Bend Loss" description="Calculate microbending loss from periodic perturbations in fiber geometry.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={800} max={2000} />
        <ValidatedNumberInput label="Perturbation Period (mm)" value={period} onChange={setPeriod} min={0.1} max={10} step="0.1" />
        <ValidatedNumberInput label="Amplitude (µm)" value={amplitude} onChange={setAmplitude} min={0.1} max={10} step="0.1" />
        <ValidatedNumberInput label="Affected Length (m)" value={length} onChange={setLength} min={1} max={1000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Microbend Loss</p>
          <p className="text-2xl font-bold text-purple-400">{loss.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Loss/km</p>
          <p className="text-2xl font-bold text-blue-400">{(loss * 1000 / length).toFixed(3)} dB/km</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coupling Coeff.</p>
          <p className="text-2xl font-bold text-green-400">{(Math.pow(amplitude * 1e-6 / (wavelength * 1e-9), 2) * 1e4).toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Severity</p>
          <p className={`text-2xl font-bold ${loss < 0.01 ? "text-green-400" : loss < 0.1 ? "text-yellow-400" : "text-red-400"}`}>{loss < 0.01 ? "Low" : loss < 0.1 ? "Medium" : "High"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Perturbation Period (mm)", gridcolor: "#374151" },
          yaxis: { title: "Loss (dB)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
