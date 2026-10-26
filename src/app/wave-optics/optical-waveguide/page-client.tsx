"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { slabEffectiveIndex, slabModeB, slabModeCount, slabTEConfinement, slabTEField, slabV } from "../../../physics/wave-optics/slab-waveguide";
import { numericalAperture } from "../../../physics/fiber-optics/step-index-modes";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const COLORS = ["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#f87171"];
const MAX_PLOTTED = 6;

export default function OpticalWaveguidePage() {
  const [nCoreRaw, setNCore] = useURLState("nCore", 1.5);
  const [nCladRaw, setNClad] = useURLState("nClad", 1.45);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [widthRaw, setWidth] = useURLState("coreWidth", 10); // µm, full thickness

  const n1 = clamp(nCoreRaw, 1, 5, 1.5);
  const n2 = clamp(nCladRaw, 1, 5, 1.45);
  const lambda = clamp(wavelengthRaw, 100, 1e5, 1550) * 1e-9;
  const d = clamp(widthRaw, 0.01, 1e4, 10) * 1e-6;

  const V = slabV(n1, n2, d, lambda);
  const guided = Number.isFinite(V);
  const NA = guided ? numericalAperture(n1, n2) : NaN;
  const modes = guided ? slabModeCount(V) : 0;
  const rTM = (n1 * n1) / (n2 * n2);
  const bTE = slabModeB(V, 0);
  const bTM = slabModeB(V, 0, rTM);
  const neffTE = slabEffectiveIndex(bTE, n1, n2);
  const neffTM = slabEffectiveIndex(bTM, n1, n2);
  const confinement = slabTEConfinement(V, bTE, 0);
  const criticalAngle = guided ? (Math.asin(n2 / n1) * 180) / Math.PI : NaN;
  const acceptance = NA >= 1 ? 90 : (Math.asin(NA) * 180) / Math.PI;
  const singleModeD = guided ? lambda / (2 * NA) : NaN; // V = π/2

  const vMax = guided ? Math.max(1.5 * V, Math.PI) : 0;
  const bvSeries = guided ? Array.from({ length: Math.min(slabModeCount(vMax), MAX_PLOTTED) }, (_, m) => {
    const v0 = (m * Math.PI) / 2;
    const points = Array.from({ length: 151 }, (_, i) => v0 + ((vMax - v0) * (i + 1)) / 151)
      .map((v) => ({ x: round6(v), y: round6(slabModeB(v, m)) }));
    return { name: `TE${m}`, color: COLORS[m % COLORS.length], points: [{ x: round6(v0), y: 0 }, ...points] };
  }) : [];
  const bvMarker = guided ? [{
    name: "This guide", color: "#e5e7eb", showPoints: true,
    points: Array.from({ length: Math.min(modes, MAX_PLOTTED) }, (_, m) => ({ x: round6(V), y: round6(slabModeB(V, m)) })),
  }] : [];

  const a = d / 2;
  const xs = Array.from({ length: 301 }, (_, i) => ((i - 150) / 100) * d);
  const fieldSeries = guided ? Array.from({ length: Math.min(modes, 4) }, (_, m) => {
    const b = slabModeB(V, m);
    return { name: `TE${m}`, color: COLORS[m % COLORS.length], points: xs.map((x) => ({ x: round6(x * 1e6), y: round6(slabTEField(x, a, V, b, m)) })) };
  }) : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Core index n₁" value={nCoreRaw} onChange={setNCore} min={1} max={5} step="any" />
        <ValidatedNumberInput label="Cladding index n₂" value={nCladRaw} onChange={setNClad} min={1} max={5} step="any" />
        <ValidatedNumberInput label="Wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={1e5} step="any" />
        <ValidatedNumberInput label="Core thickness d (µm)" value={widthRaw} onChange={setWidth} min={0.01} max={1e4} step="any" />
      </div>

      {!guided && (
        <p className="mb-6 text-sm text-yellow-400">No guided modes: the core index must be higher than the cladding index (total internal reflection needs n₁ &gt; n₂).</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="V-number" value={fmt(V)} subtext={`(πd/λ)√(n₁² − n₂²); NA = ${fmt(NA)}`} tone="green" />
        <ResultCard label="Guided modes" value={guided ? `${modes} TE + ${modes} TM` : "0"}
          subtext={guided ? `⌊2V/π⌋ + 1; single-mode for d < λ/(2NA) = ${fmt(singleModeD * 1e6, 4)} µm` : "—"} tone="orange" />
        <ResultCard label="TE₀ effective index" value={fmt(neffTE, 7)} subtext={`b = ${fmt(bTE, 5)}; TM₀: ${fmt(neffTM, 7)}`} tone="blue" />
        <ResultCard label="TE₀ power in the core" value={`${fmt(confinement * 100, 4)} %`}
          subtext={guided ? `θ_c = ${fmt(criticalAngle, 4)}°, acceptance ±${fmt(acceptance, 4)}° in air` : "—"} tone="purple" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6">
        <p>A symmetric slab of thickness d and index n₁ between two claddings of index n₂. With u = V√(1 − b) and w = V√b, TE
          mode m satisfies u = mπ/2 + arctan(w/u), and TM modes have w multiplied by n₁²/n₂². The page solves these exactly
          by bisection. Mode m is cut off at V = mπ/2, so the fundamental TE₀ and TM₀ modes are always guided, and the
          normalized index b = (n_eff² − n₂²)/(n₁² − n₂²) runs from 0 at cutoff towards 1. Here V uses the half-thickness,
          so it is half the V of Kogelnik and Ramaswamy.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {bvSeries.length > 0 && (
          <SimpleLineChart title="Normalized index b vs V (TE modes)" xLabel="V" yLabel="b" series={[...bvSeries, ...bvMarker]} />
        )}
        {fieldSeries.length > 0 && (
          <SimpleLineChart title="TE mode fields across the slab" xLabel="x (µm), core |x| ≤ d/2" yLabel="E_y (core-normalized)" series={fieldSeries} />
        )}
      </div>
    </>
  );
}
