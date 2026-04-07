"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function PolarimetryPage() {
  const [s0, setS0] = useState(1);
  const [s1, setS1] = useState(0.5);
  const [s2, setS2] = useState(0.3);
  const [s3, setS3] = useState(0.2);
  const [analyzerAngleDeg, setAnalyzerAngleDeg] = useState(0);
  const [retarderDeg, setRetarderDeg] = useState(0);

  const analyzerAngle = analyzerAngleDeg * Math.PI / 180;
  const retardance = retarderDeg * Math.PI / 180;

  // Normalize Stokes vector
  const norm = Math.sqrt(s1 * s1 + s2 * s2 + s3 * s3);
  const dop = norm / Math.max(s0, 1e-10);
  const s1n = s1 / Math.max(s0, 1e-10);
  const s2n = s2 / Math.max(s0, 1e-10);
  const s3n = s3 / Math.max(s0, 1e-10);

  // Polarization ellipse parameters
  const psi = 0.5 * Math.atan2(s2n, s1n); // orientation
  const chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, s3n / Math.max(dop, 1e-10)))); // ellipticity

  // Degree of linear/circular polarization
  const dolp = Math.sqrt(s1n * s1n + s2n * s2n);
  const docp = Math.abs(s3n);

  // Transmission through analyzer at angle θ
  // T = 0.5 * (S0 + S1*cos(2θ) + S2*sin(2θ))
  const transmission = 0.5 * (s0 + s1 * Math.cos(2 * analyzerAngle) + s2 * Math.sin(2 * analyzerAngle));

  // After retarder (rotate, apply phase, rotate back)
  // Simplified: S3 component affected by retardance
  const s3After = s3 * Math.cos(retardance) + Math.sqrt(Math.max(0, s1 * s1 + s2 * s2)) * Math.sin(retardance);

  const poincareData = useMemo(() => {
    // Wireframe sphere
    const phi = Array.from({ length: 50 }, (_, i) => (i / 50) * 2 * Math.PI);
    const theta = Array.from({ length: 25 }, (_, i) => (i / 24) * Math.PI - Math.PI / 2);

    const traces: any[] = [];

    // Latitude circles
    for (const t of [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4]) {
      const x = phi.map(p => Math.cos(t) * Math.cos(p));
      const y = phi.map(p => Math.cos(t) * Math.sin(p));
      const z = phi.map(p => Math.sin(t));
      traces.push({ x, y, z, type: "scatter3d" as const, mode: "lines" as const, line: { color: "#374151", width: 1 }, showlegend: false });
    }

    // Longitude circles
    for (const p of [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4]) {
      const x = theta.map(t => Math.cos(t) * Math.cos(p));
      const y = theta.map(t => Math.cos(t) * Math.sin(p));
      const z = theta.map(t => Math.sin(t));
      traces.push({ x, y, z, type: "scatter3d" as const, mode: "lines" as const, line: { color: "#374151", width: 1 }, showlegend: false });
    }

    // Current state
    traces.push({
      x: [s1n], y: [s2n], z: [s3n],
      type: "scatter3d" as const, mode: "markers" as const, name: "State",
      marker: { color: "#f87171", size: 10 },
    });

    // DOP sphere
    const u = Array.from({ length: 30 }, (_, i) => (i / 30) * 2 * Math.PI);
    const v = Array.from({ length: 15 }, (_, i) => (i / 14) * Math.PI);
    const surfX: number[][] = [];
    const surfY: number[][] = [];
    const surfZ: number[][] = [];
    for (let i = 0; i < v.length; i++) {
      surfX.push([]);
      surfY.push([]);
      surfZ.push([]);
      for (let j = 0; j < u.length; j++) {
        surfX[i].push(dop * Math.cos(v[i]) * Math.cos(u[j]));
        surfY[i].push(dop * Math.cos(v[i]) * Math.sin(u[j]));
        surfZ[i].push(dop * Math.sin(v[i]));
      }
    }
    traces.push({
      type: "surface" as const, x: surfX, y: surfY, z: surfZ,
      surfacecolor: surfZ, colorscale: [[0, "#1e3a5f"], [1, "#3b82f6"]],
      opacity: 0.2, showscale: false, name: "DOP sphere",
    });

    return traces;
  }, [s1n, s2n, s3n, dop]);

  const analyzerData = useMemo(() => {
    const angles = Array.from({ length: 180 }, (_, i) => (i / 180) * 180);
    const trans = angles.map(a => {
      const th = a * Math.PI / 180;
      return 0.5 * (s0 + s1 * Math.cos(2 * th) + s2 * Math.sin(2 * th));
    });
    return [
      { x: angles, y: trans, type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#60a5fa", width: 2 } },
      { x: [analyzerAngleDeg, analyzerAngleDeg], y: [0, Math.max(...trans)], type: "scatter" as const, mode: "lines" as const, name: "Analyzer", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [s0, s1, s2, analyzerAngleDeg]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Polarimetry Basics" description="Explore Stokes parameters, Poincaré sphere representation, and analyzer measurements for polarization state characterization.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">S = [S₀, S₁, S₂, S₃]ᵀ</p>
        <p className="text-gray-300 text-sm font-mono">DOP = √(S₁² + S₂² + S₃²) / S₀</p>
        <p className="text-gray-300 text-sm font-mono">ψ = ½atan2(S₂, S₁), χ = ½asin(S₃/|S|)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="S₀ (total intensity)" value={s0} onChange={setS0} step="0.1" />
        <ValidatedNumberInput label="S₁ (H−V)" value={s1} onChange={setS1} min={-1} max={1} step="0.1" />
        <ValidatedNumberInput label="S₂ (+45°−−45°)" value={s2} onChange={setS2} min={-1} max={1} step="0.1" />
        <ValidatedNumberInput label="S₃ (RCP−LCP)" value={s3} onChange={setS3} min={-1} max={1} step="0.1" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setS1(1); setS2(0); setS3(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">H linear</button>
        <button onClick={() => { setS1(0); setS2(1); setS3(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">+45° linear</button>
        <button onClick={() => { setS1(0.707); setS2(0); setS3(0.707); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Elliptical</button>
        <button onClick={() => { setS1(0); setS2(0); setS3(1); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">RCP</button>
        <button onClick={() => { setS1(0); setS2(0); setS3(-1); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">LCP</button>
        <button onClick={() => { setS1(0); setS2(0); setS3(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Unpolarized</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DOP</p>
          <p className="text-2xl font-bold text-blue-400">{(dop * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DOLP</p>
          <p className="text-2xl font-bold text-green-400">{(dolp * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DOCP</p>
          <p className="text-2xl font-bold text-yellow-400">{(docp * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Orientation ψ / Ellipticity χ</p>
          <p className="text-lg font-bold text-purple-400">{(psi * 180 / Math.PI).toFixed(1)}° / {(chi * 180 / Math.PI).toFixed(1)}°</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Poincaré Sphere</h3>
          <ChartPanel data={poincareData} layout={{
            paper_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            scene: {
              xaxis: { title: "S₁", gridcolor: "#374151", range: [-1.2, 1.2] },
              yaxis: { title: "S₂", gridcolor: "#374151", range: [-1.2, 1.2] },
              zaxis: { title: "S₃", gridcolor: "#374151", range: [-1.2, 1.2] },
            },
            margin: { t: 10, r: 10, b: 10, l: 10 },
            showlegend: false,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Analyzer Transmission</h3>
          <ChartPanel data={analyzerData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Analyzer Angle (°)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Stokes Vector</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div><p className="text-xs text-gray-500">S₀</p><p className="font-mono text-blue-400">{s0.toFixed(3)}</p></div>
          <div><p className="text-xs text-gray-500">S₁</p><p className="font-mono text-green-400">{s1.toFixed(3)}</p></div>
          <div><p className="text-xs text-gray-500">S₂</p><p className="font-mono text-yellow-400">{s2.toFixed(3)}</p></div>
          <div><p className="text-xs text-gray-500">S₃</p><p className="font-mono text-purple-400">{s3.toFixed(3)}</p></div>
        </div>
      </div>
    </CalculatorShell>
  );
}
