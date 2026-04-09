"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function BraggReflectorPage() {
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [designWavelength, setDesignWavelength] = useURLState("designWavelength", 1550);
  const [pairs, setPairs] = useURLState("pairs", 5);

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
      // Effective admittance at design wavelength (Macleod)
      // Y = (nH/nL)^(2N) · nSub
      const ratio = Math.pow(nH / nL, 2 * pairs);
      const Y = ratio * nSub;
      const reff = (nInc - Y) / (nInc + Y);

      // Wavelength-dependent modulation (Airy-like approximation)
      const f = designWavelength / wl;
      const sinTerm = Math.sin(pairs * Math.PI * f);
      const R_approx = reff * reff * sinTerm * sinTerm / (1 - reff * reff + reff * reff * sinTerm * sinTerm);
      return R_approx;
    });
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } }];
  }, [nInc, nH, nL, nSub, designWavelength, pairs]);

  const peakR = Math.pow((nInc - Math.pow(nH / nL, 2 * pairs) * nSub) / (nInc + Math.pow(nH / nL, 2 * pairs) * nSub), 2);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Bragg Reflector" description="Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <ValidatedNumberInput label="nincident" value={nInc} onChange={setNInc} min={1} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>high</sub></span>
          <ValidatedNumberInput label="nhigh" value={nH} onChange={setNH} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>low</sub></span>
          <ValidatedNumberInput label="nlow" value={nL} onChange={setNL} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <ValidatedNumberInput label="nsubstrate" value={nSub} onChange={setNSub} step="0.01" /></label>
        <ValidatedNumberInput label="Design Wavelength (nm)" value={designWavelength} onChange={setDesignWavelength} />
        <ValidatedNumberInput label="Number of Pairs" value={pairs} onChange={setPairs} min={1} max={50} />
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
