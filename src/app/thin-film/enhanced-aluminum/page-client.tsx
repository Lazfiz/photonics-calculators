"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import { intervalStats } from "../../../physics/math";
import { rakicIndex } from "../../../physics/materials/lorentz-drude";
import { coatingResponse, type Substrate } from "../../../physics/thin-film/low-emissivity";
import { enhancedMetalReflectance, enhancedMirrorLayers } from "../../../physics/thin-film/metal-mirror";

const NM = 1e-9;
const pct = (x: number, digits = 2) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");

export default function EnhancedAluminumPage() {
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [pairsRaw, setPairs] = useURLState("pairs", 1);
  const [nL, setNL] = useURLState("nL", 1.46);
  const [nH, setNH] = useURLState("nH", 2.35);
  const [alThick, setAlThick] = useURLState("alThick", 80);
  const [adhesionThick, setAdhesionThick] = useURLState("adhesionThick", 0);
  const [nSub, setNSub] = useURLState("nSub", 1.52);

  // The URL isn't range-checked: an integer number of pairs in 0–6.
  const pairs = Math.round(clampToRange(pairsRaw, 0, 6));
  const valid = nL > 0 && nH > 0 && nSub > 0 && alThick >= 0 && adhesionThick >= 0 && designWl >= 250 && designWl <= 1200;
  const lambda0 = designWl * NM;
  const substrate = useMemo<Substrate>(() => ({ material: "dielectric", n: nSub }), [nSub]);

  const design = useMemo(() => {
    const adhesion = { material: "Cr" as const, thickness: adhesionThick * NM };
    const enhanced = enhancedMirrorLayers({ metal: "Al", metalThickness: alThick * NM, nL, nH, pairs, lambda0, adhesion });
    const bare = enhancedMirrorLayers({ metal: "Al", metalThickness: alThick * NM, nL, nH, pairs: 0, lambda0, adhesion });
    return { enhanced, bare };
  }, [alThick, adhesionThick, nL, nH, pairs, lambda0]);

  const results = useMemo(() => {
    if (!valid) return null;
    const R = (layers: typeof design.enhanced) => (lam: number) => coatingResponse(layers, substrate, lam).R;
    const at0 = coatingResponse(design.enhanced, substrate, lambda0);
    return {
      R0: at0.R,
      T0: at0.T,
      bareR0: R(design.bare)(lambda0),
      vis: intervalStats(R(design.enhanced), 400 * NM, 700 * NM, 300),
      bareVis: intervalStats(R(design.bare), 400 * NM, 700 * NM, 300),
      qw: enhancedMetalReflectance(rakicIndex("Al", lambda0), nL, nH, pairs),
    };
  }, [valid, design, substrate, lambda0, nL, nH, pairs]);

  const spectrum = useMemo(() => {
    if (!valid) return null;
    const x = Array.from({ length: 381 }, (_, i) => 250 + 2.5 * i);
    const enh = x.map((w) => coatingResponse(design.enhanced, substrate, w * NM));
    const bare = x.map((w) => coatingResponse(design.bare, substrate, w * NM).R);
    return { x, R: enh.map((s) => s.R), A: enh.map((s) => s.A), bare };
  }, [valid, design, substrate]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Design wavelength λ₀ (nm)" value={designWl} onChange={setDesignWl} min={250} max={1200} step="1" />
        <ValidatedNumberInput label="Enhancing pairs (L then H on the Al)" value={pairs} onChange={setPairs} min={0} max={6} step="1" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (next to the Al)</>} value={nL} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>H</sub> (outermost)</>} value={nH} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Al thickness (nm)" value={alThick} onChange={setAlThick} min={0} max={1000} step="1" />
        <ValidatedNumberInput label="Cr adhesion layer under the Al (nm)" value={adhesionThick} onChange={setAdhesionThick} min={0} max={100} step="1" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set positive indices, non-negative thicknesses and λ₀ in 250–1200 nm.</p>}

      {results && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">R at λ₀ = {designWl} nm</p>
            <p className="text-2xl font-bold text-blue-400">{pct(results.R0)}</p>
            <p className="text-sm text-gray-500 mt-1">Bare Al: {pct(results.bareR0)}; T = {results.T0 < 1e-4 ? results.T0.toExponential(1) : pct(results.T0)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Mean R, 400–700 nm</p>
            <p className="text-2xl font-bold text-green-400">{pct(results.vis.mean)}</p>
            <p className="text-sm text-gray-500 mt-1">Bare Al: {pct(results.bareVis.mean)}; minimum {pct(results.vis.min)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Opaque-Al limit at λ₀</p>
            <p className="text-2xl font-bold text-amber-400">{pct(results.qw)}</p>
            <p className="text-sm text-gray-500 mt-1">|(1 − Y)/(1 + Y)|², Y = (n<sub>H</sub>/n<sub>L</sub>)<sup>2N</sup>(n + iκ)</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Quarter waves at λ₀: d<sub>L</sub> = <span className="text-blue-400 font-mono">{(designWl / (4 * nL)).toFixed(1)} nm</span>, d<sub>H</sub> = <span className="text-blue-400 font-mono">{(designWl / (4 * nH)).toFixed(1)} nm</span></p>
        <p className="text-gray-300 text-xs mt-2">
          Each quarter-wave pair turns the metal&apos;s admittance Y = n + iκ into (n<sub>H</sub>/n<sub>L</sub>)² Y, which raises R near λ₀ and
          lowers it away from λ₀ (the enhanced band is narrower than the metal&apos;s). Al and Cr use the Rakić et al. (1998) Lorentz–Drude n, k,
          which includes aluminium&apos;s interband dip near 800 nm; the dielectrics have constant indices. Exact transfer matrix, normal
          incidence; evaporated films differ from the model by a few per cent, and the native oxide and the substrate&apos;s back face are ignored.
        </p>
      </div>

      {spectrum && (
        <ChartPanel title="Reflectance" data={[
          { x: spectrum.x, y: spectrum.R, type: "scatter", mode: "lines", name: `Enhanced (${pairs} pair${pairs === 1 ? "" : "s"})`, line: { color: "#60a5fa" } },
          { x: spectrum.x, y: spectrum.bare, type: "scatter", mode: "lines", name: "Bare Al", line: { color: "#9ca3af", dash: "dash" } },
          { x: spectrum.x, y: spectrum.A, type: "scatter", mode: "lines", name: "Absorptance", line: { color: "#fbbf24" } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / A", gridcolor: "#374151", range: [0, 1.02] },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        }} />
      )}
    </>
  );
}
