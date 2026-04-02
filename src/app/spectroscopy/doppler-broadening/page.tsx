"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DopplerBroadeningPage() {
  const [wavelength, setWavelength] = useState(632.8);
  const [temperature, setTemperature] = useState(300);
  const [mass, setMass] = useState(20.18); // Neon in amu

  const c = 3e8;
  const kB = 1.381e-23;
  const amu = 1.661e-27;
  const m = mass * amu;

  const deltaNuD = (wavelength * 1e-9) / c * Math.sqrt(8 * kB * temperature * Math.log(2) / m); // Hz
  const fwhmNm = deltaNuD * (wavelength * 1e-9) ** 2 / c * 1e9; // nm
  const deltaNuHz = deltaNuD / Math.PI; // HWHM in Hz

  const profile = (dw: number) => Math.exp(-Math.pow(dw / (fwhmNm / 2), 2) * Math.log(2));

  const chartData = useMemo(() => {
    const range = fwhmNm * 5;
    const wls = Array.from({ length: 200 }, (_, i) => wavelength - range + (2 * range * i) / 199);
    return [
      { x: wls, y: wls.map(w => profile(w - wavelength)), type: "scatter" as const, mode: "lines" as const, name: "Gaussian Profile", line: { color: "#f97316" } },
    ];
  }, [wavelength, fwhmNm]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Doppler Broadening Calculator</h1>
      <p className="text-gray-400 mb-8">Calculate Doppler (thermal) line broadening FWHM from gas temperature and atomic/molecular mass.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={100} max={5000} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} min={10} max={10000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Mass (amu)</span>
          <input type="number" value={mass} onChange={e => setMass(+e.target.value)} min={1} max={300} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM (nm)</p>
          <p className="text-2xl font-bold text-orange-400">{fwhmNm.toExponential(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM (GHz)</p>
          <p className="text-2xl font-bold text-blue-400">{(deltaNuD * 1e-9).toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">HWHM (MHz)</p>
          <p className="text-2xl font-bold text-green-400">{(deltaNuHz * 1e-6).toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Thermal Velocity</p>
          <p className="text-2xl font-bold text-yellow-400">{Math.sqrt(kB * temperature / m).toFixed(0)} m/s</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
