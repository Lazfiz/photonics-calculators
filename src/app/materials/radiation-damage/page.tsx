"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


interface Material {
  name: string;
  // Radiation-induced absorption coefficient at 1 Mrad dose (cm⁻¹)
  alphaGamma1M: number;
  // Recovery time constant (hours)
  tauRecovery: number;
  // Permanent darkening fraction (0-1)
  permanentFrac: number;
  // Displacement damage threshold (neq/cm²)
  displacementThreshold: number;
  // Notes
  radiationHard: boolean;
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica", alphaGamma1M: 0.02, tauRecovery: 500, permanentFrac: 0.3, displacementThreshold: 1e15, radiationHard: true },
  "BK7": { name: "BK7", alphaGamma1M: 0.1, tauRecovery: 200, permanentFrac: 0.5, displacementThreshold: 5e14, radiationHard: false },
  "CaF2": { name: "CaF₂", alphaGamma1M: 0.005, tauRecovery: 100, permanentFrac: 0.1, displacementThreshold: 5e15, radiationHard: true },
  "Sapphire": { name: "Sapphire", alphaGamma1M: 0.01, tauRecovery: 50, permanentFrac: 0.2, displacementThreshold: 1e16, radiationHard: true },
  "Diamond": { name: "Diamond", alphaGamma1M: 0.001, tauRecovery: 10, permanentFrac: 0.05, displacementThreshold: 1e17, radiationHard: true },
  "ZnSe": { name: "ZnSe", alphaGamma1M: 0.5, tauRecovery: 1000, permanentFrac: 0.7, displacementThreshold: 1e13, radiationHard: false },
  "ULE": { name: "ULE", alphaGamma1M: 0.03, tauRecovery: 600, permanentFrac: 0.3, displacementThreshold: 8e14, radiationHard: true },
  "MgF2": { name: "MgF₂", alphaGamma1M: 0.008, tauRecovery: 150, permanentFrac: 0.15, displacementThreshold: 3e15, radiationHard: true },
  "LiF": { name: "LiF", alphaGamma1M: 0.8, tauRecovery: 5000, permanentFrac: 0.6, displacementThreshold: 1e14, radiationHard: false },
  "SiO2 (crystalline)": { name: "α-Quartz", alphaGamma1M: 0.03, tauRecovery: 800, permanentFrac: 0.35, displacementThreshold: 5e14, radiationHard: false },
};

function inducedAbsorption(mat: Material, doseMrad: number): number {
  return mat.alphaGamma1M * doseMrad; // linear approximation
}

function transmissionAfterRadiation(mat: Material, doseMrad: number, thicknessCm: number, timeHours: number): number {
  const alphaTotal = inducedAbsorption(mat, doseMrad);
  const alphaTransient = alphaTotal * (1 - mat.permanentFrac) * Math.exp(-timeHours / mat.tauRecovery);
  const alphaPermanent = alphaTotal * mat.permanentFrac;
  return Math.exp(-(alphaTransient + alphaPermanent) * thicknessCm);
}

function dnFromRadiation(mat: Material, doseMrad: number): number {
  // Typical: ~1e-7 per Mrad for hard materials, more for soft
  const base = mat.radiationHard ? 1e-7 : 5e-7;
  return base * doseMrad;
}

export default function RadiationDamagePage() {
  const [selected, setSelected] = useState("Fused Silica");
  const [dose, setDose] = useState(100);
  const [thickness, setThickness] = useState(10);
  const [timeAfter, setTimeAfter] = useState(24);
  const [neutronFluence, setNeutronFluence] = useState(1e14);

  const mat = materials[selected];
  const alphaInduced = useMemo(() => inducedAbsorption(mat, dose), [mat, dose]);
  const trans = useMemo(() => transmissionAfterRadiation(mat, dose, thickness, timeAfter), [mat, dose, thickness, timeAfter]);
  const dn = useMemo(() => dnFromRadiation(mat, dose), [mat, dose]);
  const displacementOk = useMemo(() => neutronFluence < mat.displacementThreshold, [neutronFluence, mat.displacementThreshold]);

  const chartData = useMemo(() => {
    const doses = Array.from({ length: 100 }, (_, i) => i * 10);
    const mat = materials[selected];
    const times = [0, 1, 24, 168, 720];
    const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6"];
    return times.map((t, i) => ({
      x: doses,
      y: doses.map(d => transmissionAfterRadiation(mat, d, thickness, t) * 100),
      type: "scatter" as const, mode: "lines" as const,
      name: `${t === 0 ? "Immediate" : t < 24 ? t + "h" : t < 168 ? (t/24) + "d" : (t/168) + "wk"}`,
      line: { color: colors[i], width: 2, dash: t === 0 ? "dash" : "solid" },
    }));
  }, [selected, thickness]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Radiation Damage Effects" description="Radiation-induced absorption and transmission loss in optical materials">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono">
        <p>α_ind = α₁M · Dose &nbsp;|&nbsp; T = exp(-α·d) &nbsp;|&nbsp; Recovery: α(t) = α₀·exp(-t/τ) + α_perm</p>
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
          <label className="block text-sm text-gray-400 mb-1">γ Dose (Mrad)</label>
          <input type="number" value={dose} onChange={e => setDose(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Thickness (mm)</label>
          <input type="number" value={thickness} onChange={e => setThickness(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0.1} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Time after exposure (h)</label>
          <input type="number" value={timeAfter} onChange={e => setTimeAfter(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Neutron fluence (n/cm²)</label>
          <input type="text" value={neutronFluence.toExponential(1)} onChange={e => setNeutronFluence(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">α_induced</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{alphaInduced.toExponential(2)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className={`text-2xl font-bold mt-1 ${trans > 0.9 ? "text-green-400" : trans > 0.5 ? "text-yellow-400" : "text-red-400"}`}>
            {(trans * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δn (radiation)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{dn.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Displacement</p>
          <p className={`text-xl font-bold mt-1 ${displacementOk ? "text-green-400" : "text-red-400"}`}>
            {displacementOk ? "✓ Below threshold" : "✗ Damage expected"}
          </p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Dose (Mrad)", gridcolor: "#374151" },
          yaxis: { title: "Transmission (%)", gridcolor: "#374151", range: [0, 105] },
          margin: { t: 20, r: 20, b: 50, l: 70 },
          legend: { orientation: "h", y: -0.2 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
