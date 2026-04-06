"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function FresnelEquationsPage() {
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.52);
  const [maxAngle, setMaxAngle] = useState(90);

  const chartData = useMemo(() => {
    const angles = Array.from({ length: 180 }, (_, i) => (i * maxAngle) / 179);
    const Rs = angles.map(a => {
      const t = (a * Math.PI) / 180;
      const cosI = Math.cos(t);
      const sinT = (n1 / n2) * Math.sin(t);
      if (Math.abs(sinT) > 1) return 1;
      const cosT = Math.sqrt(1 - sinT * sinT);
      const num = n1 * cosI - n2 * cosT;
      const den = n1 * cosI + n2 * cosT;
      return (num * num) / (den * den);
    });
    const Rp = angles.map(a => {
      const t = (a * Math.PI) / 180;
      const cosI = Math.cos(t);
      const sinT = (n1 / n2) * Math.sin(t);
      if (Math.abs(sinT) > 1) return 1;
      const cosT = Math.sqrt(1 - sinT * sinT);
      const num = n2 * cosI - n1 * cosT;
      const den = n2 * cosI + n1 * cosT;
      return (num * num) / (den * den);
    });
    const Ravg = angles.map((_, i) => (Rs[i] + Rp[i]) / 2);
    return [
      { x: angles, y: Rs, type: "scatter" as const, mode: "lines" as const, name: "Rs (s-pol)", line: { color: "#f87171" } },
      { x: angles, y: Rp, type: "scatter" as const, mode: "lines" as const, name: "Rp (p-pol)", line: { color: "#60a5fa" } },
      { x: angles, y: Ravg, type: "scatter" as const, mode: "lines" as const, name: "R avg (unpolarized)", line: { color: "#a78bfa", dash: "dash" } },
    ];
  }, [n1, n2, maxAngle]);

  const brewster = (Math.atan(n2 / n1) * 180) / Math.PI;
  const criticalAngle = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;
  const Rnormal = Math.pow((n1 - n2) / (n1 + n2), 2);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Fresnel Equations" description="Reflectance vs. angle of incidence at a dielectric interface. Shows s-polarization, p-polarization, Brewster&apos;s angle, and total internal reflection.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n₁ (incident medium)</span>
          <input type="number" value={n1} onChange={e => setN1(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n₂ (transmitting medium)</span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Max Angle (°)</span>
          <input type="number" value={maxAngle} onChange={e => setMaxAngle(+e.target.value)} step="1" min="1" max="90" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">R at normal incidence</p>
          <p className="text-xl font-bold text-green-400">{(Rnormal * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Brewster&apos;s Angle</p>
          <p className="text-xl font-bold text-yellow-400">{brewster.toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Critical Angle</p>
          <p className="text-xl font-bold text-red-400">{criticalAngle !== null ? `${criticalAngle.toFixed(2)}°` : "N/A (n₁ < n₂)"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Key Equations</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>rₛ = (n₁cosθᵢ − n₂cosθₜ) / (n₁cosθᵢ + n₂cosθₜ)</p>
          <p>rₚ = (n₂cosθᵢ − n₁cosθₜ) / (n₂cosθᵢ + n₁cosθₜ)</p>
          <p>R = |r|², &nbsp; T = 1 − R</p>
          <p>Brewster: θ_B = arctan(n₂/n₁)</p>
          <p>Critical: θ_c = arcsin(n₂/n₁) when n₁ &gt; n₂</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Angle of Incidence (°)", gridcolor: "#374151", range: [0, maxAngle] },
          yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </CalculatorShell>
  );
}
