"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function TwoDimensionalSpectroscopyPage() {
  const [excitationCenter, setExcitationCenter] = useState(12500); // cm⁻¹
  const [coupling, setCoupling] = useState(100); // cm⁻¹
  const [linewidth, setLinewidth] = useState(50); // cm⁻¹
  const [t2, setT2] = useState(200); // fs, dephasing time

  const chartData = useMemo(() => {
    const N = 100;
    const range = 3000;
    const omega1 = Array.from({ length: N }, (_, i) => excitationCenter - range / 2 + (i / N) * range);
    const omega3 = omega1.slice();

    // Two-state system with coupling
    const w1 = excitationCenter - coupling / 2;
    const w2 = excitationCenter + coupling / 2;

    // Build 2D spectrum (real part of rephasing pathway)
    const z: number[][] = [];
    for (let j = 0; j < N; j++) {
      const row: number[] = [];
      for (let i = 0; i < N; i++) {
        const o1 = omega1[i];
        const o3 = omega3[j];

        // Diagonal peaks (ground state bleach + stimulated emission)
        const diag1 = Math.exp(-((o1 - w1) ** 2 + (o3 - w1) ** 2) / (2 * linewidth * linewidth));
        const diag2 = Math.exp(-((o1 - w2) ** 2 + (o3 - w2) ** 2) / (2 * linewidth * linewidth));

        // Cross peaks (energy transfer / coupling signature)
        const cross1 = 0.5 * Math.exp(-((o1 - w1) ** 2 + (o3 - w2) ** 2) / (2 * linewidth * linewidth));
        const cross2 = 0.5 * Math.exp(-((o1 - w2) ** 2 + (o3 - w1) ** 2) / (2 * linewidth * linewidth));

        // Rephasing pathway lineshape (tilted ellipse)
        const tilt = coupling > 0 ? -0.3 : 0.3;
        const off1 = (o1 - w1) + tilt * (o3 - w1);
        const off2 = (o1 - w2) + tilt * (o3 - w2);

        row.push(diag1 + diag2 + cross1 + cross2);
      }
      z.push(row);
    }

    return [{
      x: omega1, y: omega3, z, type: "heatmap" as const,
      colorscale: [[0, "#000033"], [0.25, "#0000aa"], [0.5, "#00aaff"], [0.75, "#ffaa00"], [1, "#ff3333"]],
      name: "2D Spectrum",
    }];
  }, [excitationCenter, coupling, linewidth, t2]);

  const dephasingRate = 1 / (t2 * 1e-15); // s⁻¹
  const homogeneousWidth = dephasingRate / (2 * Math.PI * 3e10); // cm⁻¹

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Two-Dimensional (2D) Spectroscopy</h1>
      <p className="text-gray-400 mb-8">Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Excitation Center (cm⁻¹)</span>
          <input type="number" value={excitationCenter} onChange={e => setExcitationCenter(+e.target.value)} min={1000} max={30000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Coupling (cm⁻¹)</span>
          <input type="number" value={coupling} onChange={e => setCoupling(+e.target.value)} min={0} max={1000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Inhomogeneous Width (cm⁻¹)</span>
          <input type="number" value={linewidth} onChange={e => setLinewidth(+e.target.value)} min={1} max={500}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dephasing Time T₂ (fs)</span>
          <input type="number" value={t2} onChange={e => setT2(+e.target.value)} min={10} max={10000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Pulse sequence:</span> k₁ − k₂ + k₃ (rephasing)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Response:</span> S(ω₁,t₂,ω₃) = FT₁,₃[R²(t₁,t₂,t₃)]</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Diagonal:</span> ω₁ = ω₃ → same state</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Cross-peaks:</span> ω₁ ≠ ω₃ → coupling / energy transfer</p>
        <p className="text-gray-300 text-sm"><span className="text-blue-400 font-mono">Lineshape:</span> Elongated along diagonal = inhomogeneous; circular = homogeneous</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Computed Values</h3>
        <p className="text-gray-300 text-sm"><span className="text-green-400">State 1:</span> {(excitationCenter - coupling / 2).toFixed(0)} cm⁻¹ ({(1e7 / (excitationCenter - coupling / 2)).toFixed(1)} nm)</p>
        <p className="text-gray-300 text-sm"><span className="text-green-400">State 2:</span> {(excitationCenter + coupling / 2).toFixed(0)} cm⁻¹ ({(1e7 / (excitationCenter + coupling / 2)).toFixed(1)} nm)</p>
        <p className="text-gray-300 text-sm"><span className="text-green-400">Homogeneous width:</span> {homogeneousWidth.toFixed(1)} cm⁻¹</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "2D Electronic Spectrum (Rephasing)", font: { color: "white" } },
          xaxis: { title: "Excitation ω₁ (cm⁻¹)", gridcolor: "#374151" },
          yaxis: { title: "Detection ω₃ (cm⁻¹)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} config={{ responsive: true }} />
      </div>
    </div>
  );
}
