"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Dark current doubles approximately every 5-7°C (rule of thumb)
// I_dark(T) = I_dark(T_ref) * 2^((T - T_ref) / T_factor)
export default function DarkCurrentPage() {
  const [darkCurrent25, setDarkCurrent25] = useState(0.1); // e-/pix/s at 25°C
  const [tempFactor, setTempFactor] = useState(6); // °C doubling
  const [tempMin, setTempMin] = useState(-80);
  const [tempMax, setTempMax] = useState(40);
  const [readNoise, setReadNoise] = useState(5); // e- rms
  const [exposureTime, setExposureTime] = useState(1); // seconds

  const darkCurrentAtT = (T: number) =>
    darkCurrent25 * Math.pow(2, (T - 25) / tempFactor);

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => tempMin + i * (tempMax - tempMin) / 300);
    const dark = temps.map(darkCurrentAtT);
    const darkElectrons = temps.map(T => darkCurrentAtT(T) * exposureTime);
    const shotNoise = darkElectrons.map(d => Math.sqrt(d));
    return [
      { x: temps, y: dark, type: "scatter" as const, mode: "lines" as const,
        name: "Dark Current", line: { color: "#f87171" }, yaxis: "y" },
      { x: temps, y: darkElectrons, type: "scatter" as const, mode: "lines" as const,
        name: "Dark e⁻ (exposure)", line: { color: "#60a5fa" }, yaxis: "y2" },
      { x: temps, y: shotNoise, type: "scatter" as const, mode: "lines" as const,
        name: "Shot Noise", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
      { x: [tempMin, tempMax], y: [readNoise, readNoise], type: "scatter" as const, mode: "lines" as const,
        name: "Read Noise", line: { color: "#fbbf24", dash: "dot" }, yaxis: "y2" },
    ];
  }, [darkCurrent25, tempFactor, tempMin, tempMax, exposureTime, readNoise]);

  // Find crossover temperature where dark shot noise = read noise
  const crossoverTemp = 25 + tempFactor * Math.log2(readNoise * readNoise / (darkCurrent25 * exposureTime));

  const dcAtMin = darkCurrentAtT(tempMin);
  const dcAtMax = darkCurrentAtT(tempMax);
  const ratioMaxMin = dcAtMax / dcAtMin;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Dark Current vs Temperature</h1>
      <p className="text-gray-400 mb-8">Silicon detector dark current as a function of temperature — exponential doubling model.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current at 25°C (e⁻/pix/s)</span>
          <input type="number" value={darkCurrent25} onChange={e => setDarkCurrent25(+e.target.value)} min="0.001" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Doubling Temperature (°C)</span>
          <input type="number" value={tempFactor} onChange={e => setTempFactor(+e.target.value)} min="3" max="12" step="0.5"
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dark at {tempMin}°C</p>
          <p className="text-xl font-bold text-blue-400">{dcAtMin.toExponential(2)} e⁻/s</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dark at {tempMax}°C</p>
          <p className="text-xl font-bold text-red-400">{dcAtMax.toExponential(2)} e⁻/s</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ratio ({tempMax}/{tempMin}°C)</p>
          <p className="text-xl font-bold text-yellow-400">×{ratioMaxMin.toExponential(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Noise Crossover</p>
          <p className="text-xl font-bold text-purple-400">
            {isFinite(crossoverTemp) && crossoverTemp >= tempMin && crossoverTemp <= tempMax
              ? `${crossoverTemp.toFixed(1)}°C` : "Outside range"}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>I<sub>dark</sub>(T) = I<sub>0</sub> · 2<sup>(T − T₀) / T<sub>d</sub></sup></p>
        <p>Dark shot noise: σ<sub>dark</sub> = √(I<sub>dark</sub> · t<sub>exp</sub>)</p>
        <p>Crossover: I<sub>dark</sub>·t = σ<sub>read</sub>² → T<sub>cross</sub> = T₀ + T<sub>d</sub>·log₂(σ<sub>read</sub>²/(I₀·t))</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
        yaxis: { title: "Dark Current (e⁻/pix/s)", gridcolor: "#374151", type: "log" },
        yaxis2: { title: "Electrons (e⁻)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" },
        margin: { t: 30, r: 60, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
