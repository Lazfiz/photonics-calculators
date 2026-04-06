"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

function fresnelCoefficients(n1: number, n2: number, thetaI: number) {
  const cosI = Math.cos(thetaI);
  const sinThetaT = (n1 / n2) * Math.sin(thetaI);

  // Total internal reflection
  if (Math.abs(sinThetaT) > 1) {
    return { rs: 1, rp: -1, ts: 0, tp: 0, Rs: 1, Rp: 1, Ts: 0, Tp: 0, thetaT: Math.PI / 2 };
  }

  const thetaT = Math.asin(sinThetaT);
  const cosT = Math.cos(thetaT);

  const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
  const rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);
  const ts = (2 * n1 * cosI) / (n1 * cosI + n2 * cosT);
  const tp = (2 * n1 * cosI) / (n2 * cosI + n1 * cosT);

  const Rs = rs * rs;
  const Rp = rp * rp;
  const cosISafe = Math.max(cosI, 1e-10); // guard grazing incidence division
  const Ts = (n2 * cosT) / cosISafe * ts * ts;
  const Tp = (n2 * cosT) / cosISafe * tp * tp;

  return { rs, rp, ts, tp, Rs, Rp, Ts, Tp, thetaT };
}

export default function FresnelPolarizationPage() {
  const [n1, setN1] = useURLState("n1", 1.0);
  const [n2, setN2] = useURLState("n2", 1.52);
  const [thetaIDeg, setThetaIDeg] = useURLState("thetaIDeg", 30);

  const thetaI = thetaIDeg * Math.PI / 180;
  const result = fresnelCoefficients(n1, n2, thetaI);
  const brewsterDeg = Math.atan(n2 / n1) * 180 / Math.PI;

  const chartData = useMemo(() => {
    const angles = Array.from({ length: 500 }, (_, i) => (i / 500) * (89.9 * Math.PI / 180));
    const degs = angles.map(a => a * 180 / Math.PI);
    const Rs = angles.map(a => fresnelCoefficients(n1, n2, a).Rs);
    const Rp = angles.map(a => fresnelCoefficients(n1, n2, a).Rp);
    const Ts = angles.map(a => fresnelCoefficients(n1, n2, a).Ts);
    const Tp = angles.map(a => fresnelCoefficients(n1, n2, a).Tp);
    return [
      { x: degs, y: Rs, type: "scatter" as const, mode: "lines" as const, name: "Rs", line: { color: "#60a5fa" } },
      { x: degs, y: Rp, type: "scatter" as const, mode: "lines" as const, name: "Rp", line: { color: "#f87171" } },
      { x: degs, y: Ts, type: "scatter" as const, mode: "lines" as const, name: "Ts", line: { color: "#60a5fa", dash: "dash" } },
      { x: degs, y: Tp, type: "scatter" as const, mode: "lines" as const, name: "Tp", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [n1, n2]);

  const phaseData = useMemo(() => {
    const angles = Array.from({ length: 500 }, (_, i) => (i / 500) * (89.9 * Math.PI / 180));
    const degs = angles.map(a => a * 180 / Math.PI);
    const phaseDiff = angles.map(a => {
      const c = fresnelCoefficients(n1, n2, a);
      return Math.atan2(c.rp, 1) - Math.atan2(c.rs, 1);
    });
    return [
      { x: degs, y: phaseDiff.map(d => d * 180 / Math.PI), type: "scatter" as const, mode: "lines" as const, name: "δ = arg(rp) − arg(rs)", line: { color: "#a78bfa", width: 2 } },
    ];
  }, [n1, n2]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Fresnel Polarization Calculator" description="Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces. Uses Born &amp; Wolf sign convention (r_p sign differs from thin-film Macleod convention).">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">rs = (n₁cosθᵢ − n₂cosθₜ)/(n₁cosθᵢ + n₂cosθₜ)</p>
        <p className="text-gray-300 text-sm font-mono">rp = (n₂cosθᵢ − n₁cosθₜ)/(n₂cosθᵢ + n₁cosθₜ)</p>
        <p className="text-gray-500 text-xs mt-1">Snell&apos;s law: n₁sinθᵢ = n₂sinθₜ</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="n₁ (incident medium)" value={n1} onChange={setN1} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="n₂ (transmission medium)" value={n2} onChange={setN2} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Angle of Incidence (°)" value={thetaIDeg} onChange={setThetaIDeg} min={0} max={89} step="0.5" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setN1(1); setN2(1.52); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Air → Glass</button>
        <button onClick={() => { setN1(1); setN2(3.48); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Air → Silicon</button>
        <button onClick={() => { setN1(1.52); setN2(1); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Glass → Air</button>
        <button onClick={() => { setThetaIDeg(brewsterDeg); }} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">Set Brewster Angle</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">θ<sub>t</sub> (refracted)</p>
          <p className="text-2xl font-bold text-blue-400">{(result.thetaT * 180 / Math.PI).toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Brewster Angle</p>
          <p className="text-2xl font-bold text-green-400">{brewsterDeg.toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">R (unpolarized)</p>
          <p className="text-2xl font-bold text-yellow-400">{((result.Rs + result.Rp) / 2 * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Polarization Ratio R<sub>s</sub>/R<sub>p</sub></p>
          <p className="text-2xl font-bold text-purple-400">{result.Rp > 0 ? (result.Rs / result.Rp).toFixed(2) : "∞"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Amplitude Coefficients</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div><p className="text-xs text-gray-500">r<sub>s</sub></p><p className="font-mono text-blue-400">{result.rs.toFixed(4)}</p></div>
            <div><p className="text-xs text-gray-500">r<sub>p</sub></p><p className="font-mono text-red-400">{result.rp.toFixed(4)}</p></div>
            <div><p className="text-xs text-gray-500">t<sub>s</sub></p><p className="font-mono text-blue-400">{result.ts.toFixed(4)}</p></div>
            <div><p className="text-xs text-gray-500">t<sub>p</sub></p><p className="font-mono text-red-400">{result.tp.toFixed(4)}</p></div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Intensity (Power)</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div><p className="text-xs text-gray-500">R<sub>s</sub></p><p className="font-mono text-blue-400">{(result.Rs * 100).toFixed(2)}%</p></div>
            <div><p className="text-xs text-gray-500">R<sub>p</sub></p><p className="font-mono text-red-400">{(result.Rp * 100).toFixed(2)}%</p></div>
            <div><p className="text-xs text-gray-500">T<sub>s</sub></p><p className="font-mono text-blue-400">{(result.Ts * 100).toFixed(2)}%</p></div>
            <div><p className="text-xs text-gray-500">T<sub>p</sub></p><p className="font-mono text-red-400">{(result.Tp * 100).toFixed(2)}%</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Reflectance & Transmittance vs Angle</h3>
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Angle of Incidence (°)", gridcolor: "#374151", range: [0, 90] },
            yaxis: { title: "Fraction", gridcolor: "#374151", range: [0, 1] },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Phase Difference (δ = arg(r<sub>p</sub>) − arg(r<sub>s</sub>))</h3>
          <ChartPanel data={phaseData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Angle of Incidence (°)", gridcolor: "#374151", range: [0, 90] },
            yaxis: { title: "Phase (°)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
