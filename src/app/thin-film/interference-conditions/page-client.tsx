"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function InterferenceConditionsPage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.38);
  const [thickness, setThickness] = useURLState("thickness", 100);
  const [nIncident, setNIncident] = useURLState("nIncident", 1.0);
  const [nSubstrate, setNSubstrate] = useURLState("nSubstrate", 1.52);
  const [phaseShiftPi, setPhaseShiftPi] = useURLState("phaseShiftPi", 1); // 0 or π phase shift at one interface

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    const constructive = wls.map(wl => {
      const opd = 2 * nFilm * thickness;
      const extraPhase = phaseShiftPi * Math.PI;
      const phase = (2 * Math.PI * opd) / wl + extraPhase;
      return (Math.cos(phase / 2)) ** 2;
    });
    const destructive = wls.map(wl => {
      const opd = 2 * nFilm * thickness;
      const extraPhase = phaseShiftPi * Math.PI;
      const phase = (2 * Math.PI * opd) / wl + extraPhase;
      return (Math.sin(phase / 2)) ** 2;
    });
    return [
      { x: wls, y: constructive, type: "scatter" as const, mode: "lines" as const, name: "Constructive (reflected)", line: { color: "#60a5fa" } },
      { x: wls, y: destructive, type: "scatter" as const, mode: "lines" as const, name: "Destructive (transmitted)", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [nFilm, thickness, phaseShiftPi]);

  const opd = 2 * nFilm * thickness;
  const constructiveWl = opd / 1; // 2nd order: OPD = mλ
  const destructiveWl = opd / 0.5; // m=1/2

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Thin Film Interference Conditions" description="Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n (film)" value={nFilm} onChange={setNFilm} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Thickness (nm)" value={thickness} onChange={setThickness} min={1} step="1" />
        <ValidatedNumberInput label="n (incident)" value={nIncident} onChange={setNIncident} step="0.01" />
        <ValidatedNumberInput label="n (substrate)" value={nSubstrate} onChange={setNSubstrate} step="0.01" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Phase shift at one interface</span>
          <select value={phaseShiftPi} onChange={e => setPhaseShiftPi(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={0}>0 (n₁ &lt; n₂ &lt; n₃)</option>
            <option value={1}>π (n₁ &lt; n₂ &gt; n₃ or n₁ &gt; n₂ &lt; n₃)</option>
          </select></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Path Difference</p>
          <p className="text-xl font-bold text-green-400">{opd.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">1st constructive λ</p>
          <p className="text-xl font-bold text-blue-400">{opd.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">1st destructive λ</p>
          <p className="text-xl font-bold text-red-400">{(opd / 0.5).toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Interference Conditions</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>OPD = 2·n·d (normal incidence)</p>
          <p>Constructive: 2nd = mλ + δ/2·λ/π</p>
          <p>Destructive: 2nd = (m+½)λ + δ/2·λ/π</p>
          <p>δ = 0 or π depending on refractive index ordering</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (normalized)", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </CalculatorShell>
  );
}
