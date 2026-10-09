"use client";

import { useMemo } from "react";
import ChartPanel from "./chart-panel";
import ValidatedNumberInput from "./validated-number-input";
import { useURLState } from "../hooks/use-url-state";
import { clampToRange } from "../lib/number-input";
import { intervalStats } from "../physics/math";
import {
  edgeFilterLayers,
  halfTransmissionEdge,
  staggeredDesignWavelengths,
  type EdgeType,
} from "../physics/thin-film/edge-filter";
import { stopBandHalfWidth } from "../physics/thin-film/quarter-wave-stack";
import { stackResponse } from "../physics/thin-film/transfer-matrix";

const NM = 1e-9;
/** Above this many periods in all, the page stops computing (it would take seconds). */
const MAX_TOTAL_PERIODS = 400;

export interface BlockingFilterDefaults {
  nH: number;
  nL: number;
  nSub: number;
  /** Blocked (reflected) band, nm. */
  blockFrom: number;
  blockTo: number;
  /** Band to transmit, nm: above the blocked band for long-pass, below it for short-pass. */
  passFrom: number;
  passTo: number;
  /** Periods per stack. */
  periods: number;
}

interface Props {
  type: EdgeType;
  defaults: BlockingFilterDefaults;
  /** e.g. "Reflected band (visible)". */
  blockName: string;
  /** e.g. "Transmitted band (near IR)". */
  passName: string;
}

const pct = (x: number, digits = 2) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");

/**
 * A band reflector with one pass band: quarter-wave edge-filter stacks, (H/2 L H/2)^N for long-pass or
 * (L/2 H L/2)^N for short-pass, in series and staggered in λ₀ until their zones cover the blocked band
 * (`staggeredDesignWavelengths`). Used by the cold-mirror, IR-blocking and UV-blocking pages.
 */
export default function BlockingFilterCalculator({ type, defaults, blockName, passName }: Props) {
  const [nH, setNH] = useURLState("nH", defaults.nH);
  const [nL, setNL] = useURLState("nL", defaults.nL);
  const [nSub, setNSub] = useURLState("nSub", defaults.nSub);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [blockFrom, setBlockFrom] = useURLState("blockFrom", defaults.blockFrom);
  const [blockTo, setBlockTo] = useURLState("blockTo", defaults.blockTo);
  const [passFrom, setPassFrom] = useURLState("passFrom", defaults.passFrom);
  const [passTo, setPassTo] = useURLState("passTo", defaults.passTo);
  const [pairsRaw, setPairs] = useURLState("pairs", defaults.periods);

  // The URL isn't range-checked: an integer number of periods per stack in 1–40.
  const periods = Math.round(clampToRange(pairsRaw, 1, 40));
  const bandsOk = blockFrom > 0 && blockTo > blockFrom && passFrom > 0 && passTo > passFrom;
  const indicesOk = nH > nL && nL > 0 && nSub > 0 && nInc > 0;
  const centres = useMemo(
    () => (bandsOk && indicesOk ? staggeredDesignWavelengths(type, blockFrom * NM, blockTo * NM, nH, nL) : []),
    [bandsOk, indicesOk, type, blockFrom, blockTo, nH, nL],
  );
  const tooBig = centres.length * periods > MAX_TOTAL_PERIODS;
  const ready = centres.length > 0 && !tooBig;
  const overlap = type === "long-pass" ? passFrom < blockTo : passTo > blockFrom;

  const stack = useMemo(
    () => ({ incident: nInc, layers: edgeFilterLayers(type, centres, nH, nL, periods), substrate: { n: nSub } }),
    [nInc, type, centres, nH, nL, periods, nSub],
  );

  const results = useMemo(() => {
    if (!ready) return null;
    const R = (wl: number) => stackResponse(stack, wl * NM).R;
    const T = (wl: number) => stackResponse(stack, wl * NM).T;
    return {
      block: intervalStats(R, blockFrom, blockTo, 1000),
      pass: intervalStats(T, passFrom, passTo, 1000),
      // centres[0] is the stack next to the pass band.
      edge: halfTransmissionEdge(stack, type, centres[0]),
    };
  }, [ready, stack, blockFrom, blockTo, passFrom, passTo, type, centres]);

  // Third-order zones, g = λ₀/λ in 3 ± Δg, that reach into the pass band.
  const dg = stopBandHalfWidth(nH, nL);
  const thirdOrder = centres
    .map((c) => ({ from: c / (3 + dg) / NM, to: c / (3 - dg) / NM }))
    .filter((z) => z.to > passFrom && z.from < passTo);

  const chartData = useMemo(() => {
    if (!ready) return [];
    const lo = 0.8 * Math.min(blockFrom, passFrom);
    const hi = 1.2 * Math.max(blockTo, passTo);
    const wls = Array.from({ length: 1501 }, (_, i) => lo + ((hi - lo) * i) / 1500);
    const resp = wls.map((wl) => stackResponse(stack, wl * NM));
    return [
      { x: wls, y: resp.map((r) => r.R), type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: resp.map((r) => r.T), type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [ready, stack, blockFrom, blockTo, passFrom, passTo]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={`${blockName}: from (nm)`} value={blockFrom} onChange={setBlockFrom} min={100} max={20000} step="10" />
        <ValidatedNumberInput label={`${blockName}: to (nm)`} value={blockTo} onChange={setBlockTo} min={100} max={20000} step="10" />
        <ValidatedNumberInput label={`${passName}: from (nm)`} value={passFrom} onChange={setPassFrom} min={100} max={20000} step="10" />
        <ValidatedNumberInput label={`${passName}: to (nm)`} value={passTo} onChange={setPassTo} min={100} max={20000} step="10" />
        <ValidatedNumberInput label="Periods per stack (N)" value={periods} onChange={setPairs} min={1} max={40} step="1" />
      </div>

      <div className="space-y-1 mb-6 text-sm text-yellow-400">
        {!indicesOk && <p>Set n<sub>H</sub> above n<sub>L</sub>: the stacks need an index contrast.</p>}
        {!bandsOk && <p>Each band needs &quot;from&quot; below &quot;to&quot;.</p>}
        {tooBig && <p>{centres.length} stacks × {periods} periods is too many to compute here; narrow the band or use fewer periods.</p>}
        {bandsOk && overlap && <p>The two bands overlap: the {type === "long-pass" ? "transmitted band should lie above" : "transmitted band should lie below"} the blocked band.</p>}
        {thirdOrder.map((z) => (
          <p key={z.from}>A third-order reflection zone, {z.from.toFixed(0)}–{z.to.toFixed(0)} nm, falls in the transmitted band.</p>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Mean R, {blockFrom}–{blockTo} nm</p>
          <p className="text-2xl font-bold text-red-400">{pct(results?.block.mean ?? NaN)}</p>
          <p className="text-sm text-gray-500 mt-1">Lowest R in the band: {pct(results?.block.min ?? NaN, 1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Mean T, {passFrom}–{passTo} nm</p>
          <p className="text-2xl font-bold text-blue-400">{pct(results?.pass.mean ?? NaN, 1)}</p>
          <p className="text-sm text-gray-500 mt-1">Lowest T in the band: {pct(results?.pass.min ?? NaN, 1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">50 % point (edge)</p>
          <p className="text-2xl font-bold text-green-400">{results && Number.isFinite(results.edge) ? `${(results.edge / NM).toFixed(1)} nm` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Between the blocked and transmitted bands</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">
          Stacks: <span className="text-blue-400 font-mono">{centres.length}</span> × {periods} periods,{" "}
          {type === "long-pass" ? "(H/2 L H/2)" : "(L/2 H L/2)"}<sup>N</sup>, quarter waves at λ₀ ={" "}
          <span className="text-blue-400 font-mono">{centres.map((c) => (c / NM).toFixed(1)).join(", ") || "—"} nm</span>{" "}
          (from the incident side)
        </p>
        <p className="text-gray-300">Layers: <span className="text-blue-400 font-mono">{ready ? stack.layers.length : "—"}</span></p>
        <p className="text-gray-300 text-xs mt-2">
          One stack reflects g = λ₀/λ in 1 ± Δg, Δg = (2/π) asin((n<sub>H</sub> − n<sub>L</sub>)/(n<sub>H</sub> + n<sub>L</sub>)) = {Number.isFinite(dg) ? dg.toFixed(4) : "—"}.
          K = ⌈ln(λ<sub>to</sub>/λ<sub>from</sub>) / ln((1 + Δg)/(1 − Δg))⌉ stacks with λ₀ from λ<sub>from</sub>(1 + Δg) to λ<sub>to</sub>(1 − Δg)
          cover the blocked band with overlapping zones. Each stack also reflects near λ₀/3.
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
