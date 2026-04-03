"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Cooling benefit: dark current reduction, SNR improvement
// I_dark ∝ T^(3/2) · exp(-Eg/(2kT))
// Simplified: I_dark(T) = I0 · exp(-Eg/(2kT))
export default function CoolingBenefitPage() {
  const [egSi, setEgSi] = useState(1.12); // eV bandgap
  const [egInGaAs, setEgInGaAs] = useState(0.75); // eV
  const [darkCurrent25Si, setDarkCurrent25Si] = useState(0.1); // e-/pix/s
  const [darkCurrent25InGaAs, setDarkCurrent25InGaAs] = useState(1000); // e-/pix/s
  const [readNoise, setReadNoise] = useState(3); // e-
  const [exposureTime, setExposureTime] = useState(1); // s
  const [tempMin, setTempMin] = useState(-100);
  const [tempMax, setTempMax] = useState(40);

  const kB = 8.617e-5; // eV/K

  const darkCurrentAtT = (T_C: number, I0: number, Eg: number) => {
    const T = T_C + 273.15;
    const Tref = 298.15;
    return I0 * Math.pow(T / Tref, 1.5) * Math.exp(-Eg / (2 * kB * T)) / Math.exp(-Eg / (2 * kB * Tref));
  };

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => tempMin + i * (tempMax - tempMin) / 300);
    const siDark = temps.map(T => darkCurrentAtT(T, darkCurrent25Si, egSi));
    const inGaAsDark = temps.map(T => darkCurrentAtT(T, darkCurrent25InGaAs, egInGaAs));
    const siSNR = temps.map(T => {
      const d = darkCurrentAtT(T, darkCurrent25Si, egSi) * exposureTime;
      const signal = 1000; // assume 1000 signal e-
      return signal / Math.sqrt(signal + d + readNoise * readNoise);
    });
    const inGaAsSNR = temps.map(T => {
      const d = darkCurrentAtT(T, darkCurrent25InGaAs, egInGaAs) * exposureTime;
      const signal = 1000;
      return signal / Math.sqrt(signal + d + readNoise * readNoise);
    });
    return [
      { x: temps, y: siDark, type: "scatter" as const, mode: "lines" as const,
        name: "Si Dark", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: temps, y: inGaAsDark, type: "scatter" as const, mode: "lines" as const,
        name: "InGaAs Dark", line: { color: "#fb923c" }, yaxis: "y" },
      { x: temps, y: siSNR, type: "scatter" as const, mode: "lines" as const,
        name: "Si SNR", line: { color: "#60a5fa", dash: "dash" }, yaxis: "y2" },
      { x: temps, y: inGaAsSNR, type: "scatter" as const, mode: "lines" as const,
        name: "InGaAs SNR", line: { color: "#fb923c", dash: "dash" }, yaxis: "y2" },
    ];
  }, [tempMin, tempMax, darkCurrent25Si, darkCurrent25InGaAs, egSi, egInGaAs, exposureTime, readNoise]);

  // Benefit at specific cooled temp
  const [coolTemp, setCoolTemp] = useState(-40);
  const siReduction = darkCurrent25Si / darkCurrentAtT(coolTemp, darkCurrent25Si, egSi);
  const inGaAsReduction = darkCurrent25InGaAs / darkCurrentAtT(coolTemp, darkCurrent25InGaAs, egInGaAs);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Cooling Benefit Calculator</h1>
      <p className="text-gray-400 mb-8">Dark current reduction and SNR improvement from thermoelectric (TEC) or cryogenic cooling.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Si Bandgap (eV)</span>
          <input type="number" value={egSi} onChange={e => setEgSi(+e.target.value)} min="0.5" max="2" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">InGaAs Bandgap (eV)</span>
          <input type="number" value={egInGaAs} onChange={e => setEgInGaAs(+e.target.value)} min="0.3" max="1.5" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Si Dark Current at 25°C (e⁻/pix/s)</span>
          <input type="number" value={darkCurrent25Si} onChange={e => setDarkCurrent25Si(+e.target.value)} min="0.001" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">InGaAs Dark Current at 25°C (e⁻/pix/s)</span>
          <input type="number" value={darkCurrent25InGaAs} onChange={e => setDarkCurrent25InGaAs(+e.target.value)} min="1" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Read Noise (e⁻ rms)</span>
          <input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} min="0.1" step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min="0.001" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Cooling Target (°C)</span>
          <input type="number" value={coolTemp} onChange={e => setCoolTemp(+e.target.value)} min="-150" step="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Si Dark Reduction</p>
          <p className="text-xl font-bold text-blue-400">×{siReduction.toExponential(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">InGaAs Dark Reduction</p>
          <p className="text-xl font-bold text-orange-400">×{inGaAsReduction.toExponential(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Si Dark @ {coolTemp}°C</p>
          <p className="text-xl font-bold text-green-400">{darkCurrentAtT(coolTemp, darkCurrent25Si, egSi).toExponential(2)} e⁻/s</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">InGaAs Dark @ {coolTemp}°C</p>
          <p className="text-xl font-bold text-yellow-400">{darkCurrentAtT(coolTemp, darkCurrent25InGaAs, egInGaAs).toExponential(2)} e⁻/s</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>I<sub>dark</sub>(T) = I₀ · (T/T₀)<sup>3/2</sup> · exp(−E<sub>g</sub>/(2k<sub>B</sub>T))</p>
        <p>SNR = S / √(S + I<sub>dark</sub>·t + σ<sub>read</sub>²)</p>
        <p>Smaller E<sub>g</sub> (InGaAs) → dark current drops faster with cooling → more benefit from TEC</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
        yaxis: { title: "Dark Current (e⁻/pix/s)", gridcolor: "#374151", type: "log" },
        yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 30, r: 60, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
