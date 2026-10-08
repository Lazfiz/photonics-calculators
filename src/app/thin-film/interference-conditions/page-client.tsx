"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { firstReflectionExtrema, netReflectionPhase } from "../../../physics/thin-film/interference";
import { reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function InterferenceConditionsPage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.38);
  const [thickness, setThickness] = useURLState("thickness", 100);
  const [nIncident, setNIncident] = useURLState("nIncident", 1.0);
  const [nSubstrate, setNSubstrate] = useURLState("nSubstrate", 1.52);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    // Exact single-film reflectance; its extrema are the interference conditions below.
    const stack = { incident: nIncident, layers: [{ n: nFilm, thickness: thickness * 1e-9 }], substrate: { n: nSubstrate } };
    const R = reflectanceSpectrum(stack, wls.map((wl) => wl * 1e-9));
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } },
    ];
  }, [nFilm, thickness, nIncident, nSubstrate]);

  const opd = 2 * nFilm * thickness;
  const phase = netReflectionPhase(nIncident, nFilm, nSubstrate);
  const extrema = firstReflectionExtrema(nIncident, nFilm, nSubstrate, thickness * 1e-9);
  const formatNm = (m: number) => (Number.isFinite(m) ? `${(m * 1e9).toFixed(1)} nm` : "—");

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Thin Film Interference Conditions" description="Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n (film)" value={nFilm} onChange={setNFilm} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Thickness (nm)" value={thickness} onChange={setThickness} min={1} step="1" />
        <ValidatedNumberInput label="n (incident)" value={nIncident} onChange={setNIncident} step="0.01" />
        <ValidatedNumberInput label="n (substrate)" value={nSubstrate} onChange={setNSubstrate} step="0.01" />
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-300">Net reflection phase shift (from the index order)</p>
          <p className="mt-3 font-mono text-white">{Number.isNaN(phase) ? "— (a face doesn’t reflect)" : phase === 0 ? "0 (both or neither reflection off a higher index)" : "π (one reflection off a higher index)"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Path Difference</p>
          <p className="text-xl font-bold text-green-400">{opd.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">1st constructive λ (reflection)</p>
          <p className="text-xl font-bold text-blue-400">{formatNm(extrema.constructive)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">1st destructive λ (reflection)</p>
          <p className="text-xl font-bold text-red-400">{formatNm(extrema.destructive)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Interference Conditions</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>OPD = 2·n·d (normal incidence)</p>
          <p>Net phase 0: constructive 2nd = mλ, destructive 2nd = (m+½)λ</p>
          <p>Net phase π: constructive 2nd = (m+½)λ, destructive 2nd = mλ</p>
          <p>Each reflection off a higher index adds π</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </CalculatorShell>
  );
}
