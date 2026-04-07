"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
function computeRT(layers: { n: number; d: number }[], nInc: number, nSub: number, wavelengths: number[], angleDeg: number, pol: "TE" | "TM") {
  const R: number[] = [];
  const thetaInc = angleDeg * Math.PI / 180;

  for (const wl of wavelengths) {
    let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
    let m21r = 0, m21i = 0, m22r = 1, m22i = 0;

    for (const layer of layers) {
      const sinTheta = nInc * Math.sin(thetaInc) / layer.n;
      const cosTheta = Math.sqrt(Math.max(0, 1 - sinTheta * sinTheta));
      const nEff = pol === "TE" ? layer.n * cosTheta : layer.n / Math.max(cosTheta, 1e-10);

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

    const sinThetaSub = nInc * Math.sin(thetaInc) / nSub;
    const cosThetaSub = Math.sqrt(Math.max(0, 1 - sinThetaSub * sinThetaSub));
    const nEffSub = pol === "TE" ? nSub * cosThetaSub : nSub / Math.max(cosThetaSub, 1e-10);
    const nEffInc = pol === "TE" ? nInc * Math.cos(thetaInc) : nInc / Math.max(Math.cos(thetaInc), 1e-10);

    const numR = m11r * nEffInc + m12r * nEffInc * nEffSub - m21r - m22r * nEffSub;
    const numI = m11i * nEffInc + m12i * nEffInc * nEffSub - m21i - m22i * nEffSub;
    const denR = m11r * nEffInc + m12r * nEffInc * nEffSub + m21r + m22r * nEffSub;
    const denI = m11i * nEffInc + m12i * nEffInc * nEffSub + m21i + m22i * nEffSub;
    R.push((numR * numR + numI * numI) / (denR * denR + denI * denI));
  }
  return R;
}

export default function AngleTuningPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [numPairs, setNumPairs] = useState(5);
  const [designWl, setDesignWl] = useState(550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 600 / 500);
    const dH = designWl / (4 * nH);
    const dL = designWl / (4 * nL);

    const layers: { n: number; d: number }[] = [];
    for (let j = 0; j < numPairs * 2; j++) {
      layers.push({ n: j % 2 === 0 ? nH : nL, d: j % 2 === 0 ? dH : dL });
    }

    const traces: any[] = [];
    const angles = [0, 15, 30, 45];
    const angleColors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];

    for (let ai = 0; ai < angles.length; ai++) {
      const RTE = computeRT(layers, nInc, nSub, wls, angles[ai], "TE");
      const RTM = computeRT(layers, nInc, nSub, wls, angles[ai], "TM");

      traces.push({
        x: wls, y: RTE, type: "scatter" as const, mode: "lines" as const,
        name: `${angles[ai]}° TE (s)`, line: { color: angleColors[ai], width: 2 },
      });
      traces.push({
        x: wls, y: RTM, type: "scatter" as const, mode: "lines" as const,
        name: `${angles[ai]}° TM (p)`, line: { color: angleColors[ai], width: 1, dash: "dash" },
      });
    }

    // Center wavelength shift vs angle
    const angleSweep = Array.from({ length: 90 }, (_, i) => i);
    // For a QWL stack, λ(θ) ≈ λ₀ × cos(θ_eff), approximate shift
    const lambdaShift = angleSweep.map(a => {
      const aRad = a * Math.PI / 180;
      return designWl * Math.sqrt(1 - Math.pow(nInc * Math.sin(aRad) / ((nH + nL) / 2), 2));
    });

    return { mainTraces: traces, angleSweep, lambdaShift };
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Angle Tuning of Coatings" description="Changing the angle of incidence shifts the spectral response of thin film coatings toward
        shorter wavelengths (blue shift). TE (s-polarization) and TM (p-polarization) respond differently,
        with TM showing reduced reflectance at Brewster&apos;s angle. The shift follows
        λ(θ) ≈ λ₀·√(1 − (n₀ sin θ/neff)²).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>H</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>L</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Number of pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={20} />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} step="10" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
        <p className="text-gray-300 text-xs">Solid lines = TE (s-pol), Dashed = TM (p-pol). Each color = different angle.</p>
      </div>

      <ChartPanel data={chartData.mainTraces} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Reflectance vs Wavelength at Various Angles", font: { size: 13 } },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 9 } },
      }} />

      <div className="h-6" />

      <ChartPanel data={[{ x: chartData.angleSweep, y: chartData.lambdaShift, type: "scatter" as const, mode: "lines" as const, name: "λ_center(θ)", line: { color: "#a78bfa", width: 2 } }]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Center Wavelength Shift vs Angle", font: { size: 13 } },
        xaxis: { title: "Angle of incidence (°)", gridcolor: "#374151" },
        yaxis: { title: "λ_center (nm)", gridcolor: "#374151" },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </CalculatorShell>
  );
}
