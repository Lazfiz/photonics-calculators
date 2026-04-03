"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

const kB = 8.617e-5;

export default function DarkNoiseTemperaturePage() {
  const [darkCurrent25, setDarkCurrent25] = useState(0.5);
  const [eg, setEg] = useState(1.12);
  const [area, setArea] = useState(1);
  const [bandwidth, setBandwidth] = useState(1);
  const [readNoise, setReadNoise] = useState(2);

  const darkCurrentAtT = (Tc: number) => {
    const T = Tc + 273.15; const Tref = 298.15;
    return darkCurrent25 * Math.pow(T / Tref, 1.5) * Math.exp(-eg / (2 * kB) * (1 / T - 1 / Tref));
  };
  const darkNoiseAtT = (Tc: number) => {
    const Id = darkCurrentAtT(Tc) * 1e-9;
    return Math.sqrt(2 * 1.602e-19 * Id * area * 1e-6 * bandwidth);
  };

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => -40 + i * 120 / 300);
    return [
      { x: temps, y: temps.map(darkCurrentAtT), type: "scatter", mode: "lines", name: "Dark Current", line: { color: "#f87171", width: 2 }, yaxis: "y" },
      { x: temps, y: temps.map(T => darkNoiseAtT(T) * 1e9), type: "scatter", mode: "lines", name: "Dark Noise Current", line: { color: "#60a5fa", width: 2 }, yaxis: "y2" },
    ];
  }, [darkCurrent25, eg, area, bandwidth]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Dark Noise vs Temperature" description="Temperature dependence of dark current and dark noise in photodiodes/CCDs.">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Dark Current at 25°C (nA)</span><input type="number" value={darkCurrent25} onChange={e => setDarkCurrent25(+e.target.value)} min="0.001" step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Bandgap (eV)</span><input type="number" value={eg} onChange={e => setEg(+e.target.value)} min="0.5" max="2" step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Area (mm²)</span><input type="number" value={area} onChange={e => setArea(+e.target.value)} min="0.01" step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Bandwidth (Hz)</span><input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} min="0.1" step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Dark @ 25°C" value={`${darkCurrentAtT(25).toFixed(3)} nA`} tone="blue" />
        <ResultCard label="Noise @ 25°C" value={`${(darkNoiseAtT(25) * 1e9).toFixed(3)} nA rms`} tone="yellow" />
        <ResultCard label="Dark @ -40°C" value={`${darkCurrentAtT(-40).toExponential(2)} nA`} tone="green" />
        <ResultCard label="Ratio (80°C/−40°C)" value={`×${(darkCurrentAtT(80) / darkCurrentAtT(-40)).toExponential(1)}`} tone="red" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>I_dark(T) = I₀ · (T/T_ref)^(3/2) · exp[−E_g/(2k) · (1/T − 1/T_ref)]</p><p>σ_dark = √(2q · I_dark · A · Δf)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Dark Current (nA)", gridcolor: "#374151", type: "log" }, yaxis2: { title: "Dark Noise (nA rms)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" } }} />
    </CalculatorShell>
  );
}
