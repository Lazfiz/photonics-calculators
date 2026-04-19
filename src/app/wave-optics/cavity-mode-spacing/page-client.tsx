"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function CavityModeSpacingPage() {
  const [cavityLength, setCavityLength] = useURLState("cavityLength", 150); // mm
  const [n, setN] = useURLState("n", 1.0); // refractive index inside cavity
  const [R1, setR1] = useURLState("R1", 100); // mm, mirror 1 ROC
  const [R2, setR2] = useURLState("R2", 100); // mm, mirror 2 ROC
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm

  const c = 3e11; // mm/s
  const L = cavityLength * n; // optical length (for FSR)
  const fSR = c / (2 * L); // free spectral range in Hz
  const fSRGHz = fSR / 1e9;
  const lambdaFSR = wavelength * wavelength / (2 * n * cavityLength * 1e6); // nm, wavelength FSR

  // Gouy phase and transverse mode spacing
  // g-parameters use physical cavity length, NOT optical length
  const g1 = 1 - cavityLength / R1;
  const g2 = 1 - cavityLength / R2;
  const gParam = g1 * g2;
  const isStable = gParam >= 0 && gParam <= 1;

  // Round-trip Gouy phase: ζ = 2·arccos(√(g₁g₂)) — Siegman, Lasers (1986)
  const gouyRT = isStable ? 2 * Math.acos(Math.sqrt(gParam)) : 0;

  // Transverse mode spacing: Δf_T = FSR · ζ/(2π)
  const transverseSpacingGHz = isStable ? fSRGHz * gouyRT / (2 * Math.PI) : 0;

  // Mode spectrum
  const chartData = useMemo(() => {
    const maxFreq = fSRGHz * 6;
    const modes: { x: number; y: number; label: string }[] = [];

    for (let q = 0; q < 7; q++) {
      // TEM₀₀ frequency includes fundamental Gouy offset: (m+n+1)·ζ/(2π)
      const gouyOffset = transverseSpacingGHz; // (0+0+1)·ζ/(2π)·FSR
      const nu00 = q * fSRGHz + gouyOffset;
      modes.push({ x: nu00, y: 1, label: `TEM₀₀ q=${q}` });

      // Higher order transverse modes: (m+n+1)·ζ/(2π)·FSR
      for (let m = 1; m <= 4; m++) {
        const nuT = q * fSRGHz + (m + 1) * transverseSpacingGHz;
        if (nuT < maxFreq) {
          modes.push({ x: nuT, y: 1 / (m + 1), label: `TEM₀${m}` });
        }
        for (let n = 1; n <= 2; n++) {
          const nuT2 = q * fSRGHz + (m + n + 1) * transverseSpacingGHz;
          if (nuT2 < maxFreq) {
            modes.push({ x: nuT2, y: 0.5 / (m + n + 1), label: `TEM${m}${n}` });
          }
        }
      }
    }

    return [{
      x: modes.map(m => m.x),
      y: modes.map(m => m.y),
      text: modes.map(m => m.label),
      type: "scatter" as const,
      mode: "markers+text" as const,
      textposition: "top" as const,
      textfont: { size: 8, color: "#9ca3af" },
      marker: { color: "#60a5fa", size: 8 },
      name: "Cavity modes",
    }];
  }, [fSRGHz, transverseSpacingGHz]);

  // Stability diagram
  const stabData = useMemo(() => {
    const gs = Array.from({ length: 100 }, (_, i) => -1.5 + i * 3 / 100);
    const g2s = Array.from({ length: 100 }, (_, i) => -1.5 + i * 3 / 100);
    const x: number[] = [], y: number[] = [];
    for (const g1v of gs) {
      for (const g2v of g2s) {
        if (g1v * g2v >= 0 && g1v * g2v <= 1) {
          x.push(g1v);
          y.push(g2v);
        }
      }
    }
    return [{ x, y, type: "scatter" as const, mode: "markers" as const, marker: { color: "#22c55e44", size: 4 }, showlegend: false, name: "Stable" }];
  }, []);

  const layout1 = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Frequency (GHz)", gridcolor: "#374151" },
    yaxis: { title: "Relative intensity", gridcolor: "#374151", range: [0, 1.3] },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const layout2 = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "g₁", gridcolor: "#374151", range: [-1.5, 1.5] },
    yaxis: { title: "g₂", gridcolor: "#374151", range: [-1.5, 1.5], scaleanchor: "x" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
    shapes: [
      // Stability boundaries: g₁g₂ = 0 (axes) and g₁g₂ = 1 (hyperbolas)
      { type: "line" as const, xref: "x", yref: "y", x0: -1.5, y0: 0, x1: 1.5, y1: 0, line: { color: "#60a5fa44", width: 1 } },
      { type: "line" as const, xref: "x", yref: "y", x0: 0, y0: -1.5, x1: 0, y1: 1.5, line: { color: "#60a5fa44", width: 1 } },
    ],
  };

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Cavity Mode Spacing" description="Axial and transverse mode structure of optical resonators.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">FSR</span> = c / (2nL)</p>
        <p><span className="text-blue-400">g₁</span> = 1 − L/R₁, <span className="text-blue-400">g₂</span> = 1 − L/R₂</p>
        <p><span className="text-blue-400">ν<sub>mnq</sub></span> = (q + (m+n+1)·ζ/2π)·FSR</p>
        <p><span className="text-blue-400">Stability:</span> 0 ≤ g₁g₂ ≤ 1</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Cavity Length (mm)" value={cavityLength} onChange={setCavityLength} />
        <ValidatedNumberInput label="Refractive Index n" value={n} onChange={setN} step="0.01" />
        <ValidatedNumberInput label="R₁ (mm, ∞=flat)" value={R1} onChange={setR1} />
        <ValidatedNumberInput label="R₂ (mm, ∞=flat)" value={R2} onChange={setR2} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Free Spectral Range</p>
          <p className="text-xl font-bold text-blue-400">{fSRGHz.toFixed(3)} GHz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Wavelength FSR</p>
          <p className="text-xl font-bold text-green-400">{lambdaFSR.toFixed(4)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transverse Spacing</p>
          <p className="text-xl font-bold text-orange-400">{transverseSpacingGHz.toFixed(3)} GHz</p>
        </div>
        <div className={`bg-gray-900 border rounded-lg p-4 ${isStable ? "border-green-800" : "border-red-800"}`}>
          <p className="text-sm text-gray-400">Stability (g₁g₂ = {gParam.toFixed(3)})</p>
          <p className={`text-xl font-bold ${isStable ? "text-green-400" : "text-red-400"}`}>{isStable ? "✓ Stable" : "✗ Unstable"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Mode Spectrum</h3>
          <ChartPanel data={chartData} layout={layout1} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Stability Diagram</h3>
          <ChartPanel data={[...stabData, { x: [g1], y: [g2], type: "scatter" as const, mode: "markers" as const, marker: { color: "#f87171", size: 12 }, name: "This cavity" }]} layout={layout2} />
        </div>
      </div>
    </CalculatorShell>
  );
}
