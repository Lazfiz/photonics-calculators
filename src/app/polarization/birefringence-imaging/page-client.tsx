"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function BirefringenceImagingPage() {
  const [wavelength, setWavelength] = useState(550);
  const [nO, setNO] = useState(1.658);
  const [nE, setNE] = useState(1.486);
  const [thickness, setThickness] = useState(0.05); // mm
  const [polarizerAngleDeg, setPolarizerAngleDeg] = useState(0);
  const [analyzerAngleDeg, setAnalyzerAngleDeg] = useState(90); // crossed by default
  const [compensator, setCompensator] = useState<"none" | "lambda/4" | "lambda" | "sensitive">("none");

  const dn = Math.abs(nO - nE);
  const d = thickness;
  const lam = wavelength * 1e-6; // mm
  const polRad = polarizerAngleDeg * Math.PI / 180;
  const anaRad = analyzerAngleDeg * Math.PI / 180;

  // Sample retardation
  const delta = (2 * Math.PI * dn * d) / lam;
  const deltaWaves = delta / (2 * Math.PI);

  // Compensator retardation
  const compensatorRet = compensator === "none" ? 0 :
    compensator === "lambda/4" ? Math.PI / 2 :
    compensator === "lambda" ? 2 * Math.PI : 0.02 * Math.PI; // ~3.6° for sensitive

  // Total retardation
  const totalDelta = delta + compensatorRet;

  // Transmission with arbitrary analyzer angle
  // I = sin²(α - β) cos²(δ/2) + sin²(δ/2) cos²(2φ + α - β)
  // Simplified: I = sin²(α - β) when δ = 0, I varies with δ
  const theta = anaRad - polRad; // angle between pol and analyzer
  const intensity = Math.sin(theta) ** 2 * Math.cos(totalDelta / 2) ** 2 +
    Math.sin(totalDelta / 2) ** 2 * Math.cos(2 * polRad + theta) ** 2;

  // With compensator: Senarmont or similar
  // For Senarmont: I = sin²(δ/2) with λ/4 at 45°
  const senarmontIntensity = Math.sin(delta / 2 + compensatorRet / 2) ** 2;

  // Sensitivity (contrast): dI/dδ
  const sensitivity = Math.abs(Math.sin(delta) * Math.cos(totalDelta / 2));

  // Generate simulated birefringence image (2D map with varying retardation)
  const imageData = useMemo(() => {
    const N = 100;
    const xArr: number[] = [];
    const yArr: number[] = [];
    const zArr: number[] = [];

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = (i / N - 0.5) * 2;
        const y = (j / N - 0.5) * 2;
        const r = Math.sqrt(x ** 2 + y ** 2);

        // Simulate stress-induced birefringence pattern (e.g., around a hole)
        const holeR = 0.3;
        const stressR = 0.8;
        let localDn = 0;

        if (r > holeR && r < stressR) {
          // Stress concentration around hole
          const theta = Math.atan2(y, x);
          const radialStress = 1 / (r - holeR + 0.1);
          localDn = dn * Math.min(1, radialStress * 0.1) * Math.cos(2 * theta) ** 2;
        } else if (r <= holeR) {
          localDn = 0; // hole
        } else {
          localDn = dn * 0.2; // background
        }

        const localDelta = (2 * Math.PI * localDn * d) / lam + compensatorRet;
        const localTheta = anaRad - polRad;
        const I = Math.sin(localTheta) ** 2 * Math.cos(localDelta / 2) ** 2 +
          Math.sin(localDelta / 2) ** 2 * Math.cos(2 * polRad + localTheta) ** 2;

        xArr.push(x);
        yArr.push(y);
        zArr.push(r <= holeR ? -0.1 : I);
      }
    }

    return [{
      x: xArr, y: yArr, z: zArr, type: "scatter" as const, mode: "markers" as const,
      marker: { color: zArr, size: 3, colorscale: "Viridis", showscale: true, cmin: 0, cmax: 1, colorbar: { title: "Intensity", tickfont: { color: "#9ca3af" } } },
    }];
  }, [dn, d, lam, compensatorRet, polRad, anaRad]);

  const retardationScan = useMemo(() => {
    const rets = Array.from({ length: 300 }, (_, i) => (i / 300) * 4 * Math.PI);
    const I = rets.map(d => {
      const td = d + compensatorRet;
      return Math.sin(theta) ** 2 * Math.cos(td / 2) ** 2 +
        Math.sin(td / 2) ** 2 * Math.cos(2 * polRad + theta) ** 2;
    });
    const sens = rets.map(d => Math.abs(Math.sin(d)));
    return [
      { x: rets.map(r => r / Math.PI), y: I, type: "scatter" as const, mode: "lines" as const, name: "Intensity", line: { color: "#60a5fa", width: 2 } },
      { x: rets.map(r => r / Math.PI), y: sens, type: "scatter" as const, mode: "lines" as const, name: "Sensitivity", line: { color: "#f87171", width: 2, dash: "dash" }, yaxis: "y2" },
    ];
  }, [theta, polRad, compensatorRet]);

  const analyzerScan = useMemo(() => {
    const angles = Array.from({ length: 180 }, (_, i) => i * 2);
    const I = angles.map(a => {
      const th = (a - polarizerAngleDeg) * Math.PI / 180;
      const td = delta + compensatorRet;
      return Math.sin(th) ** 2 * Math.cos(td / 2) ** 2 +
        Math.sin(td / 2) ** 2 * Math.cos(2 * polRad + th) ** 2;
    });
    return [
      { x: angles, y: I, type: "scatter" as const, mode: "lines" as const, name: "Intensity", line: { color: "#a78bfa", width: 2 } },
    ];
  }, [delta, compensatorRet, polRad, polarizerAngleDeg]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Birefringence Imaging" description="Simulate quantitative birefringence imaging with polarizer/analyzer rotation and compensators. Visualize stress-induced birefringence patterns.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">I = sin²(α-β)·cos²(δ/2) + sin²(δ/2)·cos²(2φ+α-β)</p>
        <p className="text-gray-300 text-sm font-mono">δ = 2πΔn·d/λ, Sensitivity ∝ |sin(δ)|</p>
      </div>

      <div className="flex gap-4 mb-6">
        {(["none", "lambda/4", "lambda", "sensitive"] as const).map(c => (
          <button key={c} onClick={() => setCompensator(c)} className={`text-sm px-4 py-2 rounded ${compensator === c ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}>
            {c === "none" ? "No Comp." : c === "lambda/4" ? "λ/4" : c === "lambda" ? "λ" : "Sensitive"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={700} step="10" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Δn</span>
          <input type="number" value={dn} onChange={e => { }} step="0.001" disabled
            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-500" />
        </label>
        <ValidatedNumberInput label="Thickness (mm)" value={thickness} onChange={setThickness} min={0.001} max={0.5} step="0.01" />
        <ValidatedNumberInput label="Polarizer (°)" value={polarizerAngleDeg} onChange={setPolarizerAngleDeg} min={0} max={180} step="5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Analyzer (°)" value={analyzerAngleDeg} onChange={setAnalyzerAngleDeg} min={0} max={180} step="5" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setPolarizerAngleDeg(0); setAnalyzerAngleDeg(90); setCompensator("none"); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Crossed Polars</button>
        <button onClick={() => { setPolarizerAngleDeg(45); setAnalyzerAngleDeg(45); setCompensator("lambda/4"); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Senarmont Setup</button>
        <button onClick={() => setCompensator("sensitive")} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Sensitive Tint</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Sample δ</p>
          <p className="text-2xl font-bold text-blue-400">{deltaWaves.toFixed(2)} λ</p>
          <p className="text-xs text-gray-500">{(delta / Math.PI).toFixed(2)}π rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmitted I</p>
          <p className="text-2xl font-bold text-green-400">{(intensity * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Sensitivity</p>
          <p className="text-2xl font-bold text-yellow-400">{(sensitivity * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Compensator</p>
          <p className="text-lg font-bold text-purple-400">{compensator === "none" ? "None" : compensator === "lambda/4" ? "λ/4" : compensator === "lambda" ? "λ" : "~3.6°"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Simulated Birefringence Image (stress around hole)</h3>
          <ChartPanel data={imageData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "#111827",
            font: { color: "#9ca3af" },
            xaxis: { title: "x (normalized)", gridcolor: "#374151", scaleanchor: "y", scaleratio: 1 },
            yaxis: { title: "y (normalized)", gridcolor: "#374151" },
            margin: { t: 20, r: 60, b: 50, l: 50 }, height: 400,
          }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Intensity vs Retardation</h3>
          <ChartPanel data={retardationScan} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Retardation (waves)", gridcolor: "#374151" },
            yaxis: { title: "Intensity", gridcolor: "#374151", range: [-0.05, 1.05] },
            yaxis2: { title: "Sensitivity", overlaying: "y", side: "right", gridcolor: "transparent" },
            margin: { t: 20, r: 60, b: 50, l: 50 }, height: 400,
            xref: "x", yref: "y",
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Intensity vs Analyzer Angle</h3>
        <ChartPanel data={analyzerScan} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Analyzer Angle (°)", gridcolor: "#374151" },
          yaxis: { title: "Intensity", gridcolor: "#374151", range: [-0.05, 1.05] },
          margin: { t: 20, r: 20, b: 50, l: 50 },
        }} />
      </div>
    </CalculatorShell>
  );
}
