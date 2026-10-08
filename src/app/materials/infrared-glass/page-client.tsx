"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { inRange, refractiveIndex } from "../../../physics/materials/sellmeier";
import { MATERIALS, type MaterialId } from "../../../physics/materials/sellmeier-data";

interface IRMaterial {
  name: string;
  range: [number, number]; // µm, transmission
  dn_dT: number; // ×10⁻⁶/K
  thermalCond: number; // W/(m·K)
  hardness: number; // Knoop
  /** Sellmeier data set, or a single data-sheet index where no verified formula is included. */
  dispersion: { sellmeier: MaterialId } | { n10um: number; source: string };
}

const IR_MATERIALS: Record<string, IRMaterial> = {
  ge: { name: "Germanium (Ge)", range: [2, 14], dn_dT: 396, thermalCond: 60, hardness: 780, dispersion: { sellmeier: "ge" } },
  si: { name: "Silicon (Si)", range: [1.2, 7], dn_dT: 159, thermalCond: 149, hardness: 1150, dispersion: { sellmeier: "si" } },
  znse: { name: "Zinc Selenide (ZnSe)", range: [0.6, 18], dn_dT: 61, thermalCond: 18, hardness: 150, dispersion: { sellmeier: "znse" } },
  zns: { name: "Zinc Sulfide (ZnS)", range: [0.4, 14], dn_dT: 43, thermalCond: 27, hardness: 355, dispersion: { sellmeier: "zns" } },
  caf2: { name: "Calcium Fluoride (CaF₂)", range: [0.13, 9], dn_dT: -10.6, thermalCond: 9.71, hardness: 158, dispersion: { sellmeier: "caf2" } },
  baf2: { name: "Barium Fluoride (BaF₂)", range: [0.15, 12], dn_dT: -16.3, thermalCond: 11.7, hardness: 82, dispersion: { sellmeier: "baf2" } },
  krs5: {
    name: "KRS-5 (TlBr-TlI)", range: [0.6, 40], dn_dT: -235, thermalCond: 0.54, hardness: 40,
    dispersion: { n10um: 2.3685, source: "Crystran data sheet" },
  },
  amtir1: {
    name: "AMTIR-1 (GeAsSe)", range: [1, 14], dn_dT: 72, thermalCond: 0.25, hardness: 170,
    dispersion: { n10um: 2.4981, source: "Amorphous Materials data sheet" },
  },
  mgf2: { name: "Magnesium Fluoride (MgF₂)", range: [0.11, 7.5], dn_dT: 1.0, thermalCond: 21, hardness: 576, dispersion: { sellmeier: "mgf2" } },
  nacl: { name: "Sodium Chloride (NaCl)", range: [0.2, 17], dn_dT: -34, thermalCond: 6.5, hardness: 18, dispersion: { sellmeier: "nacl" } },
};
const DEFAULT_MATERIAL = "ge";
const CHART_COLORS = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee"];

export default function InfraredGlassPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_MATERIAL);
  const [wavelength, setWavelength] = useURLState("wavelength", 4); // µm
  const [temperature, setTemperature] = useURLState("temperature", 25); // °C
  const material = materialParam in IR_MATERIALS ? materialParam : DEFAULT_MATERIAL;
  const mat = IR_MATERIALS[material];

  const index = useMemo(() => {
    if (!("sellmeier" in mat.dispersion)) return null;
    const data = MATERIALS[mat.dispersion.sellmeier];
    const lambda = wavelength * 1e-6;
    const tRef = data.temperature_C ?? 20;
    const valid = inRange(data.model, lambda);
    const nRef = valid ? refractiveIndex(data.model, lambda) : NaN;
    return { data, valid, tRef, nRef, n: nRef + mat.dn_dT * 1e-6 * (temperature - tRef) };
  }, [mat, wavelength, temperature]);

  const indexChart = useMemo(() => {
    const ids = Object.values(IR_MATERIALS).flatMap((m) => ("sellmeier" in m.dispersion ? [m.dispersion.sellmeier] : []));
    return ids.map((id, i) => {
      const { model, name } = MATERIALS[id];
      const lo = Math.max(model.range[0] * 1e6, 1);
      const hi = Math.min(model.range[1] * 1e6, 14);
      const x = Array.from({ length: 121 }, (_, k) => lo + (k * (hi - lo)) / 120);
      const selected = "sellmeier" in mat.dispersion && mat.dispersion.sellmeier === id;
      return {
        x, y: x.map((um) => refractiveIndex(model, um * 1e-6)), type: "scatter", mode: "lines", name: name.split(" (")[0],
        line: { color: CHART_COLORS[i % CHART_COLORS.length], width: selected ? 3.5 : 1.5 },
      };
    });
  }, [mat]);

  const rangeChart = useMemo(() => ({
    data: Object.entries(IR_MATERIALS).map(([key, m], i) => ({
      x: [m.range[0], m.range[1]], y: [i, i], type: "scatter" as const, mode: "lines+markers" as const,
      name: m.name, line: { color: key === material ? "#60a5fa" : "#374151", width: key === material ? 4 : 2 },
      marker: { size: 8 },
    })),
    layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Transmission Range (µm)", font: { color: "#9ca3af" } }, range: [0, 42] }, yaxis: { ...baseLayout.yaxis, tickvals: Object.keys(IR_MATERIALS).map((_, i) => i), ticktext: Object.values(IR_MATERIALS).map((m) => m.name), autorange: false, range: [-0.5, Object.keys(IR_MATERIALS).length - 0.5] }, title: { text: "IR Material Transmission Ranges", font: { color: "#e5e7eb" } } },
  }), [material]);

  const propsChart = useMemo(() => {
    const keys = Object.keys(IR_MATERIALS);
    return {
      data: [
        { x: keys.map((k) => IR_MATERIALS[k].name.split(" (")[0]), y: keys.map((k) => IR_MATERIALS[k].thermalCond), type: "bar" as const, name: "Thermal Cond.", marker: { color: "#f87171" }, yaxis: "y" },
        { x: keys.map((k) => IR_MATERIALS[k].name.split(" (")[0]), y: keys.map((k) => IR_MATERIALS[k].hardness / 10), type: "bar" as const, name: "Hardness (×10)", marker: { color: "#60a5fa" }, yaxis: "y2" },
      ],
      layout: { ...baseLayout, barmode: "group" as const, xaxis: { ...baseLayout.xaxis, tickangle: -45 }, yaxis: { ...baseLayout.yaxis, title: { text: "W/(m·K)", font: { color: "#f87171" } } }, yaxis2: { title: { text: "Knoop / 10", font: { color: "#60a5fa" } }, overlaying: "y" as const, side: "right" as const, gridcolor: "rgba(0,0,0,0)" }, title: { text: "Thermal & Mechanical Properties", font: { color: "#e5e7eb" } } },
    };
  }, []);

  let nValue = "—";
  let nSubtext: string;
  if (index) {
    const [lo, hi] = index.data.model.range.map((x) => x * 1e6);
    nValue = index.valid ? index.n.toFixed(4) : "—";
    nSubtext = index.valid
      ? `${index.data.reference}; dn/dT from ${index.tRef} °C`
      : `outside the formula's ${lo}–${hi} µm range`;
  } else {
    const d = mat.dispersion as { n10um: number; source: string };
    nSubtext = `No dispersion formula here. n = ${d.n10um} at 10 µm, 20–25 °C (${d.source})`;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6" role="group" aria-label="Material">
        {Object.keys(IR_MATERIALS).map((key) => (
          <button key={key} onClick={() => setMaterial(key)} aria-pressed={material === key}
            className={`px-3 py-2 rounded text-xs ${material === key ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {IR_MATERIALS[key].name.split("(")[0].trim()}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Wavelength (µm)" value={wavelength} onChange={setWavelength} min={0.1} max={40} step="0.1" />
        <ValidatedNumberInput label="Temperature (°C)" value={temperature} onChange={setTemperature} min={-50} max={200} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label={`n at ${wavelength} µm, ${temperature} °C`} value={nValue} tone="blue" subtext={nSubtext} />
        <ResultCard label="Transmission range" value={`${mat.range[0]}–${mat.range[1]} µm`} tone="gray" />
        <ResultCard label="dn/dT" value={`${mat.dn_dT > 0 ? "+" : ""}${mat.dn_dT} ×10⁻⁶/K`} tone="orange" />
        <ResultCard label="Thermal conductivity" value={`${mat.thermalCond} W/(m·K)`} tone="purple" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Refractive Index vs Wavelength</h3>
        <ChartPanel data={indexChart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (µm)", gridcolor: "#374151" },
          yaxis: { title: "n (at each formula's temperature)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 }, height: 360,
          legend: { x: 0.75, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
        }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartPanel data={rangeChart.data} layout={rangeChart.layout} config={plotConfig} />
        <ChartPanel data={propsChart.data} layout={propsChart.layout} config={plotConfig} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">n(λ, T) = n(λ, T₀) + (dn/dT)(T − T₀)</p>
          <p>
            n(λ, T₀) comes from each material&apos;s published Sellmeier formula at the temperature T₀ of its measurements,
            within the formula&apos;s wavelength range (the same data sets as the Material Dispersion calculator). dn/dT is a
            single typical value per material; it varies with wavelength and temperature, so treat n(T) far from T₀ as an
            estimate. KRS-5 and AMTIR-1 show only their data-sheet index at 10 µm.
          </p>
        </div>
      </div>
    </>
  );
}

const baseLayout = { paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" }, xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, margin: { t: 50, r: 20, b: 80, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" } };
const plotConfig = { responsive: true, displayModeBar: false };
