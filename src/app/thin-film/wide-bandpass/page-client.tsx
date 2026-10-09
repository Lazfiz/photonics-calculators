"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import { firstCrossing, intervalStats } from "../../../physics/math";
import { edgeDesignWavelength, edgeFilterLayers, incoherentLosslessFaces } from "../../../physics/thin-film/edge-filter";
import { stopBandEdges } from "../../../physics/thin-film/quarter-wave-stack";
import { stackResponse, type Stack } from "../../../physics/thin-film/transfer-matrix";

const NM = 1e-9;
const nmText = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : "—");

export default function WideBandpassPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [cutOn, setCutOn] = useURLState("cutOn", 500);
  const [cutOff, setCutOff] = useURLState("cutOff", 700);
  const [pairsRaw, setPairs] = useURLState("pairs", 8);

  // The URL isn't range-checked: an integer number of periods per stack in 1–40.
  const periods = Math.round(clampToRange(pairsRaw, 1, 40));
  const valid = nH > nL && nL > 0 && nSub > 0 && cutOn > 0 && cutOff > cutOn;

  // Front face: long-pass edge at the cut-on. Back face: short-pass edge at the cut-off. Both stacks are
  // symmetric and lossless, so the back face reflects the same from the glass as from the air.
  const lpLambda0 = valid ? edgeDesignWavelength("long-pass", cutOn * NM, nH, nL) : NaN;
  const spLambda0 = valid ? edgeDesignWavelength("short-pass", cutOff * NM, nH, nL) : NaN;
  const { front, back } = useMemo(() => {
    const face = (layers: Stack["layers"]): Stack => ({ incident: 1, layers, substrate: { n: nSub } });
    return {
      front: face(edgeFilterLayers("long-pass", lpLambda0, nH, nL, periods)),
      back: face(edgeFilterLayers("short-pass", spLambda0, nH, nL, periods)),
    };
  }, [lpLambda0, spLambda0, nH, nL, periods, nSub]);

  const results = useMemo(() => {
    if (!valid) return null;
    const Tc = (wl: number) =>
      incoherentLosslessFaces(stackResponse(front, wl * NM).R, stackResponse(back, wl * NM).R).T;
    const lo = lpLambda0 / NM;
    const hi = spLambda0 / NM;
    // Scan from inside each reflection zone toward the pass band.
    const zonesBlock = Tc(lo) < 0.5 && Tc(hi) < 0.5;
    const on = zonesBlock ? firstCrossing(Tc, lo, hi, 0.5, 800) : NaN;
    const off = zonesBlock ? firstCrossing(Tc, hi, lo, 0.5, 800) : NaN;
    const pass = intervalStats(Tc, on, off, 1000);
    return { on, off, pass };
  }, [valid, front, back, lpLambda0, spLambda0]);

  const lpZone = stopBandEdges(lpLambda0, nH, nL);
  const spZone = stopBandEdges(spLambda0, nH, nL);

  const chartData = useMemo(() => {
    if (!valid || !results) return [];
    const lo = 0.6 * cutOn;
    const hi = 1.6 * cutOff;
    const wls = Array.from({ length: 1501 }, (_, i) => lo + ((hi - lo) * i) / 1500);
    const Rf = wls.map((wl) => stackResponse(front, wl * NM).R);
    const Rb = wls.map((wl) => stackResponse(back, wl * NM).R);
    return [
      { x: wls, y: wls.map((_, i) => incoherentLosslessFaces(Rf[i], Rb[i]).T), type: "scatter", mode: "lines", name: "Filter T (both faces)", line: { color: "#60a5fa", width: 2 } },
      { x: wls, y: Rf.map((r) => 1 - r), type: "scatter", mode: "lines", name: "Front face T (long-pass)", line: { color: "#34d399", width: 1, dash: "dot" } },
      { x: wls, y: Rb.map((r) => 1 - r), type: "scatter", mode: "lines", name: "Back face T (short-pass)", line: { color: "#a78bfa", width: 1, dash: "dot" } },
    ];
  }, [valid, results, cutOn, cutOff, front, back]);

  const fwhm = results ? results.off - results.on : NaN;
  const peak = results?.pass.max ?? NaN;
  const mean = results?.pass.mean ?? NaN;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Periods per stack (N)" value={periods} onChange={setPairs} min={1} max={40} step="1" />
        <ValidatedNumberInput label="Cut-on edge (nm), front face long-pass" value={cutOn} onChange={setCutOn} min={100} max={20000} step="10" />
        <ValidatedNumberInput label="Cut-off edge (nm), back face short-pass" value={cutOff} onChange={setCutOff} min={100} max={20000} step="10" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set n<sub>H</sub> above n<sub>L</sub> and the cut-on below the cut-off.</p>}
      {valid && results && !Number.isFinite(results.on) && (
        <p className="text-yellow-400 text-sm mb-6">No pass band above 50 %: the edges are too close or the stacks too weak.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Pass band (50 % points)</p>
          <p className="text-2xl font-bold text-blue-400">{nmText(results?.on ?? NaN)} – {nmText(results?.off ?? NaN)} nm</p>
          <p className="text-sm text-gray-500 mt-1">Width {nmText(fwhm)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Peak T in the pass band</p>
          <p className="text-2xl font-bold text-green-400">{Number.isFinite(peak) ? `${(peak * 100).toFixed(2)} %` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Mean {Number.isFinite(mean) ? `${(mean * 100).toFixed(1)} %` : "—"} between the 50 % points</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Front face: (H/2 L H/2)<sup>{periods}</sup> at λ₀ = <span className="text-blue-400 font-mono">{nmText(lpLambda0 / NM)} nm</span>, reflects <span className="text-blue-400 font-mono">{nmText(lpZone.short / NM)}–{nmText(lpZone.long / NM)} nm</span></p>
        <p className="text-gray-300">Back face: (L/2 H L/2)<sup>{periods}</sup> at λ₀ = <span className="text-blue-400 font-mono">{nmText(spLambda0 / NM)} nm</span>, reflects <span className="text-blue-400 font-mono">{nmText(spZone.short / NM)}–{nmText(spZone.long / NM)} nm</span></p>
        <p className="text-gray-300 text-xs mt-2">
          Each face is an edge filter with λ₀ = λ<sub>edge</sub>(1 ∓ Δg). The faces of the thick substrate add in intensity:
          T = T₁T₂/(1 − R₁R₂). Outside the two reflection zones (and near λ₀/3) the filter transmits again; a real filter adds
          blocking stacks there.
        </p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Transmittance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 11 } },
      }} />
    </>
  );
}
