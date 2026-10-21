"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  dispersionParameter, dnDlambda, groupIndex, gvd, inRange, refractiveIndex, zeroDispersionWavelengths,
} from "../../../physics/materials/sellmeier";
import { MATERIALS, SCHOTT_GLASSES, type DispersionMaterial } from "../../../physics/materials/sellmeier-data";

const OPTIONS: Record<string, DispersionMaterial> = { ...MATERIALS, ...SCHOTT_GLASSES };
const DEFAULT_MATERIAL = "fusedSilica";
// Chart window within each fit range.
const CHART_MIN_UM = 0.2;
const CHART_MAX_UM = 20;
const CHART_POINTS = 300;
const COMPARE_POINTS = 160;
const COMPARE_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#a855f7", "#e5e7eb", "#14b8a6", "#eab308", "#fb7185", "#6366f1"];
const WAVELENGTH_PRESETS_NM = [486.1, 532, 589.3, 632.8, 800, 1064, 1310, 1550, 10600];
const WAVELENGTH_MIN_NM = 100;
const WAVELENGTH_MAX_NM = 30000;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const coefficient = (x: number) => String(Number(x.toPrecision(9)));

/** n(λ) of every crystal set (and the selected glass), each over its own fit range in the chart window. */
function compareSeries(selectedId: string) {
  const ids = selectedId in MATERIALS ? Object.keys(MATERIALS) : [...Object.keys(MATERIALS), selectedId];
  return ids.map((id, i) => {
    const { model, name } = OPTIONS[id];
    const lo = Math.max(model.range[0] * 1e6, CHART_MIN_UM);
    const hi = Math.min(model.range[1] * 1e6, CHART_MAX_UM);
    const um = Array.from({ length: COMPARE_POINTS + 1 }, (_, k) => lo * (hi / lo) ** (k / COMPARE_POINTS));
    const n = um.map((x) => refractiveIndex(model, x * 1e-6));
    const keep = n.map(Number.isFinite);
    const color = COMPARE_COLORS[i % COMPARE_COLORS.length];
    return {
      x: um.filter((_, k) => keep[k]).map((x) => Math.round(x * 1e6) / 1e6), y: n.filter((_, k) => keep[k]).map((v) => Math.round(v * 1e6) / 1e6),
      type: "scatter", mode: "lines", name, line: { color, width: id === selectedId ? 3.5 : 1.5 },
    };
  });
}

const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(3);

export default function ChromaticDispersionPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const wavelength = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 1550);
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_MATERIAL);
  const materialId = materialParam in OPTIONS ? materialParam : DEFAULT_MATERIAL;
  const material = OPTIONS[materialId];
  const { model } = material;

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const valid = inRange(model, lambda);
    const at = (f: (l: number) => number) => (valid ? f(lambda) : NaN);
    return {
      valid,
      n: at((l) => refractiveIndex(model, l)),
      dn_per_um: at((l) => dnDlambda(model, l) * 1e-6),
      ng: at((l) => groupIndex(model, l)),
      beta2_fs2_mm: at((l) => gvd(model, l) * 1e27),
      D_ps_nm_km: at((l) => dispersionParameter(model, l) * 1e6),
      zeros_nm: zeroDispersionWavelengths(model).map((z) => z * 1e9),
    };
  }, [model, wavelength]);

  const charts = useMemo(() => {
    const lo = Math.max(model.range[0] * 1e6, CHART_MIN_UM);
    const hi = Math.min(model.range[1] * 1e6, CHART_MAX_UM);
    const um = Array.from({ length: CHART_POINTS + 1 }, (_, i) => lo * (hi / lo) ** (i / CHART_POINTS));
    const nm = um.map((x) => x * 1000);
    const finite = (ys: number[]) => {
      const keep = ys.map(Number.isFinite);
      return { x: nm.filter((_, i) => keep[i]), y: ys.filter((_, i) => keep[i]) };
    };
    return {
      index: [
        { ...finite(um.map((x) => refractiveIndex(model, x * 1e-6))), type: "scatter", mode: "lines", name: "n (phase)", line: { color: "#3b82f6", width: 2 } },
        { ...finite(um.map((x) => groupIndex(model, x * 1e-6))), type: "scatter", mode: "lines", name: "n_g (group)", line: { color: "#f59e0b", width: 2 } },
      ],
      dispersion: [
        { ...finite(um.map((x) => dispersionParameter(model, x * 1e-6) * 1e6)), type: "scatter", mode: "lines", name: "D", line: { color: "#ef4444", width: 2 } },
        { x: [nm[0], nm[nm.length - 1]], y: [0, 0], type: "scatter", mode: "lines", name: "", line: { color: "#6b7280", width: 1, dash: "dash" } },
      ],
    };
  }, [model]);

  const compare = compareSeries(materialId);
  const [lo_nm, hi_nm] = [model.range[0] * 1e9, model.range[1] * 1e9];

  return (
    <>
      <div role="group" aria-label="Wavelength presets" className="mb-5 flex flex-wrap gap-2">
        {WAVELENGTH_PRESETS_NM.map((preset) => (
          <button
            key={preset}
            onClick={() => setWavelength(preset)}
            aria-pressed={wavelength === preset}
            className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset} nm
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label htmlFor="material" className="block text-sm text-gray-400 mb-1">Material</label>
          <select id="material" value={materialId} onChange={(e) => setMaterial(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            <optgroup label="Crystals and fused silica">
              {Object.entries(MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </optgroup>
            <optgroup label="SCHOTT glasses">
              {Object.entries(SCHOTT_GLASSES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </optgroup>
          </select>
        </div>
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} />
      </div>

      {!calc.valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          {wavelength} nm is outside the {fmt(lo_nm, 4)}–{fmt(hi_nm, 4)} nm range of this formula, so no value is shown.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <ResultCard label="Refractive index n" value={fmt(calc.n, 6)} tone="blue" />
        <ResultCard label="Group index n_g" value={fmt(calc.ng, 6)} tone="orange" subtext="n − λ dn/dλ" />
        <ResultCard label="dn/dλ" value={`${fmt(calc.dn_per_um)} /µm`} tone="red" />
        <ResultCard label="GVD β₂" value={`${fmt(calc.beta2_fs2_mm)} fs²/mm`} tone="green" subtext={`${fmt(calc.beta2_fs2_mm)} ps²/km`} />
        <ResultCard
          label="Dispersion D"
          value={`${fmt(calc.D_ps_nm_km)} ps/(nm·km)`}
          tone="purple"
          subtext={!calc.valid ? undefined : calc.D_ps_nm_km > 0 ? "anomalous (β₂ < 0)" : "normal (β₂ > 0)"}
        />
        <ResultCard
          label="Zero-dispersion λ"
          value={calc.zeros_nm.length ? calc.zeros_nm.map((z) => `${fmt(z, 5)} nm`).join(", ") : "none in range"}
          tone="gray"
          subtext="d²n/dλ² = 0"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Phase and Group Index</h3>
          <ChartPanel data={charts.index} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Index", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 60 }, height: 320,
            legend: { x: 0.6, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Material Dispersion D</h3>
          <ChartPanel data={charts.dispersion} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "D (ps/(nm·km))", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 60 }, height: 320,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Compare materials: n(λ)</h3>
        <ChartPanel data={compare} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (µm)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Refractive index n", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 }, height: 380,
        }} />
        <p className="mt-2 text-xs text-gray-400">Each curve covers its own fit range; the thick one is {material.name}.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-2">Coefficients: {material.name}</h3>
        <p className="text-sm text-gray-400 mb-3">
          n² = A + Σ Bᵢλ²/(λ² − Cᵢ), λ in µm. Sets published with resonance wavelengths λᵢ (Cᵢ = λᵢ²) or in the pole form
          A′ + Σ Bᵢ′/(λ² − Cᵢ) are shown converted to this form.
        </p>
        <div className="overflow-x-auto">
          <table className="text-sm font-mono text-gray-300">
            <thead><tr className="text-gray-400"><th className="pr-6 text-left">i</th><th className="pr-6 text-left">Bᵢ</th><th className="pr-6 text-left">Cᵢ (µm²)</th><th className="text-left">√Cᵢ (µm)</th></tr></thead>
            <tbody>
              <tr><td className="pr-6">A</td><td className="pr-6" colSpan={3}>{coefficient(model.A)}</td></tr>
              {model.B.map((b, i) => (
                <tr key={i}>
                  <td className="pr-6">{i + 1}</td>
                  <td className="pr-6">{coefficient(b)}</td>
                  <td className="pr-6">{coefficient(model.C[i])}</td>
                  <td>{model.C[i] >= 0 ? coefficient(Math.sqrt(model.C[i])) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">n² = A + Σ Bᵢλ²/(λ² − Cᵢ),   β₂ = λ³/(2πc²) · d²n/dλ²,   D = −(λ/c) · d²n/dλ²</p>
          <p>
            {material.name}: {material.reference}
            {material.temperature_C !== null ? `, ${material.temperature_C} °C` : ", room temperature"}; fit range
            {" "}{fmt(lo_nm, 4)}–{fmt(hi_nm, 4)} nm. The derivatives are analytic. Exact for the published formula
            within its range; the formula itself is a fit to measurements (typically ±1e-5 to ±1e-4 in n).
          </p>
        </div>
      </div>
    </>
  );
}
