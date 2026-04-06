"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


interface Glass {
  name: string;
  B1: number; B2: number; B3: number;
  C1: number; C2: number; C3: number;
  nd: number; vd: number;
}

const glasses: Record<string, Glass> = {
  "N-BK7": {
    name: "N-BK7", B1: 1.03961212, B2: 0.231792344, B3: 1.01046945,
    C1: 0.00600069867, C2: 0.0200179144, C3: 103.560653, nd: 1.5168, vd: 64.17
  },
  "N-SF11": {
    name: "N-SF11", B1: 1.73759695, B2: 0.313747346, B3: 1.89878101,
    C1: 0.013188707, C2: 0.0623068142, C3: 155.23629, nd: 1.7847, vd: 25.76
  },
  "N-LASF9": {
    name: "N-LASF9", B1: 2.00073995, B2: 0.298989957, B3: 1.56668222,
    C1: 0.0122451539, C2: 0.0546850193, C3: 147.554483, nd: 1.8503, vd: 32.27
  },
  "N-BAK4": {
    name: "N-BAK4", B1: 1.05649266, B2: 0.129394004, B3: 0.947829028,
    C1: 0.00647370733, C2: 0.0199192279, C3: 104.168227, nd: 1.5688, vd: 56.08
  },
  "N-SF6": {
    name: "N-SF6", B1: 1.77931769, B2: 0.337593542, B3: 2.08753983,
    C1: 0.0133714482, C2: 0.0622527572, C3: 155.496742, nd: 1.8052, vd: 25.43
  },
  "N-FK5": {
    name: "N-FK5", B1: 1.00475732, B2: 0.227088442, B3: 0.891776239,
    C1: 0.00590090522, C2: 0.0194439887, C3: 95.4733534, nd: 1.4875, vd: 70.41
  },
  "N-LLF1": {
    name: "N-LLF1", B1: 1.06480112, B2: 0.198843746, B3: 0.894558858,
    C1: 0.00576231685, C2: 0.0187799721, C3: 93.9449372, nd: 1.5317, vd: 48.68
  },
  "N-SK16": {
    name: "N-SK16", B1: 1.05679612, B2: 0.116938049, B3: 0.974575461,
    C1: 0.00594128832, C2: 0.0172961939, C3: 103.569348, nd: 1.6204, vd: 60.35
  },
  "N-LaK22": {
    name: "N-LaK22", B1: 1.50978347, B2: 0.201653557, B3: 1.39406715,
    C1: 0.0107999777, C2: 0.0541972456, C3: 134.933812, nd: 1.7550, vd: 51.04
  },
  "N-SSK2": {
    name: "N-SSK2", B1: 1.14230770, B2: 0.243471706, B3: 1.10968280,
    C1: 0.00620701239, C2: 0.0212360913, C3: 105.517703, nd: 1.6228, vd: 53.27
  },
};

function sellmeier(g: Glass, lambdaUm: number): number {
  const l2 = lambdaUm * lambdaUm;
  const n2 = 1 + g.B1 * l2 / (l2 - g.C1) + g.B2 * l2 / (l2 - g.C2) + g.B3 * l2 / (l2 - g.C3);
  return Math.sqrt(n2);
}

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7"];

export default function SchottGlassPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 587.6);
  const [selected, setSelected] = useState("N-BK7");

  const n = useMemo(() => sellmeier(glasses[selected], wavelength / 1000), [selected, wavelength]);
  const glass = glasses[selected];

  const chartData = useMemo(() => {
    const ws: number[] = [];
    for (let w = 380; w <= 2500; w += 5) ws.push(w);
    const entries = Object.entries(glasses);
    return entries.map(([key, g], i) => ({
      x: ws,
      y: ws.map(w => sellmeier(g, w / 1000)),
      type: "scatter" as const,
      mode: "lines" as const,
      name: g.name,
      line: { color: colors[i % colors.length], width: key === selected ? 3 : 1.5 },
    }));
  }, [selected]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Schott Glass Catalog" description="Refractive index n(λ) from SCHOTT Sellmeier coefficients">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Glass Type</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(glasses).map(([k, v]) => <option key={k} value={k}>{v.name} (n<sub>d</sub>={v.nd}, ν<sub>d</sub>={v.vd})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={380} max={2500} step={0.1} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n at {wavelength} nm</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{n.toFixed(6)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n<sub>d</sub> (587.6 nm)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{glass.nd.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ν<sub>d</sub> (Abbe)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{glass.vd.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dispersion class</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{glass.vd > 50 ? "Crown" : glass.vd > 35 ? "Light Flint" : "Flint"}</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Refractive Index n", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.2 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
