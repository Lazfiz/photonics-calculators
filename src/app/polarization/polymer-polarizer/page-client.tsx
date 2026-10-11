"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix, fromLog10 } from "../../../components/polarization-format";
import { faceReflectance, sheetMetrics, slabLogTransmittanceFrom } from "../../../physics/polarization/sheet-polarizer";

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const pct = (v: number, digits = 2) => (Number.isFinite(v) ? `${fix(v * 100, digits)} %` : "—");

/** ln k of a film with face reflectance R whose axis absorbs α (µm⁻¹, natural) over d µm. */
const lnK = (R: number, alphaUm: number, dUm: number) => slabLogTransmittanceFrom(R, -alphaUm * dUm);

/** log₁₀ k₁ and k₂ against film thickness, 1–200 µm. */
function thicknessCurves(R: number, alphaPass: number, alphaBlock: number) {
  const t = Array.from({ length: 200 }, (_, i) => 1 + i);
  return [
    { x: t, y: t.map((x) => lnK(R, alphaPass, x) / Math.LN10), type: "scatter" as const, mode: "lines" as const, name: "log₁₀ k₁ (pass, ⟂ stretch)", line: { color: "#60a5fa", width: 2 } },
    { x: t, y: t.map((x) => lnK(R, alphaBlock, x) / Math.LN10), type: "scatter" as const, mode: "lines" as const, name: "log₁₀ k₂ (block, ∥ stretch)", line: { color: "#f87171", width: 2 } },
  ];
}

/** Thickening the film raises the extinction and lowers k₁; the dichroic ratio sets the curve (half, this, double). */
function tradeOffCurves(R: number, alphaBlock: number, ratio: number) {
  const t = Array.from({ length: 300 }, (_, i) => 0.5 + i);
  const colors = ["#9ca3af", "#a78bfa", "#34d399"];
  return [ratio / 2, ratio, ratio * 2].map((r, j) => {
    const pts = t.map((x) => sheetMetrics(lnK(R, alphaBlock / r, x), lnK(R, alphaBlock, x)));
    return {
      x: pts.map((p) => p.k1 * 100), y: pts.map((p) => p.extinctionDb),
      type: "scatter" as const, mode: "lines" as const, name: `Dichroic ratio ${fix(r, 0)}`,
      line: { color: colors[j], width: j === 1 ? 3 : 2, ...(j === 1 ? {} : { dash: "dash" }) },
    };
  });
}

export default function PolymerPolarizerPage() {
  const [thicknessIn, setThickness] = useURLState("thickness", 25);
  const [ratioIn, setDichroicRatio] = useURLState("dichroicRatio", 40);
  const [alphaIn, setAbsorptionCoeff] = useURLState("absorptionCoeff", 0.3);
  const [nIn, setN] = useURLState("n", 1.5);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const d = clamp(thicknessIn, 1, 200);
  const ratio = clamp(ratioIn, 1, 500);
  const alphaBlock = clamp(alphaIn, 0.001, 5);
  const n = clamp(nIn, 1, 2.5);
  const alphaPass = alphaBlock / ratio;
  const R = faceReflectance(n, 0);

  const m = sheetMetrics(lnK(R, alphaPass, d), lnK(R, alphaBlock, d));

  const thicknessChart = thicknessCurves(R, alphaPass, alphaBlock);
  const tradeOff = tradeOffCurves(R, alphaBlock, ratio);

  const layout = (x: string, y: string) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: x, gridcolor: "#374151" },
    yaxis: { title: y, gridcolor: "#374151" },
    margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>stretched PVA–iodine film: chains along the stretch absorb E ∥ stretch (α<sub>∥</sub>), pass E ⟂ (α<sub>⟂</sub> = α<sub>∥</sub>/R<sub>d</sub>)</p>
        <p>k = (1 − R)² e<sup>−αd</sup>/(1 − R² e<sup>−2αd</sup>), &nbsp;k₁ = k(α<sub>⟂</sub>) pass, k₂ = k(α<sub>∥</sub>) block</p>
        <p>extinction k₁/k₂, &nbsp;efficiency (k₁ − k₂)/(k₁ + k₂), &nbsp;one sheet (k₁ + k₂)/2, &nbsp;crossed pair k₁k₂</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <ValidatedNumberInput label="Film thickness (µm)" value={thicknessIn} onChange={setThickness} min={1} max={200} step="1" />
        <ValidatedNumberInput label="Absorption coefficient α∥, block axis (µm⁻¹)" value={alphaIn} onChange={setAbsorptionCoeff} min={0.001} max={5} step="0.01" />
        <ValidatedNumberInput label={<>Dichroic ratio R<sub>d</sub> = α∥/α⟂</>} value={ratioIn} onChange={setDichroicRatio} min={1} max={500} step="1" />
        <ValidatedNumberInput label="Film index n (face reflections)" value={nIn} onChange={setN} min={1} max={2.5} step="0.01" />
      </div>
      <p className="text-xs text-gray-500 mb-6">
        α is the natural-log (Napierian) absorption coefficient; a decadic absorbance A corresponds to αd = 2.303 A. One
        wavelength, normal incidence, uncoated faces in air. The defaults are illustrative, not a product&apos;s data.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {[20, 40, 80].map((r) => (
          <button key={r} onClick={() => setDichroicRatio(r)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">R<sub>d</sub> = {r}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">k₁ (pass, E ⟂ stretch)</p>
          <p className="text-2xl font-bold text-green-400">{pct(m.k1, 2)}</p>
          <p className="text-xs text-gray-500">face reflectance {pct(R, 2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">k₂ (block, E ∥ stretch)</p>
          <p className="text-2xl font-bold text-red-400">{fromLog10(m.log10K2)}</p>
          <p className="text-xs text-gray-500">α∥d = {fix(alphaBlock * d, 2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Extinction ratio k₁/k₂</p>
          <p className="text-2xl font-bold text-yellow-400">{fix(m.extinctionDb, 1)} dB</p>
          <p className="text-xs text-gray-500">polarizing efficiency {fix(m.efficiency * 100, 4)} %</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Unpolarized light</p>
          <p className="text-lg font-bold text-purple-400">one sheet {pct(m.single, 1)}</p>
          <p className="text-xs text-gray-500">parallel pair {pct(m.parallel, 1)}; crossed pair {fromLog10(m.log10Crossed)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Principal transmittances against film thickness (log₁₀)</h3>
          <ChartPanel data={thicknessChart} layout={layout("Thickness (µm)", "log₁₀ k")} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Extinction against pass transmittance as the film thickens</h3>
          <ChartPanel data={tradeOff} layout={layout("k₁ (%)", "Extinction ratio (dB)")} />
        </div>
      </div>
    </>
  );
}
