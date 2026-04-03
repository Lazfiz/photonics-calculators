"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function computeRT(layers: { n: number; d: number }[], nInc: number, nSub: number, wavelengths: number[], angleDeg: number) {
  const R: number[] = [];
  const thetaInc = angleDeg * Math.PI / 180;
  const cosThetaInc = Math.cos(thetaInc);
  const sinThetaInc = Math.sin(thetaInc);

  for (const wl of wavelengths) {
    let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
    let m21r = 0, m21i = 0, m22r = 1, m22i = 0;
    let nEffPrev = nInc;

    for (const layer of layers) {
      // Snell's law for refraction angle in each layer
      const sinThetaLayer = nInc * sinThetaInc / layer.n;
      const cosThetaLayer = Math.sqrt(1 - sinThetaLayer * sinThetaLayer);
      // TE polarization effective index
      const nEff = layer.n * cosThetaLayer;

      const delta = (2 * Math.PI * nEff * layer.d) / wl;
      const cosD = Math.cos(delta), sinD = Math.sin(delta);

      const new11r = m11r * cosD + m12r * (-nEff * sinD);
      const new11i = m11i * cosD + m12i * (-nEff * sinD);
      const new12r = m11r * (-sinD / nEff) + m12r * cosD;
      const new12i = m11i * (-sinD / nEff) + m12i * cosD;
      const new21r = m21r * cosD + m22r * (-nEff * sinD);
      const new21i = m21i * cosD + m22i * (-nEff * sinD);
      const new22r = m21r * (-sinD / nEff) + m22r * cosD;
      const new22i = m21i * (-sinD / nEff) + m22i * cosD;
      m11r = new11r; m11i = new11i; m12r = new12r; m12i = new12i;
      m21r = new21r; m21i = new21i; m22r = new22r; m22i = new22i;
    }

    // Substrate angle
    const sinThetaSub = nInc * sinThetaInc / nSub;
    const cosThetaSub = Math.sqrt(1 - sinThetaSub * sinThetaSub);
    const nEffSub = nSub * cosThetaSub;
    const nEffInc = nInc * cosThetaInc;

    const numR = m11r * nEffInc + m12r * nEffInc * nEffSub - m21r - m22r * nEffSub;
    const numI = m11i * nEffInc + m12i * nEffInc * nEffSub - m21i - m22i * nEffSub;
    const denR = m11r * nEffInc + m12r * nEffInc * nEffSub + m21r + m22r * nEffSub;
    const denI = m11i * nEffInc + m12i * nEffInc * nEffSub + m21i + m22i * nEffSub;
    R.push((numR * numR + numI * numI) / (denR * denR + denI * denI));
  }
  return R;
}

export default function WavelengthSeparationPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [numPairs, setNumPairs] = useState(5);
  const [designWl, setDesignWl] = useState(550);
  const [bandwidthFactor, setBandwidthFactor] = useState(1.0); // 1.0 = QWL, >1 = broader

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 600 }, (_, i) => 300 + i * 600 / 600);
    const dH = bandwidthFactor * designWl / (4 * nH);
    const dL = bandwidthFactor * designWl / (4 * nL);

    // Two-stack approach: stack A centered at λ₁, stack B centered at λ₂
    // Reflects λ₁, transmits λ₂ (or vice versa)
    const sepRatio = 1.25; // λ₂/λ₁ ratio
    const lambda1 = designWl;
    const lambda2 = designWl * sepRatio;

    const dH1 = lambda1 / (4 * nH);
    const dL1 = lambda1 / (4 * nL);
    const dH2 = lambda2 / (4 * nH);
    const dL2 = lambda2 / (4 * nL);

    // Stack A: reflects λ₁
    const layersA: { n: number; d: number }[] = [];
    for (let j = 0; j < numPairs * 2; j++) {
      layersA.push({ n: j % 2 === 0 ? nH : nL, d: j % 2 === 0 ? dH1 : dL1 });
    }

    // Stack B: reflects λ₂
    const layersB: { n: number; d: number }[] = [];
    for (let j = 0; j < numPairs * 2; j++) {
      layersB.push({ n: j % 2 === 0 ? nH : nL, d: j % 2 === 0 ? dH2 : dL2 });
    }

    // Combined: A on top of B
    const layersAB = [...layersA, ...layersB];

    const R_A = computeRT(layersA, nInc, nSub, wls, 0);
    const R_B = computeRT(layersB, nInc, nSub, wls, 0);
    const R_AB = computeRT(layersAB, nInc, nSub, wls, 0);

    return [
      { x: wls, y: R_A, type: "scatter" as const, mode: "lines" as const,
        name: `Reflects λ₁ = ${lambda1} nm`, line: { color: "#f87171", width: 2 } },
      { x: wls, y: R_B, type: "scatter" as const, mode: "lines" as const,
        name: `Reflects λ₂ = ${lambda2} nm`, line: { color: "#60a5fa", width: 2 } },
      { x: wls, y: R_AB, type: "scatter" as const, mode: "lines" as const,
        name: "Combined stack", line: { color: "#34d399", width: 2, dash: "dash" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl, bandwidthFactor]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Wavelength Separation</h1>
      <p className="text-gray-400 mb-8">
        Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths
        to reflect specific bands while transmitting others. Two stacks centered at λ₁ and λ₂ = 1.25·λ₁
        demonstrate dichroic behavior. The combined stack shows how reflectance bands add when cascaded.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n<sub>H</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>L</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pairs per stack (N)</span>
          <input type="number" value={numPairs} onChange={e => setNumPairs(Math.max(1, +e.target.value))} min="1" max="20" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">λ₁ center (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} step="10" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">λ₁ = <span className="text-blue-400 font-mono">{designWl} nm</span>, λ₂ = <span className="text-blue-400 font-mono">{(designWl * 1.25).toFixed(0)} nm</span></p>
        <p className="text-gray-300">Total layers (combined) = <span className="text-blue-400 font-mono">{numPairs * 4}</span></p>
        <p className="text-gray-300 text-xs mt-2">Each stack: (HL)<sup>N</sup>. Combined: Stack₁ | Stack₂ on substrate.</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
