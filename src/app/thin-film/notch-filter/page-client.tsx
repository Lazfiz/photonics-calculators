"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import {
  quarterWavePairsForReflectance,
  reflectionBandEdges,
  stopBandEdges,
  stopBandHalfWidth,
} from "../../../physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, quarterWaveStackReflectance, stackResponse } from "../../../physics/thin-film/transfer-matrix";

const NM = 1e-9;
const nm = (x: number, digits = 1) => (Number.isFinite(x) ? `${(x / NM).toFixed(digits)} nm` : "—");

export default function NotchFilterPage() {
  // A low index contrast (Al₂O₃/SiO₂-like 1.63/1.46) keeps the notch narrow; many pairs make it deep.
  const [nH, setNH] = useURLState("nH", 1.63);
  const [nL, setNL] = useURLState("nL", 1.46);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [notchWl, setNotchWl] = useURLState("notchWl", 532);
  const [pairsRaw, setPairs] = useURLState("pairs", 40);

  // The URL isn't range-checked: an integer number of pairs in 1–200.
  const pairs = Math.round(clampToRange(pairsRaw, 1, 200));
  const valid = nH > nL && nL > 0 && nSub > 0 && nInc > 0 && notchWl >= 100 && notchWl <= 20000;
  const lambda0 = notchWl * NM;
  const dg = stopBandHalfWidth(nH, nL);

  // (HL)^N: H faces the incident medium, L sits on the substrate.
  const indices = useMemo(() => Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? nH : nL)), [pairs, nH, nL]);
  const stack = useMemo(() => ({ incident: nInc, layers: quarterWaveLayers(indices, lambda0), substrate: { n: nSub } }), [nInc, indices, lambda0, nSub]);

  const R0 = valid ? quarterWaveStackReflectance(nInc, indices, nSub) : NaN;
  // OD from T itself: 1 − R loses its digits as R → 1.
  const od = valid ? -Math.log10(stackResponse(stack, lambda0).T) : NaN;
  const notch = useMemo(() => (valid ? reflectionBandEdges(stack, lambda0, R0 / 2, 3 * dg) : { short: NaN, long: NaN }), [valid, stack, lambda0, R0, dg]);
  const zone = stopBandEdges(lambda0, nH, nL);
  const pairsFor = (target: number) => (valid ? quarterWavePairsForReflectance(1 - 10 ** -target, nH, nL, nInc, nSub) : NaN);

  const spectrum = useMemo(() => {
    if (!valid) return null;
    const lo = lambda0 / (1 + 4 * dg), hi = lambda0 / (1 - 4 * dg);
    const wls = Array.from({ length: 1201 }, (_, i) => lo + ((hi - lo) * i) / 1200);
    const resp = wls.map((wl) => stackResponse(stack, wl));
    return { x: wls.map((wl) => wl / NM), R: resp.map((s) => s.R), T: resp.map((s) => s.T), od: resp.map((s) => (s.T > 0 ? -Math.log10(s.T) : NaN)) };
  }, [valid, lambda0, dg, stack]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Notch wavelength λ₀ (nm)" value={notchWl} onChange={setNotchWl} min={100} max={20000} step="1" />
        <ValidatedNumberInput label="Pairs (N)" value={pairs} onChange={setPairs} min={1} max={200} step="1" />
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={1} max={5} step="0.01" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set n<sub>H</sub> above n<sub>L</sub>, positive indices and λ₀ in 100–20 000 nm.</p>}

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Blocking at λ₀</p>
          <p className="text-2xl font-bold text-red-400">{Number.isFinite(od) ? `OD ${od.toFixed(2)}` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">R = {Number.isFinite(R0) ? `${(R0 * 100).toFixed(4)} %` : "—"}, T = 10<sup>−OD</sup></p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Notch FWHM (R ≥ R(λ₀)/2)</p>
          <p className="text-2xl font-bold text-green-400">{Number.isFinite(notch.short) ? nm(notch.long - notch.short, 2) : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">{Number.isFinite(notch.short) ? `${nm(notch.short)} – ${nm(notch.long)}` : ""}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Pairs needed</p>
          <p className="text-lg font-bold text-blue-400 font-mono">OD 3: {pairsFor(3)}, OD 4: {pairsFor(4)}, OD 6: {pairsFor(6)}</p>
          <p className="text-sm text-gray-500 mt-1">Layers now: {indices.length}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Zone of the infinite stack: <span className="text-blue-400 font-mono">{nm(zone.short)} – {nm(zone.long)}</span> ({nm(zone.long - zone.short)})</p>
        <p className="text-gray-300">d<sub>H</sub> = <span className="text-blue-400 font-mono">{nm(lambda0 / (4 * nH))}</span>, d<sub>L</sub> = <span className="text-blue-400 font-mono">{nm(lambda0 / (4 * nL))}</span></p>
        <p className="text-gray-300 text-xs mt-2">
          A quarter-wave stack (HL)<sup>N</sup> reflects R = tanh²(N ln(n<sub>H</sub>/n<sub>L</sub>) + ½ ln(n<sub>s</sub>/n₀)) at λ₀. Its notch
          is about as wide as the zone λ₀/(1 ± Δg), Δg = (2/π) asin((n<sub>H</sub> − n<sub>L</sub>)/(n<sub>H</sub> + n<sub>L</sub>)), so the index
          contrast sets the width and the number of pairs the depth. It reflects again near λ₀/3, λ₀/5, … Real notch filters
          also suppress the side lobes (apodized or rugate profiles) and add AR layers; this page doesn&apos;t. Exact transfer matrix,
          normal incidence, lossless layers, back surface ignored.
        </p>
      </div>

      {spectrum && (
        <div className="mb-6">
          <ChartPanel title="Reflectance and transmittance" data={[
            { x: spectrum.x, y: spectrum.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171" } },
            { x: spectrum.x, y: spectrum.T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#60a5fa" } },
          ]} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
            margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
          }} />
        </div>
      )}

      {spectrum && (
        <ChartPanel title="Optical density" data={[
          { x: spectrum.x, y: spectrum.od, type: "scatter", mode: "lines", name: "OD = −log₁₀ T", line: { color: "#fbbf24" } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "OD", gridcolor: "#374151" },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        }} />
      )}
    </>
  );
}
