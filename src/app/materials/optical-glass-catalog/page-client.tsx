"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  LAMBDA_C, LAMBDA_D, LAMBDA_F, SCHOTT_DNDT_RANGE_C, abbeNumber, inRange, refractiveIndex, schottDeltaN, schottDnDt,
} from "../../../physics/materials/sellmeier";
import { MATERIALS, SCHOTT_GLASSES, type DispersionMaterial, type GlassId } from "../../../physics/materials/sellmeier-data";

const GLASS_IDS = Object.keys(SCHOTT_GLASSES) as GlassId[];
const DEFAULT_SELECTION = "N-BK7,N-SF11,N-LAK9,N-FK5";
const COLORS = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee", "#84cc16", "#e879f9"];
// e-line (mercury 546.07 nm), where SCHOTT data sheets quote dn/dT.
const LAMBDA_E = 546.07e-9;
// SCHOTT data sheets tabulate dn/dT from the g-line (435.8 nm) to 1060 nm.
const DNDT_TABLE_NM = [435.8, 1060] as const;
const [T_MIN_C, T_MAX_C] = SCHOTT_DNDT_RANGE_C;

// Abbe numbers for every set whose fit range covers the F and C lines (the infrared crystals' fits don't).
const ABBE_OPTIONS: Record<string, DispersionMaterial> = Object.fromEntries(
  Object.entries({ ...SCHOTT_GLASSES, ...MATERIALS }).filter(([, m]) => inRange(m.model, LAMBDA_F) && inRange(m.model, LAMBDA_C)),
);
const ABBE_DEFAULT = "N-BK7";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const isGlass = (id: string): id is GlassId => id in SCHOTT_GLASSES;
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

/** n(λ) across the visible with the F, d and C lines marked. */
function abbeChart(m: DispersionMaterial) {
  const lo = Math.max(m.model.range[0], 400e-9);
  const hi = Math.min(m.model.range[1], 700e-9);
  const wl = Array.from({ length: 151 }, (_, k) => lo + (k * (hi - lo)) / 150);
  const lines = [LAMBDA_F, LAMBDA_D, LAMBDA_C];
  return [
    { x: wl.map((w) => round6(w * 1e9)), y: wl.map((w) => round6(refractiveIndex(m.model, w))), type: "scatter", mode: "lines", name: "n(λ)", line: { color: "#60a5fa", width: 2 } },
    {
      x: lines.map((w) => round6(w * 1e9)), y: lines.map((w) => round6(refractiveIndex(m.model, w))),
      type: "scatter", mode: "markers", name: "F, d, C lines", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 },
    },
  ];
}

/** Absolute dn/dT across the TIE-19 temperature range at λ, ×10⁻⁶/K. */
function dndtChart(id: GlassId, lambda: number, T0: number, T1: number) {
  const g = SCHOTT_GLASSES[id];
  const T = Array.from({ length: 121 }, (_, k) => T_MIN_C + (k * (T_MAX_C - T_MIN_C)) / 120);
  const at = (t: number) => round6(schottDnDt(g.model, g.thermal, lambda, t) * 1e6);
  return [
    { x: T, y: T.map(at), type: "scatter", mode: "lines", name: "dn/dT", line: { color: "#34d399", width: 2 } },
    { x: [T0, T1], y: [at(T0), at(T1)], type: "scatter", mode: "markers", name: "T₀, T₀ + ΔT", line: { color: "#fbbf24" }, marker: { color: "#fbbf24", size: 9 } },
  ];
}

export default function OpticalGlassCatalogPage() {
  const [glassesParam, setGlasses] = useURLState("glasses", DEFAULT_SELECTION);
  const selected = useMemo(() => GLASS_IDS.filter((id) => glassesParam.split(",").includes(id)), [glassesParam]);
  const toggleGlass = (g: GlassId) =>
    setGlasses(GLASS_IDS.filter((id) => (id === g ? !selected.includes(id) : selected.includes(id))).join(","));

  const [abbeParam, setAbbe] = useURLState("material", ABBE_DEFAULT);
  const abbeId = abbeParam in ABBE_OPTIONS ? abbeParam : ABBE_DEFAULT;
  const abbeMaterial = ABBE_OPTIONS[abbeId];
  const abbe = {
    nF: refractiveIndex(abbeMaterial.model, LAMBDA_F),
    nd: refractiveIndex(abbeMaterial.model, LAMBDA_D),
    nC: refractiveIndex(abbeMaterial.model, LAMBDA_C),
    vd: abbeNumber(abbeMaterial.model),
    catalog: isGlass(abbeId) ? SCHOTT_GLASSES[abbeId].vd : NaN,
  };

  const [glassParam, setGlass] = useURLState("glass", "N-BK7");
  const glassId: GlassId = isGlass(glassParam) ? glassParam : "N-BK7";
  const glass = SCHOTT_GLASSES[glassId];
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 546.07); // nm
  const [baseTempRaw, setBaseTemp] = useURLState("baseTemp", 20); // °C
  const [deltaTRaw, setDeltaT] = useURLState("deltaT", 50); // K
  const [lo_nm, hi_nm] = [round6(glass.model.range[0] * 1e9), round6(glass.model.range[1] * 1e9)];
  const wavelength_nm = clamp(wavelengthRaw, lo_nm, hi_nm, 546.07);
  const lambda = wavelength_nm * 1e-9;
  const T0 = clamp(baseTempRaw, T_MIN_C, T_MAX_C, 20);
  const deltaT = clamp(deltaTRaw, T_MIN_C - T_MAX_C, T_MAX_C - T_MIN_C, 50);
  const T1 = clamp(T0 + deltaT, T_MIN_C, T_MAX_C, T0);
  const thermal = {
    n20: refractiveIndex(glass.model, lambda),
    dndt0: schottDnDt(glass.model, glass.thermal, lambda, T0),
    dn: schottDeltaN(glass.model, glass.thermal, lambda, T1) - schottDeltaN(glass.model, glass.thermal, lambda, T0),
  };
  const heldAtEnd = T1 !== T0 + deltaT;
  const outsideTable = wavelength_nm < DNDT_TABLE_NM[0] || wavelength_nm > DNDT_TABLE_NM[1];

  const ndVdChart = useMemo(() => ({
    data: GLASS_IDS.map((id) => {
      const g = SCHOTT_GLASSES[id];
      return {
        x: [g.vd], y: [g.nd],
        type: "scatter" as const, mode: "markers+text" as const,
        name: g.name, text: [g.name],
        textposition: "top center" as const,
        marker: { color: selected.includes(id) ? "#60a5fa" : "#374151", size: selected.includes(id) ? 12 : 8 },
      };
    }),
    layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "V<sub>d</sub> (Abbe Number)", font: { color: "#9ca3af" } }, range: [20, 80] }, yaxis: { ...baseLayout.yaxis, title: { text: "n<sub>d</sub>", font: { color: "#9ca3af" } }, range: [1.45, 1.9] }, title: { text: "Glass Map (n<sub>d</sub> vs V<sub>d</sub>)", font: { color: "#e5e7eb" } } },
  }), [selected]);

  const dispersionChart = useMemo(() => ({
    data: selected.map((id, i) => {
      const g = SCHOTT_GLASSES[id];
      const [lo, hi] = g.model.range;
      const wl = Array.from({ length: 201 }, (_, k) => lo + (k * (hi - lo)) / 200);
      return {
        x: wl.map((w) => w * 1e9), y: wl.map((w) => refractiveIndex(g.model, w)),
        type: "scatter" as const, mode: "lines" as const, name: g.name, line: { color: COLORS[i % COLORS.length] },
      };
    }),
    layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Refractive Index n(λ)", font: { color: "#9ca3af" } } }, title: { text: "Dispersion Curves", font: { color: "#e5e7eb" } } },
  }), [selected]);

  const abbeData = abbeChart(abbeMaterial);
  const dndtData = dndtChart(glassId, lambda, T0, T1);

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Glasses (click to toggle)</h3>
        <div role="group" aria-label="Glasses" className="flex flex-wrap gap-2">
          {GLASS_IDS.map((id) => (
            <button key={id} onClick={() => toggleGlass(id)} aria-pressed={selected.includes(id)}
              className={`px-3 py-1 rounded text-sm ${selected.includes(id) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {SCHOTT_GLASSES[id].name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartPanel data={ndVdChart.data} layout={ndVdChart.layout} config={plotConfig} />
        <ChartPanel data={dispersionChart.data} layout={dispersionChart.layout} config={plotConfig} />
      </div>

      <div className="overflow-x-auto mb-8">
        <h3 className="text-lg font-semibold mb-3">SCHOTT Glass Properties</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700 text-gray-400">
            <th className="py-2 px-3 text-left">Glass</th><th className="py-2 px-3">n<sub>d</sub></th><th className="py-2 px-3">V<sub>d</sub></th>
            <th className="py-2 px-3">ρ (g/cm³)</th><th className="py-2 px-3">dn/dT at 546 nm, 20 °C (×10⁻⁶/K)</th>
          </tr></thead>
          <tbody>
            {GLASS_IDS.map((id) => {
              const g = SCHOTT_GLASSES[id];
              const dndt = schottDnDt(g.model, g.thermal, LAMBDA_E, 20) * 1e6;
              return (
                <tr key={id} className="border-b border-gray-800 hover:bg-gray-900">
                  <td className="py-2 px-3 font-medium">{g.name}</td>
                  <td className="py-2 px-3 text-center">{g.nd.toFixed(5)}</td>
                  <td className="py-2 px-3 text-center">{g.vd.toFixed(2)}</td>
                  <td className="py-2 px-3 text-center">{(g.density / 1000).toFixed(2)}</td>
                  <td className="py-2 px-3 text-center">{dndt > 0 ? "+" : ""}{dndt.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Abbe Number from the Dispersion Formula</h3>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label htmlFor="abbe-material" className="block text-sm text-gray-400 mb-1">Material</label>
            <select id="abbe-material" value={abbeId} onChange={(e) => setAbbe(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
              {Object.entries(ABBE_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <ResultCard label="n_F (486.13 nm, H)" value={fmt(abbe.nF, 5)} tone="blue" />
          <ResultCard label="n_d (587.56 nm, He)" value={fmt(abbe.nd, 5)} tone="orange" />
          <ResultCard label="n_C (656.27 nm, H)" value={fmt(abbe.nC, 5)} tone="red" />
          <ResultCard label="Abbe number V_d" value={fmt(abbe.vd, 2)} tone="green"
            subtext={Number.isFinite(abbe.catalog) ? `catalog ${abbe.catalog.toFixed(2)}` : abbeMaterial.reference} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={abbeData} layout={{
            ...baseLayout, height: 300,
            xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } },
            yaxis: { ...baseLayout.yaxis, title: { text: "Refractive index n", font: { color: "#9ca3af" } } },
          }} config={plotConfig} />
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Temperature Coefficient dn/dT (TIE-19)</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <div>
            <label htmlFor="thermal-glass" className="block text-sm text-gray-400 mb-1">Glass</label>
            <select id="thermal-glass" value={glassId} onChange={(e) => setGlass(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
              {GLASS_IDS.map((id) => <option key={id} value={id}>{SCHOTT_GLASSES[id].name}</option>)}
            </select>
          </div>
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={lo_nm} max={hi_nm} />
          <ValidatedNumberInput label="Temperature T₀ (°C)" value={baseTempRaw} onChange={setBaseTemp} min={T_MIN_C} max={T_MAX_C} />
          <ValidatedNumberInput label="Temperature change ΔT (K)" value={deltaTRaw} onChange={setDeltaT}
            min={T_MIN_C - T_MAX_C} max={T_MAX_C - T_MIN_C} />
        </div>
        {(heldAtEnd || outsideTable) && (
          <p className="mb-4 text-sm text-yellow-300" role="status">
            {heldAtEnd && `T₀ + ΔT is held at ${T1} °C, the end of the TIE-19 range (${T_MIN_C} to +${T_MAX_C} °C). `}
            {outsideTable && `${wavelength_nm} nm is outside the ${DNDT_TABLE_NM[0]}–${DNDT_TABLE_NM[1]} nm span that SCHOTT tabulates, so the formula is extrapolated.`}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <ResultCard label="n at 20 °C" value={fmt(thermal.n20, 6)} tone="blue" subtext="catalog formula (relative to air)" />
          <ResultCard label="dn/dT at T₀" value={`${fmt(thermal.dndt0 * 1e6, 3)} ×10⁻⁶/K`} tone="green" subtext="absolute (vacuum)" />
          <ResultCard label={`Δn, ${T0} → ${T1} °C`} value={thermal.dn === 0 ? "0" : thermal.dn.toExponential(3)} tone="orange" subtext="absolute (vacuum)" />
          <ResultCard label="Mean dn/dT over ΔT" value={T1 === T0 ? "—" : `${fmt((thermal.dn / (T1 - T0)) * 1e6, 3)} ×10⁻⁶/K`} tone="purple" />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={dndtData} layout={{
            ...baseLayout, height: 300,
            xaxis: { ...baseLayout.xaxis, title: { text: "Temperature (°C)", font: { color: "#9ca3af" } } },
            yaxis: { ...baseLayout.yaxis, title: { text: "dn/dT (×10⁻⁶/K)", font: { color: "#9ca3af" } } },
          }} config={plotConfig} />
        </div>
      </section>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Data</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">n²(λ) = 1 + Σ Bᵢλ²/(λ² − Cᵢ),   V<sub>d</sub> = (n<sub>d</sub> − 1)/(n<sub>F</sub> − n<sub>C</sub>)</p>
          <p className="font-mono">Δn<sub>abs</sub>(T) = (n² − 1)/(2n) · (D₀ΔT + D₁ΔT² + D₂ΔT³ + (E₀ΔT + E₁ΔT²)/(λ² − λ<sub>TK</sub>²)),   ΔT = T − 20 °C</p>
          <p>
            Sellmeier coefficients, n<sub>d</sub>, V<sub>d</sub>, density and thermo-optic coefficients from the SCHOTT
            optical glass catalog (2017). Each formula reproduces its catalog n<sub>d</sub> to 1e-5 and V<sub>d</sub> to 0.01.
            dn/dT and Δn are absolute (in vacuum), from SCHOTT TIE-19, valid from −100 to +140 °C; n is the catalog index at
            20 °C. Values relative to air are larger by about n × 0.9×10⁻⁶/K, from the air&apos;s own dn/dT ≈ −(n<sub>air</sub> − 1)/T.
            Curves cover each glass&apos;s 0.3–2.5 µm data range. The crystal and fused silica V<sub>d</sub> come from each set&apos;s
            published formula (fused silica: Malitson 1965, V<sub>d</sub> 67.82).
          </p>
        </div>
      </div>
    </>
  );
}

const baseLayout = {
  paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
  xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" },
  yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" },
  margin: { t: 50, r: 20, b: 50, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" },
};
const plotConfig = { responsive: true, displayModeBar: false };
