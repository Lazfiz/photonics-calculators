"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function AntiFogPage() {
  const [nCoat, setNCoat] = useState(1.33);
  const [nSub, setNSub] = useState(1.52);
  const [designWl, setDesignWl] = useState(550);
  const [thickness, setThickness] = useState(120);
  const [contactAngle, setContactAngle] = useState(15);

  // Anti-fog principle: hydrophilic coating → low contact angle → uniform water film
  // Optically: thin film acts as partial AR at visible wavelengths
  // Key metric: no scattering from water droplets when surface is hydrophilic (θ < 30°)

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 350 + i * 500 / N);
    const d = thickness; // nm

    const R = wls.map(wl => {
      const delta = (2 * Math.PI * nCoat * d) / wl;
      const c = Math.cos(delta), s = Math.sin(delta);

      // Single layer: substrate interface
      // Fresnel: r = (r12 + r23·exp(2iδ)) / (1 + r12·r23·exp(2iδ))
      // Using transfer matrix instead for real-valued calculation

      // Complex Fresnel not needed — use transfer matrix instead
      const eta = nCoat;
      const M = [[c, -s / eta], [s * eta, c]] as [number, number][];

      const nInc = 1.0;
      const rNum = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const rDen = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (rNum / rDen) ** 2;
    });

    // With water layer on top (fog): n_water ≈ 1.33
    const RwithWater = wls.map(wl => {
      const delta1 = (2 * Math.PI * nCoat * d) / wl;
      const delta2 = (2 * Math.PI * 1.33 * 1000) / wl; // 1µm water film

      let M = [[1, 0], [0, 1]] as [number, number][];
      const addLayer = (n: number, delta: number) => {
        const c = Math.cos(delta), s = Math.sin(delta);
        const L: [number, number][] = [[c, -s / n], [s * n, c]];
        M = [
          [M[0][0]*L[0][0]+M[0][1]*L[1][0], M[0][0]*L[0][1]+M[0][1]*L[1][1]],
          [M[1][0]*L[0][0]+M[1][1]*L[1][0], M[1][0]*L[0][1]+M[1][1]*L[1][1]],
        ];
      };

      addLayer(1.33, delta2); // water
      addLayer(nCoat, delta1); // coating

      const nInc = 1.0;
      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });

    return { wls, R, RwithWater };
  }, [nCoat, nSub, thickness]);

  const T = tmm.R.map(r => 1 - r);
  const TwithWater = tmm.RwithWater.map(r => 1 - r);
  const avgT = T.reduce((a, b) => a + b) / T.length;
  const avgTwithWater = TwithWater.reduce((a, b) => a + b) / TwithWater.length;

  // Surface energy from contact angle (Young's equation approximation)
  // γ_sv = γ_sl + γ_lv · cos(θ) → cos(θ) close to 1 means hydrophilic
  const cosTheta = Math.cos(contactAngle * Math.PI / 180);
  const surfaceEnergy = cosTheta * 72.8; // mN/m, relative to water (γ_water = 72.8 mN/m)

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Anti-Fog Coating Design" description="Hydrophilic thin film that spreads condensation into a uniform water layer, minimizing scattering.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>coating</sub></span>
          <input type="number" value={nCoat} onChange={e => setNCoat(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Coating thickness (nm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Contact angle (°)</span>
          <input type="number" value={contactAngle} onChange={e => setContactAngle(+e.target.value)} min={0} max={90} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Dry T (avg)</p>
          <p className="text-2xl font-bold text-blue-400">{(avgT * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">With fog T (avg)</p>
          <p className="text-2xl font-bold text-cyan-400">{(avgTwithWater * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Surface Energy</p>
          <p className="text-2xl font-bold text-green-400">{surfaceEnergy.toFixed(1)} mN/m</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                                      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: T, type: "scatter", mode: "lines", name: "Dry T", line: { color: "#60a5fa", width: 2 } },
          { x: tmm.wls, y: TwithWater, type: "scatter", mode: "lines", name: "With fog T", line: { color: "#22d3ee", width: 2 } },
          { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "Dry R", line: { color: "#f87171", width: 1, dash: "dot" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { orientation: "h", y: 1.12 },
        }} />
      </div>
    </CalculatorShell>
  );
}
