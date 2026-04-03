"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


interface Crystal {
  name: string;
  // Sellmeier coefficients for ordinary ray
  B1o: number; B2o: number; B3o: number;
  C1o: number; C2o: number; C3o: number;
  // Sellmeier coefficients for extraordinary ray
  B1e: number; B2e: number; B3e: number;
  C1e: number; C2e: number; C3e: number;
  dnTypical: number; // typical birefringence at 589nm
}

const crystals: Record<string, Crystal> = {
  "Calcite": {
    name: "Calcite (CaCO₃)",
    B1o: 0.8559, B2o: 0.8359, B3o: 0.0033,
    C1o: 0.005083, C2o: 0.014569, C3o: 0.010639,
    B1e: 1.0856, B2e: 0.0988, B3e: 0.3174,
    C1e: 0.006000, C2e: 0.021080, C3e: 0.097750,
    dnTypical: -0.172,
  },
  "Quartz": {
    name: "Quartz (SiO₂)",
    B1o: 0.6961663, B2o: 0.4079426, B3o: 0.8974794,
    C1o: 0.0684043, C2o: 0.1162414, C3o: 9.896161,
    B1e: 0.7400480, B2e: 0.4199740, B3e: 0.8907644,
    C1e: 0.0697253, C2e: 0.1153987, C3e: 10.53298,
    dnTypical: 0.009,
  },
  "LiNbO3": {
    name: "LiNbO₃",
    B1o: 2.6734, B2o: 1.2290, B3o: 12.614,
    C1o: 0.01354, C2o: 0.06200, C3o: 474.60,
    B1e: 2.9804, B2e: 0.5981, B3e: 8.9543,
    C1e: 0.01354, C2e: 0.02020, C3e: 416.08,
    dnTypical: -0.082,
  },
  "BBO": {
    name: "BBO (β-BaB₂O₄)",
    B1o: 1.1318, B2o: 0.1875, B3o: 1.9030,
    C1o: 0.007040, C2o: 0.011980, C3o: 760.00,
    B1e: 1.0950, B2e: 0.2100, B3e: 1.6530,
    C1e: 0.006000, C2e: 0.012000, C3e: 620.00,
    dnTypical: -0.115,
  },
  "KDP": {
    name: "KDP (KH₂PO₄)",
    B1o: 1.4486, B2o: 0.3466, B3o: 5.8176,
    C1o: 0.013100, C2o: 0.018000, C3o: 400.00,
    B1e: 1.4410, B2e: 0.3427, B3e: 5.6452,
    C1e: 0.012400, C2e: 0.017900, C3e: 380.00,
    dnTypical: -0.044,
  },
  "Rutile": {
    name: "Rutile (TiO₂)",
    B1o: 4.2291, B2o: 3.5230, B3o: 0.0077,
    C1o: 0.020370, C2o: 0.041100, C3o: 0.007004,
    B1e: 4.5562, B2e: 3.4334, B3e: 0.0084,
    C1e: 0.022000, C2e: 0.041600, C3e: 0.007500,
    dnTypical: -0.287,
  },
};

function sellmeier(B1: number, B2: number, B3: number, C1: number, C2: number, C3: number, lam: number) {
  const l2 = lam * lam;
  return Math.sqrt(1 + B1 * l2 / (l2 - C1) + B2 * l2 / (l2 - C2) + B3 * l2 / (l2 - C3));
}

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function BirefringentCrystalsPage() {
  const [wavelength, setWavelength] = useState(589);
  const [selected, setSelected] = useState("Quartz");

  const c = crystals[selected];
  const no = useMemo(() => sellmeier(c.B1o, c.B2o, c.B3o, c.C1o, c.C2o, c.C3o, wavelength / 1000), [c, wavelength]);
  const ne = useMemo(() => sellmeier(c.B1e, c.B2e, c.B3e, c.C1e, c.C2e, c.C3e, wavelength / 1000), [c, wavelength]);
  const dn = ne - no;

  const chartData = useMemo(() => {
    const ws: number[] = [];
    for (let w = 300; w <= 2500; w += 5) ws.push(w);
    const entries = Object.entries(crystals);
    return [
      ...entries.map(([key, cr], i) => ({
        x: ws,
        y: ws.map(w => sellmeier(cr.B1o, cr.B2o, cr.B3o, cr.C1o, cr.C2o, cr.C3o, w / 1000)),
        type: "scatter" as const, mode: "lines" as const,
        name: `${cr.name} nₒ`, line: { color: colors[i % colors.length], width: key === selected ? 2.5 : 1, dash: "dot" },
      })),
      ...entries.map(([key, cr], i) => ({
        x: ws,
        y: ws.map(w => sellmeier(cr.B1e, cr.B2e, cr.B3e, cr.C1e, cr.C2e, cr.C3e, w / 1000)),
        type: "scatter" as const, mode: "lines" as const,
        name: `${cr.name} nₑ`, line: { color: colors[i % colors.length], width: key === selected ? 3 : 1.5 },
      })),
    ];
  }, [selected]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Birefringent Crystals" description="Ordinary (nₒ) and extraordinary (nₑ) refractive indices">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Crystal</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(crystals).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={200} max={5000} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">nₒ (ordinary)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{no.toFixed(6)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">nₑ (extraordinary)</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{ne.toFixed(6)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δn = nₑ − nₒ</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{dn.toFixed(6)}</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Refractive Index", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.3, font: { size: 9 } },
        }}
       
       
      />
    </CalculatorShell>
  );
}
