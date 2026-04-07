"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function AfocalPage() {
  const [f1Mm, setF1Mm] = useState(100);
  const [f2Mm, setF2Mm] = useState(200);
  const [separationMm, setSeparationMm] = useState(300); // f1 + f2 for afocal
  const [objectAngleDeg, setObjectAngleDeg] = useState(2);

  // Afocal: separation d = f1 + f2
  const idealSep = f1Mm + f2Mm;
  const isAfocal = Math.abs(separationMm - idealSep) < 0.01;
  const angularMag = isAfocal ? -f2Mm / f1Mm : -(f2Mm / f1Mm) * (1 - (separationMm - idealSep) / f2Mm);
  const exitAngle = objectAngleDeg * angularMag;
  const fieldStopDiam = 2 * f1Mm * Math.tan(objectAngleDeg * Math.PI / 180);

  // Keplerian (f1,f2 > 0) vs Galilean (one negative)
  const type = f1Mm > 0 && f2Mm > 0 ? "Keplerian" : "Galilean";

  const chartData = useMemo(() => {
    const seps = Array.from({ length: 200 }, (_, i) => (f1Mm + f2Mm) - 50 + i * 0.5);
    return [
      {
        x: seps,
        y: seps.map(d => {
          const dev = d - (f1Mm + f2Mm);
          return -(f2Mm / f1Mm) * (1 - dev / f2Mm);
        }),
        type: "scatter" as const, mode: "lines" as const,
        name: "Angular Magnification",
        line: { color: "#60a5fa", width: 2 },
      },
      {
        x: [separationMm], y: [angularMag],
        type: "scatter" as const, mode: "markers" as const,
        name: "Current",
        marker: { color: "#f87171", size: 12 },
      },
      {
        x: [idealSep], y: [-f2Mm / f1Mm],
        type: "scatter" as const, mode: "markers" as const,
        name: "True Afocal",
        marker: { color: "#34d399", size: 12, symbol: "diamond" },
      },
    ];
  }, [f1Mm, f2Mm, separationMm, angularMag, idealSep]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Afocal System Calculator" description="Design and analyze afocal (telescopic) relay systems — Keplerian and Galilean configurations.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">M_ang = −f₂ / f₁ &nbsp;(afocal, d = f₁ + f₂)</p>
        <p className="text-gray-300 text-sm font-mono mt-1">d_ideal = f₁ + f₂</p>
        <p className="text-gray-300 text-sm font-mono mt-1">θ_out = M_ang · θ_in</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="f₁ (mm)" value={f1Mm} onChange={setF1Mm} min={-500} max={5000} step="0.1" />
        <ValidatedNumberInput label="f₂ (mm)" value={f2Mm} onChange={setF2Mm} min={-500} max={5000} step="0.1" />
        <ValidatedNumberInput label="Separation (mm)" value={separationMm} onChange={setSeparationMm} min={0} max={10000} step="0.1" />
        <ValidatedNumberInput label="Input Angle (°)" value={objectAngleDeg} onChange={setObjectAngleDeg} min={0.01} max={30} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular Mag.</p>
          <p className="text-2xl font-bold text-blue-400">{angularMag.toFixed(2)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ideal Separation</p>
          <p className="text-2xl font-bold text-green-400">{idealSep.toFixed(1)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Exit Angle</p>
          <p className="text-2xl font-bold text-yellow-400">{exitAngle.toFixed(3)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Type</p>
          <p className="text-xl font-bold text-purple-400">{type}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Afocal?</p>
          <p className={`text-2xl font-bold ${isAfocal ? "text-green-400" : "text-red-400"}`}>
            {isAfocal ? "Yes ✓" : "No ✗"}
          </p>
        </div>
      </div>

      {!isAfocal && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-8">
          <p className="text-yellow-400 text-sm">
            Separation is {(separationMm - idealSep).toFixed(1)} mm from afocal condition. System is not truly afocal.
          </p>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Separation (mm)", gridcolor: "#374151" },
          yaxis: { title: "Angular Magnification", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
