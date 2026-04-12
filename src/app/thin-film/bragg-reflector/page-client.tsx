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
    const dH = designWavelength / (4 * nH);
    const dL = designWavelength / (4 * nL);

    const R = wls.map(wl => {
      // Transfer matrix method (normal incidence, Macleod Ch. 2)
      let m00r = 1, m00i = 0; // M[0][0]
      let m01r = 0, m01i = 0; // M[0][1]
      let m10r = 0, m10i = 0; // M[1][0]
      let m11r = 1, m11i = 0; // M[1][1]

      const applyLayer = (n: number, d: number) => {
        const delta = (2 * Math.PI * n * d) / wl;
        const cosD = Math.cos(delta);
        const sinD = Math.sin(delta);
        const eta = n; // admittance at normal incidence

        // Characteristic matrix: [[cos δ, -i sin δ / η], [-i η sin δ, cos δ]]
        // Using complex: -i*sin = (0, -sin)
        const a00r = cosD, a00i = 0;
        const a01r = 0, a01i = -sinD / eta;
        const a10r = 0, a10i = -eta * sinD;
        const a11r = cosD, a11i = 0;

        // M = M · A (complex matrix multiply)
        const nr = m00r * a00r - m00i * a00i + m01r * a10r - m01i * a10i;
        const ni = m00r * a00i + m00i * a00r + m01r * a10i + m01i * a10r;
        const or_ = m00r * a01r - m00i * a01i + m01r * a11r - m01i * a11i;
        const oi = m00r * a01i + m00i * a01r + m01r * a11i + m01i * a11r;
        const pr = m10r * a00r - m10i * a00i + m11r * a10r - m11i * a10i;
        const pi = m10r * a00i + m10i * a00r + m11r * a10i + m11i * a10r;
        const qr = m10r * a01r - m10i * a01i + m11r * a11r - m11i * a11i;
        const qi = m10r * a01i + m10i * a01r + m11r * a11i + m11i * a11r;

        m00r = nr; m00i = ni; m01r = or_; m01i = oi;
        m10r = pr; m10i = pi; m11r = qr; m11i = qi;
      };

      // Stack: air | (H L)^N | substrate
      for (let i = 0; i < pairs; i++) {
        applyLayer(nH, dH);
        applyLayer(nL, dL);
      }

      // Reflection coefficient: r = (m00*nS + m01*nS*n0 - m10 - m11*n0) / (m00*nS + m01*nS*n0 + m10 + m11*n0)
      // Using real n0, nS and complex M
      const numR = m00r * nSub + m10r + (m01r * nSub * nInc - m11r * nInc);
      const numI = m00i * nSub + m10i + (m01i * nSub * nInc - m11i * nInc);
      const denR = m00r * nSub - m10r + (m01r * nSub * nInc + m11r * nInc);
      const denI = m00i * nSub - m10i + (m01i * nSub * nInc + m11i * nInc);

      const rMag2 = (numR * numR + numI * numI) / (denR * denR + denI * denI);
      return rMag2;
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
