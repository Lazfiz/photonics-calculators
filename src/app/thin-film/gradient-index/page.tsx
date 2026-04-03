"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function GradientIndexPage() {
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [nSurface, setNSurface] = useState(1.38);
  const [thickness, setThickness] = useState(500);
  const [profile, setProfile] = useState<"linear" | "cosine" | "exponential">("cosine");
  const [designWl, setDesignWl] = useState(550);

  const tmm = useMemo(() => {
    const N = 400;
    const wls = Array.from({ length: N }, (_, i) => designWl * 0.5 + i * designWl / N);
    const numLayers = 50;

    const R = wls.map(wl => {
      let M = [[1, 0], [0, 1]] as [number, number][];

      for (let j = 0; j < numLayers; j++) {
        const frac = j / numLayers;
        let nLayer: number;
        if (profile === "linear") {
          nLayer = nSub + (nSurface - nSub) * frac;
        } else if (profile === "cosine") {
          nLayer = nSub + (nSurface - nSub) * (1 - Math.cos(Math.PI * frac)) / 2;
        } else {
          nLayer = nSub * Math.exp(frac * Math.log(nSurface / nSub));
        }
        const dLayer = thickness / numLayers;
        const delta = (2 * Math.PI * nLayer * dLayer) / wl;
        const c = Math.cos(delta), s = Math.sin(delta);
        const L: [number, number][] = [[c, -s / nLayer], [s * nLayer, c]];
        M = [
          [M[0][0]*L[0][0]+M[0][1]*L[1][0], M[0][0]*L[0][1]+M[0][1]*L[1][1]],
          [M[1][0]*L[0][0]+M[1][1]*L[1][0], M[1][0]*L[0][1]+M[1][1]*L[1][1]],
        ];
      }

      const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
      const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
      return (num / den) ** 2;
    });

    // Index profile for plotting
    const depths = Array.from({ length: 101 }, (_, i) => (thickness * i) / 100);
    const nProfile = depths.map(d => {
      const frac = d / thickness;
      if (profile === "linear") return nSub + (nSurface - nSub) * frac;
      if (profile === "cosine") return nSub + (nSurface - nSub) * (1 - Math.cos(Math.PI * frac)) / 2;
      return nSub * Math.exp(frac * Math.log(nSurface / nSub));
    });

    return { wls, R, depths, nProfile };
  }, [nSub, nInc, nSurface, thickness, profile, designWl]);

  const T = tmm.R.map(r => 1 - r);
  const designR = tmm.R[Math.round(tmm.wls.length / 2)];

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Gradient Index Coating" description="Continuously graded refractive index coating — broadband AR with no sharp interfaces.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>surface</sub></span>
          <input type="number" value={nSurface} onChange={e => setNSurface(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Thickness (nm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Design λ (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Profile</span>
          <select value={profile} onChange={e => setProfile(e.target.value as "linear" | "cosine" | "exponential")} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="linear">Linear</option>
            <option value="cosine">Cosine</option>
            <option value="exponential">Exponential</option>
          </select></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">R at Design λ</p>
          <p className="text-3xl font-bold text-blue-400">{(designR * 100).toFixed(4)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">T at Design λ</p>
          <p className="text-3xl font-bold text-green-400">{((1 - designR) * 100).toFixed(4)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                              </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Index Profile</p>
          <ChartPanel data={[{ x: tmm.nProfile, y: tmm.depths, type: "scatter", mode: "lines", line: { color: "#a78bfa" } }]} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af", size: 11 }, xaxis: { title: "Refractive Index", gridcolor: "#374151" },
            yaxis: { title: "Depth (nm)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 55 }, height: 280,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Reflectance / Transmittance</p>
          <ChartPanel data={[
            { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "R", line: { color: "#f87171" } },
            { x: tmm.wls, y: T, type: "scatter", mode: "lines", name: "T", line: { color: "#60a5fa" } },
          ]} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af", size: 11 }, xaxis: { title: "λ (nm)", gridcolor: "#374151" },
            yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
            margin: { t: 20, r: 20, b: 40, l: 45 }, height: 280,
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
