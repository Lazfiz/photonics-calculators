"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const POLARIZERS = [
  { name: "Glan-Taylor", er: 100000, transmission: 0.95, damageThreshold: 500, aperture: 10, wavelengthRange: "350–2500", coating: "MgF₂", material: "Calcite" },
  { name: "Glan-Thompson", er: 100000, transmission: 0.96, damageThreshold: 100, aperture: 15, wavelengthRange: "300–2500", coating: "MgF₂", material: "Calcite" },
  { name: "Wollaston", er: 1000, transmission: 0.92, transmission2: 0.92, damageThreshold: 100, aperture: 15, wavelengthRange: "350–2500", coating: "MgF₂", material: "Calcite" },
  { name: "Rochon", er: 1000, transmission: 0.92, damageThreshold: 100, aperture: 15, wavelengthRange: "350–2500", coating: "MgF₂", material: "Quartz" },
  { name: "Wire Grid", er: 10000, transmission: 0.90, damageThreshold: 50, aperture: 25, wavelengthRange: "1000–50000", coating: "None", material: "Al on KRS-5" },
  { name: "Sheet (Polaroid)", er: 1000, transmission: 0.42, damageThreshold: 0.5, aperture: 50, wavelengthRange: "400–700", coating: "None", material: "PVA/Iodine" },
  { name: "Thin-Film Plate", er: 1000, transmission: 0.97, damageThreshold: 10, aperture: 25, wavelengthRange: "400–700", coating: "Dielectric stack", material: "Glass" },
  { name: "PBS Cube", er: 1000, transmission: 0.98, transmission2: 0.98, damageThreshold: 200, aperture: 15, wavelengthRange: "400–700", coating: "Dielectric", material: "BK7" },
];

export default function PolarizerTypesPage() {
  const [selected, setSelected] = useState<string[]>(POLARIZERS.map((p) => p.name));
  const [inputPower, setInputPower] = useState(10); // mW
  const [wavelength, setWavelength] = useState(550);

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));

  const filtered = POLARIZERS.filter((p) => selected.includes(p.name));

  const erData = useMemo(
    () => ({
      x: filtered.map((p) => p.name),
      y: filtered.map((p) => 10 * Math.log10(p.er)),
      text: filtered.map((p) => `${p.er}:1`),
      type: "bar" as const,
      marker: { color: "#3b82f6" },
    }),
    [filtered]
  );

  const transData = useMemo(
    () => ({
      x: filtered.map((p) => p.name),
      y: filtered.map((p) => p.transmission * 100),
      text: filtered.map((p) => `${(p.transmission * 100).toFixed(1)}%`),
      type: "bar" as const,
      marker: { color: "#22c55e" },
    }),
    [filtered]
  );

  const damageData = useMemo(
    () => ({
      x: filtered.map((p) => p.name),
      y: filtered.map((p) => p.damageThreshold),
      type: "bar" as const,
      marker: { color: "#ef4444" },
    }),
    [filtered]
  );

  const comparisonData = useMemo(
    () =>
      filtered.map((p) => ({
        name: p.name,
        er: 10 * Math.log10(p.er),
        transmission: (p.transmission * 100).toFixed(1),
        outputPower: (inputPower * p.transmission).toFixed(2),
        leakagePower: (inputPower / p.er).toFixed(4),
        damageThreshold: p.damageThreshold,
        wavelengthRange: p.wavelengthRange,
        material: p.material,
      })),
    [filtered, inputPower]
  );

  const plotLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#111827",
    font: { color: "#e5e7eb" },
    margin: { t: 30, b: 80, l: 50, r: 10 },
    xaxis: { tickangle: -45, color: "#9ca3af" },
    yaxis: { color: "#9ca3af", gridcolor: "#374151" },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:underline mb-6 inline-block">
        ← Polarization
      </Link>
      <h1 className="text-3xl font-bold mb-2">Polarizer Types Comparison</h1>
      <p className="text-gray-400 mb-6">
        Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Options</h2>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Input power (mW)</label>
            <input
              type="number"
              value={inputPower}
              onChange={(e) => setInputPower(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          <h3 className="text-sm font-semibold mb-2 mt-4">Select polarizers:</h3>
          <div className="space-y-1">
            {POLARIZERS.map((p) => (
              <label key={p.name} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(p.name)}
                  onChange={() => toggle(p.name)}
                  className="accent-blue-500"
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Extinction Ratio (dB)</h2>
          <Plot data={[erData]} layout={{ ...plotLayout, height: 250, yaxis: { ...plotLayout.yaxis, title: "ER (dB)" } }} config={{ displayModeBar: false }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Transmission (%)</h2>
          <Plot data={[transData]} layout={{ ...plotLayout, height: 250, yaxis: { ...plotLayout.yaxis, title: "Transmission (%)" } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Damage Threshold (W/cm²)</h2>
          <Plot data={[damageData]} layout={{ ...plotLayout, height: 250, yaxis: { ...plotLayout.yaxis, title: "Damage (W/cm²)" } }} config={{ displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-4">Comparison Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-right py-2 px-2">ER (dB)</th>
                <th className="text-right py-2 px-2">Transmission</th>
                <th className="text-right py-2 px-2">Output (mW)</th>
                <th className="text-right py-2 px-2">Leakage (mW)</th>
                <th className="text-right py-2 px-2">Damage (W/cm²)</th>
                <th className="text-right py-2 px-2">Material</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((c) => (
                <tr key={c.name} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-2 px-2 font-medium">{c.name}</td>
                  <td className="text-right py-2 px-2">{c.er}</td>
                  <td className="text-right py-2 px-2">{c.transmission}%</td>
                  <td className="text-right py-2 px-2">{c.outputPower}</td>
                  <td className="text-right py-2 px-2">{c.leakagePower}</td>
                  <td className="text-right py-2 px-2">{c.damageThreshold}</td>
                  <td className="text-right py-2 px-2">{c.material}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>ER (dB) = 10 · log₁₀(P_max / P_min)</p>
          <p>Leakage power = P_input / ER_linear</p>
          <p>Malus&apos;s law: I = I₀ · cos²(θ)</p>
          <p>ER_cascaded (dB) = ER₁ + ER₂ + ... (in dB)</p>
        </div>
      </div>
    </div>
  );
}
