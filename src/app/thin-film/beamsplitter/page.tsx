"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


function computeRT(layers: { n: number; d: number }[], nInc: number, nSub: number, wavelengths: number[]) {
  const R: number[] = [];
  for (const wl of wavelengths) {
    let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
    let m21r = 0, m21i = 0, m22r = 1, m22i = 0;
    for (const layer of layers) {
      const delta = (2 * Math.PI * layer.n * layer.d) / wl;
      const cosD = Math.cos(delta), sinD = Math.sin(delta), n = layer.n;
      const new11r = m11r * cosD + m12r * (-n * sinD);
      const new11i = m11i * cosD + m12i * (-n * sinD);
      const new12r = m11r * (-sinD / n) + m12r * cosD;
      const new12i = m11i * (-sinD / n) + m12i * cosD;
      const new21r = m21r * cosD + m22r * (-n * sinD);
      const new21i = m21i * cosD + m22i * (-n * sinD);
      const new22r = m21r * (-sinD / n) + m22r * cosD;
      const new22i = m21i * (-sinD / n) + m22i * cosD;
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

export default function BeamsplitterPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [designWl, setDesignWl] = useState(550);
  const [targetR, setTargetR] = useState(50); // 50/50 beamsplitter

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 600 / 500);

    // For a 50/50 beamsplitter, find the number of QWL pairs to hit target R
    // Single layer Fresnel: R = ((nH-nL)/(nH+nL))^2 for one interface
    // We use a single half-wave layer or specific stack
    // Simpler: use a single non-QWL layer of variable thickness
    // Actually, let's do a single dielectric layer approach
    // R = (r1^2 + r2^2 + 2*r1*r2*cos(2δ)) / (1 + r1^2*r2^2 + 2*r1*r2*cos(2δ))
    // where r1 = (nInc - nFilm)/(nInc + nFilm), r2 = (nFilm - nSub)/(nFilm + nSub)

    const traces: any[] = [];

    // Multiple nFilm values for comparison
    const nFilms = [1.7, 2.0, 2.35, 2.7];
    const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa"];

    for (let fi = 0; fi < nFilms.length; fi++) {
      const nF = nFilms[fi];
      const d = designWl / (4 * nF);
      const r1 = (nInc - nF) / (nInc + nF);
      const r2 = (nF - nSub) / (nF + nSub);

      const R = wls.map(wl => {
        const delta = (2 * Math.PI * nF * d) / wl;
        const cos2d = Math.cos(2 * delta);
        const num = r1 * r1 + r2 * r2 + 2 * r1 * r2 * cos2d;
        const den = 1 + r1 * r1 * r2 * r2 + 2 * r1 * r2 * cos2d;
        return num / den;
      });

      traces.push({
        x: wls, y: R, type: "scatter" as const, mode: "lines" as const,
        name: `n_film = ${nF}`,
        line: { color: colors[fi], width: 2 },
      });
    }

    // Also show multilayer approach: (HL)^N with varying N
    const Ns = [1, 2, 3];
    const dH = designWl / (4 * nH);
    const dL = designWl / (4 * nL);
    const mlColors = ["#a78bfa", "#fb923c", "#f472b6"];

    for (let ni = 0; ni < Ns.length; ni++) {
      const layers: { n: number; d: number }[] = [];
      for (let j = 0; j < Ns[ni] * 2; j++) {
        layers.push({ n: j % 2 === 0 ? nH : nL, d: j % 2 === 0 ? dH : dL });
      }
      const R = computeRT(layers, nInc, nSub, wls);
      traces.push({
        x: wls, y: R, type: "scatter" as const, mode: "lines" as const,
        name: `(HL)^${Ns[ni]}`,
        line: { color: mlColors[ni], width: 1.5, dash: "dash" },
      });
    }

    // 50% line
    traces.push({
      x: [300, 900], y: [0.5, 0.5], type: "scatter" as const, mode: "lines" as const,
      name: "50% line", line: { color: "#6b7280", width: 1, dash: "dot" },
    });

    return traces;
  }, [nH, nL, nSub, nInc, designWl, targetR]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Beamsplitter Design" description="Dielectric beamsplitters split light into reflected and transmitted beams. A single quarter-wave
        layer gives R &lt; 50% for most materials; multilayer (HL)N stacks approach 100%.
        A 50/50 split is achieved with specific layer thicknesses (non-quarter-wave) or by selecting
        the appropriate number of layer pairs near the stop band edge.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>H</sub> (high index)</span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>L</sub> (low index)</span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Design λ₀ (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} step="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300 text-xs">Single layer QWL R<sub>max</sub> = [(n<sub>f</sub>² − n<sub>inc</sub>·n<sub>sub</sub>) / (n<sub>f</sub>² + n<sub>inc</sub>·n<sub>sub</sub>)]²</p>
        <p className="text-gray-300 text-xs">Solid lines: single QWL layer with varying n<sub>film</sub>. Dashed: (HL)<sup>N</sup> multilayer.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />
    </CalculatorShell>
  );
}
