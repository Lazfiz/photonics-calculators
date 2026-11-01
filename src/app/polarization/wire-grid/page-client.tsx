"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import { Z_0 } from "../../../physics/constants";
import { wireGridResponse, type WireGrid } from "../../../physics/polarization/wire-grid";

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const pct = (v: number, digits = 2) => (Number.isFinite(v) ? `${fix(v * 100, digits)} %` : "—");
const dB = (ratio: number) => (Number.isFinite(ratio) && ratio > 0 ? 10 * Math.log10(ratio) : NaN);

// Room-temperature DC conductivities (resistivities 2.65, 1.68 and 1.59 × 10⁻⁸ Ω·m).
const METALS = [
  { name: "Aluminium", sigma: 3.77e7 },
  { name: "Copper", sigma: 5.96e7 },
  { name: "Silver", sigma: 6.3e7 },
];

/** Transmittances and extinction from 1.1 p to 100 p, widened to include the current wavelength λ (m), marked on each series. */
function spectralCurves(grid: WireGrid, lambda: number) {
  const lo = Math.min(1.1 * grid.period, 0.8 * lambda), hi = Math.max(100 * grid.period, 1.25 * lambda);
  const l = Array.from({ length: 200 }, (_, i) => lo * (hi / lo) ** (i / 199));
  const now = wireGridResponse(grid, lambda);
  const mark = (y: number, name: string, color: string, yaxis?: string) => (
    { x: [lambda * 1e6], y: [y], type: "scatter" as const, mode: "markers" as const, name, marker: { color, size: 9 }, showlegend: false, ...(yaxis ? { yaxis } : {}) }
  );
  const r = l.map((x) => wireGridResponse(grid, x));
  const um = l.map((x) => x * 1e6);
  return [
    { x: um, y: r.map((q) => q.perpendicular.T), type: "scatter" as const, mode: "lines" as const, name: "T (E ⟂ strips)", line: { color: "#34d399", width: 2 } },
    { x: um, y: r.map((q) => q.parallel.T), type: "scatter" as const, mode: "lines" as const, name: "T (E ∥ strips)", line: { color: "#f87171", width: 2 } },
    { x: um, y: r.map((q) => dB(q.extinction)), type: "scatter" as const, mode: "lines" as const, name: "Extinction (dB)", line: { color: "#a78bfa", dash: "dash" }, yaxis: "y2" },
    mark(now.perpendicular.T, "Current λ, T ⟂", "#34d399"),
    mark(now.parallel.T, "Current λ, T ∥", "#f87171"),
    mark(dB(now.extinction), "Current λ, extinction", "#a78bfa", "y2"),
  ];
}

/** Extinction and T⟂ against the fill factor w/p at wavelength λ (m). */
function fillCurves(grid: WireGrid, lambda: number) {
  const f = Array.from({ length: 91 }, (_, i) => 0.05 + i * 0.01);
  const r = f.map((x) => wireGridResponse({ ...grid, width: x * grid.period }, lambda));
  return [
    { x: f, y: r.map((q) => dB(q.extinction)), type: "scatter" as const, mode: "lines" as const, name: "Extinction (dB)", line: { color: "#a78bfa", width: 2 } },
    { x: f, y: r.map((q) => q.perpendicular.T * 100), type: "scatter" as const, mode: "lines" as const, name: "T ⟂ (%)", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
  ];
}

export default function WireGridPage() {
  const [wavelengthIn, setWavelength] = useURLState("wavelength", 10.6);
  const [periodIn, setPeriod] = useURLState("wireSpacing", 0.83);
  const [widthIn, setWidth] = useURLState("stripWidth", 0.415);
  const [thicknessIn, setThickness] = useURLState("stripThickness", 0.1);
  const [sigmaIn, setSigma] = useURLState("wireConductivity", 3.77e7);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const lambdaUm = clamp(wavelengthIn, 0.2, 3000);
  const periodUm = clamp(periodIn, 0.01, 1000);
  const widthUm = clamp(widthIn, 0.001, 1000);
  const thicknessUm = clamp(thicknessIn, 0.001, 100);
  const sigma = clamp(sigmaIn, 1e4, 1e9);
  const grid = { period: periodUm * 1e-6, width: widthUm * 1e-6, thickness: thicknessUm * 1e-6, conductivity: sigma };
  const g = wireGridResponse(grid, lambdaUm * 1e-6);
  const widthOk = widthUm < periodUm;
  const diffracts = periodUm >= lambdaUm;

  const spectral = spectralCurves(grid, lambdaUm * 1e-6);
  const fill = fillCurves(grid, lambdaUm * 1e-6);

  const layout = (x: string, y: string, y2: string, logX = false, y2Range?: [number, number]) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: x, gridcolor: "#374151", ...(logX ? { type: "log" as const } : {}) },
    yaxis: { title: y, gridcolor: "#374151" },
    yaxis2: { title: y2, overlaying: "y" as const, side: "right" as const, gridcolor: "transparent", ...(y2Range ? { range: y2Range } : {}) },
    margin: { t: 20, r: 60, b: 50, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>shunt sheet across free space: t = 2Z/(2Z + Z₀), r = −Z₀/(2Z + Z₀), A = 1 − |t|² − |r|²</p>
        <p>E ∥ strips: Z = iZ₀(p/λ) ln csc(πw/2p) + Z<sub>strip</sub> p/w; &nbsp;E ⟂ strips: 1/Z = i(4/Z₀)(p/λ) ln csc(π(p − w)/2p)</p>
        <p>valid for p ≪ λ; at p ≥ λ a diffraction order propagates</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <ValidatedNumberInput label="Wavelength (µm)" value={wavelengthIn} onChange={setWavelength} min={0.2} max={3000} step="0.1" />
        <ValidatedNumberInput label="Period p (µm)" value={periodIn} onChange={setPeriod} min={0.01} max={1000} step="0.01" />
        <ValidatedNumberInput label="Strip width w (µm)" value={widthIn} onChange={setWidth} min={0.001} max={1000} step="0.01" />
        <ValidatedNumberInput label="Strip thickness (µm)" value={thicknessIn} onChange={setThickness} min={0.001} max={100} step="0.01" />
        <ValidatedNumberInput label="Conductivity (S/m)" value={sigmaIn} onChange={setSigma} min={1e4} max={1e9} step="1e5" />
      </div>
      <p className="text-xs text-gray-500 mb-4">
        A free-standing grating of flat metal strips at normal incidence (no substrate). The strips&apos; thickness enters
        only the ohmic loss, computed from the DC conductivity and the classical skin depth: indicative, best in the far
        infrared. Tall strips extinguish more than this thin-sheet model shows.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {METALS.map((mt) => (
          <button key={mt.name} onClick={() => setSigma(mt.sigma)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">{mt.name} ({mt.sigma.toExponential(2)} S/m)</button>
        ))}
      </div>

      {!widthOk && <p className="text-sm text-yellow-400 mb-4">The strip width must be smaller than the period.</p>}
      {diffracts && <p className="text-sm text-yellow-400 mb-4">p ≥ λ: a diffraction order propagates and the quasi-static model does not apply.</p>}
      {!diffracts && g.periodRatio > 0.5 && (
        <p className="text-sm text-yellow-400 mb-4">p/λ = {fix(g.periodRatio, 2)}: the formulas are first order in p/λ and lose accuracy well before p reaches λ.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T (E ⟂ strips, passed)</p>
          <p className="text-2xl font-bold text-green-400">{pct(g.perpendicular.T, 2)}</p>
          <p className="text-xs text-gray-500">reflects {pct(g.perpendicular.R, 2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T (E ∥ strips, blocked)</p>
          <p className="text-2xl font-bold text-red-400">{pct(g.parallel.T, 3)}</p>
          <p className="text-xs text-gray-500">reflects {pct(g.parallel.R, 2)}, absorbs {pct(g.parallel.A, 2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Extinction ratio T⟂/T∥</p>
          <p className="text-2xl font-bold text-yellow-400">{Number.isFinite(dB(g.extinction)) ? `${fix(dB(g.extinction), 1)} dB` : "—"}</p>
          <p className="text-xs text-gray-500">p/λ = {fix(g.periodRatio, 3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Grid impedances (per square)</p>
          <p className="text-sm font-mono text-gray-200">Z∥ = {fix(g.parallel.Z.re, 2)} + {fix(g.parallel.Z.im, 2)}i Ω</p>
          <p className="text-sm font-mono text-gray-200">Z⟂ = {fix(g.perpendicular.Z.im, 1)}i Ω</p>
          <p className="text-xs text-gray-500">Z₀ = {fix(Z_0, 1)} Ω; skin depth {fix(g.skinDepth * 1e9, 1)} nm</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Against wavelength, from 1.1 p to 100 p (this grating)</h3>
          <ChartPanel data={spectral} layout={layout("Wavelength (µm)", "Transmittance", "Extinction (dB)", true)} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Against the fill factor w/p (this wavelength)</h3>
          <ChartPanel data={fill} layout={layout("Fill factor w/p", "Extinction (dB)", "T ⟂ (%)", false, [0, 100])} />
        </div>
      </div>
    </>
  );
}
