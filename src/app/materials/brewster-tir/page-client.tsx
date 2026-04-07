"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
const interfacePresets = [
  { label: "Air → Glass", n1: 1.0, n2: 1.5 },
  { label: "Glass → Air", n1: 1.5, n2: 1.0 },
  { label: "Air → Water", n1: 1.0, n2: 1.33 },
  { label: "Silica → Air", n1: 1.45, n2: 1.0 },
];
const currentHref = "/materials/brewster-tir";

export default function BrewsterTIRPage() {
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.5);

  const brewster = useMemo(() => (Math.atan(n2 / n1) * 180) / Math.PI, [n1, n2]);
  const critical = useMemo(() => {
    if (n2 >= n1) return null;
    return (Math.asin(n2 / n1) * 180) / Math.PI;
  }, [n1, n2]);

  const diagram = useMemo(() => {
    const traces: any[] = [];
    traces.push({ x: [-3, 8], y: [0, 0], type: "scatter", mode: "lines", line: { color: "#6b7280", width: 3 }, showlegend: false, hoverinfo: "skip" });
    traces.push({ x: [2.5, 2.5], y: [-4, 4], type: "scatter", mode: "lines", line: { color: "#4b5563", width: 1, dash: "dash" }, showlegend: false, hoverinfo: "skip" });
    traces.push({ x: [6.5], y: [2.5], type: "scatter", mode: "text", text: [`n₁ = ${n1}`], textfont: { color: "#9ca3af", size: 14 }, showlegend: false, hoverinfo: "skip" });
    traces.push({ x: [6.5], y: [-2.5], type: "scatter", mode: "text", text: [`n₂ = ${n2}`], textfont: { color: "#9ca3af", size: 14 }, showlegend: false, hoverinfo: "skip" });

    const bRad = (brewster * Math.PI) / 180;
    const incLen = 3.5;
    const ix = 2.5 - incLen * Math.sin(bRad);
    const iy = incLen * Math.cos(bRad);
    traces.push({ x: [ix, 2.5], y: [iy, 0], type: "scatter", mode: "lines", line: { color: "#3b82f6", width: 3 }, name: "Incident beam", hoverinfo: "name" });

    const rx = 2.5 + incLen * Math.sin(bRad);
    const ry = incLen * Math.cos(bRad);
    traces.push({ x: [2.5, rx], y: [0, ry], type: "scatter", mode: "lines", line: { color: "#f59e0b", width: 2, dash: "dash" }, name: "Reflected (s-pol)", hoverinfo: "name" });

    const sinT = (n1 * Math.sin(bRad)) / n2;
    if (Math.abs(sinT) <= 1) {
      const tRad = Math.asin(sinT);
      const tLen = 3.5;
      const tx = 2.5 + tLen * Math.sin(tRad);
      const ty = -tLen * Math.cos(tRad);
      traces.push({ x: [2.5, tx], y: [0, ty], type: "scatter", mode: "lines", line: { color: "#22c55e", width: 3 }, name: "Transmitted (p-pol)", hoverinfo: "name" });
    }

    if (critical !== null) {
      traces.push({ x: [7], y: [3.5], type: "scatter", mode: "text", text: [`θc = ${critical.toFixed(1)}°`], textfont: { color: "#ef4444", size: 12 }, showlegend: false, hoverinfo: "skip" });
    }

    traces.push({ x: [2.5], y: [0], type: "scatter", mode: "markers", marker: { color: "#ffffff", size: 8 }, showlegend: false, hoverinfo: "skip" });
    return traces;
  }, [n1, n2, brewster, critical]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Brewster Angle & Total Internal Reflection" description="Interactive Brewster-angle and critical-angle explorer with common interface presets.">
      <div className="mb-5 flex flex-wrap gap-2">
        {interfacePresets.map((preset) => (
          <button key={preset.label} onClick={() => { setN1(preset.n1); setN2(preset.n2); }} className={`rounded-full border px-3 py-1 text-sm transition ${n1 === preset.n1 && n2 === preset.n2 ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="n₁ (incident medium)" value={n1} onChange={setN1} min={1} max={3} step={0.01} />
        <InputSlider label="n₂ (transmitting medium)" value={n2} onChange={setN2} min={1} max={3} step={0.01} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Brewster angle" value={`${brewster.toFixed(4)}°`} tone="yellow" subtext="p-pol reflection = 0" />
        <ResultCard label="Critical angle" value={critical !== null ? `${critical.toFixed(4)}°` : "N/A"} tone="red" subtext={critical !== null ? "TIR for larger angles" : "Requires n₁ > n₂"} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-xs text-gray-400 space-y-1">
        <p>• Brewster angle: p-polarized light is perfectly transmitted (R<sub>p</sub> = 0)</p>
        <p>• Critical angle: total internal reflection begins when light travels from higher to lower index and θ &gt; θc</p>
      </div>

      <ChartPanel data={diagram} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { visible: false, range: [-3, 8] }, yaxis: { visible: false, range: [-4, 4], scaleanchor: "x", scaleratio: 1 },
        margin: { t: 10, r: 10, b: 10, l: 10 }, showlegend: true, legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
      }} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
