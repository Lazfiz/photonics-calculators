"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function WavelengthSelectionPage() {
  const [range, setRange] = useState(1);
  const [visibility, setVisibility] = useState(2);
  const [dataRate, setDataRate] = useState(10);
  const [eyeSafety, setEyeSafety] = useState(true);
  const [costBudget, setCostBudget] = useState<"low" | "mid" | "high">("mid");

  const calc = useMemo(() => {
    const lambdas = [850, 1064, 1310, 1550, 10000];
    const names = ["850 nm", "1064 nm", "1310 nm", "1550 nm", "10 μm"];
    const colors = ["#f43f5e", "#fb923c", "#facc15", "#06b6d4", "#a78bfa"];

    const scores = lambdas.map((wl, idx) => {
      // Eye safety (higher wavelength = safer, especially >1400nm)
      const eyeSafetyScore = wl >= 1400 ? 95 : wl >= 1000 ? 60 : 30;

      // Atmospheric transmission (Beer-Lambert with Kim model)
      const V = visibility * 1e3;
      const q = V < 0.5 ? 0 : V < 1 ? 1.6 : V < 2 ? 0.585 * Math.pow(V, 0.333) : 1.3;
      const beta = 3.91 / V * Math.pow(wl * 1e-6 / 0.55, -q);
      const att = beta * range;
      const atmosScore = Math.max(0, 100 - att * 5);

      // Component availability
      const componentScore = [90, 70, 85, 95, 30][idx];

      // Data rate capability
      const dataScore = wl <= 1550 ? Math.min(100, dataRate * 5) : Math.min(60, dataRate * 3);

      // Cost (850 cheap, 1550 moderate, 10um expensive)
      const costScore = [90, 70, 75, 65, 20][idx];

      // Weighted overall
      const weights = { eyeSafety: eyeSafety ? 0.25 : 0.05, atmos: 0.3, component: 0.15, data: 0.15, cost: 0.15 };
      const total = weights.eyeSafety * eyeSafetyScore + weights.atmos * atmosScore + weights.component * componentScore + weights.data * dataScore + weights.cost * costScore;

      return {
        name: names[idx], wl, color: colors[idx],
        eyeSafetyScore, atmosScore, componentScore, dataScore, costScore, total, att,
      };
    });

    const best = scores.reduce((a, b) => a.total > b.total ? a : b);
    return { scores, best };
  }, [range, visibility, dataRate, eyeSafety, costBudget]);

  const plotData = useMemo(() => {
    const categories = ["Eye Safety", "Atmosphere", "Components", "Data Rate", "Cost"];
    return calc.scores.map((s) => ({
      r: [s.eyeSafetyScore, s.atmosScore, s.componentScore, s.dataScore, s.costScore],
      theta: categories,
      type: "scatterpolar" as const, fill: "toself", name: s.name,
      line: { color: s.color },
    }));
  }, [calc]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm">
                <p className="text-gray-500 mt-1">850 nm (VCSEL), 1064 nm, 1310 nm, 1550 nm (eye-safe), 10 μm (CO₂ laser)</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Link Requirements</h2>
          {[
            ["Range (km)", range, setRange],
            ["Visibility (km)", visibility, setVisibility],
            ["Data Rate (Gbps)", dataRate, setDataRate],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={eyeSafety} onChange={(e) => setEyeSafety(e.target.checked)} className="rounded" />
            <label className="text-sm text-gray-400">Prioritise eye safety</label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Recommendation</h2>
            <div className="text-2xl font-bold text-green-400 mb-3">{calc.best.name}</div>
            <div className="space-y-2 text-sm">
              {calc.scores.sort((a, b) => b.total - a.total).map((s) => (
                <div key={s.name} className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" />
                    {s.name}
                  </span>
                  <span className={s.name === calc.best.name ? "text-green-400 font-bold" : "text-gray-400"}>
                    {s.total.toFixed(0)}/100 {s.name === calc.best.name ? "★" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              polar: { radialaxis: { visible: true, range: [0, 100], color: "#9ca3af", gridcolor: "#374151" } },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 30, r: 20, b: 20, l: 20 }, font: { color: "#9ca3af", size: 10 },
              legend: { x: 0.5, y: -0.1, orientation: "h", font: { size: 10 } },
              showlegend: true,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
