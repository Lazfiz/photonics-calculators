"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function DichroicPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairs, setNumPairs] = useURLState("numPairs", 7);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [aoi, setAoi] = useURLState("aoi", 45);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 700 / 500);
    const cosTheta = Math.cos((aoi * Math.PI) / 180);
    const sinTheta = Math.sin((aoi * Math.PI) / 180);

    const R_s = wls.map(wl => {
      let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
      let m21r = 0, m21i = 0, m22r = 1, m22i = 0;
      for (let j = 0; j < numPairs * 2; j++) {
        const n = j % 2 === 0 ? nH : nL;
        const d = designWl / (4 * n);
        const cosThetaT = Math.sqrt(1 - (sinTheta * nInc / n) ** 2);
        const delta = (2 * Math.PI * n * d * cosThetaT) / wl;
        const cosD = Math.cos(delta), sinD = Math.sin(delta);
        const eta = n * cosThetaT; // s-polarization admittance
        const a11r = cosD, a12r = 0, a12i = -sinD / eta;
        const a21r = 0, a21i = -eta * sinD, a22r = cosD;
        const n11r = m11r * a11r + m12r * a21r - m12i * a21i;
        const n11i = m11i * a11r + m12i * a21r + m12r * a21i;
        const n12r = m11r * a12r - m11i * a12i + m12r * a22r;
        const n12i = m11r * a12i + m11i * a12r + m12i * a22r;
        const n21r = m21r * a11r + m22r * a21r - m22i * a21i;
        const n21i = m21i * a11r + m22i * a21r + m22r * a21i;
        const n22r = m21r * a12r - m21i * a12i + m22r * a22r;
        const n22i = m21r * a12i + m21i * a12r + m22i * a22r;
        m11r = n11r; m11i = n11i; m12r = n12r; m12i = n12i;
        m21r = n21r; m21i = n21i; m22r = n22r; m22i = n22i;
      }
      const cosThetaI = cosTheta;
      const cosThetaSub = Math.sqrt(1 - (sinTheta * nInc / nSub) ** 2);
      const etaI = nInc * cosThetaI, etaS = nSub * cosThetaSub;
      const numR = m11r * etaI + m12r * etaI * etaS - m21r - m22r * etaS;
      const numI = m11i * etaI + m12i * etaI * etaS - m21i - m22i * etaS;
      const denR = m11r * etaI + m12r * etaI * etaS + m21r + m22r * etaS;
      const denI = m11i * etaI + m12i * etaI * etaS + m21i + m22i * etaS;
      return (numR * numR + numI * numI) / (denR * denR + denI * denI);
    });

    const R_p = wls.map(wl => {
      let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
      let m21r = 0, m21i = 0, m22r = 1, m22i = 0;
      for (let j = 0; j < numPairs * 2; j++) {
        const n = j % 2 === 0 ? nH : nL;
        const d = designWl / (4 * n);
        const cosThetaT = Math.sqrt(1 - (sinTheta * nInc / n) ** 2);
        const delta = (2 * Math.PI * n * d * cosThetaT) / wl;
        const cosD = Math.cos(delta), sinD = Math.sin(delta);
        const eta = n / cosThetaT; // p-polarization admittance
        const a11r = cosD, a12r = 0, a12i = -sinD / eta;
        const a21r = 0, a21i = -eta * sinD, a22r = cosD;
        const n11r = m11r * a11r + m12r * a21r - m12i * a21i;
        const n11i = m11i * a11r + m12i * a21r + m12r * a21i;
        const n12r = m11r * a12r - m11i * a12i + m12r * a22r;
        const n12i = m11r * a12i + m11i * a12r + m12i * a22r;
        const n21r = m21r * a11r + m22r * a21r - m22i * a21i;
        const n21i = m21i * a11r + m22i * a21r + m22r * a21i;
        const n22r = m21r * a12r - m21i * a12i + m22r * a22r;
        const n22i = m21r * a12i + m21i * a12r + m22i * a22r;
        m11r = n11r; m11i = n11i; m12r = n12r; m12i = n12i;
        m21r = n21r; m21i = n21i; m22r = n22r; m22i = n22i;
      }
      const etaI = nInc / cosThetaI, etaS = nSub / cosThetaSub;
      const numR = m11r * etaI + m12r * etaI * etaS - m21r - m22r * etaS;
      const numI = m11i * etaI + m12i * etaI * etaS - m21i - m22i * etaS;
      const denR = m11r * etaI + m12r * etaI * etaS + m21r + m22r * etaS;
      const denI = m11i * etaI + m12i * etaI * etaS + m21i + m22i * etaS;
      return (numR * numR + numI * numI) / (denR * denR + denI * denI);
    });

    const R_avg = wls.map((_, i) => (R_s[i] + R_p[i]) / 2);
    return [
      { x: wls, y: R_s, type: "scatter" as const, mode: "lines" as const, name: "R (s-pol)", line: { color: "#f87171" } },
      { x: wls, y: R_p, type: "scatter" as const, mode: "lines" as const, name: "R (p-pol)", line: { color: "#34d399" } },
      { x: wls, y: R_avg, type: "scatter" as const, mode: "lines" as const, name: "R (avg)", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl, aoi]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Dichroic Beam Splitter" description="Dichroic beam splitter at oblique incidence. Shows s- and p-polarisation splitting characteristic of dichroic filters used at 45°.
        Effective optical thickness shifts with cos(θ).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>H</sub></span>
          <ValidatedNumberInput label="nH" value={nH} onChange={setNH} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>L</sub></span>
          <ValidatedNumberInput label="nL" value={nL} onChange={setNL} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <ValidatedNumberInput label="nsubstrate" value={nSub} onChange={setNSub} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <ValidatedNumberInput label="nincident" value={nInc} onChange={setNInc} step="0.01" /></label>
        <ValidatedNumberInput label="Pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={20} />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} />
        <ValidatedNumberInput label="Angle of incidence (°)" value={aoi} onChange={setAoi} min={0} max={89} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">cos(θ) = <span className="text-blue-400 font-mono">{Math.cos((aoi * Math.PI) / 180).toFixed(4)}</span></p>
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
        <p className="text-gray-300 text-xs mt-2">Note: Slight pol-splitting visible at 45° — real designs use modified thicknesses to compensate.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </CalculatorShell>
  );
}
