"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function BrewsterTIRPage() {
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.5);

  const brewster = useMemo(() => Math.atan(n2 / n1) * 180 / Math.PI, [n1, n2]);
  
  const critical = useMemo(() => {
    if (n2 >= n1) return null; // No TIR when going from lower to higher index
    return Math.asin(n2 / n1) * 180 / Math.PI;
  }, [n1, n2]);

  // Build beam diagram using Plotly shapes and traces
  const diagram = useMemo(() => {
    const traces: any[] = [];

    // Interface line (horizontal at y=0)
    traces.push({ 
      x: [-3, 8], 
      y: [0, 0], 
      type: "scatter", 
      mode: "lines", 
      line: { color: "#6b7280", width: 3 }, 
      showlegend: false,
      hoverinfo: "skip"
    });

    // Normal (dashed vertical line)
    traces.push({ 
      x: [2.5, 2.5], 
      y: [-4, 4], 
      type: "scatter", 
      mode: "lines", 
      line: { color: "#4b5563", width: 1, dash: "dash" }, 
      showlegend: false,
      hoverinfo: "skip"
    });

    // Medium labels
    traces.push({ 
      x: [6.5], y: [2.5], 
      type: "scatter", mode: "text", 
      text: [`n₁ = ${n1}`], 
      textfont: { color: "#9ca3af", size: 14 }, 
      showlegend: false,
      hoverinfo: "skip"
    });
    traces.push({ 
      x: [6.5], y: [-2.5], 
      type: "scatter", mode: "text", 
      text: [`n₂ = ${n2}`], 
      textfont: { color: "#9ca3af", size: 14 }, 
      showlegend: false,
      hoverinfo: "skip"
    });

    // Incident beam at Brewster angle
    const bRad = brewster * Math.PI / 180;
    const incLen = 3.5;
    const ix = 2.5 - incLen * Math.sin(bRad);
    const iy = incLen * Math.cos(bRad);
    
    traces.push({ 
      x: [ix, 2.5], 
      y: [iy, 0], 
      type: "scatter", 
      mode: "lines", 
      line: { color: "#3b82f6", width: 3 }, 
      name: "Incident beam",
      hoverinfo: "name"
    });

    // Reflected beam (at Brewster, only s-pol reflects)
    const rx = 2.5 + incLen * Math.sin(bRad);
    const ry = incLen * Math.cos(bRad);
    traces.push({ 
      x: [2.5, rx], 
      y: [0, ry], 
      type: "scatter", 
      mode: "lines", 
      line: { color: "#f59e0b", width: 2, dash: "dash" }, 
      name: "Reflected (s-pol)",
      hoverinfo: "name"
    });

    // Transmitted beam (using Snell's law)
    const sinT = n1 * Math.sin(bRad) / n2;
    if (Math.abs(sinT) <= 1) {
      const tRad = Math.asin(sinT);
      const tLen = 3.5;
      const tx = 2.5 + tLen * Math.sin(tRad);
      const ty = -tLen * Math.cos(tRad);
      traces.push({ 
        x: [2.5, tx], 
        y: [0, ty], 
        type: "scatter", 
        mode: "lines", 
        line: { color: "#22c55e", width: 3 }, 
        name: "Transmitted (p-pol)",
        hoverinfo: "name"
      });
    }

    // Angle arc for Brewster angle (incident side)
    const arcB: { x: number; y: number }[] = [];
    for (let a = 0; a <= brewster; a += 1) {
      const r = 0.8;
      arcB.push({ x: 2.5 - r * Math.sin(a * Math.PI / 180), y: r * Math.cos(a * Math.PI / 180) });
    }
    traces.push({ 
      x: arcB.map(p => p.x), 
      y: arcB.map(p => p.y), 
      type: "scatter", 
      mode: "lines", 
      line: { color: "#3b82f6", width: 2 }, 
      name: `θB = ${brewster.toFixed(1)}°`,
      hoverinfo: "name"
    });

    // Critical angle indicator (if applicable)
    if (critical !== null) {
      // Show critical angle annotation
      traces.push({ 
        x: [7], y: [3.5], 
        type: "scatter", 
        mode: "text", 
        text: [`θc = ${critical.toFixed(1)}° (TIR)`], 
        textfont: { color: "#ef4444", size: 12 }, 
        showlegend: false,
        hoverinfo: "skip"
      });

      // Critical angle arc
      const arcC: { x: number; y: number }[] = [];
      for (let a = 0; a <= Math.min(critical, 90); a += 1) {
        const r = 0.6;
        arcC.push({ x: 2.5 - r * Math.sin(a * Math.PI / 180), y: r * Math.cos(a * Math.PI / 180) });
      }
      traces.push({ 
        x: arcC.map(p => p.x), 
        y: arcC.map(p => p.y), 
        type: "scatter", 
        mode: "lines", 
        line: { color: "#ef4444", width: 2, dash: "dot" }, 
        name: `θc = ${critical.toFixed(1)}°`,
        hoverinfo: "name"
      });
    }

    // Point of incidence
    traces.push({ 
      x: [2.5], y: [0], 
      type: "scatter", 
      mode: "markers", 
      marker: { color: "#ffffff", size: 8 }, 
      showlegend: false,
      hoverinfo: "skip"
    });

    return traces;
  }, [n1, n2, brewster, critical]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Brewster Angle &amp; Total Internal Reflection" description="θB = arctan(n₂/n₁) &nbsp;|&nbsp; θc = arcsin(n₂/n₁)">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">n₁ (incident medium)</label>
          <input type="number" value={n1} onChange={e => setN1(Number(e.target.value))} step={0.01} min={0.1}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">n₂ (transmitting medium)</label>
          <input type="number" value={n2} onChange={e => setN2(Number(e.target.value))} step={0.01} min={0.1}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-400">Brewster Angle</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{brewster.toFixed(4)}°</p>
          <p className="text-xs text-gray-500 mt-2">p-polarized reflection = 0 at this angle</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-400">Critical Angle (TIR)</p>
          {critical !== null ? (
            <>
              <p className="text-3xl font-bold text-red-400 mt-1">{critical.toFixed(4)}°</p>
              <p className="text-xs text-gray-500 mt-2">Total internal reflection for θ &gt; θc</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-600 mt-1">N/A</p>
              <p className="text-xs text-gray-500 mt-2">TIR requires n₁ &gt; n₂ (light going to lower index)</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400 mb-2">Physics Notes:</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• <span className="text-yellow-400">Brewster angle</span>: p-polarized light is perfectly transmitted (R<sub>p</sub> = 0)</li>
          <li>• <span className="text-red-400">Critical angle</span>: TIR begins; light cannot transmit for larger angles</li>
          <li>• Diagram shows incident beam at Brewster angle (p-pol transmitted, s-pol reflected)</li>
        </ul>
      </div>

      <ChartPanel data={diagram}
        layout={{
          paper_bgcolor: "transparent", 
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { visible: false, range: [-3, 8] },
          yaxis: { visible: false, range: [-4, 4], scaleanchor: "x", scaleratio: 1 },
          margin: { t: 10, r: 10, b: 40, l: 10 },
          legend: { orientation: "h", y: -0.08, x: 0.5, xanchor: "center", font: { size: 11 } },
          showlegend: true,
        }}
       
       
      />
    </CalculatorShell>
  );
}
