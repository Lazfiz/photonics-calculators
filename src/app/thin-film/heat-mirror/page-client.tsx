"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

// Transfer matrix method for multilayer stacks
function computeRT(
  layers: { n: number; d: number }[],
  nInc: number,
  nSub: number,
  wavelengths: number[]
) {
  const R: number[] = [];
  for (const wl of wavelengths) {
    let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
    let m21r = 0, m21i = 0, m22r = 1, m22i = 0;

    for (const layer of layers) {
      const delta = (2 * Math.PI * layer.n * layer.d) / wl;
      const cosD = Math.cos(delta);
      const sinD = Math.sin(delta);
      const n = layer.n;

      const a11r = cosD, a11i = 0;
      const a12r = 0, a12i = -sinD / n;
      const a21r = 0, a21i = -n * sinD;
      const a22r = cosD, a22i = 0;

      const new11r = m11r * a11r - m11i * a11i + m12r * a21r - m12i * a21i;
      const new11i = m11r * a11i + m11i * a11r + m12r * a21i + m12i * a21r;
      const new12r = m11r * a12r - m11i * a12i + m12r * a22r - m12i * a22i;
      const new12i = m11r * a12i + m11i * a12r + m12r * a22i + m12i * a22r;
      const new21r = m21r * a11r - m21i * a11i + m22r * a21r - m22i * a21i;
      const new21i = m21r * a11i + m21i * a11r + m22r * a21i + m22i * a21r;
      const new22r = m21r * a12r - m21i * a12i + m22r * a22r - m22i * a22i;
      const new22i = m21r * a12i + m21i * a12r + m22r * a22i + m22i * a22r;

      m11r = new11r; m11i = new11i; m12r = new12r; m12i = new12i;
      m21r = new21r; m21i = new21i; m22r = new22r; m22i = new22i;
    }

    const numR = m11r * nInc + m12r * nInc * nSub - m21r - m22r * nSub;
    const numI = m11i * nInc + m12i * nInc * nSub - m21i - m22i * nSub;
    const denR = m11r * nInc + m12r * nInc * nSub + m21r + m22r * nSub;
    const denI = m11i * nInc + m12i * nInc * nSub + m21i + m22i * nSub;
    R.push((numR * numR + numI * numI) / (denR * denR + denI * denI));
  }
  return R;
}

export default function HeatMirrorPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [numPairs, setNumPairs] = useState(5);
  const [designWl, setDesignWl] = useState(10000); // IR heat mirror: reflect ~10μm

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 250 + i * 14750 / 500);
    const dH = designWl / (4 * nH);
    const dL = designWl / (4 * nL);

    const layers: { n: number; d: number }[] = [];
    for (let j = 0; j < numPairs * 2; j++) {
      const n = j % 2 === 0 ? nL : nH;
      const d = j % 2 === 0 ? dL : dH;
      layers.push({ n, d });
    }

    const R = computeRT(layers, nInc, nSub, wls);
    const T = wls.map((_, i) => 1 - R[i]);

    // Blackbody curves at T=5800K (sun) and T=300K (room)
    const bbSun = wls.map(wl => {
      const lam = wl * 1e-9;
      const h = 6.626e-34, c = 3e8, k = 1.381e-23;
      const exp = Math.min(h * c / (lam * k * 5800), 500);
      return (2 * h * c * c / (Math.pow(lam, 5))) / (Math.exp(exp) - 1) * 1e-12;
    });
    const bbRoom = wls.map(wl => {
      const lam = wl * 1e-9;
      const h = 6.626e-34, c = 3e8, k = 1.381e-23;
      const exp = Math.min(h * c / (lam * k * 300), 500);
      return (2 * h * c * c / (Math.pow(lam, 5))) / (Math.exp(exp) - 1) * 1e-12;
    });
    const maxBBSun = Math.max(...bbSun);
    const normSun = bbSun.map(v => v / maxBBSun);

    return [
      { x: wls, y: normSun, type: "scatter" as const, mode: "lines" as const, name: "Solar BB (5800K, norm.)", line: { color: "#fbbf24", width: 1, dash: "dot" }, yaxis: "y2" },
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  const dH = designWl / (4 * nH);
  const dL = designWl / (4 * nL);
  const rMax = Math.pow(nH / nL, 2 * numPairs);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Heat Mirror Design" description="Heat mirrors reflect infrared (thermal radiation) while transmitting visible light.
        A quarter-wave stack centered in the IR (e.g., 8–12 μm) reflects thermal radiation from room-temperature objects.
        Solar radiation (~0.3–2.5 μm) passes through. Critical for energy-efficient windows and thermal management.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>H</sub> (high index, e.g. TiO₂)</span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>L</sub> (low index, e.g. SiO₂)</span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Number of pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={20} />
        <ValidatedNumberInput label="Design λ₀ (nm) — IR center" value={designWl} onChange={setDesignWl} step="100" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">d<sub>H</sub> = <span className="text-blue-400 font-mono">{dH.toFixed(1)} nm</span>, d<sub>L</sub> = <span className="text-blue-400 font-mono">{dL.toFixed(1)} nm</span></p>
        <p className="text-gray-300">R<sub>max</sub> (at λ₀) ≈ <span className="text-blue-400 font-mono">{(((rMax - 1) / (rMax + 1)) ** 2 * 100).toFixed(4)}%</span></p>
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
        <p className="text-gray-300 text-xs mt-2">Formula: R<sub>max</sub> = [(n<sub>H</sub>/n<sub>L</sub>)<sup>2N</sup> − 1]² / [(n<sub>H</sub>/n<sub>L</sub>)<sup>2N</sup> + 1]²</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", range: [250, 15000] },
        yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
        yaxis2: { title: "Solar BB (norm.)", overlaying: "y", side: "right", gridcolor: "#374151", range: [0, 1.2], showgrid: false },
        margin: { t: 20, b: 40, l: 50, r: 50 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />
    </CalculatorShell>
  );
}
