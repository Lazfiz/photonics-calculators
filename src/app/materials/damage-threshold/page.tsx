"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


interface Material {
  name: string;
  // LIDT in J/cm² at various pulse durations (ns), reference 1064nm
  lidt1ns: number;
  lidt10ns: number;
  lidt100ns: number;
  cwThreshold: number; // W/cm²
  tauRef: number; // reference pulse duration for scaling
  exponent: number; // τ^0.5 scaling exponent
  arCoating: number; // AR coating LIDT multiplier (typically 0.3-0.5 of bulk)
  notes: string;
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica", lidt1ns: 15, lidt10ns: 50, lidt100ns: 150, cwThreshold: 1e6, tauRef: 10, exponent: 0.5, arCoating: 0.4, notes: "Standard UV-grade" },
  "BK7": { name: "BK7", lidt1ns: 10, lidt10ns: 35, lidt100ns: 100, cwThreshold: 5e5, tauRef: 10, exponent: 0.5, arCoating: 0.35, notes: "Borosilicate crown" },
  "CaF2": { name: "CaF₂", lidt1ns: 20, lidt10ns: 60, lidt100ns: 180, cwThreshold: 2e6, tauRef: 10, exponent: 0.5, arCoating: 0.45, notes: "Deep UV capable" },
  "Sapphire": { name: "Sapphire", lidt1ns: 25, lidt10ns: 80, lidt100ns: 250, cwThreshold: 5e6, tauRef: 10, exponent: 0.5, arCoating: 0.5, notes: "Very high thermal" },
  "Diamond": { name: "Diamond", lidt1ns: 50, lidt10ns: 150, lidt100ns: 500, cwThreshold: 1e7, tauRef: 10, exponent: 0.5, arCoating: 0.3, notes: "Highest LIDT known" },
  "ZnSe": { name: "ZnSe", lidt1ns: 5, lidt10ns: 15, lidt100ns: 40, cwThreshold: 2e5, tauRef: 10, exponent: 0.5, arCoating: 0.3, notes: "CO₂ laser optics" },
  "SiC": { name: "SiC", lidt1ns: 30, lidt10ns: 100, lidt100ns: 300, cwThreshold: 8e6, tauRef: 10, exponent: 0.5, arCoating: 0.4, notes: "Extreme environments" },
  "ULE": { name: "ULE", lidt1ns: 12, lidt10ns: 40, lidt100ns: 120, cwThreshold: 8e5, tauRef: 10, exponent: 0.5, arCoating: 0.35, notes: "Low CTE glass" },
};

// Scale LIDT with pulse duration: LIDT(τ) = LIDT_ref * (τ/τ_ref)^0.5
function scaleLIDT(mat: Material, tauNs: number, coating: boolean) {
  const bulk = mat.lidt10ns * Math.pow(tauNs / mat.tauRef, mat.exponent);
  return coating ? bulk * mat.arCoating : bulk;
}

// Peak fluence from pulse energy and beam area
function peakFluence(energy: number, diameter: number) {
  const area = Math.PI * Math.pow(diameter / 2, 2); // cm²
  return energy / area; // J/cm²
}

// Peak intensity for CW
function peakIntensity(power: number, diameter: number) {
  const area = Math.PI * Math.pow(diameter / 2, 2); // cm²
  return power / area; // W/cm²
}

export default function DamageThresholdPage() {
  const [selected, setSelected] = useState("Fused Silica");
  const [pulseDuration, setPulseDuration] = useState(10);
  const [energy, setEnergy] = useState(0.5);
  const [beamDiam, setBeamDiam] = useState(1);
  const [isCW, setIsCW] = useState(false);
  const [cwPower, setCwPower] = useState(100);
  const [useCoating, setUseCoating] = useState(true);

  const mat = materials[selected];
  const lidt = useMemo(() => scaleLIDT(mat, pulseDuration, useCoating), [mat, pulseDuration, useCoating]);
  const fluence = useMemo(() => peakFluence(energy, beamDiam), [energy, beamDiam]);
  const cwIntensity = useMemo(() => peakIntensity(cwPower, beamDiam), [cwPower, beamDiam]);
  const margin = useMemo(() => isCW ? mat.cwThreshold / cwIntensity : lidt / fluence, [isCW, mat.cwThreshold, cwIntensity, lidt, fluence]);

  const chartData = useMemo(() => {
    const taus = Array.from({ length: 100 }, (_, i) => Math.pow(10, -3 + i * 0.06)); // 0.001 to 10000 ns
    const mat = materials[selected];
    return [
      {
        x: taus, y: taus.map(t => scaleLIDT(mat, t, false)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Bulk", line: { color: "#3b82f6", width: 2 },
      },
      {
        x: taus, y: taus.map(t => scaleLIDT(mat, t, true)),
        type: "scatter" as const, mode: "lines" as const,
        name: "AR Coating", line: { color: "#ef4444", width: 2, dash: "dash" },
      },
    ];
  }, [selected]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Laser Damage Threshold" description="LIDT for pulsed and CW laser optics">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono">
        <p>LIDT(τ) = LIDT_ref · (τ/τ_ref)^0.5 &nbsp;|&nbsp; F = E/A &nbsp;|&nbsp; I = P/A</p>
      </div>

      <div className="flex gap-4 mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input type="checkbox" checked={isCW} onChange={e => setIsCW(e.target.checked)} className="rounded" />
          CW mode
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input type="checkbox" checked={useCoating} onChange={e => setUseCoating(e.target.checked)} className="rounded" />
          Include AR coating limit
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        {!isCW ? (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pulse duration (ns)</label>
              <input type="number" value={pulseDuration} onChange={e => setPulseDuration(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0.001} step="0.1" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pulse energy (J)</label>
              <input type="number" value={energy} onChange={e => setEnergy(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0} step="0.01" />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm text-gray-400 mb-1">CW Power (W)</label>
            <input type="number" value={cwPower} onChange={e => setCwPower(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0} />
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Beam diameter (cm)</label>
          <input type="number" value={beamDiam} onChange={e => setBeamDiam(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0.01} step="0.01" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">LIDT</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{!isCW ? `${lidt.toFixed(1)} J/cm²` : `${(mat.cwThreshold).toExponential(1)} W/cm²`}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">{isCW ? "Intensity" : "Fluence"}</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{isCW ? `${cwIntensity.toExponential(1)} W/cm²` : `${fluence.toFixed(2)} J/cm²`}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Safety margin</p>
          <p className={`text-2xl font-bold mt-1 ${margin > 2 ? "text-green-400" : margin > 1 ? "text-yellow-400" : "text-red-400"}`}>
            {margin.toFixed(2)}×
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Status</p>
          <p className={`text-xl font-bold mt-1 ${margin > 2 ? "text-green-400" : margin > 1 ? "text-yellow-400" : "text-red-400"}`}>
            {margin > 2 ? "✓ Safe" : margin > 1 ? "⚠ Marginal" : "✗ DAMAGE RISK"}
          </p>
        </div>
      </div>

      {!isCW && (
        <ChartPanel data={chartData}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Pulse Duration (ns)", gridcolor: "#374151", type: "log" },
            yaxis: { title: "LIDT (J/cm²)", gridcolor: "#374151", type: "log" },
            margin: { t: 20, r: 20, b: 50, l: 70 },
            legend: { orientation: "h", y: -0.15 },
          }}
         
         
        />
      )}
    </CalculatorShell>
  );
}
