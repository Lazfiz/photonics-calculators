"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PoincareSpherePage() {
  const [thetaDeg, setThetaDeg] = useState(45);
  const [chiDeg, setChiDeg] = useState(15);
  const [amplitude, setAmplitude] = useState(1);

  const stokes = useMemo(() => {
    const psi = (thetaDeg * Math.PI) / 180;
    const chi = (chiDeg * Math.PI) / 180;
    const I = amplitude * amplitude;
    const Q = I * Math.cos(2 * chi) * Math.cos(2 * psi);
    const U = I * Math.cos(2 * chi) * Math.sin(2 * psi);
    const V = I * Math.sin(2 * chi);
    const s1 = Q / I, s2 = U / I, s3 = V / I;
    return { I, Q, U, V, s1, s2, s3 };
  }, [thetaDeg, chiDeg, amplitude]);

  const tracePath = useMemo(() => {
    // Great circle path from H-polarized to current state
    const n = 50;
    const s1 = stokes.s1, s2 = stokes.s2, s3 = stokes.s3;
    const x: number[] = [], y: number[] = [], z: number[] = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.acos(Math.min(1, s1)); // angle from (1,0,0)
      x.push(Math.cos(t));
      y.push(s2 / Math.sqrt(s2 * s2 + s3 * s3 + 1e-12) * Math.sin(t));
      z.push(s3 / Math.sqrt(s2 * s2 + s3 * s3 + 1e-12) * Math.sin(t));
    }
    return { x, y, z };
  }, [stokes]);

  const wireframe = useMemo(() => {
    const phi = Array.from({ length: 37 }, (_, i) => (i * 10 * Math.PI) / 180);
    const theta = Array.from({ length: 19 }, (_, i) => (i * 10 * Math.PI) / 180);
    return {
      lon: theta.map((t) => ({ x: phi.map((p) => Math.cos(t) * Math.cos(p)), y: phi.map((p) => Math.cos(t) * Math.sin(p)), z: phi.map((p) => Math.sin(t)) })),
      lat: phi.filter((_, i) => i % 3 === 0).map((p) => ({ x: theta.map((t) => Math.cos(t) * Math.cos(p)), y: theta.map((t) => Math.cos(t) * Math.sin(p)), z: theta.map((t) => Math.sin(t)) })),
    };
  }, []);

  // Jones vector
  const jones = useMemo(() => {
    const psi = (thetaDeg * Math.PI) / 180;
    const chi = (chiDeg * Math.PI) / 180;
    return {
      ex: amplitude * Math.cos(psi) * Math.cos(chi) - 0 * amplitude * Math.sin(psi) * Math.sin(chi),
      ey: amplitude * Math.sin(psi) * Math.cos(chi) + 0 * amplitude * Math.cos(psi) * Math.sin(chi),
    };
  }, [thetaDeg, chiDeg, amplitude]);

  // Ellipse trace for polarization ellipse
  const ellipseTrace = useMemo(() => {
    const t = Array.from({ length: 101 }, (_, i) => (2 * Math.PI * i) / 100);
    const psi = (thetaDeg * Math.PI) / 180;
    const chi = (chiDeg * Math.PI) / 180;
    const a = amplitude * Math.cos(chi);
    const b = amplitude * Math.sin(chi);
    const x = t.map((ti) => a * Math.cos(ti) * Math.cos(psi) - b * Math.sin(ti) * Math.sin(psi));
    const y = t.map((ti) => a * Math.cos(ti) * Math.sin(psi) + b * Math.sin(ti) * Math.cos(psi));
    return { x, y };
  }, [thetaDeg, chiDeg, amplitude]);

  const dop = Math.sqrt(stokes.s1 ** 2 + stokes.s2 ** 2 + stokes.s3 ** 2);
  const handedness = stokes.V > 0 ? "Right Circular" : stokes.V < 0 ? "Left Circular" : "Linear";

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:underline mb-6 inline-block">← Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Poincaré Sphere</h1>
      <p className="text-gray-400 mb-6">Interactive visualization of polarization states on the Poincaré sphere.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Polarization Parameters</h2>
          {[
            { label: "Orientation angle θ (°)", val: thetaDeg, set: setThetaDeg, min: 0, max: 180 },
            { label: "Ellipticity angle χ (°)", val: chiDeg, set: setChiDeg, min: -45, max: 45 },
            { label: "Amplitude", val: amplitude, set: setAmplitude, min: 0.01, max: 5 },
          ].map(({ label, val, set, min, max }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step="1" min={min} max={max} value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
              <input type="range" min={min} max={max} step="1" value={val} onChange={(e) => set(parseFloat(e.target.value))}
                className="w-full mt-1" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Stokes Vector</h2>
          <div className="space-y-3">
            <ResultRow label="I" value={stokes.I.toFixed(4)} />
            <ResultRow label="Q (S₁)" value={stokes.Q.toFixed(4)} />
            <ResultRow label="U (S₂)" value={stokes.U.toFixed(4)} />
            <ResultRow label="V (S₃)" value={stokes.V.toFixed(4)} />
            <ResultRow label="DOP" value={dop.toFixed(4)} />
            <ResultRow label="Handedness" value={handedness} />
            <ResultRow label="Jones Ex" value={`${jones.ex.toFixed(3)}`} />
            <ResultRow label="Jones Ey" value={`${jones.ey.toFixed(3)}`} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Poincaré Sphere</h2>
          <Plot
            data={[
              ...wireframe.lon.map((l) => ({ type: "scatter3d" as const, mode: "lines" as const, x: l.x, y: l.y, z: l.z, line: { color: "#374151", width: 1 }, showlegend: false, hoverinfo: "skip" })),
              ...wireframe.lat.map((l) => ({ type: "scatter3d" as const, mode: "lines" as const, x: l.x, y: l.y, z: l.z, line: { color: "#374151", width: 1 }, showlegend: false, hoverinfo: "skip" })),
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [1], y: [0], z: [0], text: ["H"], textposition: "top center", marker: { size: 4, color: "#f59e0b" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [-1], y: [0], z: [0], text: ["V"], textposition: "top center", marker: { size: 4, color: "#f59e0b" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [0], y: [1], z: [0], text: ["45°"], textposition: "top center", marker: { size: 4, color: "#f59e0b" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [0], y: [-1], z: [0], text: ["135°"], textposition: "top center", marker: { size: 4, color: "#f59e0b" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [0], y: [0], z: [1], text: ["RCP"], textposition: "top center", marker: { size: 4, color: "#22c55e" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "markers+text" as const, x: [0], y: [0], z: [-1], text: ["LCP"], textposition: "top center", marker: { size: 4, color: "#ef4444" }, showlegend: false, hoverinfo: "skip" },
              { type: "scatter3d" as const, mode: "lines" as const, x: tracePath.x, y: tracePath.y, z: tracePath.z, line: { color: "#3b82f6", width: 2 }, name: "Path from H", showlegend: true },
              { type: "scatter3d" as const, mode: "markers" as const, x: [stokes.s1], y: [stokes.s2], z: [stokes.s3], marker: { size: 12, color: "#3b82f6", symbol: "circle" }, name: "Current state" },
            ]}
            layout={{
              scene: { xaxis: { title: "S₁/Q", range: [-1.3, 1.3], color: "#9ca3af" }, yaxis: { title: "S₂/U", range: [-1.3, 1.3], color: "#9ca3af" }, zaxis: { title: "S₃/V", range: [-1.3, 1.3], color: "#9ca3af" }, bgcolor: "#111827" },
              margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: "#111827", font: { color: "#d1d5db" },
              showlegend: true, legend: { x: 0, y: 1, bgcolor: "rgba(0,0,0,0)" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "500px" }}
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Polarization Ellipse</h2>
          <Plot
            data={[{ type: "scatter" as const, mode: "lines" as const, x: ellipseTrace.x, y: ellipseTrace.y, line: { color: "#3b82f6", width: 2 } }]}
            layout={{
              xaxis: { title: "Ex", range: [-amplitude * 1.2, amplitude * 1.2], color: "#9ca3af", gridcolor: "#374151", zerolinecolor: "#4b5563" },
              yaxis: { title: "Ey", range: [-amplitude * 1.2, amplitude * 1.2], color: "#9ca3af", gridcolor: "#374151", zerolinecolor: "#4b5563", scaleanchor: "x" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "350px" }}
          />
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
