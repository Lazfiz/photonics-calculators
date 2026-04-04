"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ResultCard from "../../../components/result-card";

export default function NEPPage() {
  const [darkCurrent, setDarkCurrent] = useState(10); // nA
  const [responsivity, setResponsivity] = useState(0.8); // A/W
  const [bandwidth, setBandwidth] = useState(1); // Hz
  const [temperature, setTemperature] = useState(300); // K
  const [loadResistor, setLoadResistor] = useState(50); // Ω
  const [detectorArea, setDetectorArea] = useState(1); // mm²

  const k = 1.381e-23;
  const q = 1.602e-19;

  const calc = useMemo(() => {
    const A = detectorArea * 1e-6; // mm² → m²
    const shotNoiseSq = 2 * q * (darkCurrent * 1e-9) * bandwidth;
    const thermalNoiseSq = 4 * k * temperature * bandwidth / loadResistor;
    const totalNoiseCurrent = Math.sqrt(shotNoiseSq + thermalNoiseSq);
    const nep = totalNoiseCurrent / responsivity; // W (total NEP for bandwidth B)
    const nepSpectral = nep / Math.sqrt(bandwidth); // W/√Hz
    const detectivity = Math.sqrt(A * bandwidth) / nep; // Jones = √(A·B)/NEP
    return { nep, nepSpectral, detectivity, totalNoiseCurrent, shotNoiseSq, thermalNoiseSq };
  }, [darkCurrent, responsivity, bandwidth, temperature, loadResistor, detectorArea]);

  return (
    <CalculatorShell
      backHref="/detectors"
      backLabel="Detectors"
      title="Noise Equivalent Power (NEP) & Detectivity (D*)"
      description="Calculate NEP and specific detectivity D* from detector noise sources: shot noise, thermal (Johnson) noise, and dark current."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Dark Current (nA)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Responsivity (A/W)</span>
          <input type="number" value={responsivity} onChange={e => setResponsivity(+e.target.value)} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bandwidth (Hz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Load Resistor (Ω)</span>
          <input type="number" value={loadResistor} onChange={e => setLoadResistor(+e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Detector Area (mm²)</span>
          <input type="number" value={detectorArea} onChange={e => setDetectorArea(+e.target.value)} step="any" min={0.001}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="NEP" value={`${calc.nep.toExponential(2)} W`} tone="blue" subtext="Total for bandwidth B" />
        <ResultCard label="NEP (spectral)" value={`${calc.nepSpectral.toExponential(2)} W/√Hz`} tone="cyan" subtext="Per root Hz" />
        <ResultCard label="D*" value={`${calc.detectivity.toExponential(2)} Jones`} tone="green" subtext="√(A·B)/NEP" />
        <ResultCard label="Noise current (rms)" value={`${(calc.totalNoiseCurrent * 1e9).toFixed(2)} nA`} tone="orange" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-sm text-gray-400 leading-6">
        <p className="font-semibold text-white mb-2">Formulas</p>
        <p>i<sub>shot</sub> = √(2qI<sub>d</sub>B)</p>
        <p>i<sub>thermal</sub> = √(4kTB/R<sub>L</sub>)</p>
        <p>NEP = i<sub>noise</sub> / R (total power equivalent)</p>
        <p>D* = √(A · B) / NEP (Jones — cm·√Hz/W)</p>
      </div>
    </CalculatorShell>
  );
}
