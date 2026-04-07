"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function FogAttenuationPage() {
  const [visibility, setVisibility] = useState(0.5);
  const [wavelength, setWavelength] = useState(1550);
  const [range, setRange] = useState(1);
  const [fogModel, setFogModel] = useState<"kim" | "kruse">("kim");

  const calc = useMemo(() => {
    const V = visibility; // keep in km — Kim/Kruse thresholds are in km
    let q: number;
    if (fogModel === "kim") {
      q = V < 0.5 ? 0 : V < 1 ? 1.6 : V < 2 ? 0.585 * Math.pow(V, 0.333) : 1.3;
    } else {
      q = V < 6 ? 1.6 : V < 50 ? 1.58 : V < 80 ? 1.46 : 1.46;
    }
    const beta = 3.91 / V * Math.pow(wavelength * 1e-6 / 0.55, -q); // per km
    const attenuation = beta * range; // dB/km * km
    const totalPowerFraction = Math.pow(10, -attenuation / 10);
    return { q, beta, attenuation, totalPowerFraction };
  }, [visibility, wavelength, range, fogModel]);

  const plotData = useMemo(() => {
    const vis = Array.from({ length: 200 }, (_, i) => 0.02 + i * 0.1);
    const lambdas = [850, 1310, 1550];
    const colors = ["#f43f5e", "#06b6d4", "#a78bfa"];
    return lambdas.map((wl, idx) => {
      const attens = vis.map((v) => {
        const V = v; // km
        let q: number;
        if (fogModel === "kim") {
          q = V < 0.5 ? 0 : V < 1 ? 1.6 : V < 2 ? 0.585 * Math.pow(V, 0.333) : 1.3;
        } else {
          q = V < 6 ? 1.6 : V < 50 ? 1.58 : V < 80 ? 1.46 : 1.46;
        }
        return (3.91 / V) * Math.pow(wl * 1e-6 / 0.55, -q) * range;
      });
      return { x: vis, y: attens, type: "scatter", mode: "lines", name: `${wl} nm`, line: { color: colors[idx] } };
    });
  }, [range, fogModel]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm">
                <p className="text-cyan-300 mt-1 font-mono">β = 3.91 / V · (λ/0.55)^(-q) &nbsp; [dB/km]</p>
        <p className="text-gray-500 mt-1">q depends on visibility V. Total loss = β × L</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Visibility (km)", visibility, setVisibility],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["Link Range (km)", range, setRange],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fog Model</label>
            <select value={fogModel} onChange={(e) => setFogModel(e.target.value as "kim" | "kruse")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
              <option value="kim">Kim (V &lt; 2 km)</option>
              <option value="kruse">Kruse</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">q exponent</span><span>{calc.q.toFixed(3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Attenuation coeff (β)</span><span>{calc.beta.toFixed(2)} dB/km</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Attenuation</span><span className="text-red-400">{calc.attenuation.toFixed(1)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Power Transmitted</span><span>{(calc.totalPowerFraction * 100).toFixed(4)}%</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Visibility (km)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
              yaxis: { title: "Attenuation (dB)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 50, l: 60 }, font: { color: "#9ca3af" }, legend: { x: 0.02, y: 0.98 },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
