"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import {
  quarterWaveMirrorDelay,
  reflectionBandEdges,
  stopBandEdges,
  stopBandHalfWidth,
} from "../../../physics/thin-film/quarter-wave-stack";
import {
  quarterWaveLayers,
  quarterWaveStackReflectance,
  reflectionGroupDelay,
  stackResponse,
} from "../../../physics/thin-film/transfer-matrix";

const NM = 1e-9;
const FS = 1e-15;
const nm = (x: number, digits = 1) => (Number.isFinite(x) ? `${(x / NM).toFixed(digits)} nm` : "—");

export default function DielectricHRPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 1064);
  const [pairsRaw, setPairs] = useURLState("pairs", 10);
  const [outerKey, setOuterKey] = useURLState("outer", "high");

  // The URL isn't range-checked: an integer number of pairs in 1–40.
  const pairs = Math.round(clampToRange(pairsRaw, 1, 40));
  const outer = outerKey === "low" ? "low" : "high";
  const valid = nH > nL && nL > 0 && nSub > 0 && nInc > 0 && designWl >= 100 && designWl <= 20000;
  const lambda0 = designWl * NM;
  const dg = stopBandHalfWidth(nH, nL);

  // (HL)^N H: high index on both faces (2N + 1 layers). (LH)^N: low index facing the incident medium.
  const indices = useMemo(
    () => (outer === "high" ? Array.from({ length: 2 * pairs + 1 }, (_, j) => (j % 2 === 0 ? nH : nL)) : Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? nL : nH))),
    [outer, pairs, nH, nL],
  );
  const stack = useMemo(() => ({ incident: nInc, layers: quarterWaveLayers(indices, lambda0), substrate: { n: nSub } }), [nInc, indices, lambda0, nSub]);

  const R0 = valid ? quarterWaveStackReflectance(nInc, indices, nSub) : NaN;
  const band = useMemo(() => (valid ? reflectionBandEdges(stack, lambda0, 0.5, 2 * dg) : { short: NaN, long: NaN }), [valid, stack, lambda0, dg]);
  const zone = stopBandEdges(lambda0, nH, nL);
  const delay = valid ? reflectionGroupDelay(stack, lambda0) : { groupDelay: NaN, gdd: NaN };
  const delayLimit = valid ? quarterWaveMirrorDelay(lambda0, nH, nL, nInc, outer) : NaN;
  const hasBand = Number.isFinite(band.short);

  const spectrum = useMemo(() => {
    if (!valid) return null;
    const wls = Array.from({ length: 1001 }, (_, i) => lambda0 * (0.5 + i / 1000));
    const R = wls.map((wl) => stackResponse(stack, wl).R);
    return { x: wls.map((wl) => wl / NM), R, T: R.map((r) => 1 - r) };
  }, [valid, lambda0, stack]);

  // GD and GDD across the 50 % band; they grow steeply at its edges, so stop 2 % of the width inside them.
  const dispersion = useMemo(() => {
    if (!valid || !hasBand) return null;
    const w = band.long - band.short;
    const wls = Array.from({ length: 241 }, (_, i) => band.short + w * (0.02 + (0.96 * i) / 240));
    const d = wls.map((wl) => reflectionGroupDelay(stack, wl));
    const finite = (v: number) => (Number.isFinite(v) ? v : NaN);
    return { x: wls.map((wl) => wl / NM), gd: d.map((v) => finite(v.groupDelay / FS)), gdd: d.map((v) => finite(v.gdd / FS ** 2)) };
  }, [valid, hasBand, band, stack]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Design</span>
          <select value={outer} onChange={(e) => setOuterKey(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="high">(HL)ᴺH: high index on both faces</option>
            <option value="low">(LH)ᴺ: low index facing the incident medium</option>
          </select>
        </label>
        <ValidatedNumberInput label="Design wavelength λ₀ (nm)" value={designWl} onChange={setDesignWl} min={100} max={20000} step="1" />
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Pairs (N)" value={pairs} onChange={setPairs} min={1} max={40} step="1" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set n<sub>H</sub> above n<sub>L</sub>, positive indices and λ₀ in 100–20 000 nm.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Reflectance at λ₀</p>
          <p className="text-2xl font-bold text-blue-400">{Number.isFinite(R0) ? `${(R0 * 100).toFixed(4)} %` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">1 − R = {Number.isFinite(R0) ? (1 - R0).toExponential(2) : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Stop band (R ≥ 50 %)</p>
          <p className="text-2xl font-bold text-green-400">{hasBand ? nm(band.long - band.short, 0) : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">{hasBand ? `${nm(band.short)} – ${nm(band.long)}` : valid ? "R(λ₀) is below 50 %" : ""}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Group delay at λ₀</p>
          <p className="text-2xl font-bold text-purple-400">{Number.isFinite(delay.groupDelay) ? `${(delay.groupDelay / FS).toFixed(3)} fs` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Semi-infinite stack: {Number.isFinite(delayLimit) ? `${(delayLimit / FS).toFixed(3)} fs` : "—"}; GDD(λ₀) = 0</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Zone of the infinite stack: <span className="text-blue-400 font-mono">{nm(zone.short)} – {nm(zone.long)}</span> ({nm(zone.long - zone.short, 0)}, Δg = {Number.isFinite(dg) ? dg.toFixed(4) : "—"})</p>
        <p className="text-gray-300">Layers: <span className="text-blue-400 font-mono">{indices.length}</span>; d<sub>H</sub> = <span className="text-blue-400 font-mono">{nm(lambda0 / (4 * nH))}</span>, d<sub>L</sub> = <span className="text-blue-400 font-mono">{nm(lambda0 / (4 * nL))}</span></p>
        <p className="text-gray-300 text-xs mt-2">
          R(λ₀) = ((n₀ − Y)/(n₀ + Y))², each quarter-wave layer mapping the admittance Y → n²/Y from Y = n<sub>s</sub>. The stop band is
          the actual stack&apos;s, from λ₀ out to the first 50 % points (side lobes excluded); the zone λ₀/(1 ± Δg),
          Δg = (2/π) asin((n<sub>H</sub> − n<sub>L</sub>)/(n<sub>H</sub> + n<sub>L</sub>)), is the limit of many pairs. Group delay
          τ = d(arg r)/dω and GDD = d²(arg r)/dω² on reflection, front face as reference. At λ₀ the semi-infinite stack gives
          τ = λ₀n₀/(2cΔn) with H outermost and λ₀n<sub>H</sub>n<sub>L</sub>/(2cn₀Δn) with L outermost.
        </p>
      </div>

      {spectrum && (
        <div className="mb-6">
          <ChartPanel title="Reflectance and transmittance" data={[
            { x: spectrum.x, y: spectrum.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#60a5fa" } },
            { x: spectrum.x, y: spectrum.T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#34d399" } },
          ]} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
            margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
          }} />
        </div>
      )}

      {dispersion && (
        <ChartPanel title="Dispersion on reflection, inside the stop band" data={[
          { x: dispersion.x, y: dispersion.gd, type: "scatter", mode: "lines", name: "GD (fs)", line: { color: "#a78bfa" } },
          { x: dispersion.x, y: dispersion.gdd, type: "scatter", mode: "lines", name: "GDD (fs²)", yaxis: "y2", line: { color: "#fbbf24" } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Group delay (fs)", gridcolor: "#374151" },
          yaxis2: { title: "GDD (fs²)", overlaying: "y", side: "right" },
          margin: { t: 20, b: 40, l: 50, r: 60 }, autosize: true,
        }} />
      )}
    </>
  );
}
