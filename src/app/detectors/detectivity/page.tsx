"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Detectivity D* = sqrt(A * Δf) / NEP = R / sqrt(2qId + 4kT/Rload + iN²)
// D** = D* for specific detectivity (cm·Hz^½/W)
// Also: D*(λ) = R(λ) * sqrt(A) / in, where in is total noise current

export default function DetectivityPage() {
  const [wavelength, setWavelength] = useState(850); // nm
  const [qe, setQe] = useState(0.7);
  const [darkCurrent, setDarkCurrent] = useState(1); // nA
  const [area, setArea] = useState(1); // mm²
  const [bandwidth, setBandwidth] = useState(1); // MHz
  const [temperature, setTemperature] = useState(293); // K
  const [loadResistance, setLoadResistance] = useState(50); // Ω
  const [excessNoiseFactor, setExcessNoiseFactor] = useState(1);

  // Responsivity: R = qe * λ * q / (h*c)
  const h = 6.626e-34;
  const c = 3e8;
  const q = 1.602e-19;
  const k = 1.381e-23;

  const lambda = wavelength * 1e-9;
  const responsivity = qe * lambda * q / (h * c); // A/W
  const areaM2 = area * 1e-6;

  // Noise sources
  const shotNoiseDark = Math.sqrt(2 * q * darkCurrent * 1e-9 * excessNoiseFactor * bandwidth * 1e6);
  const thermalNoise = Math.sqrt(4 * k * temperature * bandwidth * 1e6 / loadResistance);
  const totalNoise = Math.sqrt(shotNoiseDark ** 2 + thermalNoise ** 2);

  // NEP = in / R
  const nep = totalNoise / responsivity;
  // D* = sqrt(A * Δf) / NEP
  const detectivity = Math.sqrt(areaM2 * bandwidth * 1e6) / nep;

  // Spectral D* chart
  const spectralChart = useMemo(() => {
    const wl = Array.from({ length: 200 }, (_, i) => 400 + i * 1.2);
    const dStar = wl.map(w => {
      const l = w * 1e-9;
      const R = qe * l * q / (h * c);
      if (R < 1e-10) return 0;
      const in2 = shotNoiseDark ** 2 + thermalNoise ** 2;
      return Math.sqrt(areaM2 * bandwidth * 1e6) / (Math.sqrt(in2) / R);
    });
    return [{
      x: wl, y: dStar, type: "scatter", mode: "lines",
      name: "D*", line: { color: "#60a5fa", width: 2 },
    }];
  }, [qe, darkCurrent, area, bandwidth, temperature, loadResistance, excessNoiseFactor, shotNoiseDark, thermalNoise, areaM2]);

  // D* vs temperature
  const tempChart = useMemo(() => {
    const temps = Array.from({ length: 100 }, (_, i) => 200 + i * 2);
    // Dark current doubles every ~7K for Si
    const dStar = temps.map(T => {
      const Idd = darkCurrent * 1e-9 * Math.pow(2, (T - temperature) / 7);
      const sn = Math.sqrt(2 * q * Idd * excessNoiseFactor * bandwidth * 1e6);
      const tn = Math.sqrt(4 * k * T * bandwidth * 1e6 / loadResistance);
      const in2 = Math.sqrt(sn ** 2 + tn ** 2);
      if (responsivity < 1e-10) return 0;
      return Math.sqrt(areaM2 * bandwidth * 1e6) / (in2 / responsivity);
    });
    return [{
      x: temps, y: dStar, type: "scatter", mode: "lines",
      name: "D*", line: { color: "#f87171", width: 2 },
    }];
  }, [darkCurrent, temperature, bandwidth, loadResistance, excessNoiseFactor, responsivity, areaM2]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Detectivity (D*)</h1>
      <p className="text-gray-400 mb-8">Specific detectivity from NEP, area, and bandwidth. D* = √(A·Δf) / NEP</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min="200" max="3000" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Quantum Efficiency</span>
          <input type="number" value={qe} onChange={e => setQe(+e.target.value)} min="0.01" max="1" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current (nA)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min="0" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Active Area (mm²)</span>
          <input type="number" value={area} onChange={e => setArea(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bandwidth (MHz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} min="0.001" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} min="77" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Load Resistance (Ω)</span>
          <input type="number" value={loadResistance} onChange={e => setLoadResistance(+e.target.value)} min="1" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Excess Noise Factor</span>
          <input type="number" value={excessNoiseFactor} onChange={e => setExcessNoiseFactor(+e.target.value)} min="1" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><span className="text-gray-400 text-sm">Responsivity</span><div className="text-xl font-mono">{responsivity.toFixed(3)} A/W</div></div>
          <div><span className="text-gray-400 text-sm">NEP</span><div className="text-xl font-mono">{nep.toExponential(3)} W/√Hz</div></div>
          <div><span className="text-gray-400 text-sm">Shot Noise (dark)</span><div className="text-xl font-mono">{shotNoiseDark.toExponential(3)} A</div></div>
          <div><span className="text-gray-400 text-sm">Thermal Noise</span><div className="text-xl font-mono">{thermalNoise.toExponential(3)} A</div></div>
          <div className="sm:col-span-2"><span className="text-gray-400 text-sm">Detectivity D*</span><div className="text-2xl font-mono text-green-400">{detectivity.toExponential(3)} cm·Hz^½/W</div></div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">D* vs Wavelength</h3>
          <Plot data={spectralChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "D* (cm·Hz^½/W)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">D* vs Temperature</h3>
          <Plot data={tempChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Temperature (K)", gridcolor: "#374151" },
            yaxis: { title: "D* (cm·Hz^½/W)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
        <h3 className="text-white font-semibold mb-2">Formulas</h3>
        <p>D* = √(A·Δf) / NEP</p>
        <p>NEP = i_n / R</p>
        <p>R = η·q·λ / (h·c)</p>
        <p>i²_shot = 2·q·I_d·F·Δf</p>
        <p>i²_thermal = 4·k·T·Δf / R_L</p>
      </div>
    </div>
  );
}
