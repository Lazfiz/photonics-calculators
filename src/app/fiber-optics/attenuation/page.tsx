"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AttenuationPage() {
  const [fiberType, setFiberType] = useState<"SMF28" | "DSF" | "NZDSF">("SMF28");
  const [length, setLength] = useState(50); // km

  const getAttenuation = (wl: number, type: string) => {
    // Simplified attenuation model (dB/km)
    // Rayleigh scattering ~ λ⁻⁴, IR absorption exponential, OH peak at 1383nm
    const rayleigh = type === "SMF28" ? 0.85 * Math.pow(1.55 / (wl / 1000), 4) * 0.19 :
                     type === "DSF" ? 0.85 * Math.pow(1.55 / (wl / 1000), 4) * 0.19 :
                     0.85 * Math.pow(1.55 / (wl / 1000), 4) * 0.19;
    const irAbsorption = 6e10 * Math.exp(-48 / (wl / 1000));
    const ohPeak = 0.5 * Math.exp(-0.5 * Math.pow((wl - 1383) / 8, 2));
    const uvAbsorption = 1e-3 * Math.exp(4.63 * (1.55 - wl / 1000));
    return rayleigh + irAbsorption + ohPeak + uvAbsorption;
  };

  const calc = useMemo(() => {
    const wl1550 = getAttenuation(1550, fiberType);
    const wl1310 = getAttenuation(1310, fiberType);
    const total1550 = wl1550 * length;
    const total1310 = wl1310 * length;
    return { wl1550, wl1310, total1550, total1310 };
  }, [fiberType, length]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 800 + i * 4);
    const att = wls.map(wl => getAttenuation(wl, fiberType));
    const total = att.map(a => a * length);

    return [
      { x: wls, y: att, type: "scatter" as const, mode: "lines" as const, name: "Attenuation", line: { color: "#f87171" } },
      { x: [1310], y: [getAttenuation(1310, fiberType)], type: "scatter" as const, mode: "markers" as const, name: "1310 nm", marker: { color: "#60a5fa", size: 10 } },
      { x: [1550], y: [getAttenuation(1550, fiberType)], type: "scatter" as const, mode: "markers" as const, name: "1550 nm", marker: { color: "#34d399", size: 10 } },
    ];
  }, [fiberType]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Wavelength-Dependent Attenuation</h1>
      <p className="text-gray-400 mb-8">Fiber attenuation spectrum showing Rayleigh scattering, IR absorption, and OH peak for standard fiber types.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Fiber Type</span>
          <select value={fiberType} onChange={e => setFiberType(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="SMF28">SMF-28 (G.652)</option>
            <option value="DSF">DSF (G.653)</option>
            <option value="NZDSF">NZ-DSF (G.655)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Fiber Length (km)</span>
          <input type="number" value={length} onChange={e => setLength(+e.target.value)} min={0.1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">α @ 1310nm</p>
          <p className="text-xl font-bold text-blue-400">{calc.wl1310.toFixed(3)} dB/km</p>
          <p className="text-xs text-gray-500">{calc.total1310.toFixed(1)} dB total</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">α @ 1550nm</p>
          <p className="text-xl font-bold text-green-400">{calc.wl1550.toFixed(3)} dB/km</p>
          <p className="text-xs text-gray-500">{calc.total1550.toFixed(1)} dB total</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Min Attenuation</p>
          <p className="text-xl font-bold text-yellow-400">~1550 nm</p>
          <p className="text-xs text-gray-500">C-band window</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">OH Peak</p>
          <p className="text-xl font-bold text-red-400">~1383 nm</p>
          <p className="text-xs text-gray-500">Water absorption</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Attenuation (dB/km)", gridcolor: "#374151", rangemode: "tozero" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
