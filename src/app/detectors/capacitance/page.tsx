"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Photodiode Junction Capacitance
// C_j = C_j0 / (1 - V_R/V_bi)^m  (abrupt: m=0.5, graded: m=0.33, hyper-abrupt: m=0.75)
// V_bi = built-in potential ≈ 0.6V (Si), 0.7V (GaAs)
// f_3dB = 1 / (2π·R_load·C_j) for RC-limited bandwidth
// ε_Si = 11.7·ε_0, ε_InGaAs = 12.9·ε_0

export default function CapacitancePage() {
  const [zeroBiasCap, setZeroBiasCap] = useState(10); // pF
  const [builtInVoltage, setBuiltInVoltage] = useState(0.6); // V
  const [reverseBias, setReverseBias] = useState(5); // V
  const [gradingProfile, setGradingProfile] = useState<"abrupt" | "graded" | "hyperabrupt">("abrupt");
  const [loadResistance, setLoadResistance] = useState(50); // Ω
  const [seriesResistance, setSeriesResistance] = useState(10); // Ω

  const gradingExponent: Record<string, number> = { abrupt: 0.5, graded: 0.33, hyperabrupt: 0.75 };
  const m = gradingExponent[gradingProfile];

  const capacitance = zeroBiasCap / Math.pow(1 + reverseBias / builtInVoltage, m); // pF
  const totalResistance = loadResistance + seriesResistance;
  const rcBandwidth = 1 / (2 * Math.PI * totalResistance * capacitance * 1e-12); // Hz

  const capVsBias = useMemo(() => {
    const vr = Array.from({ length: 200 }, (_, i) => 0.01 + i * 20 / 200);
    return [
      { x: vr, y: vr.map(v => zeroBiasCap / Math.pow(1 + v / builtInVoltage, 0.5)), type: "scatter", mode: "lines", name: "Abrupt (m=0.5)", line: { color: "#60a5fa", width: 2 } },
      { x: vr, y: vr.map(v => zeroBiasCap / Math.pow(1 + v / builtInVoltage, 0.33)), type: "scatter", mode: "lines", name: "Graded (m=0.33)", line: { color: "#34d399", width: 2 } },
      { x: vr, y: vr.map(v => zeroBiasCap / Math.pow(1 + v / builtInVoltage, 0.75)), type: "scatter", mode: "lines", name: "Hyper-abrupt (m=0.75)", line: { color: "#f87171", width: 2 } },
    ];
  }, [zeroBiasCap, builtInVoltage]);

  const bwVsBias = useMemo(() => {
    const vr = Array.from({ length: 200 }, (_, i) => 0.01 + i * 20 / 200);
    return [
      { x: vr, y: vr.map(v => 1 / (2 * Math.PI * totalResistance * (zeroBiasCap / Math.pow(1 + v / builtInVoltage, m)) * 1e-12) / 1e6), type: "scatter", mode: "lines", name: "RC Bandwidth", line: { color: "#fbbf24", width: 2 } },
      { x: vr, y: vr.map(v => 1 / (2 * Math.PI * totalResistance * (zeroBiasCap / Math.pow(1 + v / builtInVoltage, 0.5)) * 1e-12) / 1e6), type: "scatter", mode: "lines", name: "Abrupt BW", line: { color: "#60a5fa", width: 2, dash: "dash" } },
    ];
  }, [zeroBiasCap, builtInVoltage, totalResistance, m]);

  const capVsArea = useMemo(() => {
    const areas = Array.from({ length: 150 }, (_, i) => 0.01 + i * 5 / 150);
    return [{
      x: areas, y: areas.map(a => a * zeroBiasCap / 1), type: "scatter", mode: "lines",
      name: "C_j ∝ Area", line: { color: "#a78bfa", width: 2 },
    }];
  }, [zeroBiasCap]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Junction Capacitance</h1>
      <p className="text-gray-400 mb-8">Photodiode junction capacitance vs reverse bias, doping profile, and RC bandwidth impact.</p>

      <div className="flex gap-2 mb-6">
        {(["abrupt", "graded", "hyperabrupt"] as const).map(p => (
          <button key={p} onClick={() => setGradingProfile(p)}
            className={`px-4 py-2 rounded text-sm font-medium capitalize ${gradingProfile === p ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Zero-Bias Capacitance (pF)</span>
          <input type="number" value={zeroBiasCap} onChange={e => setZeroBiasCap(+e.target.value)} min="0.1" step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Built-in Voltage (V)</span>
          <input type="number" value={builtInVoltage} onChange={e => setBuiltInVoltage(+e.target.value)} min="0.1" step="0.05"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Reverse Bias (V)</span>
          <input type="number" value={reverseBias} onChange={e => setReverseBias(+e.target.value)} min="0" step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Load Resistance (Ω)</span>
          <input type="number" value={loadResistance} onChange={e => setLoadResistance(+e.target.value)} min="1" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Series Resistance (Ω)</span>
          <input type="number" value={seriesResistance} onChange={e => setSeriesResistance(+e.target.value)} min="0" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><span className="text-gray-400 text-sm">Junction Capacitance</span><div className="text-xl font-mono text-green-400">{capacitance.toFixed(2)} pF</div></div>
          <div><span className="text-gray-400 text-sm">RC Bandwidth</span><div className="text-xl font-mono">{rcBandwidth > 1e9 ? (rcBandwidth / 1e9).toFixed(2) + " GHz" : (rcBandwidth / 1e6).toFixed(1) + " MHz"}</div></div>
          <div><span className="text-gray-400 text-sm">RC Time Constant</span><div className="text-xl font-mono">{(totalResistance * capacitance * 1e-12 * 1e9).toFixed(2)} ns</div></div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Capacitance vs Reverse Bias</h3>
          <Plot data={capVsBias} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Reverse Bias (V)", gridcolor: "#374151" },
            yaxis: { title: "C_j (pF)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">RC Bandwidth vs Reverse Bias</h3>
          <Plot data={bwVsBias} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Reverse Bias (V)", gridcolor: "#374151" },
            yaxis: { title: "f_3dB (MHz)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
        <h3 className="text-white font-semibold mb-2">Formulas</h3>
        <p>C_j = C_j0 / (1 + V_R/V_bi)^m</p>
        <p>f_3dB = 1 / (2π·(R_L + R_s)·C_j)</p>
        <p>Abrupt junction: m=0.5, Graded: m=0.33, Hyper-abrupt: m=0.75</p>
      </div>
    </div>
  );
}
