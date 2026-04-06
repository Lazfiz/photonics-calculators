"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

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

export default function PartialReflectorPage() {
  const [nFilm, setNFilm] = useState(1.7);
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [thicknessRatio, setThicknessRatio] = useState(1.0); // ratio to QWL
  const [designWl, setDesignWl] = useState(550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 600 / 500);
    const d = thicknessRatio * designWl / (4 * nFilm);
    const r1 = (nInc - nFilm) / (nInc + nFilm);
    const r2 = (nFilm - nSub) / (nFilm + nSub);

    // Single layer
    const R_single = wls.map(wl => {
      const delta = (2 * Math.PI * nFilm * d) / wl;
      const cos2d = Math.cos(2 * delta);
      const num = r1 * r1 + r2 * r2 + 2 * r1 * r2 * cos2d;
      const den = 1 + r1 * r1 * r2 * r2 + 2 * r1 * r2 * cos2d;
      return num / den;
    });

    // Fabry-Perot: substrate + two coatings (partial reflector on each side)
    // Model as: film | substrate | film
    const layers = [
      { n: nFilm, d },
      { n: nSub, d: 1000000 }, // thick substrate (just use nSub as exit)
      { n: nFilm, d },
    ];
    // Actually for a Fabry-Perot we need air gap, let's just show single layer at multiple thicknesses
    const traces: any[] = [
      { x: wls, y: R_single, type: "scatter" as const, mode: "lines" as const,
        name: `Single layer (d/λ₀ = ${thicknessRatio})`, line: { color: "#60a5fa", width: 2 } },
    ];

    // Sweep thickness ratios
    const ratios = [0.25, 0.5, 1.0, 1.5, 2.0];
    const ratioColors = ["#f87171", "#fbbf24", "#34d399", "#a78bfa", "#fb923c"];
    for (let ri = 0; ri < ratios.length; ri++) {
      if (Math.abs(ratios[ri] - thicknessRatio) < 0.01) continue;
      const dd = ratios[ri] * designWl / (4 * nFilm);
      const Rr = wls.map(wl => {
        const delta = (2 * Math.PI * nFilm * dd) / wl;
        const cos2d = Math.cos(2 * delta);
        const num = r1 * r1 + r2 * r2 + 2 * r1 * r2 * cos2d;
        const den = 1 + r1 * r1 * r2 * r2 + 2 * r1 * r2 * cos2d;
        return num / den;
      });
      traces.push({
        x: wls, y: Rr, type: "scatter" as const, mode: "lines" as const,
        name: `d/λ₀ = ${ratios[ri]}`, line: { color: ratioColors[ri], width: 1, dash: "dash" },
      });
    }

    // Show R at design wavelength for various nFilm
    const nRange = Array.from({ length: 200 }, (_, i) => 1.0 + i * 2.5 / 200);
    const R_vs_n = nRange.map(n => {
      const rr1 = (nInc - n) / (nInc + n);
      const rr2 = (n - nSub) / (n + nSub);
      return (rr1 * rr1 + rr2 * rr2 + 2 * rr1 * rr2) / (1 + rr1 * rr1 * rr2 * rr2 + 2 * rr1 * rr2);
    });

    return { mainTraces: traces, nRange, R_vs_n };
  }, [nFilm, nSub, nInc, thicknessRatio, designWl]);

  const r1 = (nInc - nFilm) / (nInc + nFilm);
  const r2 = (nFilm - nSub) / (nFilm + nSub);
  const Rdesign = (r1 * r1 + r2 * r2 + 2 * r1 * r2) / (1 + r1 * r1 * r2 * r2 + 2 * r1 * r2);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Partial Reflector Design" description="Partial reflectors (output couplers, etalon mirrors) provide controlled reflectance between
        bare substrate and full HR. A single dielectric layer at QWL gives R determined by nfilm.
        Adjusting the thickness ratio tunes R via thin-film interference.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>film</sub></span>
          <input type="number" value={nFilm} onChange={e => setNFilm(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} step="10" />
        <ValidatedNumberInput label="Thickness ratio (d / λ₀/4n)" value={thicknessRatio} onChange={setThicknessRatio} min={0.1} max={3} step="0.05" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">R<sub>design</sub> (QWL) = <span className="text-blue-400 font-mono">{(Rdesign * 100).toFixed(2)}%</span></p>
        <p className="text-gray-300">d = <span className="text-blue-400 font-mono">{(thicknessRatio * designWl / (4 * nFilm)).toFixed(1)} nm</span></p>
        <p className="text-gray-300 text-xs mt-2">R = [r₁² + r₂² + 2r₁r₂cos(2δ)] / [1 + r₁²r₂² + 2r₁r₂cos(2δ)] where δ = 2πn<sub>f</sub>d/λ</p>
      </div>

      <ChartPanel data={chartData.mainTraces} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Reflectance vs Wavelength", font: { size: 13 } },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />

      <div className="h-6" />

      <ChartPanel data={[{ x: chartData.nRange, y: chartData.R_vs_n, type: "scatter" as const, mode: "lines" as const, name: "R (QWL)", line: { color: "#34d399", width: 2 } }]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "QWL Reflectance vs Film Index", font: { size: 13 } },
        xaxis: { title: "n_film", gridcolor: "#374151" },
        yaxis: { title: "R (at λ₀)", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </CalculatorShell>
  );
}
