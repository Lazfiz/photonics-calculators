"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function OrthoconoscopicPage() {
  const [nO, setNO] = useURLState("nO", 1.658);
  const [nE, setNE] = useURLState("nE", 1.486);
  const [thickness, setThickness] = useURLState("thickness", 0.05); // mm
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [rotAngleDeg, setRotAngleDeg] = useURLState("rotAngleDeg", 0); // stage rotation
  const [polarizerAngleDeg, setPolarizerAngleDeg] = useURLState("polarizerAngleDeg", 0);

  const dn = Math.abs(nO - nE);
  const d = thickness;
  const lam = wavelength * 1e-6; // mm
  const rotRad = rotAngleDeg * Math.PI / 180;
  const polRad = polarizerAngleDeg * Math.PI / 180;

  // In orthoscopic (parallel polars or slightly uncrossed), we observe
  // the sample in transmitted light with plane-polarized illumination
  // Retardation: δ = 2π Δn d / λ (for normal incidence, optic axis perpendicular)
  const retardation = (2 * Math.PI * dn * d) / lam;
  const retWaves = retardation / (2 * Math.PI);

  // Transmission between crossed polars: I = sin²(2φ) sin²(δ/2)
  // φ = angle between crystal fast axis and polarizer
  const phi = (rotAngleDeg - polarizerAngleDeg) * Math.PI / 180;
  const intensityCrossed = Math.sin(2 * phi) ** 2 * Math.sin(retardation / 2) ** 2;

  // Transmission between parallel polars: I = 1 - sin²(2φ) sin²(δ/2)
  const intensityParallel = 1 - Math.sin(2 * phi) ** 2 * Math.sin(retardation / 2) ** 2;

  // Extinction position: when φ = 0° or 90° (every 45° rotation for uniaxial)
  const isExtinction = Math.abs(Math.sin(2 * phi)) < 0.05;

  // Interference color estimation (simplified Michel-Lévy)
  const getColor = (waves: number): string => {
    const w = waves % 1;
    if (w < 0.05 || w > 0.95) return "#1a1a2e"; // near-zero: black
    if (w < 0.15) return "#4a90d9"; // first order blue
    if (w < 0.25) return "#e8e8e8"; // white
    if (w < 0.35) return "#f0c040"; // yellow
    if (w < 0.45) return "#ff6b35"; // orange
    if (w < 0.55) return "#d94040"; // red
    if (w < 0.65) return "#8b40d9"; // violet (2nd order)
    if (w < 0.75) return "#40b0d9"; // blue
    if (w < 0.85) return "#40d980"; // green
    return "#f0c040"; // yellow (higher order)
  };

  const rotationData = useMemo(() => {
    const angles = Array.from({ length: 360 }, (_, i) => i);
    const Icrossed = angles.map(a => {
      const p = (a - polarizerAngleDeg) * Math.PI / 180;
      return Math.sin(2 * p) ** 2 * Math.sin(retardation / 2) ** 2;
    });
    const Iparallel = angles.map(a => {
      const p = (a - polarizerAngleDeg) * Math.PI / 180;
      return 1 - Math.sin(2 * p) ** 2 * Math.sin(retardation / 2) ** 2;
    });
    return [
      { x: angles, y: Icrossed, type: "scatter" as const, mode: "lines" as const, name: "Crossed polars", line: { color: "#60a5fa", width: 2 } },
      { x: angles, y: Iparallel, type: "scatter" as const, mode: "lines" as const, name: "Parallel polars", line: { color: "#f87171", width: 2 } },
    ];
  }, [retardation, polarizerAngleDeg]);

  const thicknessData = useMemo(() => {
    const ths = Array.from({ length: 300 }, (_, i) => (i / 300) * 0.2);
    const rets = ths.map(t => (2 * Math.PI * dn * t) / lam / (2 * Math.PI));
    return [
      { x: ths.map(t => t * 1000), y: rets, type: "scatter" as const, mode: "lines" as const, name: "Retardation (waves)", line: { color: "#a78bfa", width: 2 } },
    ];
  }, [dn, lam]);

  // Rotating stage animation data
  const stageData = useMemo(() => {
    const angles = Array.from({ length: 72 }, (_, i) => i * 5);
    const sin2phi = angles.map(a => Math.sin(2 * (a - polarizerAngleDeg) * Math.PI / 180) ** 2);
    return [
      { x: angles, y: sin2phi, type: "scatter" as const, mode: "lines+markers" as const, name: "sin²(2φ)", line: { color: "#34d399", width: 2 }, marker: { size: 4 } },
      { x: [rotAngleDeg, rotAngleDeg], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "Current", line: { color: "#fbbf24", dash: "dash", width: 2 } },
    ];
  }, [polarizerAngleDeg, rotAngleDeg]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Orthoscopic Observation" description="Model orthoscopic observation of birefringent samples with rotating stage. Calculate intensity vs rotation angle and interference colors.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">I<sub>crossed</sub> = sin²(2φ) · sin²(δ/2), I<sub>parallel</sub> = 1 - sin²(2φ) · sin²(δ/2)</p>
        <p className="text-gray-300 text-sm font-mono">δ = 2π Δn d / λ, φ = angle between fast axis and polarizer</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>o</sub></span>
          <input type="number" value={nO} onChange={e => setNO(+e.target.value)} step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>e</sub></span>
          <input type="number" value={nE} onChange={e => setNE(+e.target.value)} step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <ValidatedNumberInput label="Thickness (mm)" value={thickness} onChange={setThickness} min={0.001} max={1} step="0.01" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={700} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Stage Rotation (°)" value={rotAngleDeg} onChange={setRotAngleDeg} min={0} max={360} step="5" />
        <ValidatedNumberInput label="Polarizer Angle (°)" value={polarizerAngleDeg} onChange={setPolarizerAngleDeg} min={0} max={90} step="5" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNO(1.658); setNE(1.486); setThickness(0.03); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Calcite thin</button>
        <button onClick={() => { setNO(1.544); setNE(1.553); setThickness(0.05); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Quartz</button>
        <button onClick={() => { setNO(1.973); setNE(2.165); setThickness(0.01); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Rutile</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retardation</p>
          <p className="text-2xl font-bold text-blue-400">{retWaves.toFixed(2)} λ</p>
          <p className="text-xs text-gray-500">{retardation.toFixed(1)} rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">I crossed polars</p>
          <p className="text-2xl font-bold text-green-400">{(intensityCrossed * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">I parallel polars</p>
          <p className="text-2xl font-bold text-yellow-400">{(intensityParallel * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Status</p>
          <p className={`text-2xl font-bold ${isExtinction ? "text-red-400" : "text-purple-400"}`}>{isExtinction ? "EXTINCTION" : "Bright"}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Interference Color:</span>
          <div className="w-12 h-12 rounded-lg border border-gray-700" />
          <span className="text-sm text-gray-300">Order: {Math.floor(retWaves) + 1}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Intensity vs Stage Rotation</h3>
          <ChartPanel data={rotationData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Stage Rotation (°)", gridcolor: "#374151" },
            yaxis: { title: "Intensity", gridcolor: "#374151", range: [-0.05, 1.05] },
            margin: { t: 20, r: 20, b: 50, l: 50 }, height: 300,
          }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">sin²(2φ) Orientation Factor</h3>
          <ChartPanel data={stageData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Rotation (°)", gridcolor: "#374151" },
            yaxis: { title: "sin²(2φ)", gridcolor: "#374151", range: [-0.05, 1.05] },
            margin: { t: 20, r: 20, b: 50, l: 50 }, height: 300,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Retardation vs Thickness</h3>
        <ChartPanel data={thicknessData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Thickness (μm)", gridcolor: "#374151" },
          yaxis: { title: "Retardation (waves)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 50 },
        }} />
      </div>
    </CalculatorShell>
  );
}
