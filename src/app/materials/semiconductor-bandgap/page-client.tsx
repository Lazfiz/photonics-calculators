"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import { cutoffWavelength } from "../../../physics/detectors/ingaas";
import { INGAAS_LATTICE_MATCHED_X, VARSHNI, ingaasBandGap, varshniBandGap } from "../../../physics/materials/bandgap";

interface Semiconductor {
  name: string;
  direct: boolean;
  color: string;
  /** Band gap in eV at T in K. */
  bandGap: (T: number) => number;
}

// Varshni sets from materials/bandgap.ts: Si, Ge (Sze 1981); III–V (Vurgaftman et al. 2001); GaP is its X (indirect) gap.
const varshni = (p: (typeof VARSHNI)[keyof typeof VARSHNI]) => (T: number) => varshniBandGap(T, p);
const SEMICONDUCTORS: Record<string, Semiconductor> = {
  GaAs: { name: "GaAs", direct: true, color: "#f87171", bandGap: varshni(VARSHNI.gaas) },
  InP: { name: "InP", direct: true, color: "#60a5fa", bandGap: varshni(VARSHNI.inp) },
  GaP: { name: "GaP", direct: false, color: "#34d399", bandGap: varshni(VARSHNI.gap) },
  Si: { name: "Si", direct: false, color: "#f59e0b", bandGap: varshni(VARSHNI.si) },
  Ge: { name: "Ge", direct: false, color: "#a78bfa", bandGap: varshni(VARSHNI.ge) },
  InAs: { name: "InAs", direct: true, color: "#ec4899", bandGap: varshni(VARSHNI.inas) },
  GaSb: { name: "GaSb", direct: true, color: "#84cc16", bandGap: varshni(VARSHNI.gasb) },
  InSb: { name: "InSb", direct: true, color: "#fb923c", bandGap: varshni(VARSHNI.insb) },
  GaN: { name: "GaN (wurtzite)", direct: true, color: "#06b6d4", bandGap: varshni(VARSHNI.gan) },
  InGaAs: { name: "In₀.₅₃Ga₀.₄₇As", direct: true, color: "#e879f9", bandGap: T => ingaasBandGap(INGAAS_LATTICE_MATCHED_X, T) },
};

/** Absorption edge hc/E_g in nm for E_g in eV. */
const egToWavelength = (eg: number) => cutoffWavelength(eg) * 1e9;

export default function SemiconductorBandgapPage() {
  const [selected, setSelected] = useState<string[]>(["GaAs", "InP", "Si", "GaN", "InGaAs"]);
  const [temperatureRaw, setTemperature] = useURLState("temperature", 300);
  const temperature = Number.isFinite(temperatureRaw) ? Math.min(700, Math.max(10, temperatureRaw)) : 300;

  const toggle = (key: string) => setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const bandgaps = useMemo(() => {
    return selected.map(key => {
      const s = SEMICONDUCTORS[key];
      return { key, ...s, Eg: s.bandGap(temperature) };
    });
  }, [selected, temperature]);

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 200 }, (_, i) => 10 + i * 3);
    return selected.map(key => {
      const s = SEMICONDUCTORS[key];
      return { x: temps, y: temps.map(s.bandGap), type: "scatter" as const, mode: "lines" as const, name: s.name, line: { color: s.color, width: 2 } };
    });
  }, [selected]);

  const wlChart = useMemo(() => {
    return selected.map(key => {
      const s = SEMICONDUCTORS[key];
      const temps = Array.from({ length: 200 }, (_, i) => 10 + i * 3);
      return { x: temps, y: temps.map(T => egToWavelength(s.bandGap(T))), type: "scatter" as const, mode: "lines" as const, name: s.name, line: { color: s.color, width: 2, dash: "dash" } };
    });
  }, [selected]);

  const visRegion = useMemo(() => [{ x: [380, 750, 750, 380], y: [0, 0, 5, 5], type: "scatter" as const, fill: "toself" as const, fillcolor: "rgba(255,255,255,0.05)", line: { color: "transparent" }, showlegend: false, hoverinfo: "skip" as const }], []);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(SEMICONDUCTORS).map(([key, s]) => (
          <button key={key} onClick={() => toggle(key)} className={`px-3 py-1.5 rounded text-sm border ${selected.includes(key) ? "border-blue-500 bg-blue-500/20 text-blue-300" : "border-gray-700 text-gray-500"}`}>{s.name}{s.direct ? "" : " (ind)"}</button>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-1">Temperature: {temperature} K ({(temperature - 273.15).toFixed(0)} °C)</label>
        <input type="range" aria-label="Temperature (K)" min={10} max={700} step={5} value={temperature} onChange={e => setTemperature(+e.target.value)} />
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
        <p className="font-mono bg-gray-800 p-2 rounded mb-2">λ<sub>edge</sub> = hc / E<sub>g</sub> = 1239.84 / E<sub>g</sub>(eV) nm</p>
        <p className="font-mono bg-gray-800 p-2 rounded">E<sub>g</sub>(In<sub>x</sub>Ga<sub>1−x</sub>As) = (1−x)·E<sub>g,GaAs</sub> + x·E<sub>g,InAs</sub> − 0.477·x(1−x) eV</p>
      </div>
    </>
  );
}
