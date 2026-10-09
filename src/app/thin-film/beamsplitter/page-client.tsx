"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import {
  middleIndexForReflectance,
  singleLayerIndexForReflectance,
  tunedSplitter,
  tunedSplitterLayers,
} from "../../../physics/thin-film/beamsplitter";
import { quarterWaveLayers, quarterWaveStackReflectance, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

const NM = 1e-9;
const pct = (x: number, digits = 2) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");
const STACK_NAMES = ["H", "HLH", "HLHLH", "HLHLHLH"];

export default function BeamsplitterPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [targetRaw, setTargetR] = useURLState("targetR", 50);

  // The URL isn't range-checked: a target reflectance of 1–99 %.
  const targetR = clampToRange(targetRaw, 1, 99);
  const valid = nH > nL && nL > 0 && nSub > 0 && nInc > 0 && designWl >= 100 && designWl <= 20000;
  const lambda0 = designWl * NM;
  const target = targetR / 100;

  const singleIndex = valid ? singleLayerIndexForReflectance(target, nInc, nSub) : NaN;
  const middleIndex = valid ? middleIndexForReflectance(target, nH, nInc, nSub) : NaN;
  const bare = ((nInc - nSub) / (nInc + nSub)) ** 2;
  // Quarter-wave stacks H(LH)^m, m = 0…3.
  const ladder = STACK_NAMES.map((name, m) => ({
    name,
    R: valid ? quarterWaveStackReflectance(nInc, Array.from({ length: 2 * m + 1 }, (_, j) => (j % 2 === 0 ? nH : nL)), nSub) : NaN,
  }));
  const design = useMemo(() => (valid ? tunedSplitter(target, nH, nL, nInc, nSub, lambda0) : null), [valid, target, nH, nL, nInc, nSub, lambda0]);

  const chartData = useMemo(() => {
    if (!valid) return [];
    const wls = Array.from({ length: 601 }, (_, i) => lambda0 * (0.6 + i / 600));
    const x = wls.map((wl) => wl / NM);
    const R = (layers: ReturnType<typeof tunedSplitterLayers>) => reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, wls);
    const traces: Record<string, unknown>[] = [];
    const colors = ["#f87171", "#34d399", "#60a5fa"];
    for (let m = 0; m < 3; m++) {
      traces.push({ x, y: R(tunedSplitterLayers(nH, nL, m, 1, lambda0)), type: "scatter", mode: "lines", name: STACK_NAMES[m], line: { color: colors[m], width: 1.5, dash: "dash" } });
    }
    if (design) {
      traces.push({ x, y: R(design.layers), type: "scatter", mode: "lines", name: "Thinned", line: { color: "#fbbf24", width: 3 } });
    }
    if (Number.isFinite(middleIndex)) {
      traces.push({ x, y: R(quarterWaveLayers([nH, middleIndex, nH], lambda0)), type: "scatter", mode: "lines", name: "H M H", line: { color: "#c084fc", width: 3 } });
    }
    traces.push({ x: [x[0], x[x.length - 1]], y: [target, target], type: "scatter", mode: "lines", name: "Target", line: { color: "#9ca3af", width: 1, dash: "dot" } });
    return traces;
  }, [valid, lambda0, nInc, nSub, nH, nL, design, middleIndex, target]);

  const layerText = design
    ? design.layers.map((l) => `${l.n === nH ? "H" : "L"} ${(l.thickness / NM).toFixed(2)} nm`).join(" | ")
    : "";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Target reflectance at λ₀ (%)" value={targetR} onChange={setTargetR} min={1} max={99} step="1" />
        <ValidatedNumberInput label="Design wavelength λ₀ (nm)" value={designWl} onChange={setDesignWl} min={100} max={20000} step="10" />
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={1} max={5} step="0.01" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set n<sub>H</sub> above n<sub>L</sub>, positive indices and λ₀ in 100–20 000 nm.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Thinned-layer design, {targetR} % at λ₀ (your n<sub>H</sub>, n<sub>L</sub>)</p>
          <p className="text-lg font-bold text-yellow-400 font-mono">{design ? layerText : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">
            {design
              ? `${STACK_NAMES[design.m] ?? `H(LH)^${design.m}`} with the ${design.m === 0 ? "H layer" : "second (L) layer"} at ${design.x.toFixed(3)} of a quarter wave`
              : valid && target <= bare
                ? `Below the bare substrate (${pct(bare)}): that is an AR task`
                : valid ? "Not reachable with up to 20 periods" : ""}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Single quarter-wave layer for {targetR} %</p>
          <p className="text-2xl font-bold text-blue-400">{Number.isFinite(singleIndex) ? `n = ${singleIndex.toFixed(3)}` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">n² = n₀n<sub>s</sub>(1 + √R)/(1 − √R). Visible coating materials reach about 2.4 (ZnS, TiO₂ films); higher indices are IR materials such as Si and Ge.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">All quarter waves: H M H for {targetR} %</p>
          <p className="text-2xl font-bold text-purple-400">{Number.isFinite(middleIndex) ? <>n<sub>M</sub> = {middleIndex.toFixed(3)}</> : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">n<sub>M</sub> = n<sub>H</sub>²/n with n from the single-layer card. R is flat at λ₀ (a maximum when n<sub>M</sub> &lt; n<sub>H</sub>).</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300 mb-2">Quarter-wave stacks at λ₀ (bare substrate: {pct(bare)}):</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-sm">
          {ladder.map((s) => (
            <p key={s.name} className="text-gray-300">{s.name}: <span className="text-blue-400">{pct(s.R)}</span></p>
          ))}
        </div>
        <p className="text-gray-300 text-xs mt-3">
          A quarter-wave layer maps the admittance Y → n²/Y, so R steps up in jumps as layers are added. The thinned design takes
          the smallest quarter-wave stack H(LH)<sup>m</sup> that reaches the target and thins one layer until R(λ₀) equals it
          (R rises monotonically with that thickness). It meets the target at λ₀ only: its R peak moves to shorter wavelengths,
          so λ₀ sits on a slope (chart). H M H keeps every layer a quarter wave and gets a flat top, but needs a middle index n<sub>M</sub>. Exact transfer matrix at normal incidence, lossless layers, back surface
          ignored. A plate splitter at 45° splits s and p differently; this page doesn&apos;t model that.
        </p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </>
  );
}
