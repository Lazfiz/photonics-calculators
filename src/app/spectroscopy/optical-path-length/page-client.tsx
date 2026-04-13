"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function OpticalPathLengthPage() {
  const [physicalLength, setPhysicalLength] = useURLState("physicalLength", 1);
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.5);
  const [numPasses, setNumPasses] = useURLState("numPasses", 1);
  const [angleDeg, setAngleDeg] = useURLState("angleDeg", 0);
  const [sweepParam, setSweepParam] = useState<"n" | "angle" | "passes">("n");

  const angleRad = (angleDeg * Math.PI) / 180;
  // Internal angle via Snell's law: n_air·sin(θ_ext) = n·sin(θ_int)
  const sinInternal = Math.sin(angleRad) / refractiveIndex;
  const cosInternal = Math.sqrt(Math.max(0, 1 - sinInternal * sinInternal));
  const opl = physicalLength * refractiveIndex * numPasses / Math.max(cosInternal, 1e-10);
  const retTime = opl * 0.01 / 3e8 * 1e9; // OPL(cm)→m, /c(m/s), ×1e9→ns

  const chartData = useMemo(() => {
    const n = 200;
    let xs: number[], ys: number[];

    if (sweepParam === "n") {
      xs = Array.from({ length: n }, (_, i) => 1 + (i / n) * 1.5);
      ys = xs.map(ni => {
        const sinI = Math.sin(angleRad) / ni;
        const cosI = Math.sqrt(Math.max(0, 1 - sinI * sinI));
        return physicalLength * ni * numPasses / Math.max(cosI, 1e-10);
      });
    } else if (sweepParam === "angle") {
      xs = Array.from({ length: n }, (_, i) => (i / n) * 80);
      ys = xs.map(a => {
        const sinI = Math.sin((a * Math.PI) / 180) / refractiveIndex;
        const cosI = Math.sqrt(Math.max(0, 1 - sinI * sinI));
        return physicalLength * refractiveIndex * numPasses / Math.max(cosI, 1e-10);
      });
    } else {
      xs = Array.from({ length: n }, (_, i) => 1 + i);
      ys = xs.map(p => physicalLength * refractiveIndex * p / Math.max(cosInternal, 1e-10));
    }

    return [{ x: xs, y: ys, type: "scatter" as const, mode: "lines" as const, name: "OPL (cm)", line: { color: "#60a5fa" } }];
  }, [physicalLength, refractiveIndex, numPasses, angleRad, sweepParam]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Optical Path Length Calculator" description="OPL = n·d·N/cos(θ_internal). External angle converted via Snell's law.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Physical Length (cm)" value={physicalLength} onChange={setPhysicalLength} min={0} />
        <ValidatedNumberInput label="Refractive Index (n)" value={refractiveIndex} onChange={setRefractiveIndex} min={1} />
        <ValidatedNumberInput label="Number of Passes" value={numPasses} onChange={setNumPasses} min={1} />
        <ValidatedNumberInput label="Angle of Incidence (°)" value={angleDeg} onChange={setAngleDeg} min={0} max={85} />
      </div>

      <div role="group" aria-label="Options" className="flex gap-2 mb-6">
        {(["n", "angle", "passes"] as const).map(p => (
          <button key={p} onClick={() => setSweepParam(p)}
            className={`px-3 py-1 rounded text-sm ${sweepParam === p ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {p === "n" ? "Sweep n" : p === "angle" ? "Sweep Angle" : "Sweep Passes"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Path Length</p>
          <p className="text-xl font-bold text-blue-400">{opl.toFixed(4)} cm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">OPL / Physical</p>
          <p className="text-xl font-bold text-green-400">{physicalLength > 0 ? (opl / physicalLength).toFixed(2) : "N/A"}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retardation Time (ns)</p>
          <p className="text-xl font-bold text-orange-400">{retTime.toFixed(4)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono text-blue-400">OPL = n · d · N / cos(θ)</p>
        <p className="text-gray-300 text-sm font-mono text-green-400">Δt = OPL / c</p>
        <p className="text-gray-500 text-xs mt-2">n = refractive index, d = physical length, N = number of passes, θ = external angle of incidence (converted to internal via Snell's law).</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: sweepParam === "n" ? "Refractive Index" : sweepParam === "angle" ? "Angle (°)" : "Passes", gridcolor: "#1f2937" },
          yaxis: { title: "OPL (cm)", gridcolor: "#1f2937" },
          margin: { t: 30 },
        }} />
      </div>
    </CalculatorShell>
  );
}
