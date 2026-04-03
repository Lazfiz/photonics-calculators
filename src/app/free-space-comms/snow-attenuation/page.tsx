"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SnowAttenuationPage() {
  const [snowRate, setSnowRate] = useState(5);
  const [wavelength, setWavelength] = useState(1550);
  const [range, setRange] = useState(1);
  const [snowType, setSnowType] = useState<"dry" | "wet">("dry");

  const calc = useMemo(() => {
    // Snow attenuation model (simplified)
    // Dry snow: mainly scattering, attenuation ~0.01-0.1 dB/km
    // Wet snow: higher attenuation due to water coating, ~0.1-1 dB/km
    const S = snowRate; // mm/h water equivalent
    const isWet = snowType === "wet";
    // Based on empirical models: α = k_s · S^α_s
    const k_s = isWet ? 0.22 : 0.035;
    const alpha_s = isWet ? 0.85 : 0.72;
    const specificAtt = k_s * Math.pow(S, alpha_s);
    const totalAtt = specificAtt * range;
    // Visibility equivalent
    const visEq = isWet ? Math.max(0.1, 2.0 / Math.sqrt(S + 0.1)) : Math.max(0.5, 5.0 / Math.sqrt(S + 0.1));
    return { k_s, alpha_s, specificAtt, totalAtt, visEq };
  }, [snowRate, wavelength, range, snowType]);

  const plotData = useMemo(() => {
    const rates = Array.from({ length: 200 }, (_, i) => 0.5 + i * 0.25);
    const types = ["dry", "wet"];
    const colors = ["#06b6d4", "#f43f5e"];
    return types.map((type, idx) => {
      const isWet = type === "wet";
      const attens = rates.map((r) => {
        const k_s = isWet ? 0.22 : 0.035;
        return k_s * Math.pow(r, isWet ? 0.85 : 0.72) * range;
      });
      return { x: rates, y: attens, type: "scatter", mode: "lines", name: `${type} snow`, line: { color: colors[idx] } };
    });
  }, [range]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      <Link href="/free-space-comms" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">← Back to Free-Space Comms</Link>
      <h1 className="text-3xl font-bold mb-6">Snow Attenuation Calculator</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm">
        <p className="text-gray-400">Snow causes less attenuation than fog but wet snow (melting) can be significant due to water coating on flakes:</p>
        <p className="text-cyan-300 mt-1 font-mono">α = k_s · S^α_s &nbsp; [dB/km]</p>
        <p className="text-gray-500 mt-1">S = snowfall rate (mm/h water equiv). Dry snow: k≈0.035, Wet snow: k≈0.22</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Snowfall Rate (mm/h water eq.)", snowRate, setSnowRate],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["Link Range (km)", range, setRange],
          ].map(([label, val, set]) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Snow Type</label>
            <select value={snowType} onChange={(e) => setSnowType(e.target.value as "dry" | "wet")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
              <option value="dry">Dry Snow (powder)</option>
              <option value="wet">Wet Snow (melting)</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">k coefficient</span><span>{calc.k_s.toFixed(3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">α exponent</span><span>{calc.alpha_s.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Specific Attenuation</span><span>{calc.specificAtt.toFixed(3)} dB/km</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Attenuation</span><span className="text-red-400">{calc.totalAtt.toFixed(2)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">~Equivalent Visibility</span><span>{calc.visEq.toFixed(1)} km</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <Plot data={plotData} layout={{
              xaxis: { title: "Snowfall Rate (mm/h)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Attenuation (dB)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" }, legend: { x: 0.02, y: 0.98 },
            }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
