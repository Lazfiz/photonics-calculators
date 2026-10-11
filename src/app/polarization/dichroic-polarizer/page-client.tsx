"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix, fromLog10 } from "../../../components/polarization-format";
import { faceReflectance, sheetMetrics, slabLogTransmittance } from "../../../physics/polarization/sheet-polarizer";

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const pct = (v: number, digits = 2) => (Number.isFinite(v) ? `${fix(v * 100, digits)} %` : "—");

/** log₁₀ of the principal transmittances and the extinction ratio against thickness, up to 1 mm or twice d. */
function thicknessCharts(nPass: number, kPass: number, nBlock: number, kBlock: number, lambda: number, d: number) {
  const t = Array.from({ length: 200 }, (_, i) => (i + 1) * 0.005 * Math.max(1, (d * 1e3) / 0.5));
  const l1 = t.map((x) => slabLogTransmittance(nPass, kPass, x * 1e-3, lambda) / Math.LN10);
  const l2 = t.map((x) => slabLogTransmittance(nBlock, kBlock, x * 1e-3, lambda) / Math.LN10);
  return {
    logT: [
      { x: t, y: l1, type: "scatter" as const, mode: "lines" as const, name: "log₁₀ k₁ (pass)", line: { color: "#60a5fa", width: 2 } },
      { x: t, y: l2, type: "scatter" as const, mode: "lines" as const, name: "log₁₀ k₂ (block)", line: { color: "#f87171", width: 2 } },
    ],
    er: [
      { x: t, y: t.map((_, i) => 10 * (l1[i] - l2[i])), type: "scatter" as const, mode: "lines" as const, name: "Extinction ratio (dB)", line: { color: "#a78bfa", width: 2 } },
      { x: t, y: t.map((_, i) => 10 ** l1[i] * 100), type: "scatter" as const, mode: "lines" as const, name: "k₁ (%)", line: { color: "#60a5fa", dash: "dash" }, yaxis: "y2" },
    ],
  };
}

export default function DichroicPolarizerPage() {
  const [wavelengthIn, setWavelength] = useURLState("wavelength", 550);
  const [nPassIn, setNPass] = useURLState("nE", 1.62);
  const [kPassIn, setKPass] = useURLState("kE", 1e-5);
  const [nBlockIn, setNBlock] = useURLState("nO", 1.64);
  const [kBlockIn, setKBlock] = useURLState("kO", 3e-3);
  const [thicknessIn, setThickness] = useURLState("thickness", 0.1);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const lambda = clamp(wavelengthIn, 200, 20000) * 1e-9;
  const nPass = clamp(nPassIn, 1, 5);
  const kPass = clamp(kPassIn, 0, 10);
  const nBlock = clamp(nBlockIn, 1, 5);
  const kBlock = clamp(kBlockIn, 0, 10);
  const d = clamp(thicknessIn, 0.001, 10) * 1e-3;

  const lnK1 = slabLogTransmittance(nPass, kPass, d, lambda);
  const lnK2 = slabLogTransmittance(nBlock, kBlock, d, lambda);
  const m = sheetMetrics(lnK1, lnK2);
  const alpha = (k: number) => (4 * Math.PI * k) / lambda;
  const swapped = lnK2 > lnK1;

  const thicknessChart = thicknessCharts(nPass, kPass, nBlock, kBlock, lambda, d);


  const layout = (y: string, y2?: string) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: "Thickness (mm)", gridcolor: "#374151" },
    yaxis: { title: y, gridcolor: "#374151" },
    ...(y2 ? { yaxis2: { title: y2, overlaying: "y" as const, side: "right" as const, gridcolor: "transparent", range: [0, 100] } } : {}),
    margin: { t: 20, r: y2 ? 60 : 20, b: 50, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>each principal axis: N = n − iκ, &nbsp;α = 4πκ/λ, &nbsp;R = ((n − 1)² + κ²)/((n + 1)² + κ²)</p>
        <p>k = (1 − R)² e<sup>−αd</sup>/(1 − R² e<sup>−2αd</sup>) &nbsp;(normal incidence, incoherent reflections)</p>
        <p>extinction k₁/k₂, &nbsp;efficiency (k₁ − k₂)/(k₁ + k₂), &nbsp;crossed pair H₉₀ = k₁k₂</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthIn} onChange={setWavelength} min={200} max={20000} step="10" />
        <ValidatedNumberInput label="Thickness (mm)" value={thicknessIn} onChange={setThickness} min={0.001} max={10} step="0.01" />
        <div />
        <ValidatedNumberInput label="n, pass axis" value={nPassIn} onChange={setNPass} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="κ, pass axis" value={kPassIn} onChange={setKPass} min={0} max={10} step="0.00001" />
        <div />
        <ValidatedNumberInput label="n, block axis" value={nBlockIn} onChange={setNBlock} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="κ, block axis" value={kBlockIn} onChange={setKBlock} min={0} max={10} step="0.0001" />
      </div>
      <p className="text-xs text-gray-500 mb-6">
        κ is the imaginary part of the index (absorption index), not an absorption coefficient: κ = 3 × 10⁻³ at 550 nm is
        α = 68.5 mm⁻¹. A metal has κ of order 1 to 10 and blocks both axes. The defaults are illustrative, not a measured material.
      </p>

      {swapped && <p className="text-sm text-yellow-400 mb-4">The &quot;block&quot; axis transmits more than the &quot;pass&quot; axis: the ratios below are below 1 (negative dB).</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">k₁ (pass axis)</p>
          <p className="text-2xl font-bold text-green-400">{pct(m.k1, 2)}</p>
          <p className="text-xs text-gray-500">α = {fix(alpha(kPass) * 1e-3, 4)} mm⁻¹, R = {pct(faceReflectance(nPass, kPass), 2)} per face</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">k₂ (block axis)</p>
          <p className="text-2xl font-bold text-red-400">{fromLog10(m.log10K2)}</p>
          <p className="text-xs text-gray-500">α = {fix(alpha(kBlock) * 1e-3, 2)} mm⁻¹, R = {pct(faceReflectance(nBlock, kBlock), 2)} per face</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Extinction ratio k₁/k₂</p>
          <p className="text-2xl font-bold text-yellow-400">{fix(m.extinctionDb, 1)} dB</p>
          <p className="text-xs text-gray-500">efficiency {fix(m.efficiency * 100, 4)} %; κ ratio {kPass > 0 ? fix(kBlock / kPass, 0) : "∞"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Unpolarized light</p>
          <p className="text-lg font-bold text-purple-400">one sheet {pct(m.single, 2)}</p>
          <p className="text-xs text-gray-500">two crossed: {fromLog10(m.log10Crossed)}; parallel: {pct(m.parallel, 2)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Principal transmittances against thickness (log₁₀)</h3>
          <ChartPanel data={thicknessChart.logT} layout={layout("log₁₀ k")} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Extinction ratio and pass transmittance against thickness</h3>
          <ChartPanel data={thicknessChart.er} layout={layout("Extinction (dB)", "k₁ (%)")} />
        </div>
      </div>
    </>
  );
}
