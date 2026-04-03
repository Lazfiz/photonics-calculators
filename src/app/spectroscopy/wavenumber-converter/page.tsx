"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function WavenumberConverterPage() {
  const [wavelengthMin, setWavelengthMin] = useState(400);
  const [wavelengthMax, setWavelengthMax] = useState(4000);
  const [mode, setMode] = useState<"wl-to-wn" | "wn-to-wl">("wl-to-wn");
  const [singleValue, setSingleValue] = useState(1000);

  const wnMin = 1e7 / wavelengthMax;
  const wnMax = 1e7 / wavelengthMin;

  const singleConverted = mode === "wl-to-wn"
    ? 1e7 / singleValue
    : 1e7 / singleValue;

  const chartData = useMemo(() => {
    const wl = Array.from({ length: 300 }, (_, i) => wavelengthMin + (i / 300) * (wavelengthMax - wavelengthMin));
    const wn = wl.map(w => 1e7 / w);
    const freq = wl.map(w => 3e17 / w); // Hz (c/λ with λ in nm)
    const energy = wl.map(w => 1240 / w); // eV

    return [
      { x: wl, y: wn, type: "scatter" as const, mode: "lines" as const, name: "Wavenumber (cm⁻¹)", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: wl, y: energy, type: "scatter" as const, mode: "lines" as const, name: "Energy (eV)", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [wavelengthMin, wavelengthMax]);

  // FTIR common reference lines
  const referenceLines = [
    { name: "HeNe laser", wl: 632.8 },
    { name: "CO₂ laser (10.6 µm)", wl: 10600 },
    { name: "Water band", wl: 3400 },
    { name: "C-H stretch", wl: 3500 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Wavenumber Converter</h1>
      <p className="text-gray-400 mb-8">Convert between wavelength (nm, µm), wavenumber (cm⁻¹), frequency (Hz), and energy (eV).</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">λ min (nm)</span>
          <input type="number" value={wavelengthMin} onChange={e => setWavelengthMin(+e.target.value)} min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">λ max (nm)</span>
          <input type="number" value={wavelengthMax} onChange={e => setWavelengthMax(+e.target.value)} min={wavelengthMin}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Range (cm⁻¹)</p>
          <p className="text-xl font-bold text-blue-400">{wnMin.toFixed(1)} — {wnMax.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Energy Range (eV)</p>
          <p className="text-xl font-bold text-green-400">{(1240 / wavelengthMax).toFixed(3)} — {(1240 / wavelengthMin).toFixed(3)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <div className="flex gap-4 items-end mb-4">
          <label className="block flex-1">
            <span className="text-gray-300 text-sm">{mode === "wl-to-wn" ? "Wavelength (nm)" : "Wavenumber (cm⁻¹)"}</span>
            <input type="number" value={singleValue} onChange={e => setSingleValue(+e.target.value)} min={0.001}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <button onClick={() => setMode(mode === "wl-to-wn" ? "wn-to-wl" : "wl-to-wn")}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white">⇄</button>
          <div className="flex-1 bg-gray-800 rounded px-3 py-2">
            <p className="text-sm text-gray-400">{mode === "wl-to-wn" ? "Wavenumber" : "Wavelength"}</p>
            <p className="text-lg font-bold text-yellow-400">{singleConverted.toFixed(2)} {mode === "wl-to-wn" ? "cm⁻¹" : "nm"}</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm">
          Freq: <span className="text-purple-400">{(mode === "wl-to-wn" ? 3e17 / singleValue : 3e10 * singleValue).toExponential(2)} Hz</span> | Energy: <span className="text-green-400">{(mode === "wl-to-wn" ? 1240 / singleValue : 1240 / singleConverted).toFixed(3)} eV</span>
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm"><span className="text-blue-400 font-mono">ν̃ = 10⁷ / λ(nm) = 1 / λ(cm)</span></p>
        <p className="text-gray-300 text-sm"><span className="text-green-400 font-mono">E = hc/λ = 1240 / λ(nm) eV</span></p>
        <p className="text-gray-300 text-sm"><span className="text-purple-400 font-mono">f = c/λ = 3×10¹⁷ / λ(nm) Hz</span></p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151", side: "left" },
          yaxis2: { title: "Energy (eV)", gridcolor: "#374151", side: "right", overlaying: "y" },
          margin: { t: 30, r: 60, b: 50, l: 70 }, legend: { x: 0.01, y: 0.99 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
