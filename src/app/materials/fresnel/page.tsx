"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface FresnelResult {
  Rs: number;
  Rp: number;
  R_avg: number;
  T_avg: number;
  thetaT: number;
}

function fresnel(n1: number, n2: number, thetaI: number): FresnelResult {
  const sinThetaT = n1 * Math.sin(thetaI) / n2;
  if (Math.abs(sinThetaT) > 1) {
    // Total internal reflection
    return { Rs: 1, Rp: 1, R_avg: 1, T_avg: 0, thetaT: NaN };
  }
  const thetaT = Math.asin(sinThetaT);
  const cosI = Math.cos(thetaI);
  const cosT = Math.cos(thetaT);
  const Rs = Math.pow((n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT), 2);
  const Rp = Math.pow((n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT), 2);
  return { Rs, Rp, R_avg: (Rs + Rp) / 2, T_avg: 1 - (Rs + Rp) / 2, thetaT };
}

export default function FresnelPage() {
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.5);
  const [angle, setAngle] = useState(45);

  const result = useMemo(() => {
    const thetaI = angle * Math.PI / 180;
    return fresnel(n1, n2, thetaI);
  }, [n1, n2, angle]);

  const brewster = Math.atan(n2 / n1) * 180 / Math.PI;

  const chartData = useMemo(() => {
    const angles: number[] = [];
    const rs: number[] = [];
    const rp: number[] = [];
    const ravg: number[] = [];
    
    for (let a = 0; a <= 90; a += 0.5) {
      const r = fresnel(n1, n2, a * Math.PI / 180);
      angles.push(a);
      rs.push(r.Rs);
      rp.push(r.Rp);
      ravg.push(r.R_avg);
    }
    
    return [
      { x: angles, y: rs, type: "scatter" as const, mode: "lines" as const, name: "Rs (s-pol)", line: { color: "#3b82f6" } },
      { x: angles, y: rp, type: "scatter" as const, mode: "lines" as const, name: "Rp (p-pol)", line: { color: "#ef4444" } },
      { x: angles, y: ravg, type: "scatter" as const, mode: "lines" as const, name: "R_avg", line: { color: "#f59e0b", dash: "dash" } },
      { 
        x: [brewster, brewster], 
        y: [0, 1], 
        type: "scatter" as const, 
        mode: "lines" as const, 
        name: `Brewster (${brewster.toFixed(1)}°)`, 
        line: { color: "#22c55e", dash: "dot", width: 2 } 
      },
    ];
  }, [n1, n2, brewster]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">Fresnel Equations</h1>
      <p className="text-gray-400 mb-6">Reflection &amp; transmission at a dielectric interface</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-xs text-gray-400 font-mono">
          R<sub>s</sub> = ((n₁cosθᵢ − n₂cosθₜ)/(n₁cosθᵢ + n₂cosθₜ))² &nbsp;|&nbsp;
          R<sub>p</sub> = ((n₂cosθᵢ − n₁cosθₜ)/(n₂cosθᵢ + n₁cosθₜ))²
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">n₁ (incident medium)</label>
          <input type="number" value={n1} onChange={e => setN1(Number(e.target.value))} step={0.01}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">n₂ (transmitting medium)</label>
          <input type="number" value={n2} onChange={e => setN2(Number(e.target.value))} step={0.01}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Angle of Incidence (°)</label>
          <input type="number" value={angle} onChange={e => setAngle(Number(e.target.value))} min={0} max={90}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5 mb-8">
        {[
          { label: "Rs (s-pol)", val: result.Rs },
          { label: "Rp (p-pol)", val: result.Rp },
          { label: "R_avg", val: result.R_avg },
          { label: "T_avg", val: result.T_avg },
          { label: "θt", val: isNaN(result.thetaT) ? "TIR" : `${(result.thetaT * 180 / Math.PI).toFixed(2)}°` },
        ].map(item => (
          <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{typeof item.val === "number" ? item.val.toFixed(6) : item.val}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">Brewster angle: <span className="text-green-400 font-semibold">{brewster.toFixed(2)}°</span></p>

      <Plot
        data={chartData}
        layout={{
          paper_bgcolor: "transparent", 
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Angle of Incidence (°)", gridcolor: "#374151", range: [0, 90] },
          yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1] },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.15 },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%", height: 450 }}
      />
    </div>
  );
}
