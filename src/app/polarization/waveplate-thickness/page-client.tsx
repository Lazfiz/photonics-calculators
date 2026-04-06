"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function WaveplateThicknessPage() {
  const [wavelengthNm, setWavelengthNm] = useState(550);
  const [birefringence, setBirefringence] = useState(0.0092); // quartz at 550nm
  const [order, setOrder] = useState(1);
  const [customRetardance, setCustomRetardance] = useState(0.25); // waves

  const lambdaM = wavelengthNm * 1e-9;
  const deltaWaves = customRetardance;
  const thicknessUm = (deltaWaves * lambdaM / birefringence) * 1e6;
  const thicknessMm = thicknessUm / 1000;
  const retardanceNm = thicknessUm * 1000 * birefringence;

  // Zero-order: two plates of (order+1)/2 waves each
  const zeroOrderSingleUm = (0.25 * lambdaM / birefringence) * 1e6;
  const multiOrderUm = (order * lambdaM / birefringence) * 1e6;

  const chartData = useMemo(() => {
    const wavelengths = Array.from({ length: 200 }, (_, i) => 400 + i * 5);
    // Zero-order plate thickness fixed at 550nm design
    const fixedThickM = zeroOrderSingleUm * 1e-6;
    return [
      {
        x: wavelengths,
        y: wavelengths.map(wl => (fixedThickM * birefringence) / (wl * 1e-9)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Zero-Order Retardance",
        line: { color: "#60a5fa", width: 2 },
      },
      {
        x: [wavelengthNm], y: [customRetardance],
        type: "scatter" as const, mode: "markers" as const,
        name: "Design Point",
        marker: { color: "#f87171", size: 10 },
      },
      {
        x: [400, 700], y: [0.25, 0.25],
        type: "scatter" as const, mode: "lines" as const,
        name: "Quarter-Wave",
        line: { color: "#34d399", dash: "dash" },
      },
      {
        x: [400, 700], y: [0.5, 0.5],
        type: "scatter" as const, mode: "lines" as const,
        name: "Half-Wave",
        line: { color: "#fbbf24", dash: "dash" },
      },
    ];
  }, [wavelengthNm, birefringence, customRetardance, zeroOrderSingleUm]);

  const materialPresets = [
    { name: "Quartz (550nm)", n: 0.0092 },
    { name: "Calcite (550nm)", n: 0.172 },
    { name: "MgF₂ (550nm)", n: 0.012 },
    { name: "Sapphire (550nm)", n: 0.008 },
  ];

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Waveplate Thickness Calculator" description="Calculate required crystal thickness for waveplates of any retardance order.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">d = Δ·λ / (n_e − n_o)</p>
        <p className="text-gray-500 text-xs mt-1">Δ = retardance in waves, λ = wavelength, Δn = birefringence</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {materialPresets.map(p => (
          <button key={p.name} onClick={() => setBirefringence(p.n)}
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={300} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Birefringence (Δn)</span>
          <input type="number" value={birefringence} onChange={e => setBirefringence(+e.target.value)} min={0.0001} max={1} step="0.0001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Retardance (waves)</span>
          <input type="number" value={customRetardance} onChange={e => setCustomRetardance(+e.target.value)} min={0.01} max={100} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Quick Select</span>
          <select onChange={e => setCustomRetardance(+e.target.value)} value=""
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="" disabled>Select...</option>
            <option value="0.25" onClick={() => setCustomRetardance(0.25)}>Quarter-Wave (0.25λ)</option>
            <option value="0.5" onClick={() => setCustomRetardance(0.5)}>Half-Wave (0.5λ)</option>
            <option value="1" onClick={() => setCustomRetardance(1)}>Full-Wave (1.0λ)</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Required Thickness</p>
          <p className="text-2xl font-bold text-blue-400">{thicknessUm.toFixed(3)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retardance</p>
          <p className="text-2xl font-bold text-green-400">{customRetardance.toFixed(2)}λ</p>
          <p className="text-xs text-gray-500">= {(customRetardance * 360).toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Zero-Order Thickness</p>
          <p className="text-2xl font-bold text-yellow-400">{zeroOrderSingleUm.toFixed(3)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">{order}-th Order Thickness</p>
          <p className="text-2xl font-bold text-purple-400">{multiOrderUm.toFixed(1)} µm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Retardance (waves)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
