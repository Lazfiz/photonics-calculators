"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ResultCard from "../../../components/result-card";

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
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Dark Current (nA)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Responsivity (A/W)</span>
          <input type="number" value={responsivity} onChange={e => setResponsivity(+e.target.value)} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Bandwidth (Hz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Load Resistor (Ω)</span>
          <input type="number" value={loadResistor} onChange={e => setLoadResistor(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="NEP" value="{nep.toExponential(2)} W/√Hz" tone="blue" />
        <ResultCard label="D*" value="{detectivity.toExponential(2)} Jones" tone="green" />
        <ResultCard label="Noise Current (rms)" value="{(totalNoiseCurrent * 1e9).toFixed(2)} nA" tone="orange" />
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
