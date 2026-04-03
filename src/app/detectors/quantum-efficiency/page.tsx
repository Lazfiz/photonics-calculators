"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function QuantumEfficiencyPage() {
  const [detType, setDetType] = useState<"silicon"|"ingaas"|"ccd"|"mcd">("silicon");
  const [fillFactor, setFillFactor] = useState(0.95);
  const [microlensGain, setMicrolensGain] = useState(1.0);

  // Simple QE models vs wavelength (nm)
  const qeModel = useMemo(() => {
    const wl = Array.from({ length: 300 }, (_, i) => 300 + i * 0.7); // 300-510nm
    return wl.map(w => {
      let base = 0;
      if (detType === "silicon") {
        // Si: rises ~400nm, peaks ~700nm, drops ~1000nm
        if (w < 400) base = 0;
        else if (w < 600) base = 0.7 * (1 - Math.exp(-(w - 400) / 80));
        else if (w < 900) base = 0.7 + 0.25 * Math.sin(Math.PI * (w - 600) / 600);
        else base = 0.95 * Math.exp(-(w - 900) / 80);
      } else if (detType === "ingaas") {
        // InGaAs: 900-1700nm
        if (w < 900) base = 0;
        else if (w < 1100) base = 0.85 * (1 - Math.exp(-(w - 900) / 60));
        else if (w < 1600) base = 0.85 + 0.05 * Math.sin(Math.PI * (w - 1100) / 500);
        else base = 0.9 * Math.exp(-(w - 1600) / 40);
      } else if (detType === "ccd") {
        // Back-illuminated CCD
        if (w < 350) base = 0;
        else if (w < 500) base = 0.9 * (1 - Math.exp(-(w - 350) / 60));
        else if (w < 800) base = 0.9 + 0.05 * Math.sin(Math.PI * (w - 500) / 600);
        else base = 0.95 * Math.exp(-(w - 800) / 60);
      } else {
        // CMOS front-illuminated
        if (w < 400) base = 0;
        else if (w < 550) base = 0.55 * (1 - Math.exp(-(w - 400) / 70));
        else if (w < 700) base = 0.55 + 0.1 * Math.sin(Math.PI * (w - 550) / 300);
        else base = 0.65 * Math.exp(-(w - 700) / 70);
      }
      return base * fillFactor * microlensGain;
    });
  }, [detType, fillFactor, microlensGain]);

  const chartData = useMemo(() => {
    const wl = Array.from({ length: 300 }, (_, i) => 300 + i * 0.7);
    return [{ x: wl, y: qeModel, type: "scatter" as const, mode: "lines" as const, name: "QE", line: { color: "#60a5fa", width: 2 } }];
  }, [qeModel]);

  const peakQE = Math.max(...qeModel);
  const peakWl = 300 + qeModel.indexOf(peakQE) * 0.7;

  const labels: Record<string, string> = { silicon: "Silicon (Si)", ingaas: "InGaAs", ccd: "CCD (Back-illuminated)", mcd: "CMOS (Front-illuminated)" };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Detector Type</span>
          <select value={detType} onChange={e => setDetType(e.target.value as any)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(labels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Fill Factor</span>
          <input type="number" value={fillFactor} onChange={e => setFillFactor(+e.target.value)} min={0.1} max={1} step={0.01} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Microlens Gain</span>
          <input type="number" value={microlensGain} onChange={e => setMicrolensGain(+e.target.value)} min={0.5} max={1.5} step={0.01} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Peak QE = <span className="text-blue-400 font-mono">{(peakQE * 100).toFixed(1)}%</span> at <span className="text-blue-400 font-mono">{peakWl.toFixed(0)} nm</span></p>
        <p className="text-gray-300 text-sm mt-1">Effective QE = η<sub>intrinsic</sub> × FF × G<sub>microlens</sub></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", range: [300, 510], gridcolor: "#374151" },
        yaxis: { title: "Quantum Efficiency", range: [0, 1.05], gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
