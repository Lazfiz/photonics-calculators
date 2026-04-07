"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
interface Semiconductor {
  name: string; Eg0: number; alpha: number; beta: number;
  direct: boolean; color: string;
}

// Varshni parameters: Eg(T) = Eg0 - αT²/(T+β)
const SEMICONDUCTORS: Record<string, Semiconductor> = {
  GaAs: { name: "GaAs", Eg0: 1.519, alpha: 5.405e-4, beta: 204, direct: true, color: "#f87171" },
  InP: { name: "InP", Eg0: 1.424, alpha: 4.5e-4, beta: 327, direct: true, color: "#60a5fa" },
  GaP: { name: "GaP", Eg0: 2.338, alpha: 5.771e-4, beta: 372, direct: false, color: "#34d399" },
  Si: { name: "Si", Eg0: 1.170, alpha: 4.73e-4, beta: 636, direct: false, color: "#f59e0b" },
  Ge: { name: "Ge", Eg0: 0.744, alpha: 4.774e-4, beta: 235, direct: false, color: "#a78bfa" },
  InAs: { name: "InAs", Eg0: 0.417, alpha: 3.76e-4, beta: 93, direct: true, color: "#ec4899" },
  GaN: { name: "GaN", Eg0: 3.39, alpha: 9.09e-4, beta: 830, direct: true, color: "#06b6d4" },
  CdTe: { name: "CdTe", Eg0: 1.606, alpha: 5.5e-4, beta: 180, direct: true, color: "#84cc16" },
  ZnO: { name: "ZnO", Eg0: 3.44, alpha: 7.5e-4, beta: 600, direct: true, color: "#fb923c" },
  InGaAs: { name: "In₀.₅₃Ga₀.₄₇As", Eg0: 0.75, alpha: 4.5e-4, beta: 300, direct: true, color: "#e879f9" },
};

function varshni(eg0: number, alpha: number, beta: number, T: number) {
  return eg0 - (alpha * T * T) / (T + beta);
}

function egToWavelength(eg: number) {
  return 1.23984 / eg * 1000; // nm
}

export default function SemiconductorBandgapPage() {
  const [selected, setSelected] = useState<string[]>(["GaAs", "InP", "Si", "GaN", "InGaAs"]);
  const [temperature, setTemperature] = useState(300);

  const toggle = (key: string) => setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const bandgaps = useMemo(() => {
    return selected.map(key => {
      const s = SEMICONDUCTORS[key];
      return { key, ...s, Eg: varshni(s.Eg0, s.alpha, s.beta, temperature) };
    });
  }, [selected, temperature]);

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 200 }, (_, i) => 10 + i * 3);
    return selected.map(key => {
      const s = SEMICONDUCTORS[key];
      return { x: temps, y: temps.map(T => varshni(s.Eg0, s.alpha, s.beta, T)), type: "scatter" as const, mode: "lines" as const, name: s.name, line: { color: s.color, width: 2 } };
    });
  }, [selected]);

  const wlChart = useMemo(() => {
    return selected.map(key => {
      const s = SEMICONDUCTORS[key];
      const temps = Array.from({ length: 200 }, (_, i) => 10 + i * 3);
      return { x: temps, y: temps.map(T => egToWavelength(varshni(s.Eg0, s.alpha, s.beta, T))), type: "scatter" as const, mode: "lines" as const, name: s.name, line: { color: s.color, width: 2, dash: "dash" } };
    });
  }, [selected]);

  const visRegion = useMemo(() => [{ x: [380, 750, 750, 380], y: [0, 0, 5, 5], type: "scatter" as const, fill: "toself" as const, fillcolor: "rgba(255,255,255,0.05)", line: { color: "transparent" }, showlegend: false, hoverinfo: "skip" as const }], []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Semiconductor Bandgap" description="Bandgap energy and absorption edge vs temperature using the Varshni equation. Direct vs indirect gap materials.">
            
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(SEMICONDUCTORS).map(([key, s]) => (
          <button key={key} onClick={() => toggle(key)} className={`px-3 py-1.5 rounded text-sm border ${selected.includes(key) ? "border-blue-500 bg-blue-500/20 text-blue-300" : "border-gray-700 text-gray-500"}`}>{s.name}{s.direct ? "" : " (ind)"}</button>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-1">Temperature: {temperature} K ({(temperature - 273.15).toFixed(0)} °C)</label>
        <input type="range" min={10} max={700} step={5} value={temperature} onChange={e => setTemperature(+e.target.value)} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {bandgaps.map(b => (
          <div key={b.key}>
            <div className="text-xs text-gray-500">{b.name}</div>
            <div className="text-lg font-bold">{b.Eg.toFixed(3)} eV</div>
            <div className="text-xs text-gray-500">λ<sub>edge</sub> = {egToWavelength(b.Eg).toFixed(0)} nm | {b.direct ? "Direct" : "Indirect"}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-bold mb-2">Bandgap Energy vs Temperature</h3>
        <ChartPanel data={chartData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Temperature (K)", gridcolor: "#374151" }, yaxis: { title: "E_g (eV)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.25 }, margin: { t: 20, b: 70, l: 60, r: 20 } }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2">Absorption Edge Wavelength vs Temperature</h3>
        <ChartPanel data={[...wlChart, ...visRegion]} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Temperature (K)", gridcolor: "#374151" }, yaxis: { title: "λ_edge (nm)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.25 }, margin: { t: 20, b: 70, l: 60, r: 20 } }} />
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
        <p className="font-mono bg-gray-800 p-2 rounded mb-2">E<sub>g</sub>(T) = E<sub>g0</sub> − αT² / (T + β)</p>
        <p className="font-mono bg-gray-800 p-2 rounded">λ<sub>edge</sub> = hc / E<sub>g</sub> = 1239.84 / E<sub>g</sub>(eV) nm</p>
      </div>
    </CalculatorShell>
  );
}
