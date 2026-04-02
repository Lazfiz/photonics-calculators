"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function RetarderPage() {
  const [retardanceDeg, setRetardanceDeg] = useState(90);
  const [fastAxisDeg, setFastAxisDeg] = useState(0);
  const [inputPolDeg, setInputPolDeg] = useState(45);

  const retardanceRad = retardanceDeg * Math.PI / 180;
  const fastAxisRad = fastAxisDeg * Math.PI / 180;
  const inputPolRad = inputPolDeg * Math.PI / 180;

  // Input Jones vector (linear polarization)
  const inputEx = Math.cos(inputPolRad);
  const inputEy = Math.sin(inputPolRad);

  // Rotate to fast axis frame, apply retardance, rotate back
  const cosA = Math.cos(fastAxisRad);
  const sinA = Math.sin(fastAxisRad);
  
  // In fast-axis frame
  const u = inputEx * cosA + inputEy * sinA;
  const v = -inputEx * sinA + inputEy * cosA;
  
  // Apply retardance (phase on slow axis)
  const uOut = u;
  const vOut = v * Math.cos(retardanceRad) + v * 1j * Math.sin(retardanceRad);
  
  // Rotate back
  const outputEx = uOut * cosA - vOut * sinA;
  const outputEy = uOut * sinA + vOut * cosA;

  // Calculate output parameters
  const intensity = Math.abs(outputEx) ** 2 + Math.abs(outputEy) ** 2;
  
  // Stokes parameters from Jones
  const S0 = Math.abs(outputEx) ** 2 + Math.abs(outputEy) ** 2;
  const S1 = Math.abs(outputEx) ** 2 - Math.abs(outputEy) ** 2;
  const S2 = 2 * (outputEx.real * outputEy.real + outputEx.imag * outputEy.imag);
  const S3 = 2 * (outputEx.real * outputEy.imag - outputEx.imag * outputEy.real);

  // DOP and ellipticity
  const dop = Math.sqrt(S1 * S1 + S2 * S2 + S3 * S3) / Math.max(S0, 1e-10);
  const ellipticityAngle = 0.5 * Math.asin(S3 / Math.max(S0, 1e-10));
  const orientationAngle = 0.5 * Math.atan2(S2, S1);

  // Simplified calculation using real arithmetic
  const phase = retardanceRad;
  const c = Math.cos(fastAxisRad);
  const s = Math.sin(fastAxisRad);
  const ci = Math.cos(inputPolRad);
  const si = Math.sin(inputPolRad);
  
  // Output field components (real calculation for visualization)
  const Ex_re = ci * (c * c + s * s * Math.cos(phase)) + si * c * s * (1 - Math.cos(phase));
  const Ex_im = si * s * s * Math.sin(phase) - ci * c * s * Math.sin(phase);
  const Ey_re = si * (s * s + c * c * Math.cos(phase)) + ci * c * s * (1 - Math.cos(phase));
  const Ey_im = -si * c * s * Math.sin(phase) + ci * c * c * Math.sin(phase);

  const chartData = useMemo(() => {
    const t = Array.from({ length: 200 }, (_, i) => (i / 200) * 2 * Math.PI);
    
    // Input ellipse
    const inX = t.map(tt => ci * Math.cos(tt));
    const inY = t.map(tt => si * Math.cos(tt));
    
    // Output ellipse
    const outX = t.map(tt => Ex_re * Math.cos(tt) - Ex_im * Math.sin(tt));
    const outY = t.map(tt => Ey_re * Math.cos(tt) - Ey_im * Math.sin(tt));
    
    return [
      { x: inX, y: inY, type: "scatter" as const, mode: "lines" as const, name: "Input", line: { color: "#60a5fa", dash: "dash" } },
      { x: outX, y: outY, type: "scatter" as const, mode: "lines" as const, name: "Output", line: { color: "#f87171", width: 2 } },
    ];
  }, [ci, si, Ex_re, Ex_im, Ey_re, Ey_im]);

  const poincareData = useMemo(() => {
    // Poincaré sphere representation
    const S1n = S1 / Math.max(S0, 1e-10);
    const S2n = S2 / Math.max(S0, 1e-10);
    const S3n = S3 / Math.max(S0, 1e-10);
    
    // Input state (linear at inputPolDeg)
    const S1_in = Math.cos(2 * inputPolRad);
    const S2_in = Math.sin(2 * inputPolRad);
    const S3_in = 0;
    
    // Circle on Poincaré sphere showing rotation path
    const pathT = Array.from({ length: 100 }, (_, i) => (i / 100) * 2 * Math.PI);
    const pathS1 = pathT.map(t => Math.cos(2 * fastAxisRad) * S1_in + Math.sin(2 * fastAxisRad) * (S2_in * Math.cos(t) - S3_in * Math.sin(t)));
    const pathS2 = pathT.map(t => -Math.sin(2 * fastAxisRad) * S1_in + Math.cos(2 * fastAxisRad) * (S2_in * Math.cos(t) - S3_in * Math.sin(t)));
    const pathS3 = pathT.map(t => S2_in * Math.sin(t) + S3_in * Math.cos(t));
    
    return [
      { x: pathS1, y: pathS2, z: pathS3, type: "scatter3d" as const, mode: "lines" as const, name: "Rotation Path", line: { color: "#6b7280", width: 2 } },
      { x: [S1_in], y: [S2_in], z: [S3_in], type: "scatter3d" as const, mode: "markers" as const, name: "Input", marker: { color: "#60a5fa", size: 8 } },
      { x: [S1n], y: [S2n], z: [S3n], type: "scatter3d" as const, mode: "markers" as const, name: "Output", marker: { color: "#f87171", size: 10 } },
    ];
  }, [S0, S1, S2, S3, inputPolRad, fastAxisRad]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Retarder Design Calculator</h1>
      <p className="text-gray-400 mb-8">Design waveplate retarders and visualize polarization transformation on the Poincaré sphere.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">J_retarder(δ, α) = R(-α) · [[1, 0], [0, e^(iδ)]] · R(α)</p>
        <p className="text-gray-500 text-xs mt-1">δ = retardance, α = fast axis angle</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Retardance (°)</span>
          <input type="number" value={retardanceDeg} onChange={e => setRetardanceDeg(+e.target.value)} min={0} max={360} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Fast Axis Angle (°)</span>
          <input type="number" value={fastAxisDeg} onChange={e => setFastAxisDeg(+e.target.value)} min={0} max={180} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Input Polarization (°)</span>
          <input type="number" value={inputPolDeg} onChange={e => setInputPolDeg(+e.target.value)} min={0} max={180} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setRetardanceDeg(90)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Quarter-Wave (90°)</button>
        <button onClick={() => setRetardanceDeg(180)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Half-Wave (180°)</button>
        <button onClick={() => setRetardanceDeg(360)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Full-Wave (360°)</button>
        <button onClick={() => { setRetardanceDeg(90); setFastAxisDeg(45); setInputPolDeg(0); }} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">H → RCP</button>
        <button onClick={() => { setRetardanceDeg(180); setFastAxisDeg(22.5); setInputPolDeg(0); }} className="text-xs bg-green-900 hover:bg-green-800 border border-green-700 rounded px-2 py-1 text-green-300">H → 45°</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Intensity</p>
          <p className="text-2xl font-bold text-blue-400">{intensity.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DOP</p>
          <p className="text-2xl font-bold text-green-400">{(dop * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ellipticity</p>
          <p className="text-2xl font-bold text-yellow-400">{(ellipticityAngle * 180 / Math.PI).toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Orientation</p>
          <p className="text-2xl font-bold text-purple-400">{(orientationAngle * 180 / Math.PI).toFixed(1)}°</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Polarization Ellipse</h3>
          <Plot data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Ex", gridcolor: "#374151", scaleanchor: "y", scaleratio: 1 },
            yaxis: { title: "Ey", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 50 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Poincaré Sphere</h3>
          <Plot data={poincareData} layout={{
            paper_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            scene: {
              xaxis: { title: "S₁", gridcolor: "#374151", range: [-1.2, 1.2] },
              yaxis: { title: "S₂", gridcolor: "#374151", range: [-1.2, 1.2] },
              zaxis: { title: "S₃", gridcolor: "#374151", range: [-1.2, 1.2] },
            },
            margin: { t: 20, r: 20, b: 40, l: 50 },
            showlegend: false,
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Output Stokes Vector</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div><p className="text-xs text-gray-500">S₀</p><p className="font-mono text-blue-400">{S0.toFixed(4)}</p></div>
          <div><p className="text-xs text-gray-500">S₁</p><p className="font-mono text-green-400">{S1.toFixed(4)}</p></div>
          <div><p className="text-xs text-gray-500">S₂</p><p className="font-mono text-yellow-400">{S2.toFixed(4)}</p></div>
          <div><p className="text-xs text-gray-500">S₃</p><p className="font-mono text-purple-400">{S3.toFixed(4)}</p></div>
        </div>
      </div>
    </div>
  );
}
