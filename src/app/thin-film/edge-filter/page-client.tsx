"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import {
  edgeDesignWavelength,
  edgeFilterLayers,
  halfTransmissionEdge,
  type EdgeType,
} from "../../../physics/thin-film/edge-filter";
import { stopBandEdges, stopBandHalfWidth } from "../../../physics/thin-film/quarter-wave-stack";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";

const NM = 1e-9;
const nm = (x: number, digits = 1) => (Number.isFinite(x) ? `${(x / NM).toFixed(digits)} nm` : "—");

export default function EdgeFilterPage() {
  const [typeKey, setTypeKey] = useURLState("type", "long");
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [edgeWl, setEdgeWl] = useURLState("edgeWl", 600);
  const [pairsRaw, setPairs] = useURLState("pairs", 10);

  const type: EdgeType = typeKey === "short" ? "short-pass" : "long-pass";
  // The URL isn't range-checked: an integer number of periods in 1–40.
  const periods = Math.round(clampToRange(pairsRaw, 1, 40));
  const valid = nH > nL && nL > 0 && nSub > 0 && nInc > 0 && edgeWl > 0;

  const lambda0 = valid ? edgeDesignWavelength(type, edgeWl * NM, nH, nL) : NaN;
  const stack = useMemo(
    () => ({ incident: nInc, layers: edgeFilterLayers(type, lambda0, nH, nL, periods), substrate: { n: nSub } }),
    [type, lambda0, nH, nL, periods, nInc, nSub],
  );
  const half = valid ? halfTransmissionEdge(stack, type, lambda0) : NaN;
  const zone = stopBandEdges(lambda0, nH, nL);
  const dg = stopBandHalfWidth(nH, nL);
  const R0 = valid ? stackResponse(stack, lambda0).R : NaN;

  const chartData = useMemo(() => {
    if (!valid) return [];
    // 0.45–1.6 λ_edge: the zone, both pass bands and (short-pass) the start of the third-order zone.
    const wls = Array.from({ length: 1201 }, (_, i) => edgeWl * (0.45 + (1.15 * i) / 1200));
    const resp = wls.map((wl) => stackResponse(stack, wl * NM));
    const traces: Record<string, unknown>[] = [
      { x: wls, y: resp.map((r) => r.R), type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: resp.map((r) => r.T), type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#60a5fa" } },
    ];
    if (Number.isFinite(half)) {
      traces.push({ x: [half / NM, half / NM], y: [0, 1], type: "scatter", mode: "lines", name: "50 % point", line: { color: "#34d399", dash: "dash" } });
    }
    return traces;
  }, [valid, edgeWl, stack, half]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Type</span>
          <select value={type === "short-pass" ? "short" : "long"} onChange={(e) => setTypeKey(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="long">Long-pass: (H/2 L H/2)ᴺ, transmits λ &gt; edge</option>
            <option value="short">Short-pass: (L/2 H L/2)ᴺ, transmits λ &lt; edge</option>
          </select>
        </label>
        <ValidatedNumberInput label="Edge wavelength (nm)" value={edgeWl} onChange={setEdgeWl} min={100} max={20000} step="10" />
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Periods (N)" value={periods} onChange={setPairs} min={1} max={40} step="1" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set n<sub>H</sub> above n<sub>L</sub>: the edge needs an index contrast.</p>}

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">50 % point of this stack</p>
          <p className="text-3xl font-bold text-blue-400">{nm(half)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {Number.isFinite(half) ? `${type === "long-pass" ? "Transmits above" : "Transmits below"} this wavelength` : "No 50 % crossing: add periods or contrast"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Design wavelength λ₀</p>
          <p className="text-3xl font-bold text-green-400">{nm(lambda0)}</p>
          <p className="text-sm text-gray-500 mt-1">Quarter-wave layers at λ₀; R(λ₀) = {Number.isFinite(R0) ? `${(R0 * 100).toFixed(3)} %` : "—"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Reflection zone of the infinite stack: <span className="text-blue-400 font-mono">{nm(zone.short)} – {nm(zone.long)}</span> (Δg = {Number.isFinite(dg) ? dg.toFixed(4) : "—"})</p>
        <p className="text-gray-300">d<sub>H</sub> = <span className="text-blue-400 font-mono">{nm(lambda0 / (4 * nH))}</span>, d<sub>L</sub> = <span className="text-blue-400 font-mono">{nm(lambda0 / (4 * nL))}</span>; the two outer layers are halves</p>
        <p className="text-gray-300">Layers: <span className="text-blue-400 font-mono">{2 * periods + 1}</span></p>
        <p className="text-gray-300 text-xs mt-2">
          Long-pass λ₀ = λ<sub>edge</sub>(1 − Δg), short-pass λ₀ = λ<sub>edge</sub>(1 + Δg), Δg = (2/π) asin((n<sub>H</sub> − n<sub>L</sub>)/(n<sub>H</sub> + n<sub>L</sub>)).
          A finite stack&apos;s 50 % point lies a little past the zone edge, toward the pass band. The outer half layers keep the
          ripple low on the pass side; the other side of the zone ripples more.
        </p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </>
  );
}
