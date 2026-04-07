"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ModeLockedLaserPage() {
  const [repRate, setRepRate] = useURLState("repRate", 80); // MHz
  const [pulseDuration, setPulseDuration] = useURLState("pulseDuration", 100); // fs
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm

  const chartData = useMemo(() => {
    const t = Array.from({ length: 200 }, (_, i) => (i - 100) * pulseDuration * 2e-15 / 1e-15); // fs
    const intensity = t.map(ti => Math.exp(-((ti / pulseDuration) ** 2)));
    
    return [
      { x: t, y: intensity, type: "scatter" as const, mode: "lines" as const, name: "Pulse", line: { color: "#60a5fa" }, fill: "tozeroy" },
    ];
  }, [repRate, pulseDuration, wavelength]);

  const peakPower = (1.5 * pulseDuration * 1e-15 * repRate * 1e6) / 1;

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Mode-Locked Laser" description="Ultrashort pulse generation through passive or active mode-locking.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Rep Rate (MHz)" value={repRate} onChange={setRepRate} step="1" />
        <ValidatedNumberInput label="Pulse Duration (fs)" value={pulseDuration} onChange={setPulseDuration} step="10" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Cavity Length: <span className="text-blue-400 font-mono">{(3e8 / (2 * repRate * 1e6)).toFixed(2)} m</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Time (fs)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} />
    </CalculatorShell>
  );
}
