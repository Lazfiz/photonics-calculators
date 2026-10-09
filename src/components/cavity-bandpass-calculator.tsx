"use client";

import { useMemo } from "react";
import ChartPanel from "./chart-panel";
import ValidatedNumberInput from "./validated-number-input";
import { useURLState } from "../hooks/use-url-state";
import { clampToRange } from "../lib/number-input";
import { cavityFilterLayers, cavityPassband } from "../physics/thin-film/cavity-filter";
import { stopBandHalfWidth } from "../physics/thin-film/quarter-wave-stack";
import { stackResponse } from "../physics/thin-film/transfer-matrix";

const NM = 1e-9;

export interface CavityBandpassDefaults {
  nH: number;
  nL: number;
  nSub: number;
  spacerN: number;
  /** Centre wavelength λ₀, nm. */
  centerWl: number;
  /** HL pairs in each mirror. */
  pairs: number;
  cavities: number;
}

interface Props {
  defaults: CavityBandpassDefaults;
  /** URL key of the mirror-pair count (the two pages used different names). */
  pairsKey: string;
  maxPairs: number;
}

const pct = (x: number, digits = 2) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");
/** A width in nm, switching to pm below 0.1 nm. */
function width(m: number): string {
  if (!(m > 0)) return "—";
  return m < 0.1 * NM ? `${(m / 1e-12).toPrecision(4)} pm` : `${(m / NM).toPrecision(4)} nm`;
}

/**
 * All-dielectric Fabry–Perot band-pass filter: cavities (HL)^p S (LH)^p with half-wave spacers, coupled by
 * quarter-wave L layers (`cavityFilterLayers`), on a substrate in air at normal incidence. Reports the
 * pass band from `cavityPassband` (scan + bisection, not the plotted grid). Used by the bandpass-filter and
 * narrow-bandpass pages.
 */
export default function CavityBandpassCalculator({ defaults, pairsKey, maxPairs }: Props) {
  const [nH, setNH] = useURLState("nH", defaults.nH);
  const [nL, setNL] = useURLState("nL", defaults.nL);
  const [nSub, setNSub] = useURLState("nSub", defaults.nSub);
  const [spacerN, setSpacerN] = useURLState("spacerN", defaults.spacerN);
  const [centerWl, setCenterWl] = useURLState("centerWl", defaults.centerWl);
  const [pairsRaw, setPairs] = useURLState(pairsKey, defaults.pairs);
  const [cavitiesRaw, setCavities] = useURLState("cavities", defaults.cavities);
  // The URL isn't range-checked: integer counts within the input ranges.
  const pairs = Math.round(clampToRange(pairsRaw, 1, maxPairs));
  const cavities = Math.round(clampToRange(cavitiesRaw, 1, 6));
  const valid = nH > nL && nL > 0 && nSub > 0 && spacerN > 0 && centerWl >= 100 && centerWl <= 20000;

  const lambda0 = centerWl * NM;
  const dg = stopBandHalfWidth(nH, nL);
  const result = useMemo(() => {
    if (!valid) return null;
    const layers = cavityFilterLayers({ nH, nL, nSpacer: spacerN, mirrorPairs: pairs, cavities, spacerQuarterWaves: 2, lambda0 });
    const stack = { incident: 1, layers, substrate: { n: nSub } };
    return { stack, layerCount: layers.length, band: cavityPassband(stack, lambda0, dg), T0: stackResponse(stack, lambda0).T };
  }, [valid, nH, nL, spacerN, pairs, cavities, lambda0, nSub, dg]);

  const band = result?.band;
  const fwhm = band ? band.long - band.short : NaN;
  const hasBand = Number.isFinite(fwhm) && fwhm > 0;

  const charts = useMemo(() => {
    if (!result) return null;
    const T = (wl: number) => stackResponse(result.stack, wl).T;
    // Detail: λ₀ ± 2.5 FWHM. Wide: the mirrors' zone and some margin, with the detail points merged in so the
    // pass band is drawn at full height however narrow it is.
    const detail = hasBand ? Array.from({ length: 601 }, (_, i) => lambda0 + (i / 600 - 0.5) * 5 * fwhm) : [];
    const lo = lambda0 / (1 + 1.6 * dg), hi = lambda0 / (1 - 1.6 * dg);
    const wide = Array.from({ length: 1201 }, (_, i) => lo + ((hi - lo) * i) / 1200)
      .concat(detail.filter((wl) => wl > lo && wl < hi))
      .sort((a, b) => a - b);
    const wideT = wide.map(T);
    return {
      detail: { x: detail.map((wl) => wl / NM), y: detail.map((wl) => T(wl) * 100) },
      wide: { x: wide.map((wl) => wl / NM), T: wideT, R: wideT.map((t) => 1 - t) },
    };
  }, [result, hasBand, lambda0, fwhm, dg]);

  const peakAtCentre = band ? band.peakShort === band.peakLong : true;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Centre wavelength λ₀ (nm)" value={centerWl} onChange={setCenterWl} min={100} max={20000} step="10" />
        <ValidatedNumberInput label={<>n<sub>H</sub> (high index)</>} value={nH} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub> (low index)</>} value={nL} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Spacer index (half-wave spacer)" value={spacerN} onChange={setSpacerN} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Mirror pairs p (HL pairs per mirror)" value={pairs} onChange={setPairs} min={1} max={maxPairs} step="1" />
        <ValidatedNumberInput label="Cavities" value={cavities} onChange={setCavities} min={1} max={6} step="1" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set n<sub>H</sub> above n<sub>L</sub> (the mirrors need an index contrast), positive indices and λ₀ in 100–20 000 nm.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Peak transmittance</p>
          <p className="text-2xl font-bold text-blue-400">{pct(band?.peakT ?? NaN)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {!band || !Number.isFinite(band.peakT) ? "" : peakAtCentre ? "At λ₀" : `Ripple peaks at ${(band.peakShort / NM).toFixed(3)} and ${(band.peakLong / NM).toFixed(3)} nm`}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Transmittance at λ₀</p>
          <p className="text-2xl font-bold text-blue-400">{pct(result?.T0 ?? NaN)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">FWHM</p>
          <p className="text-2xl font-bold text-green-400">{width(fwhm)}</p>
          <p className="text-sm text-gray-500 mt-1">{hasBand ? `${(band!.short / NM).toFixed(3)} – ${(band!.long / NM).toFixed(3)} nm` : valid ? "T doesn't fall to half: add mirror pairs" : ""}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">λ₀ / FWHM</p>
          <p className="text-2xl font-bold text-purple-400">{hasBand ? (lambda0 / fwhm).toPrecision(4) : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Resolving power (Q), not a finesse</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Layers: <span className="text-blue-400 font-mono">{result?.layerCount ?? "—"}</span>; mirror zone (infinite stack) {valid ? `${(lambda0 / (1 + dg) / NM).toFixed(1)} – ${(lambda0 / (1 - dg) / NM).toFixed(1)} nm` : "—"}</p>
        <p className="text-gray-300 text-xs mt-2">
          Each cavity is (HL)<sup>p</sup> S (LH)<sup>p</sup> with a half-wave spacer S; cavities are coupled by a quarter-wave L layer.
          Exact transfer matrix at normal incidence from air, lossless and non-dispersive layers, back surface ignored.
          FWHM: from λ₀ outward to where T first falls to half the peak, found by bisection. There are no matching layers,
          so the peak T is below 100 % and a multi-cavity pass band ripples (Macleod, Thin-Film Optical Filters, ch. 8).
        </p>
      </div>

      {charts && hasBand && (
        <div className="mb-6">
          <ChartPanel title="Pass band (λ₀ ± 2.5 FWHM)" data={[
            { x: charts.detail.x, y: charts.detail.y, type: "scatter", mode: "lines", name: "T (%)", line: { color: "#60a5fa" } },
            { x: [band!.short / NM, band!.long / NM], y: [band!.peakT * 50, band!.peakT * 50], type: "scatter", mode: "lines", name: "FWHM", line: { color: "#34d399", dash: "dash" } },
          ]} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Transmittance (%)", gridcolor: "#374151", range: [0, 105] },
            margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
          }} />
        </div>
      )}

      {charts && (
        <ChartPanel title="Whole stop band" data={[
          { x: charts.wide.x, y: charts.wide.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171" } },
          { x: charts.wide.x, y: charts.wide.T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#60a5fa" } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        }} />
      )}
    </>
  );
}
