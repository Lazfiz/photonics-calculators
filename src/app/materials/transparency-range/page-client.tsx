"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

interface Material {
  name: string;
  type: string;
  transmissionMin: number; // nm
  transmissionMax: number; // nm
  peakTransmission: number; // %
  uvCutoff: number; // nm (10% T)
  irCutoff: number; // nm (10% T)
  notes: string;
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica", type: "Glass", transmissionMin: 160, transmissionMax: 3500, peakTransmission: 93, uvCutoff: 160, irCutoff: 3500, notes: "Standard UV-IR grade" },
  "BK7": { name: "BK7", type: "Glass", transmissionMin: 330, transmissionMax: 2500, peakTransmission: 92, uvCutoff: 330, irCutoff: 2500, notes: "Most common optical glass" },
  "CaF2": { name: "CaF₂", type: "Crystal", transmissionMin: 130, transmissionMax: 9000, peakTransmission: 95, uvCutoff: 130, irCutoff: 9000, notes: "Deep UV to mid-IR" },
  "BaF2": { name: "BaF₂", type: "Crystal", transmissionMin: 130, transmissionMax: 14500, peakTransmission: 93, uvCutoff: 130, irCutoff: 14500, notes: "Wide range, hygroscopic" },
  "Sapphire": { name: "Sapphire (Al₂O₃)", type: "Crystal", transmissionMin: 150, transmissionMax: 6000, peakTransmission: 95, uvCutoff: 150, irCutoff: 6000, notes: "Very hard, scratch resistant" },
  "MgF2": { name: "MgF₂", type: "Crystal", transmissionMin: 110, transmissionMax: 7500, peakTransmission: 94, uvCutoff: 110, irCutoff: 7500, notes: "VUV applications" },
  "ZnSe": { name: "ZnSe", type: "II-VI", transmissionMin: 500, transmissionMax: 22000, peakTransmission: 95, uvCutoff: 500, irCutoff: 22000, notes: "CO₂ laser optics" },
  "Ge": { name: "Germanium", type: "Semiconductor", transmissionMin: 1800, transmissionMax: 23000, peakTransmission: 95, uvCutoff: 1800, irCutoff: 23000, notes: "Thermal imaging, opaque in visible" },
  "Si": { name: "Silicon", type: "Semiconductor", transmissionMin: 1100, transmissionMax: 8000, peakTransmission: 55, uvCutoff: 1100, irCutoff: 8000, notes: "IR windows, moderate absorption" },
  "Diamond": { name: "Diamond", type: "Crystal", transmissionMin: 225, transmissionMax: 100000, peakTransmission: 97, uvCutoff: 225, irCutoff: 100000, notes: "Exceptional thermal properties" },
  "KBr": { name: "KBr", type: "Alkali Halide", transmissionMin: 200, transmissionMax: 30000, peakTransmission: 93, uvCutoff: 200, irCutoff: 30000, notes: "Far-IR, very hygroscopic" },
  "NaCl": { name: "NaCl", type: "Alkali Halide", transmissionMin: 200, transmissionMax: 20000, peakTransmission: 92, uvCutoff: 200, irCutoff: 20000, notes: "Hygroscopic, cheap IR window" },
};

const typeColors: Record<string, string> = {
  "Glass": "#3b82f6",
  "Crystal": "#22c55e",
  "II-VI": "#f59e0b",
  "Semiconductor": "#ef4444",
  "Alkali Halide": "#8b5cf6",
};

export default function TransparencyRangePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);

  const results = useMemo(() => {
    return Object.entries(materials).map(([key, m]) => {
      const inRange = wavelength >= m.uvCutoff && wavelength <= m.irCutoff;
      let t = 0;
      if (inRange) {
        const range = m.irCutoff - m.uvCutoff;
        const pos = (wavelength - m.uvCutoff) / range;
        // Approximate bell-curve transmission profile
        t = m.peakTransmission * Math.exp(-Math.pow((pos - 0.3) * 2.5, 2));
      }
      return { key, ...m, transmits: inRange, approxT: t };
    }).sort((a, b) => (b.transmits ? 1 : 0) - (a.transmits ? 1 : 0));
  }, [wavelength]);

  const chartData = useMemo(() => {
    return Object.entries(materials).map(([key, m]) => {
      const ws: number[] = [];
      const ts: number[] = [];
      for (let w = 100; w <= 30000; w += 50) {
        ws.push(w);
        if (w >= m.uvCutoff && w <= m.irCutoff) {
          const range = m.irCutoff - m.uvCutoff;
          const pos = (w - m.uvCutoff) / range;
          ts.push(m.peakTransmission * Math.exp(-Math.pow((pos - 0.3) * 2.5, 2)));
        } else {
          ts.push(0);
        }
      }
      return {
        x: ws,
        y: ts,
        type: "scatter" as const,
        mode: "lines" as const,
        name: m.name,
        line: { color: typeColors[m.type] || "#9ca3af", width: 1.5 },
      };
    });
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Transparency Range" description="UV cutoff to IR cutoff for common optical materials">
            
      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={100} max={50000} />
      </div>

      <div className="space-y-2 mb-8">
        {results.map(r => (
          <div key={r.key} className={`flex items-center justify-between p-3 rounded-lg border ${r.transmits ? "bg-green-900/20 border-green-800" : "bg-gray-900 border-gray-800"}`}>
            <div>
              <span className="font-semibold">{r.name}</span>
              <span className="text-xs text-gray-400 ml-2">{r.type}</span>
              <span className="text-xs text-gray-500 ml-2">{r.notes}</span>
            </div>
            <div className="text-right text-sm">
              <span className="text-gray-400">{r.uvCutoff}–{r.irCutoff >= 10000 ? `${(r.irCutoff/1000).toFixed(0)}µm` : `${r.irCutoff}nm`}</span>
              {r.transmits && <span className="text-green-400 ml-2 font-bold">✓ ~{r.approxT.toFixed(0)}%</span>}
            </div>
          </div>
        ))}
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "Transmission (%)", gridcolor: "#374151", range: [0, 100] },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.3, font: { size: 9 } },
          shapes: [{ type: "line", x0: wavelength, x1: wavelength, y0: 0, y1: 100, line: { color: "#ffffff", width: 1, dash: "dashdot" } }],
        }}
       
       
      />
    </CalculatorShell>
  );
}
