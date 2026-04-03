"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Dark noise: σ_dark = sqrt(2 * q * I_dark * A * Δf) for photodiodes
// I_dark(T) = I_0 * exp(-E_g / (2*k*T)) ≈ I_0 * T^(3/2) * exp(-E_g/(2kT))
// For CCDs: dark noise ≈ sqrt(dark_current * t_exp) + read_noise
export default function DarkNoiseTemperaturePage() {
  const [darkCurrent25, setDarkCurrent25] = useState(0.5); // nA at 25°C
  const [eg, setEg] = useState(1.12); // eV, silicon bandgap
  const [area, setArea] = useState(1); // mm²
  const [bandwidth, setBandwidth] = useState(1); // Hz
  const [tempMin, setTempMin] = useState(-40);
  const [tempMax, setTempMax] = useState(80);
  const [readNoise, setReadNoise] = useState(2); // e⁻ rms

  const kB = 8.617e-5; // eV/K
  const darkCurrentAtT = (Tc: number) => {
    const T = Tc + 273.15;
    const Tref = 298.15;
    return darkCurrent25 * Math.pow(T / Tref, 1.5) * Math.exp(-eg / (2 * kB) * (1 / T - 1 / Tref));
  };

  const darkNoiseAtT = (Tc: number) => {
    const Id = darkCurrentAtT(Tc) * 1e-9; // A
    return Math.sqrt(2 * 1.602e-19 * Id * area * 1e-6 * bandwidth); // A rms
  };

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => tempMin + i * (tempMax - tempMin) / 300);
    const dc = temps.map(darkCurrentAtT);
    const dn = temps.map(darkNoiseAtT);
    return [
      { x: temps, y: dc, type: "scatter", mode: "lines",
        name: "Dark Current", line: { color: "#f87171", width: 2 }, yaxis: "y" },
      { x: temps, y: dn.map(v => v * 1e9), type: "scatter", mode: "lines",
        name: "Dark Noise Current", line: { color: "#60a5fa", width: 2 }, yaxis: "y2" },
    ];
  }, [darkCurrent25, eg, area, bandwidth, tempMin, tempMax]);

  const dc25 = darkCurrentAtT(25);
  const dcMin = darkCurrentAtT(tempMin);
  const dcMax = darkCurrentAtT(tempMax);
  const dn25 = darkNoiseAtT(25) * 1e9;
  const ratio = dcMax / dcMin;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Dark Noise vs Temperature</h1>
      <p className="text-gray-400 mb-8">Temperature dependence of dark current and dark noise in photodiodes/CCDs.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current at 25°C (nA)</span>
          <input type="number" value={darkCurrent25} onChange={e => setDarkCurrent25(+e.target.value)} min="0.001" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bandgap Energy (eV)</span>
          <input type="number" value={eg} onChange={e => setEg(+e.target.value)} min="0.5" max="2" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Detector Area (mm²)</span>
          <input type="number" value={area} onChange={e => setArea(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bandwidth (Hz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} min="0.1" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dark Current @ 25°C</p>
          <p className="text-xl font-bold text-blue-400">{dc25.toFixed(3)} nA</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dark Noise @ 25°C</p>
          <p className="text-xl font-bold text-yellow-400">{dn25.toFixed(3)} nA rms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dark Current @ {tempMin}°C</p>
          <p className="text-xl font-bold text-green-400">{dcMin.toExponential(2)} nA</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ratio ({tempMax}/{tempMin}°C)</p>
          <p className="text-xl font-bold text-red-400">×{ratio.toExponential(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>I<sub>dark</sub>(T) = I<sub>0</sub> · (T/T<sub>ref</sub>)<sup>3/2</sup> · exp[−E<sub>g</sub>/(2k) · (1/T − 1/T<sub>ref</sub>)]</p>
        <p>σ<sub>dark</sub> = √(2q · I<sub>dark</sub> · A · Δf)</p>
        <p>E<sub>g</sub>(Si) = 1.12 eV, E<sub>g</sub>(Ge) = 0.67 eV, E<sub>g</sub>(InGaAs) = 0.75 eV</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
        yaxis: { title: "Dark Current (nA)", gridcolor: "#374151", type: "log" },
        yaxis2: { title: "Dark Noise (nA rms)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" },
        margin: { t: 30, r: 60, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
