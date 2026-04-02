"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function NEPPage() {
  const [darkCurrent, setDarkCurrent] = useState(10); // nA
  const [responsivity, setResponsivity] = useState(0.8); // A/W
  const [bandwidth, setBandwidth] = useState(1); // Hz
  const [temperature, setTemperature] = useState(300); // K
  const [loadResistor, setLoadResistor] = useState(50); // Ohm

  const k = 1.381e-23;
  const q = 1.602e-19;
  const T = temperature;

  const shotNoise = 2 * q * (darkCurrent * 1e-9) * bandwidth; // A²
  const thermalNoise = 4 * k * T * bandwidth / loadResistor; // A²
  const totalNoiseCurrent = Math.sqrt(shotNoise + thermalNoise);
  const nep = totalNoiseCurrent / responsivity; // W
  const detectivity = 1 / nep / Math.sqrt(bandwidth); // Jones

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Noise Equivalent Power (NEP)</h1>
      <p className="text-gray-400 mb-8">Minimum detectable optical power from detector noise sources.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Dark Current (nA)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Responsivity (A/W)</span>
          <input type="number" value={responsivity} onChange={e => setResponsivity(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Bandwidth (Hz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Load Resistor (Ω)</span>
          <input type="number" value={loadResistor} onChange={e => setLoadResistor(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">NEP</p>
          <p className="text-xl font-bold text-blue-400">{nep.toExponential(2)} W/√Hz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">D*</p>
          <p className="text-xl font-bold text-green-400">{detectivity.toExponential(2)} Jones</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Noise Current (rms)</p>
          <p className="text-xl font-bold text-orange-400">{(totalNoiseCurrent * 1e9).toFixed(2)} nA</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-sm text-gray-400">
        <p className="font-semibold text-white mb-2">Formulas</p>
        <p>NEP = i<sub>noise</sub> / R</p>
        <p>i<sub>shot</sub> = √(2qI<sub>d</sub>B)</p>
        <p>i<sub>thermal</sub> = √(4kTB/R<sub>L</sub>)</p>
        <p>D* = 1/(NEP × √A) (normalized to unit area)</p>
      </div>
    </div>
  );
}
