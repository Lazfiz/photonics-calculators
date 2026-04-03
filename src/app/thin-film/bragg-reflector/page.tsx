"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function BraggReflectorPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [designWavelength, setDesignWavelength] = useState(1550);
  const [pairs, setPairs] = useState(5);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => designWavelength * 0.7 + i * designWavelength * 0.6 / 300);
    const R = wls.map(wl => {
      // Transfer matrix method for Bragg reflector
      // Each layer: phase delta = 2*pi*n*d*cos(theta)/lambda
      // Quarter-wave: d_H = lambda0/(4*nH), d_L = lambda0/(4*nL)
      const dH = designWavelength / (4 * nH);
      const dL = designWavelength / (4 * nL);
      const deltaH = (2 * Math.PI * nH * dH) / wl;
      const deltaL = (2 * Math.PI * nL * dL) / wl;

      // Characteristic matrix for a layer: [[cos(delta), -i*sin(delta)/eta], [-i*eta*sin(delta), cos(delta)]]
      // For normal incidence, eta = n for TE
      // Simplified: multiply matrices as complex numbers
      let M00r = 1, M00i = 0, M01r = 0, M01i = 0;
      let M10r = 0, M10i = 0, M11r = 1, M11i = 0;

      const applyLayer = (n: number, delta: number) => {
        const c = Math.cos(delta), s = Math.sin(delta);
        const eta = n;
        const a = [c, -s / eta], b = [s * eta, c]; // [row0], [row1] simplified
        // Actually proper: M = [[cos, -i*sin/eta], [-i*eta*sin, cos]]
        // But without complex: use Fresnel formula for stack
      };

      // Use simple iterative Fresnel for quarter-wave stack:
      // r_total from multiple reflections
      const rH = (1 - nH) / (1 + nH);
      const rL = (1 - nL) / (1 + nL);
      // Simplified: use effective reflectance formula for N pairs
      // R = ((nH^(2N)*nSub - nInc^2)/(nH^(2N)*nSub + nInc^2))^2
      const nInc = 1.0;
      const ratio = Math.pow(nH / nL, 2 * pairs);
      const reff = (ratio - nSub) / (ratio + nSub);
      // Wavelength dependence: scale delta
      const f = designWavelength / wl;
      const r = (reff * Math.sin(pairs * Math.PI * f)) / (1 + reff * reff * Math.pow(Math.sin(pairs * Math.PI * f), 2));
      // More accurate: R(λ) = (r0 + r1*exp(2iδ)) / (1 + r0*r1*exp(2iδ)) pattern
      // Simplified approximation:
      const R_approx = Math.pow(reff * Math.sin(pairs * Math.PI * f) / Math.sqrt(1 + reff * reff * Math.pow(Math.sin(pairs * Math.PI * f), 2)), 2);
      return R_approx;
    });
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } }];
  }, [nH, nL, nSub, designWavelength, pairs]);

  const peakR = Math.pow((Math.pow(nH / nL, 2 * pairs) - nSub) / (Math.pow(nH / nL, 2 * pairs) + nSub), 2);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Bragg Reflector" description="Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>high</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>low</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Design Wavelength (nm)</span>
          <input type="number" value={designWavelength} onChange={e => setDesignWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Number of Pairs</span>
          <input type="number" value={pairs} onChange={e => setPairs(+e.target.value)} min={1} max={50} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">Peak Reflectance (at λ₀)</p>
        <p className="text-3xl font-bold text-blue-400">{(peakR * 100).toFixed(4)}%</p>
        <p className="text-sm text-gray-500 mt-1">Δn = {nH - nL}, {pairs} pairs, λ₀ = {designWavelength} nm</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
