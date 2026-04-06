"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

// Photodiode: bandwidth ∝ 1/√(area) due to junction capacitance
// C_j ∝ A, BW ≈ 1/(2π·R·C_j), responsivity R = η·q·λ/(hc)
export default function PhotodiodeSpeedPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [qe, setQe] = useState(0.8);
  const [capacitanceDensity, setCapacitanceDensity] = useState(50); // fF/mm²
  const [loadResistance, setLoadResistance] = useState(50); // Ohm
  const [areaMin, setAreaMin] = useState(0.001); // mm²
  const [areaMax, setAreaMax] = useState(10); // mm²

  const responsivity = qe * 1.602e-19 * wavelength * 1e-9 / (6.626e-34 * 3e8);

  const chartData = useMemo(() => {
    const areas = Array.from({ length: 300 }, (_, i) =>
      areaMin * Math.pow(areaMax / areaMin, i / 299));
    const bw3dB = areas.map(a => 1 / (2 * Math.PI * loadResistance * capacitanceDensity * 1e-15 * a * 1e-6));
    const rcConst = areas.map(a => loadResistance * capacitanceDensity * 1e-15 * a * 1e-6);
    const cap = areas.map(a => capacitanceDensity * a);
    return [
      { x: areas, y: bw3dB, type: "scatter" as const, mode: "lines" as const,
        name: "3dB BW", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: areas, y: rcConst.map(r => r * 1e12), type: "scatter" as const, mode: "lines" as const,
        name: "RC time (ps)", line: { color: "#f87171" }, yaxis: "y2" },
      { x: areas, y: cap, type: "scatter" as const, mode: "lines" as const,
        name: "Capacitance (fF)", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
    ];
  }, [areaMin, areaMax, loadResistance, capacitanceDensity]);

  // NEP vs area
  const nepVsArea = useMemo(() => {
    const areas = Array.from({ length: 300 }, (_, i) =>
      areaMin * Math.pow(areaMax / areaMin, i / 299));
    const bw = areas.map(a => 1 / (2 * Math.PI * loadResistance * capacitanceDensity * 1e-15 * a * 1e-6));
    const thermalNoise = 4 * 1.38e-23 * 300 * bandwidthToUse();
    // NEP = sqrt(thermal noise) / Responsivity (simplified)
    const nep = areas.map((_, i) => {
      const bwHz = Math.max(bw[i], 1);
      const noiseCurrent = Math.sqrt(4 * 1.38e-23 * 300 * bwHz / loadResistance);
      return noiseCurrent / responsivity * 1e12; // pW
    });
    return { areas, nep };
  }, [areaMin, areaMax, loadResistance, capacitanceDensity, responsivity]);

  function bandwidthToUse() { return 1 / (2 * Math.PI * loadResistance * capacitanceDensity * 1e-15 * 1e-6); }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} step="10"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Quantum Efficiency</span>
          <input type="number" value={qe} onChange={e => setQe(+e.target.value)} min="0.01" max="1" step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Capacitance Density (fF/mm²)</span>
          <input type="number" value={capacitanceDensity} onChange={e => setCapacitanceDensity(+e.target.value)} min="1" step="5"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Load Resistance (Ω)</span>
          <input type="number" value={loadResistance} onChange={e => setLoadResistance(+e.target.value)} min="10" step="10"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Area Min (mm²)</span>
          <input type="number" value={areaMin} onChange={e => setAreaMin(+e.target.value)} min="0.0001" step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Area Max (mm²)</span>
          <input type="number" value={areaMax} onChange={e => setAreaMax(+e.target.value)} step="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Responsivity" value="{(responsivity * 1e3).toFixed(2)} mA/W" tone="blue" />
        <ResultCard label="BW @ 1 mm²" value="{(1 / (2 * Math.PI * loadResistance * capacitanceDensity * 1e-15 * 1e-6) / 1e9).toFixed(1)} GHz" tone="green" />
        <ResultCard label="Cap @ 1 mm²" value="{capacitanceDensity} fF" tone="yellow" />
        <ResultCard label="RC @ 1 mm²" value="{(loadResistance * capacitanceDensity * 1e-15 * 1e-6 * 1e12).toFixed(2)} ps" tone="purple" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>C<sub>j</sub> = C<sub>d</sub> · A (junction capacitance ∝ area)</p>
        <p>BW<sub>3dB</sub> = 1 / (2π · R · C<sub>j</sub>)</p>
        <p>R = QE · qλ / (hc) (responsivity)</p>
        <p>NEP<sub>thermal</sub> = √(4k<sub>B</sub>TR·BW) / R (thermal-noise-limited only)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Bandwidth & RC Time vs Area", font: { size: 12 } },
          xaxis: { title: "Area (mm²)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "3dB Bandwidth (Hz)", gridcolor: "#374151", type: "log" },
          yaxis2: { title: "RC / Cap", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" },
          margin: { t: 40, r: 60, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />

        <ChartPanel data={[{ x: nepVsArea.areas, y: nepVsArea.nep, type: "scatter" as const, mode: "lines" as const,
          name: "NEP", line: { color: "#fbbf24" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "NEP vs Area", font: { size: 12 } },
          xaxis: { title: "Area (mm²)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "NEP (pW/√Hz)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />
      </div>
    </div>
  );
}
