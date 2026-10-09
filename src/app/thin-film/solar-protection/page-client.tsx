"use client";

import { useEffect, useMemo, useState } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import {
  edgeFilterLayers,
  incoherentLosslessFaces,
  staggeredDesignWavelengths,
} from "../../../physics/thin-film/edge-filter";
import { stopBandHalfWidth } from "../../../physics/thin-film/quarter-wave-stack";
import { stackResponse, type Stack } from "../../../physics/thin-film/transfer-matrix";

const NM = 1e-9;
type G173 = typeof import("../../../physics/astm-g173");
const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)} %` : "—");

export default function SolarProtectionPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [uvFrom, setUvFrom] = useURLState("uvFrom", 300);
  const [uvTo, setUvTo] = useURLState("uvTo", 400);
  const [irFrom, setIrFrom] = useURLState("irFrom", 720);
  const [irTo, setIrTo] = useURLState("irTo", 1300);
  const [uvPairsRaw, setUvPairs] = useURLState("uvPairs", 8);
  const [irPairsRaw, setIrPairs] = useURLState("irPairs", 10);

  // The ASTM G173 table (2002 points) loads after hydration, outside the page bundle.
  const [g173, setG173] = useState<G173 | null>(null);
  useEffect(() => {
    let alive = true;
    import("../../../physics/astm-g173").then((m) => {
      if (alive) setG173(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  // The URL isn't range-checked: integer periods per stack in 1–40.
  const uvPairs = Math.round(clampToRange(uvPairsRaw, 1, 40));
  const irPairs = Math.round(clampToRange(irPairsRaw, 1, 40));
  const valid = nH > nL && nL > 0 && nSub > 0 && uvFrom > 0 && uvTo > uvFrom && irFrom > 0 && irTo > irFrom;

  // Outer face: long-pass stacks reflecting the UV band. Inner face: short-pass stacks reflecting the near IR.
  const uvCentres = useMemo(() => (valid ? staggeredDesignWavelengths("long-pass", uvFrom * NM, uvTo * NM, nH, nL) : []), [valid, uvFrom, uvTo, nH, nL]);
  const irCentres = useMemo(() => (valid ? staggeredDesignWavelengths("short-pass", irFrom * NM, irTo * NM, nH, nL) : []), [valid, irFrom, irTo, nH, nL]);
  const tooBig = uvCentres.length * uvPairs + irCentres.length * irPairs > 400;
  const ready = valid && uvCentres.length > 0 && irCentres.length > 0 && !tooBig;

  // T(λ) of the coated pane (λ in m), cached because every result reuses the same G173 wavelengths.
  const transmittance = useMemo(() => {
    const face = (layers: Stack["layers"]): Stack => ({ incident: 1, layers, substrate: { n: nSub } });
    const outer = face(edgeFilterLayers("long-pass", uvCentres, nH, nL, uvPairs));
    const inner = face(edgeFilterLayers("short-pass", irCentres, nH, nL, irPairs));
    const cache = new Map<number, number>();
    return (wl: number) => {
      let t = cache.get(wl);
      if (t === undefined) {
        t = incoherentLosslessFaces(stackResponse(outer, wl).R, stackResponse(inner, wl).R).T;
        cache.set(wl, t);
      }
      return t;
    };
  }, [nSub, uvCentres, irCentres, nH, nL, uvPairs, irPairs]);

  const solar = useMemo(() => {
    if (!ready || !g173) return null;
    const m = (from?: number, to?: number) => g173.solarWeightedMean(transmittance, from, to);
    return { total: m(), uv: m(280, 400), vis: m(400, 700), nir: m(700, 4000) };
  }, [ready, g173, transmittance]);

  const bareGlass = (2 * nSub) / (nSub * nSub + 1); // two uncoated faces, incoherent: 2n/(n² + 1)

  // Third-order zones of the IR stacks, g = λ₀/λ in 3 ± Δg, that reach the visible.
  const dg = stopBandHalfWidth(nH, nL);
  const thirdOrder = irCentres
    .map((c) => ({ from: c / (3 + dg) / NM, to: c / (3 - dg) / NM }))
    .filter((z) => z.to > 400 && z.from < 700);

  const chartData = useMemo(() => {
    if (!ready) return [];
    const wls = Array.from({ length: 1501 }, (_, i) => 280 + (2220 * i) / 1500);
    const traces: Record<string, unknown>[] = [
      { x: wls, y: wls.map((wl) => transmittance(wl * NM)), type: "scatter", mode: "lines", name: "Coated pane", line: { color: "#60a5fa", width: 2 } },
    ];
    if (g173) {
      const idx = g173.G173_WAVELENGTHS_NM.flatMap((w, i) => (w <= 2500 ? [i] : []));
      const peak = Math.max(...idx.map((i) => g173.G173_GLOBAL_TILT[i]));
      traces.push({
        x: idx.map((i) => g173.G173_WAVELENGTHS_NM[i]),
        y: idx.map((i) => g173.G173_GLOBAL_TILT[i] / peak),
        type: "scatter", mode: "lines", name: "Sunlight", line: { color: "#fbbf24", width: 1 },
      });
    }
    return traces;
  }, [ready, transmittance, g173]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>glass</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
        <div />
        <ValidatedNumberInput label="UV reflector: from (nm)" value={uvFrom} onChange={setUvFrom} min={200} max={4000} step="10" />
        <ValidatedNumberInput label="UV reflector: to (nm)" value={uvTo} onChange={setUvTo} min={200} max={4000} step="10" />
        <ValidatedNumberInput label="IR reflector: from (nm)" value={irFrom} onChange={setIrFrom} min={200} max={4000} step="10" />
        <ValidatedNumberInput label="IR reflector: to (nm)" value={irTo} onChange={setIrTo} min={200} max={4000} step="10" />
        <ValidatedNumberInput label="UV periods per stack" value={uvPairs} onChange={setUvPairs} min={1} max={40} step="1" />
        <ValidatedNumberInput label="IR periods per stack" value={irPairs} onChange={setIrPairs} min={1} max={40} step="1" />
      </div>

      <div className="space-y-1 mb-6 text-sm text-yellow-400">
        {!valid && <p>Set n<sub>H</sub> above n<sub>L</sub> and each band&apos;s &quot;from&quot; below its &quot;to&quot;.</p>}
        {tooBig && <p>Too many stacks to compute here; narrow the bands or use fewer periods.</p>}
        {thirdOrder.map((z) => (
          <p key={z.from}>A third-order zone of the IR reflector, {z.from.toFixed(0)}–{z.to.toFixed(0)} nm, blocks visible light.</p>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Solar transmittance (AM1.5 G, 280–4000 nm)</p>
          <p className="text-3xl font-bold text-orange-400">{pct(solar?.total ?? NaN)}</p>
          <p className="text-sm text-gray-500 mt-1">Uncoated glass: {pct(bareGlass)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Solar energy reflected</p>
          <p className="text-3xl font-bold text-green-400">{pct(solar ? 1 - solar.total : NaN)}</p>
          <p className="text-sm text-gray-500 mt-1">Lossless layers and glass: nothing is absorbed</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">UV, 280–400 nm</p>
          <p className="text-xl font-bold text-purple-400">T = {pct(solar?.uv ?? NaN)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Visible, 400–700 nm</p>
          <p className="text-xl font-bold text-blue-400">T = {pct(solar?.vis ?? NaN)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Near IR, 700–4000 nm</p>
          <p className="text-xl font-bold text-red-400">T = {pct(solar?.nir ?? NaN)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Outer face: {uvCentres.length} × (H/2 L H/2)<sup>{uvPairs}</sup> at λ₀ = <span className="text-blue-400 font-mono">{uvCentres.map((c) => (c / NM).toFixed(1)).join(", ") || "—"} nm</span></p>
        <p className="text-gray-300">Inner face: {irCentres.length} × (L/2 H L/2)<sup>{irPairs}</sup> at λ₀ = <span className="text-blue-400 font-mono">{irCentres.map((c) => (c / NM).toFixed(1)).join(", ") || "—"} nm</span></p>
        <p className="text-gray-300 text-xs mt-2">
          Each band is covered by edge-filter stacks in series. The two faces add in intensity, T = T₁T₂/(1 − R₁R₂), and every
          transmittance is weighted by the ASTM G173 global-tilt spectrum: T = ∫T(λ)E(λ)dλ / ∫E(λ)dλ over the band.
          The chart&apos;s sunlight curve is that spectrum scaled to its peak.
        </p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Transmittance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.6, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 11 } },
      }} />
    </>
  );
}
