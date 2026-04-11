"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function RetarderPage() {
  const [retardanceDeg, setRetardanceDeg] = useURLState("retardanceDeg", 90);
  const [fastAxisDeg, setFastAxisDeg] = useURLState("fastAxisDeg", 0);
  const [inputPolDeg, setInputPolDeg] = useURLState("inputPolDeg", 45);

  const chartData = useMemo(() => {
    const retardanceRad = retardanceDeg * Math.PI / 180;
    const fastAxisRad = fastAxisDeg * Math.PI / 180;
    const inputPolRad = inputPolDeg * Math.PI / 180;
    
    const t = Array.from({ length: 200 }, (_, i) => (i / 200) * 2 * Math.PI);
    
    // Input Jones vector
    const ci = Math.cos(inputPolRad);
    const si = Math.sin(inputPolRad);
    const c = Math.cos(fastAxisRad);
    const s = Math.sin(fastAxisRad);
    const phase = retardanceRad;
    
    // Output field (simplified real/imaginary calculation)
    // Jones matrix for retarder: M = R(-θ)·diag(1,e^{-iΓ})·R(θ)
    // Input: E_in = [cosφ, sinφ]
    // After R(θ): [cos(φ-θ), sin(φ-θ)]
    // After diag: [cos(φ-θ), e^{-iΓ}sin(φ-θ)]
    // After R(-θ): multiply by rotation matrix
    const ci_rt = ci * c + si * s; // cos(φ-θ)
    const si_rt = si * c - ci * s; // sin(φ-θ)
    const Ex_re = c * ci_rt + s * Math.cos(phase) * si_rt;
    const Ex_im = -s * Math.sin(phase) * si_rt;
    const Ey_re = -s * ci_rt + c * Math.cos(phase) * si_rt;
    const Ey_im = -c * Math.sin(phase) * si_rt;
    
    // Input polarization ellipse
    const inX = t.map(tt => ci * Math.cos(tt));
    const inY = t.map(tt => si * Math.cos(tt));
    
    // Output polarization ellipse
    const outX = t.map(tt => Ex_re * Math.cos(tt) - Ex_im * Math.sin(tt));
    const outY = t.map(tt => Ey_re * Math.cos(tt) - Ey_im * Math.sin(tt));
    
    return [
      { x: inX, y: inY, type: "scatter" as const, mode: "lines" as const, name: "Input", line: { color: "#60a5fa", dash: "dash" } },
      { x: outX, y: outY, type: "scatter" as const, mode: "lines" as const, name: "Output", line: { color: "#f87171" } },
    ];
  }, [retardanceDeg, fastAxisDeg, inputPolDeg]);

  // Calculate output parameters
  const retardanceRad = retardanceDeg * Math.PI / 180;
  const fastAxisRad = fastAxisDeg * Math.PI / 180;
  const inputPolRad = inputPolDeg * Math.PI / 180;
  const ci = Math.cos(inputPolRad);
  const si = Math.sin(inputPolRad);
  const c = Math.cos(fastAxisRad);
  const s = Math.sin(fastAxisRad);
  const phase = retardanceRad;

  const ci_rt = ci * c + si * s;
  const si_rt = si * c - ci * s;
  const Ex_re = c * ci_rt + s * Math.cos(phase) * si_rt;
  const Ex_im = -s * Math.sin(phase) * si_rt;
  const Ey_re = -s * ci_rt + c * Math.cos(phase) * si_rt;
  const Ey_im = -c * Math.sin(phase) * si_rt;

  const S0 = Ex_re * Ex_re + Ex_im * Ex_im + Ey_re * Ey_re + Ey_im * Ey_im;
  const S1 = (Ex_re * Ex_re + Ex_im * Ex_im) - (Ey_re * Ey_re + Ey_im * Ey_im);
  const S2 = 2 * (Ex_re * Ey_re + Ex_im * Ey_im);
  const S3 = 2 * (Ex_re * Ey_im - Ex_im * Ey_re);

  const intensity = S0;
  const dop = Math.sqrt(S1 * S1 + S2 * S2 + S3 * S3) / Math.max(S0, 1e-10);
  const ellipticityAngle = 0.5 * Math.asin(Math.max(-1, Math.min(1, S3 / Math.max(S0, 1e-10))));
  const orientationAngle = 0.5 * Math.atan2(S2, S1);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Waveplate / Retarder" description="Polarization state transformation by a birefringent waveplate with variable retardance and fast-axis orientation.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Retardance (°)" value={retardanceDeg} onChange={setRetardanceDeg} step="1" />
        <ValidatedNumberInput label="Fast Axis (°)" value={fastAxisDeg} onChange={setFastAxisDeg} step="1" />
        <ValidatedNumberInput label="Input Pol. (°)" value={inputPolDeg} onChange={setInputPolDeg} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><p className="text-xs text-gray-500">Intensity</p><p className="font-mono text-blue-400">{intensity.toFixed(3)}</p></div>
        <div><p className="text-xs text-gray-500">DOP</p><p className="font-mono text-blue-400">{(dop * 100).toFixed(1)}%</p></div>
        <div><p className="text-xs text-gray-500">Ellipticity</p><p className="font-mono text-blue-400">{(ellipticityAngle * 180 / Math.PI).toFixed(1)}°</p></div>
        <div><p className="text-xs text-gray-500">Orientation</p><p className="font-mono text-blue-400">{(orientationAngle * 180 / Math.PI).toFixed(1)}°</p></div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Stokes Parameters</h3>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div><span className="text-gray-400">S₀</span><br/><span className="text-blue-400 font-mono">{S0.toFixed(3)}</span></div>
          <div><span className="text-gray-400">S₁</span><br/><span className="text-blue-400 font-mono">{S1.toFixed(3)}</span></div>
          <div><span className="text-gray-400">S₂</span><br/><span className="text-blue-400 font-mono">{S2.toFixed(3)}</span></div>
          <div><span className="text-gray-400">S₃</span><br/><span className="text-blue-400 font-mono">{S3.toFixed(3)}</span></div>
        </div>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Ex", gridcolor: "#374151", scaleanchor: "y" },
        yaxis: { title: "Ey", gridcolor: "#374151" },
        margin: { t: 30, b: 50, l: 60, r: 30 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} />

      <div className="bg-gray-900 rounded p-4 mt-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>Jones matrix: R(-θ) · diag(e<sup>iΓ/2</sup>, e<sup>-iΓ/2</sup>) · R(θ)</p>
        <p>Γ = retardance, θ = fast axis angle</p>
        <p>Stokes: S₀ = |Eₓ|² + |Eᵧ|², S₁ = |Eₓ|² - |Eᵧ|², S₂ = 2Re(EₓEᵧ*), S₃ = -2Im(EₓEᵧ*)</p>
      </div>
    </CalculatorShell>
  );
}
