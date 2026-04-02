"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function BirefringencePage() {
  const [no, setNo] = useState(1.5443); // quartz ordinary
  const [ne, setNe] = useState(1.5534); // quartz extraordinary
  const [thickness, setThickness] = useState(1.0); // mm
  const [wavelength, setWavelength] = useState(550); // nm

  const delta = useMemo(() => {
    const d_m = thickness * 1e-3;
    const lam = wavelength * 1e-9;
    const dn = ne - no;
    return (2 * Math.PI * dn * d_m) / lam;
  }, [no, ne, thickness, wavelength]);

  const retardationWaves = delta / (2 * Math.PI);
  const retardationDeg = (delta * 180) / Math.PI;

  // Plot: retardation vs wavelength
  const wavelengths = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let l = 300; l <= 1500; l += 5) {
      const d_m = thickness * 1e-3;
      const lam = l * 1e-9;
      const ret = ((ne - no) * d_m) / lam; // in waves
      pts.push({ x: l, y: ret });
    }
    return pts;
  }, [no, ne, thickness]);

  const orderCrossings = useMemo(() => {
    const crossings: number[] = [];
    for (let n = 1; n <= 20; n++) {
      const lam = ((ne - no) * thickness * 1e-3) / n * 1e9; // nm
      if (lam >= 300 && lam <= 1500) crossings.push(lam);
    }
    return crossings;
  }, [no, ne, thickness]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:underline mb-6 inline-block">← Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Birefringence & Retardation</h1>
      <p className="text-gray-400 mb-6">Phase retardation from crystal birefringence, thickness, and wavelength.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Crystal Parameters</h2>
          {[
            { label: "Ordinary index (nₒ)", val: no, set: setNo, step: 0.0001 },
            { label: "Extraordinary index (nₑ)", val: ne, set: setNe, step: 0.0001 },
            { label: "Thickness (mm)", val: thickness, set: setThickness, step: 0.01 },
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength, step: 1 },
          ].map(({ label, val, set, step }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step={step} value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
          <div className="mt-3 flex gap-2">
            <button onClick={() => { setNo(1.5443); setNe(1.5534); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">Quartz</button>
            <button onClick={() => { setNo(1.5427); setNe(1.4862); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">Calcite</button>
            <button onClick={() => { setNo(1.658); setNe(1.486); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">Calcite (vis)</button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Birefringence Δn = nₑ − nₒ" value={(ne - no).toFixed(4)} />
            <ResultRow label="Phase retardation δ" value={`${delta.toFixed(4)} rad`} />
            <ResultRow label="Retardation (waves)" value={retardationWaves.toFixed(4)} />
            <ResultRow label="Retardation (degrees)" value={`${retardationDeg.toFixed(2)}°`} />
            <ResultRow label="Waveplate order" value={`~${Math.floor(retardationWaves + 0.5)}${retardationWaves >= 0.95 && retardationWaves <= 1.05 ? " (quarter)" : retardationWaves >= 1.95 && retardationWaves <= 2.05 ? " (half)" : ""}`} />
          </div>
          {orderCrossings.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Order crossings (full-wave wavelengths):</p>
              <div className="flex flex-wrap gap-2">
                {orderCrossings.map((l, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-gray-800 rounded">{l.toFixed(1)} nm</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Retardation vs Wavelength</h2>
          <Plot
            data={[
              { type: "scatter", mode: "lines", x: wavelengths.map((p) => p.x), y: wavelengths.map((p) => p.y),
                line: { color: "#3b82f6", width: 2 }, name: "Retardation (waves)" },
              { type: "scatter", mode: "markers", x: [wavelength], y: [retardationWaves],
                marker: { size: 10, color: "#f59e0b" }, name: "Selected λ" },
            ]}
            layout={{
              xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
              yaxis: { title: "Retardation (waves)", gridcolor: "#374151", color: "#9ca3af" },
              paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              margin: { l: 50, r: 20, t: 20, b: 40 }, showlegend: true,
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "400px" }}
          />
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
