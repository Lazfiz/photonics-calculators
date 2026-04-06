"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


interface Material {
  name: string;
  // Transmission loss rate at 1064nm (% per 1000h at max spec conditions)
  lossRatePer1000h: number;
  // Yellowing/browning index change per 1000h
  browningRate: number;
  // Solarization resistance (UV dose threshold in kJ/cm²)
  solarizationThreshold: number;
  // Compaction rate (density change % per GPa·h)
  compactionRate: number;
  // Stress relaxation half-life (hours)
  stressRelaxTau: number;
  // Max service temp (°C)
  maxServiceTemp: number;
  // Typical lifetime (years under normal conditions)
  typicalLifetime: number;
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica", lossRatePer1000h: 0.001, browningRate: 0.001, solarizationThreshold: 100, compactionRate: 0.0001, stressRelaxTau: 1e8, maxServiceTemp: 1000, typicalLifetime: 50 },
  "BK7": { name: "BK7", lossRatePer1000h: 0.005, browningRate: 0.003, solarizationThreshold: 10, compactionRate: 0.0005, stressRelaxTau: 1e7, maxServiceTemp: 500, typicalLifetime: 30 },
  "SF11": { name: "SF11", lossRatePer1000h: 0.02, browningRate: 0.01, solarizationThreshold: 5, compactionRate: 0.001, stressRelaxTau: 1e6, maxServiceTemp: 400, typicalLifetime: 20 },
  "CaF2": { name: "CaF₂", lossRatePer1000h: 0.003, browningRate: 0.002, solarizationThreshold: 50, compactionRate: 0.0002, stressRelaxTau: 5e7, maxServiceTemp: 800, typicalLifetime: 40 },
  "ZnSe": { name: "ZnSe", lossRatePer1000h: 0.01, browningRate: 0.005, solarizationThreshold: 3, compactionRate: 0.0003, stressRelaxTau: 1e6, maxServiceTemp: 300, typicalLifetime: 15 },
  "Sapphire": { name: "Sapphire", lossRatePer1000h: 0.0005, browningRate: 0.0, solarizationThreshold: 500, compactionRate: 0.00005, stressRelaxTau: 1e10, maxServiceTemp: 1800, typicalLifetime: 100 },
  "ULE": { name: "ULE", lossRatePer1000h: 0.001, browningRate: 0.001, solarizationThreshold: 80, compactionRate: 0.0001, stressRelaxTau: 1e8, maxServiceTemp: 600, typicalLifetime: 50 },
  "MgF2": { name: "MgF₂", lossRatePer1000h: 0.002, browningRate: 0.001, solarizationThreshold: 60, compactionRate: 0.0002, stressRelaxTau: 5e7, maxServiceTemp: 800, typicalLifetime: 40 },
};

// Transmission after time (Arrhenius-accelerated aging)
function transmissionAfter(mat: Material, hours: number, tempFactor: number): number {
  // tempFactor = exp(-Ea/k * (1/T - 1/T_ref)) — simplified as multiplier
  const effectiveHours = hours * tempFactor;
  const loss = mat.lossRatePer1000h * (effectiveHours / 1000);
  return Math.max(0, 100 - loss);
}

// Solarization effect
function solarizationLoss(mat: Material, uvDose: number): number {
  if (uvDose < mat.solarizationThreshold) return 0;
  return 0.5 * Math.pow((uvDose - mat.solarizationThreshold) / mat.solarizationThreshold, 0.5);
}

// Radiation compaction
function compaction(mat: Material, fluence: number, hours: number): number {
  return mat.compactionRate * fluence * hours / 1000; // % density change
}

// Stress birefringence from aging
function stressBirefringence(mat: Material, initialStress: number, hours: number): number {
  return initialStress * Math.exp(-hours / mat.stressRelaxTau);
}

export default function AgingEffectsPage() {
  const [selected, setSelected] = useState("Fused Silica");
  const [hours, setHours] = useURLState("hours", 8760); // 1 year
  const [tempFactor, setTempFactor] = useURLState("tempFactor", 1);
  const [uvDose, setUvDose] = useURLState("uvDose", 10);
  const [laserFluence, setLaserFluence] = useURLState("laserFluence", 0.1);
  const [initialStress, setInitialStress] = useURLState("initialStress", 5); // nm/cm

  const mat = materials[selected];
  const trans = useMemo(() => transmissionAfter(mat, hours, tempFactor), [mat, hours, tempFactor]);
  const solLoss = useMemo(() => solarizationLoss(mat, uvDose), [mat, uvDose]);
  const compact = useMemo(() => compaction(mat, laserFluence, hours), [mat, laserFluence, hours]);
  const stress = useMemo(() => stressBirefringence(mat, initialStress, hours), [mat, initialStress, hours]);

  const chartData = useMemo(() => {
    const hrs = Array.from({ length: 100 }, (_, i) => i * 876);
    const mat = materials[selected];
    return [
      {
        x: hrs.map(h => h / 8760),
        y: hrs.map(h => transmissionAfter(mat, h, tempFactor)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Transmission (%)", line: { color: "#3b82f6", width: 2 },
        yaxis: "y",
      },
      {
        x: hrs.map(h => h / 8760),
        y: hrs.map(h => compaction(mat, laserFluence, h) * 10000),
        type: "scatter" as const, mode: "lines" as const,
        name: "Compaction (×10⁻⁴ %)", line: { color: "#ef4444", width: 2, dash: "dash" },
        yaxis: "y2",
      },
      {
        x: hrs.map(h => h / 8760),
        y: hrs.map(h => stressBirefringence(mat, initialStress, h)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Stress (nm/cm)", line: { color: "#22c55e", width: 2 },
        yaxis: "y3",
      },
    ];
  }, [selected, tempFactor, laserFluence, initialStress]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Aging of Optical Materials" description="Long-term degradation: transmission loss, solarization, compaction, stress relaxation">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono">
        <p>T(t) = 100 - rate·t·A(T) &nbsp;|&nbsp; Solarization: loss ∝ (D-D_th)^0.5 &nbsp;|&nbsp; Compaction: Δρ = rate·F·t</p>
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
          <label className="block text-sm text-gray-400 mb-1">Operating time (hours)</label>
          <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={1} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Temp acceleration factor</label>
          <input type="number" value={tempFactor} onChange={e => setTempFactor(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={1} step="0.1" />
          <span className="text-xs text-gray-500">Arrhenius: exp(-Ea/k·Δ(1/T))</span>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">UV dose (kJ/cm²)</label>
          <input type="number" value={uvDose} onChange={e => setUvDose(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0} step="0.1" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Laser fluence (J/cm²/pulse)</label>
          <input type="number" value={laserFluence} onChange={e => setLaserFluence(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0} step="0.01" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Initial stress (nm/cm)</label>
          <input type="number" value={initialStress} onChange={e => setInitialStress(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className={`text-2xl font-bold mt-1 ${trans > 99 ? "text-green-400" : trans > 95 ? "text-yellow-400" : "text-red-400"}`}>
            {trans.toFixed(3)}%
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Solarization loss</p>
          <p className={`text-2xl font-bold mt-1 ${solLoss < 0.1 ? "text-green-400" : "text-red-400"}`}>
            {solLoss.toFixed(3)}%
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Compaction</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{compact.toExponential(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Remaining stress</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stress.toFixed(2)} nm/cm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Typical lifetime</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{mat.typicalLifetime} yr</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Time (years)", gridcolor: "#374151" },
          yaxis: { title: "Transmission (%)", gridcolor: "#374151", side: "left", range: [99.5, 100.05] },
          yaxis2: { title: "Compaction (×10⁻⁴ %)", gridcolor: "#374151", overlaying: "y", side: "right", position: 0.85 },
          yaxis3: { title: "Stress (nm/cm)", gridcolor: "#374151", overlaying: "y", side: "right", position: 0.95 },
          margin: { t: 20, r: 100, b: 50, l: 70 },
          legend: { orientation: "h", y: -0.2 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
