"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function HardCoatingPage() {
  const [nCoat, setNCoat] = useState(2.1);
  const [nSub, setNSub] = useState(1.52);
  const [designWl, setDesignWl] = useState(550);
  const [thickness, setThickness] = useState(200);
  const [hardness, setHardness] = useState(1200);
  const [stressGPa, setStressGPa] = useState(0.5);

  // Hard coatings: SiO₂, Al₂O₃, Si₃N₄, TiO₂, diamond-like carbon
  // Key properties: hardness, Young's modulus, stress, adhesion
  // Optical: typically acts as partial AR when thickness ≈ λ/(4n)

  const materials = [
    { name: "SiO₂", n: 1.46, H: 800, E: 73, stress: -0.3 },
    { name: "Al₂O₃", n: 1.63, H: 1200, E: 150, stress: -0.4 },
    { name: "Si₃N₄", n: 2.0, H: 1600, E: 220, stress: -0.8 },
    { name: "TiO₂", n: 2.35, H: 1100, E: 230, stress: -0.6 },
    { name: "DLC", n: 2.2, H: 3000, E: 500, stress: -2.0 },
  ];

  const selectedMaterial = materials.find(m => Math.abs(m.n - nCoat) < 0.2) || null;

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 300 + i * 600 / N);
    const d = thickness;

    const R = wls.map(wl => {
      const delta = (2 * Math.PI * nCoat * d) / wl;
      const c = Math.cos(delta), s = Math.sin(delta);
      const eta = nCoat;
      const M = [[c, -s / eta], [s * eta, c]] as [number, number][];

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });

    return { wls, R };
  }, [nCoat, nSub, thickness]);

  const T = tmm.R.map(r => 1 - r);

  // Critical stress for delamination (Griffith criterion simplified)
  const adhesionEnergy = 5; // J/m² typical for good adhesion
  const criticalStress = Math.sqrt(2 * adhesionEnergy * hardness * 1e9 / (Math.PI * 1e-6));

  // Scratch resistance (Buckle delamination threshold)
  const buckleThreshold = stressGPa > 0 ? `Low risk (compressive)` :
    stressGPa < -1 ? `High risk: ${(-stressGPa).toFixed(1)} GPa tension` :
    `Moderate: ${(-stressGPa).toFixed(1)} GPa tension`;

  // Quarter-wave AR condition check
  const idealThickness = designWl / (4 * nCoat);
  const arMismatch = Math.abs(thickness - idealThickness) / idealThickness * 100;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Hard Coating Design" description="Abrasion-resistant optical coating — balance mechanical hardness with optical performance.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>coating</sub></span>
          <input type="number" value={nCoat} onChange={e => setNCoat(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Thickness (nm)" value={thickness} onChange={setThickness} />
        <ValidatedNumberInput label="Hardness (HK₀.₀₁)" value={hardness} onChange={setHardness} />
        <ValidatedNumberInput label="Stress (GPa, negative=tension)" value={stressGPa} onChange={setStressGPa} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Avg Transmittance</p>
          <p className="text-2xl font-bold text-blue-400">{(T.reduce((a, b) => a + b) / T.length * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">AR Thickness (QW)</p>
          <p className="text-2xl font-bold text-green-400">{idealThickness.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">QW Mismatch</p>
          <p className="text-2xl font-bold text-yellow-400">{arMismatch.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Material Reference</h3>
        <div className="overflow-x-auto">
          <table className="text-sm text-gray-400 w-full">
            <thead><tr className="text-gray-500">
              <th className="text-left py-1 pr-4">Material</th>
              <th className="text-right py-1 pr-4">n</th>
              <th className="text-right py-1 pr-4">H (HK)</th>
              <th className="text-right py-1">σ (GPa)</th>
            </tr></thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.name} className={selectedMaterial?.name === m.name ? "text-blue-400" : ""}>
                  <td className="py-1 pr-4">{m.name}</td>
                  <td className="text-right py-1 pr-4">{m.n}</td>
                  <td className="text-right py-1 pr-4">{m.H}</td>
                  <td className="text-right py-1">{m.stress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                                      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#60a5fa", width: 2 } },
          { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171", width: 1 } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
