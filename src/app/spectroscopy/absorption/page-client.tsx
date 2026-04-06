"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function AbsorptionPage() {
  const [concentration, setConcentration] = useState(0.01);
  const [pathLength, setPathLength] = useState(1);
  const [extinctionCoeff, setExtinctionCoeff] = useState(50000);
  const [cMax, setCMax] = useState(0.05);

  const chartData = useMemo(() => {
    const cs = Array.from({ length: 200 }, (_, i) => (i / 200) * cMax);
    const abs = cs.map(c => extinctionCoeff * c * pathLength);
    const trans = abs.map(a => Math.pow(10, -a));

    return [
      { x: cs, y: abs, type: "scatter" as const, mode: "lines" as const, name: "Absorbance", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: cs, y: trans.map(t => t * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmission %", line: { color: "#34d399" }, yaxis: "y2" },
      { x: [concentration], y: [extinctionCoeff * concentration * pathLength], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [concentration, pathLength, extinctionCoeff, cMax]);

  const absorbance = extinctionCoeff * concentration * pathLength;
  const transmission = Math.pow(10, -absorbance);
  const od = absorbance;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Beer-Lambert Absorption" description="A = ε·c·l — absorbance from molar extinction coefficient, concentration, and path length.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Concentration (mol/L)" value={concentration} onChange={setConcentration} min={0} />
        <ValidatedNumberInput label="Path Length (cm)" value={pathLength} onChange={setPathLength} min={0.001} />
        <ValidatedNumberInput label="ε (L·mol⁻¹·cm⁻¹)" value={extinctionCoeff} onChange={setExtinctionCoeff} min={0} />
        <ValidatedNumberInput label="Max Conc. for Plot (mol/L)" value={cMax} onChange={setCMax} min={0.001} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorbance (A)</p>
          <p className="text-xl font-bold text-blue-400">{absorbance.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Density (OD)</p>
          <p className="text-xl font-bold text-green-400">{od.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className="text-xl font-bold text-orange-400">{(transmission * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">A = ε · c · l</span></p>
        <p className="text-sm text-gray-300"><span className="text-green-400 font-mono">T = 10^(−A) = 10^(−εcl)</span></p>
        <p className="text-sm text-gray-300">Linear range: A &lt; ~2.0 (T &gt; 1%). Deviations at high concentration.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Concentration (mol/L)", gridcolor: "#374151" },
          yaxis: { title: "Absorbance", gridcolor: "#374151", side: "left" },
          yaxis2: { title: "Transmission (%)", gridcolor: "#374151", side: "right", overlaying: "y", range: [0, 105] },
          margin: { t: 30, r: 60, b: 50, l: 70 }, legend: { x: 0.01, y: 0.99 },
        }} />
      </div>
    </CalculatorShell>
  );
}
