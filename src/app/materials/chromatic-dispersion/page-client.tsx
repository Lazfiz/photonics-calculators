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

const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(3);

export default function ChromaticDispersionPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
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

  const [lo_nm, hi_nm] = [model.range[0] * 1e9, model.range[1] * 1e9];

  return (
    <>
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
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={100} max={30000} />
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
