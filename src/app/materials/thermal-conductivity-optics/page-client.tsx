"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

interface Material {
  name: string;
  k300: number; // W/(m·K) at 300K
  A: number; B: number; C: number; // k(T) = A + B*T + C*T^2 (simplified)
  unit: string;
}

const materials: Record<string, Material> = {
  "Diamond": { name: "Diamond", k300: 2200, A: 44000, B: -150, C: 0.15, unit: "W/(m·K)" },
  "SiC": { name: "SiC", k300: 490, A: 12000, B: -40, C: 0.05, unit: "W/(m·K)" },
  "Sapphire": { name: "Sapphire", k300: 35, A: 2000, B: -6, C: 0.01, unit: "W/(m·K)" },
  "Fused Silica": { name: "Fused Silica", k300: 1.38, A: 50, B: -0.15, C: 0.0003, unit: "W/(m·K)" },
  "BK7": { name: "BK7", k300: 1.11, A: 35, B: -0.10, C: 0.0002, unit: "W/(m·K)" },
  "CaF2": { name: "CaF₂", k300: 9.7, A: 600, B: -2.0, C: 0.004, unit: "W/(m·K)" },
  "ZnSe": { name: "ZnSe", k300: 18, A: 900, B: -3.0, C: 0.006, unit: "W/(m·K)" },
  "Si": { name: "Silicon", k300: 148, A: 8000, B: -28, C: 0.04, unit: "W/(m·K)" },
  "Ge": { name: "Germanium", k300: 60, A: 3000, B: -10, C: 0.015, unit: "W/(m·K)" },
  "GaAs": { name: "GaAs", k300: 55, A: 2500, B: -8, C: 0.012, unit: "W/(m·K)" },
};

function kAt(m: Material, T: number) {
  return Math.max(0.01, m.A + m.B * T + m.C * T * T);
}

function thermalResistance(m: Material, thickness: number, area: number) {
  return thickness / (kAt(m, 300) * area); // K/W
}

function temperatureRise(m: Material, power: number, thickness: number, area: number) {
  return power * thermalResistance(m, thickness, area);
}

export default function ThermalConductivityPage() {
  const [selected, setSelected] = useState("Fused Silica");
  const [temp, setTemp] = useURLState("temp", 300);
  const [thickness, setThickness] = useURLState("thickness", 10);
  const [area, setArea] = useURLState("area", 100);
  const [power, setPower] = useURLState("power", 1);

  const k = useMemo(() => kAt(materials[selected], temp), [selected, temp]);
  const dT = useMemo(() => temperatureRise(materials[selected], power, thickness * 1e-3, area * 1e-6), [selected, power, thickness, area]);

  const chartData = useMemo(() => {
    const temps = Array.from({ length: 300 }, (_, i) => 10 + i * 3);
    return Object.values(materials).slice(0, 6).map((m, i) => ({
      x: temps,
      y: temps.map(T => kAt(m, T)),
      type: "scatter" as const, mode: "lines" as const,
      name: m.name,
      line: { color: ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"][i], width: 2 },
    }));
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Thermal Conductivity for Optics" description="Heat transport in optical substrates">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono">
        <p>R_th = d / (k · A) &nbsp;|&nbsp; ΔT = P · R_th &nbsp;|&nbsp; k(T) = A + BT + CT²</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Temperature (K)</label>
          <ValidatedNumberInput label="Temperature (K)" value={temp} onChange={setTemp} min={10} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Thickness (mm)</label>
          <ValidatedNumberInput label="Thickness (mm)" value={thickness} onChange={setThickness} min={0.1} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Beam area (mm²)</label>
          <ValidatedNumberInput label="Beam area (mm²)" value={area} onChange={setArea} min={0.01} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Absorbed power (W)</label>
          <ValidatedNumberInput label="Absorbed power (W)" value={power} onChange={setPower} min={0} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">k(T)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{k.toFixed(2)} W/(m·K)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">R_th</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{dT > 0 ? (dT / power).toExponential(2) : "0"} K/W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ΔT (thermal lens)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{dT.toFixed(2)} °C</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Temperature (K)", gridcolor: "#374151" },
          yaxis: { title: "Thermal Conductivity (W/m·K)", gridcolor: "#374151", type: "log" },
          margin: { t: 20, r: 20, b: 50, l: 80 },
          legend: { orientation: "h", y: -0.2 },
          showlegend: true,
        }}
       
       
      />
    </CalculatorShell>
  );
}
