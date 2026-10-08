"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function DualBandARPage() {
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [wl1, setWl1] = useURLState("wl1", 450);
  const [wl2, setWl2] = useURLState("wl2", 1064);
  const [n1, setN1] = useURLState("n1", 1.38);
  const [n2, setN2] = useURLState("n2", 2.1);
  const [n3, setN3] = useURLState("n3", 1.65);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 350 + i * 900 / N);

    // Optimize thicknesses for dual-band AR using quarter-wave at each wavelength
    // Layer 1 (top): quarter-wave at λ1, Layer 2: quarter-wave at λ2, Layer 3: quarter-wave at geometric mean
    const avgWl = Math.sqrt(wl1 * wl2);
    const d1 = wl1 / (4 * n1);
    const d2 = wl2 / (4 * n2);
    const d3 = avgWl / (4 * n3);

    // Air | layer 1 | layer 2 | layer 3 | substrate
    const layers = [
      { n: n1, thickness: d1 * 1e-9 },
      { n: n2, thickness: d2 * 1e-9 },
      { n: n3, thickness: d3 * 1e-9 },
    ];
    const R = reflectanceSpectrum({ incident: 1, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));

    return { wls, R };
  }, [nSub, wl1, wl2, n1, n2, n3]);

  const T = tmm.R.map(r => 1 - r);
  const r1 = tmm.wls.findIndex(w => Math.abs(w - wl1) < 2);
  const r2 = tmm.wls.findIndex(w => Math.abs(w - wl2) < 2);
  const R1 = r1 >= 0 ? tmm.R[r1] : 0;
  const R2 = r2 >= 0 ? tmm.R[r2] : 0;

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="Band 1 λ (nm)" value={wl1} onChange={setWl1} />
        <ValidatedNumberInput label="Band 2 λ (nm)" value={wl2} onChange={setWl2} />
        <ValidatedNumberInput label={<>n<sub>1</sub> (top layer)</>} value={n1} onChange={setN1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>2</sub> (middle layer)</>} value={n2} onChange={setN2} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>3</sub> (bottom layer)</>} value={n3} onChange={setN3} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">R at λ₁ = {wl1} nm</p>
          <p className="text-3xl font-bold text-blue-400">{(R1 * 100).toFixed(4)}%</p>
          <p className="text-sm text-gray-500 mt-1">d₁ = {(wl1 / (4 * n1)).toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">R at λ₂ = {wl2} nm</p>
          <p className="text-3xl font-bold text-green-400">{(R2 * 100).toFixed(4)}%</p>
          <p className="text-sm text-gray-500 mt-1">d₂ = {(wl2 / (4 * n2)).toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                              </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171" } },
          { x: tmm.wls, y: T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#60a5fa" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          shapes: [
            { type: "line", x0: wl1, x1: wl1, y0: 0, y1: 1, line: { color: "#fbbf24", width: 1, dash: "dash" } },
            { type: "line", x0: wl2, x1: wl2, y0: 0, y1: 1, line: { color: "#fbbf24", width: 1, dash: "dash" } },
          ],
        }} />
      </div>
    </>
  );
}
