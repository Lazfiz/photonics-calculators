"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function TwoDimensionalSpectroscopyPage() {
  const [excitationCenter, setExcitationCenter] = useURLState("excitationCenter", 12500); // cm⁻¹
  const [coupling, setCoupling] = useURLState("coupling", 100); // cm⁻¹
  const [linewidth, setLinewidth] = useURLState("linewidth", 50); // cm⁻¹
  const [t2, setT2] = useURLState("t2", 200); // fs, dephasing time

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
        const crossAmp = Math.min(Math.abs(coupling) / 200, 1); // dimensionless, vanishes at coupling=0
        const cross1 = crossAmp * Math.exp(-((o1 - w1) ** 2 + (o3 - w2) ** 2) / (2 * linewidth * linewidth));
        const cross2 = crossAmp * Math.exp(-((o1 - w2) ** 2 + (o3 - w1) ** 2) / (2 * linewidth * linewidth));

        // Rephasing pathway lineshape (tilted ellipse for inhomogeneous broadening)
        // Anti-diagonal width set by homogeneous broadening (T₂), diagonal by inhomogeneous
        const tilt = coupling > 0 ? -0.3 : 0.3;
        const off1 = (o1 - w1) + tilt * (o3 - w1);
        const off2 = (o1 - w2) + tilt * (o3 - w2);
        const homW = Math.max(homogeneousWidth, 1); // avoid zero
        const diag1r = Math.exp(-(off1 ** 2) / (2 * homW * homW) - ((o3 - w1) / (1 + Math.abs(tilt))) ** 2 / (2 * linewidth * linewidth));
        const diag2r = Math.exp(-(off2 ** 2) / (2 * homW * homW) - ((o3 - w2) / (1 + Math.abs(tilt))) ** 2 / (2 * linewidth * linewidth));

        row.push(diag1 + diag2 + cross1 + cross2 + 0.5 * (diag1r + diag2r));
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
  const homogeneousWidth = dephasingRate / (Math.PI * 3e10); // cm⁻¹ FWHM = 1/(πT₂c)

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Two-Dimensional (2D) Spectroscopy" description="Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Excitation Center (cm⁻¹)" value={excitationCenter} onChange={setExcitationCenter} min={1000} max={30000} />
        <ValidatedNumberInput label="Coupling (cm⁻¹)" value={coupling} onChange={setCoupling} min={0} max={1000} />
        <ValidatedNumberInput label="Inhomogeneous Width (cm⁻¹)" value={linewidth} onChange={setLinewidth} min={1} max={500} />
        <ValidatedNumberInput label="Dephasing Time T₂ (fs)" value={t2} onChange={setT2} min={10} max={10000} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Pulse sequence:</span> k₁ − k₂ + k₃ (rephasing)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Response:</span> S(ω₁,t₂,ω₃) = FT₁,₃[R²(t₁,t₂,t₃)]</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Diagonal:</span> ω₁ = ω₃ → same state</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Cross-peaks:</span> ω₁ ≠ ω₃ → coupling / energy transfer</p>
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">Lineshape:</span> Elongated along diagonal = inhomogeneous; circular = homogeneous</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Computed Values</h3>
        <p className="text-sm text-gray-300"><span className="text-green-400">State 1:</span> {(excitationCenter - coupling / 2).toFixed(0)} cm⁻¹ ({(1e7 / (excitationCenter - coupling / 2)).toFixed(1)} nm)</p>
        <p className="text-sm text-gray-300"><span className="text-green-400">State 2:</span> {(excitationCenter + coupling / 2).toFixed(0)} cm⁻¹ ({(1e7 / (excitationCenter + coupling / 2)).toFixed(1)} nm)</p>
        <p className="text-sm text-gray-300"><span className="text-green-400">Homogeneous width:</span> {homogeneousWidth.toFixed(1)} cm⁻¹</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "2D Electronic Spectrum (Rephasing)", font: { color: "white" } },
          xaxis: { title: "Excitation ω₁ (cm⁻¹)", gridcolor: "#374151" },
          yaxis: { title: "Detection ω₃ (cm⁻¹)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
      </div>
    </CalculatorShell>
  );
}
