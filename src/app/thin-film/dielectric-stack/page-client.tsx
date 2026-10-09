"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import { stopBandEdges } from "../../../physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, quarterWaveStackReflectance, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function DielectricStackPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.38);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairsRaw, setNumPairs] = useURLState("numPairs", 5);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  // The URL isn't range-checked: use an integer 1–30 everywhere.
  const numPairs = Math.round(clampToRange(numPairsRaw, 1, 30));

  const chartData = useMemo(() => {
    // Window 0.5–1.5 λ₀ (601 points, so λ₀ is a grid point)
    const wls = Array.from({ length: 601 }, (_, i) => designWl * (0.5 + i / 600));
    // Quarter-wave stack air | (HL)^N | sub
    const layers = quarterWaveLayers(Array.from({ length: 2 * numPairs }, (_, j) => (j % 2 === 0 ? nH : nL)), designWl * 1e-9);
    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    // Bare substrate: a single Fresnel step, R = ((n₀ − n_s)/(n₀ + n_s))²
    const bareR = ((nInc - nSub) / (nInc + nSub)) ** 2;
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } },
      { x: wls, y: wls.map(() => bareR), type: "scatter" as const, mode: "lines" as const, name: "Bare substrate R", line: { color: "#4b5563", dash: "dash" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  // Exact at λ₀ for air | (HL)^N | sub: Y = (nH/nL)^(2N)·n_sub, so q = n₀/n_sub
  const peakR = quarterWaveStackReflectance(nInc, Array.from({ length: 2 * numPairs }, (_, j) => (j % 2 === 0 ? nH : nL)), nSub);
  // Stop-band edges of the infinite stack (a finite stack's 50 % points lie slightly outside)
  const edges = stopBandEdges(designWl * 1e-9, nH, nL);
  const edgeShort_nm = edges.short * 1e9;
  const edgeLong_nm = edges.long * 1e9;
  const width_nm = edgeLong_nm - edgeShort_nm;
  const stopBand = Number.isFinite(width_nm)
    ? `${edgeShort_nm.toFixed(0)}–${edgeLong_nm.toFixed(0)} nm, width ${width_nm.toFixed(0)} nm`
    : "—";

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n (high index)" value={nH} onChange={setNH} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n (low index)" value={nL} onChange={setNL} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n (substrate)" value={nSub} onChange={setNSub} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n (incident)" value={nInc} onChange={setNInc} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Number of HL Pairs" value={numPairs} onChange={setNumPairs} min={1} max={30} step="1" />
        <ValidatedNumberInput label="Design Wavelength (nm)" value={designWl} onChange={setDesignWl} min={1} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Reflectance</p>
          <p className="text-xl font-bold text-green-400">{Number.isFinite(peakR) ? `${(peakR * 100).toFixed(2)}%` : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">nH/nL Ratio</p>
          <p className="text-xl font-bold text-blue-400">{Number.isFinite(nH / nL) ? (nH / nL).toFixed(3) : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Layers</p>
          <p className="text-xl font-bold text-yellow-400">{numPairs * 2}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stop band (infinite-stack edges)</p>
          <p className="text-xl font-bold text-red-400">{stopBand}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Quarter-Wave Stack Theory</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Structure: n₀ | (H L)^N | n_sub</p>
          <p>d_H = λ₀/(4n_H), &nbsp; d_L = λ₀/(4n_L)</p>
          <p>R_peak = {`{[(nH/nL)^(2N) − q] / [(nH/nL)^(2N) + q]}`}²</p>
          <p>q = n₀ / n_sub</p>
          <p>Transfer Matrix: M = ∏ M_j, &nbsp; M_j = [[cos δ, −i sin δ/η], [−i η sin δ, cos δ]]</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </>
  );
}
