"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function BirefringentPolarizerPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 589);
  const [nO, setNO] = useURLState("nO", 1.658);
  const [nE, setNE] = useURLState("nE", 1.486);
  const [prismAngleDeg, setPrismAngleDeg] = useURLState("prismAngleDeg", 38.3);
  const [cutType, setCutType] = useState<"glan" | "wollaston" | "rochon" | "senarmont">("wollaston");

  const prismAngle = prismAngleDeg * Math.PI / 180;
  const dn = nO - nE; // birefringence

  // Walk-off angle (ray deviation)
  const walkoffGlan = Math.atan((nO * nE * Math.sqrt((nO ** 2 - nE ** 2))) /
    (nO ** 2 * Math.cos(prismAngle) ** 2 + nE ** 2 * Math.sin(prismAngle) ** 2));

  // Wollaston: beam splitting, deviation ≈ 2Δn·tan(α)
  const deviationWollaston = 2 * dn * Math.tan(prismAngle);
  const separationWollaston = Math.tan(deviationWollaston);

  // Rochon: e-ray undeviated, o-ray deviated
  const deviationRochon = dn * Math.tan(prismAngle);

  // Senarmont: similar to Rochon but opposite
  const deviationSenarmont = dn * Math.tan(prismAngle);

  // TIR check for Glan-type
  const gapIndex = 1.0; // air
  const criticalO = Math.asin(gapIndex / nO);
  const rayAngle = Math.PI / 2 - prismAngle;
  const oTIR = rayAngle >= criticalO;

  // Angular FOV
  const fovHalf = Math.abs(Math.PI / 2 - criticalO - prismAngle) * 180 / Math.PI;

  // Throughput
  const fresnelLoss = 2 * ((nO - 1) / (nO + 1)) ** 2;
  const throughput = (1 - fresnelLoss) ** 2;

  const angularData = useMemo(() => {
    const angles = Array.from({ length: 300 }, (_, i) => 20 + (i / 300) * 50);
    const walkoff = angles.map(a => {
      const r = a * Math.PI / 180;
      if (cutType === "glan") {
        return Math.atan((nO * nE * Math.sqrt(nO ** 2 - nE ** 2)) /
          (nO ** 2 * Math.cos(r) ** 2 + nE ** 2 * Math.sin(r) ** 2)) * 180 / Math.PI;
      }
      return 2 * dn * Math.tan(r) * 180 / Math.PI;
    });
    const devE = angles.map(a => {
      const r = a * Math.PI / 180;
      return dn * Math.tan(r) * 180 / Math.PI;
    });
    return [
      { x: angles, y: walkoff, type: "scatter" as const, mode: "lines" as const, name: cutType === "glan" ? "Walk-off" : "Deviation", line: { color: "#60a5fa", width: 2 } },
      ...(cutType !== "glan" ? [{ x: angles, y: devE, type: "scatter" as const, mode: "lines" as const, name: "Single beam dev.", line: { color: "#f87171", width: 2, dash: "dash" } }] : []),
    ];
  }, [nO, nE, dn, cutType]);

  const materialData = useMemo(() => {
    const materials = [
      { name: "Calcite", no: 1.658, ne: 1.486 },
      { name: "Quartz", no: 1.544, ne: 1.553 },
      { name: "Rutile", no: 1.973, ne: 2.165 },
      { name: "YVO₄", no: 1.993, ne: 2.156 },
      { name: "MgF₂", no: 1.38, ne: 1.39 },
      { name: "BBO", no: 1.655, ne: 1.543 },
    ];
    return [
      {
        x: materials.map(m => m.name), y: materials.map(m => Math.abs(m.no - m.ne)),
        type: "bar" as const, name: "Δn",
        marker: { color: ["#60a5fa", "#f87171", "#fbbf24", "#a78bfa", "#34d399", "#fb923c"] },
      },
    ];
  }, []);

  const comparisonInfo = {
    glan: { desc: "Glan-type: o-ray TIR, e-ray transmits. Single output beam.", fov: `${fovHalf.toFixed(1)}°`, ext: ">100,000:1" },
    wollaston: { desc: "Wollaston: both beams deviate symmetrically. Two orthogonally polarized outputs.", fov: "Wide", ext: "~10⁵:1" },
    rochon: { desc: "Rochon: ordinary ray undeviated, extraordinary ray deviates.", fov: "Moderate", ext: "~10⁵:1" },
    senarmont: { desc: "Senarmont: similar to Rochon, reversed roles.", fov: "Moderate", ext: "~10⁴:1" },
  };

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Birefringent Polarizer Design" description="Compare Glan, Wollaston, Rochon, and Senarmont polarizer designs using birefringent crystal prisms.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">Δn = n<sub>o</sub> - n<sub>e</sub>, Wollaston deviation ≈ 2Δn·tan(α)</p>
        <p className="text-gray-300 text-sm font-mono">Walk-off: ρ = arctan(n<sub>o</sub>n<sub>e</sub>√(n<sub>o</sub>²-n<sub>e</sub>²) / (n<sub>o</sub>²cos²θ + n<sub>e</sub>²sin²θ))</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {(["glan", "wollaston", "rochon", "senarmont"] as const).map(t => (
          <button key={t} onClick={() => setCutType(t)} className={`text-sm px-4 py-2 rounded ${cutType === t ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={2000} step="10" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>o</sub></span>
          <ValidatedNumberInput label="no" value={nO} onChange={setNO} step="0.001" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>e</sub></span>
          <ValidatedNumberInput label="ne" value={nE} onChange={setNE} step="0.001" />
        </label>
        <ValidatedNumberInput label="Prism Angle (°)" value={prismAngleDeg} onChange={setPrismAngleDeg} min={15} max={55} step="1" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNO(1.658); setNE(1.486); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Calcite</button>
        <button onClick={() => { setNO(1.544); setNE(1.553); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Quartz</button>
        <button onClick={() => { setNO(1.973); setNE(2.165); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Rutile</button>
        <button onClick={() => { setNO(1.993); setNE(2.156); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">YVO₄</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Birefringence Δn</p>
          <p className="text-2xl font-bold text-blue-400">{Math.abs(dn).toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Deviation</p>
          <p className="text-2xl font-bold text-yellow-400">
            {cutType === "glan" ? `${(walkoffGlan * 180 / Math.PI).toFixed(2)}°` :
             cutType === "wollaston" ? `${(deviationWollaston * 180 / Math.PI).toFixed(2)}°` :
             `${(deviationRochon * 180 / Math.PI).toFixed(2)}°`}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Throughput (approx)</p>
          <p className="text-2xl font-bold text-green-400">{(throughput * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Type</p>
          <p className="text-lg font-bold text-purple-400">{cutType.charAt(0).toUpperCase() + cutType.slice(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-300">{comparisonInfo[cutType].desc}</p>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>FOV: {comparisonInfo[cutType].fov}</span>
          <span>Extinction: {comparisonInfo[cutType].ext}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Angular Characteristics</h3>
          <ChartPanel data={angularData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Prism Angle (°)", gridcolor: "#374151" },
            yaxis: { title: "Angle (°)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 }, height: 300,
          }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Birefringence by Material</h3>
          <ChartPanel data={materialData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "", gridcolor: "#374151" },
            yaxis: { title: "|Δn|", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 }, height: 300,
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
