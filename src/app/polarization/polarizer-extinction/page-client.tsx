"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function PolarizerExtinctionPage() {
  const [extinctionRatioDb, setExtinctionRatioDb] = useState(30);
  const [transmissionPercent, setTransmissionPercent] = useState(95);
  const [numPolarizers, setNumPolarizers] = useState(2);
  const [angleDeg, setAngleDeg] = useState(0);

  const T_parallel = transmissionPercent / 100;
  const ER_linear = Math.pow(10, extinctionRatioDb / 10);
  const T_perp = T_parallel / ER_linear;

  // Malus&apos;s law for two crossed polarizers with imperfect extinction
  const cosTheta = Math.cos(angleDeg * Math.PI / 180);
  const transmitted = T_parallel * Math.pow(cosTheta, 2) + T_perp * Math.pow(Math.sin(angleDeg * Math.PI / 180), 2);
  const contrastRatio = T_parallel / Math.max(transmitted, 1e-15);
  const contrastDb = 10 * Math.log10(contrastRatio);

  // Cascade: n polarizers in series
  const cascadedER = Math.pow(ER_linear, numPolarizers);
  const cascadedERdb = 10 * Math.log10(cascadedER);
  const cascadedT = Math.pow(T_parallel, numPolarizers);

  const chartData = useMemo(() => {
    const angles = Array.from({ length: 361 }, (_, i) => i);
    return [
      {
        x: angles,
        y: angles.map(a => {
          const c = Math.cos(a * Math.PI / 180);
          const s = Math.sin(a * Math.PI / 180);
          return (T_parallel * c * c + T_perp * s * s) * 100;
        }),
        type: "scatter" as const, mode: "lines" as const,
        name: "Transmission",
        line: { color: "#60a5fa", width: 2 },
      },
      {
        x: [angleDeg], y: [transmitted * 100],
        type: "scatter" as const, mode: "markers" as const,
        name: "Current Angle",
        marker: { color: "#f87171", size: 10 },
      },
    ];
  }, [T_parallel, T_perp, angleDeg, transmitted]);

  const cascadedChart = useMemo(() => {
    const ns = Array.from({ length: 10 }, (_, i) => i + 1);
    return [
      {
        x: ns, y: ns.map(n => 10 * Math.log10(Math.pow(ER_linear, n))),
        type: "bar" as const, name: "Cascaded ER (dB)",
        marker: { color: "#34d399" },
      },
    ];
  }, [ER_linear]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Polarizer Extinction Ratio" description="Analyze extinction ratio, Malus&apos;s law with imperfect polarizers, and cascaded extinction performance.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">ER = T_max / T_min &nbsp;[linear]</p>
        <p className="text-gray-300 text-sm font-mono mt-1">T(θ) = T∥·cos²θ + T⊥·sin²θ</p>
        <p className="text-gray-300 text-sm font-mono mt-1">ER_cascaded = ER^n</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Extinction Ratio (dB)" value={extinctionRatioDb} onChange={setExtinctionRatioDb} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="Max Transmission (%)" value={transmissionPercent} onChange={setTransmissionPercent} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="Analyzer Angle (°)" value={angleDeg} onChange={setAngleDeg} min={0} max={90} step="0.1" />
        <ValidatedNumberInput label="Cascade Count" value={numPolarizers} onChange={setNumPolarizers} min={1} max={10} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T_parallel</p>
          <p className="text-2xl font-bold text-blue-400">{(T_parallel * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T_perpendicular</p>
          <p className="text-2xl font-bold text-green-400">{(T_perp * 100).toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Contrast at {angleDeg}°</p>
          <p className="text-2xl font-bold text-yellow-400">{contrastDb.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Cascaded ER</p>
          <p className="text-2xl font-bold text-purple-400">{cascadedERdb.toFixed(1)} dB</p>
          <p className="text-xs text-gray-500">T = {(cascadedT * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Transmission vs Angle</h3>
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Angle (°)", gridcolor: "#374151" },
            yaxis: { title: "Transmission (%)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Cascaded Extinction Ratio</h3>
          <ChartPanel data={cascadedChart} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Number of Polarizers", gridcolor: "#374151", dtick: 1 },
            yaxis: { title: "ER (dB)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
