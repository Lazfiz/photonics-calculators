"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import TransmissionBands from "../../../components/transmission-bands";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { refractiveIndex } from "../../../physics/materials/sellmeier";
import {
  WINDOW_MATERIALS, fresnelLimitTransmission, hasFormula, transmits, windowIndex, type WindowMaterialId,
} from "../../../physics/materials/window-materials";

const IR_IDS: WindowMaterialId[] = [
  "ge", "si", "znse", "zns", "caf2", "baf2", "mgf2", "nacl", "kbr", "csi", "krs5", "as2s3", "amtir1", "zblan",
];
const DEFAULT_MATERIAL: WindowMaterialId = "ge";
const WAVELENGTH_MIN_UM = 0.2;
const WAVELENGTH_MAX_UM = 60;
const TEMPERATURE_MIN_C = -50;
const TEMPERATURE_MAX_C = 200;
const CHART_MIN_UM = 1;
const CHART_MAX_UM = 14;
const CHART_POINTS = 120;
const CHART_COLORS = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee", "#a3e635", "#e5e7eb", "#14b8a6"];

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const bandText = (bands: readonly (readonly [number, number])[]) =>
  bands.length ? bands.map(([lo, hi]) => `${+(lo * 1e6).toPrecision(3)}–${+(hi * 1e6).toPrecision(3)} µm`).join(", ") : "—";

/** n(λ) of each IR material with a formula, over its fit range inside the chart window. */
function indexSeries(selected: WindowMaterialId) {
  return IR_IDS.flatMap((id) => {
    const d = WINDOW_MATERIALS[id].dispersion;
    return hasFormula(d) ? [{ id, d }] : [];
  }).map(({ id, d }, i) => {
    const lo = Math.max(d.model.range[0] * 1e6, CHART_MIN_UM);
    const hi = Math.min(d.model.range[1] * 1e6, CHART_MAX_UM);
    const um = Array.from({ length: CHART_POINTS + 1 }, (_, k) => lo + (k * (hi - lo)) / CHART_POINTS);
    const n = um.map((x) => refractiveIndex(d.model, x * 1e-6));
    const keep = n.map(Number.isFinite);
    return {
      x: um.filter((_, k) => keep[k]).map((x) => Math.round(x * 1e6) / 1e6),
      y: n.filter((_, k) => keep[k]).map((v) => Math.round(v * 1e6) / 1e6),
      type: "scatter", mode: "lines", name: WINDOW_MATERIALS[id].name,
      line: { color: CHART_COLORS[i % CHART_COLORS.length], width: id === selected ? 3.5 : 1.5 },
    };
  });
}

export default function InfraredGlassPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_MATERIAL);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 4); // µm
  const [temperatureRaw, setTemperature] = useURLState("temperature", 25); // °C
  const material = (IR_IDS as string[]).includes(materialParam) ? (materialParam as WindowMaterialId) : DEFAULT_MATERIAL;
  const wavelength = clamp(wavelengthRaw, WAVELENGTH_MIN_UM, WAVELENGTH_MAX_UM, 4);
  const temperature = clamp(temperatureRaw, TEMPERATURE_MIN_C, TEMPERATURE_MAX_C, 25);
  const mat = WINDOW_MATERIALS[material];
  const lambda = wavelength * 1e-6;

  const d = mat.dispersion;
  const nRef = windowIndex(mat, lambda);
  const tRef = hasFormula(d) ? (d.temperature_C ?? 20) : null;
  const n = mat.dnDT !== null && tRef !== null ? nRef + mat.dnDT * (temperature - tRef) : nRef;
  const inBand = transmits(mat, lambda);

  let nSubtext: string;
  if (!hasFormula(d)) {
    nSubtext = `No dispersion formula here. n = ${d.n} at ${d.lambda * 1e6} µm, room temperature (${d.source})`;
  } else if (!Number.isFinite(nRef)) {
    const [lo, hi] = d.model.range.map((x) => +(x * 1e6).toPrecision(3));
    nSubtext = `outside the formula's ${lo}–${hi} µm range`;
  } else if (mat.dnDT === null) {
    nSubtext = `${d.reference}; at the formula's temperature (no sourced dn/dT)`;
  } else {
    nSubtext = `${d.reference}; dn/dT from ${tRef} °C`;
  }

  const indexChart = useMemo(() => indexSeries(material), [material]);
  const bandRows = IR_IDS.map((id) => ({
    key: id, name: WINDOW_MATERIALS[id].name.split(" (")[0], selected: id === material,
    bands: WINDOW_MATERIALS[id].bands.map(([lo, hi]) => [lo * 1e6, hi * 1e6] as const),
  }));
  const T = fresnelLimitTransmission(n);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 mb-6" role="group" aria-label="Material">
        {IR_IDS.map((id) => (
          <button key={id} onClick={() => setMaterial(id)} aria-pressed={material === id}
            className={`px-3 py-2 rounded text-xs ${material === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {WINDOW_MATERIALS[id].name.split(" (")[0]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Wavelength (µm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_UM} max={WAVELENGTH_MAX_UM} step="0.1" />
        <ValidatedNumberInput label="Temperature (°C)" value={temperatureRaw} onChange={setTemperature} min={TEMPERATURE_MIN_C} max={TEMPERATURE_MAX_C} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label={`n at ${wavelength} µm, ${temperature} °C`} value={Number.isFinite(n) ? n.toFixed(4) : "—"} tone="blue" subtext={nSubtext} />
        <ResultCard label="Fresnel-limited transmission" value={Number.isFinite(T) ? `${(100 * T).toFixed(1)} %` : "—"} tone="green"
          subtext={!Number.isFinite(T) ? "needs the index at this wavelength" : mat.bands.length === 0 ? "2n/(n² + 1); no sourced transmission range"
            : inBand ? "2n/(n² + 1), uncoated, both surfaces, no absorption" : "outside the transmission band: absorbing"} />
        <ResultCard label="Transmission band" value={bandText(mat.bands)} tone="gray" subtext={mat.note} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="dn/dT" value={mat.dnDT === null ? "—" : `${mat.dnDT > 0 ? "+" : ""}${+(mat.dnDT * 1e6).toPrecision(4)} ×10⁻⁶/K`} tone="orange" />
        <ResultCard label="Thermal conductivity" value={mat.conductivity === null ? "—" : `${mat.conductivity} W/(m·K)`} tone="purple" />
        <ResultCard label="Knoop hardness" value={mat.knoop === null ? "—" : `${mat.knoop} kg/mm²`} tone="gray" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Refractive Index vs Wavelength</h3>
        <ChartPanel data={indexChart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (µm)", gridcolor: "#374151" },
          yaxis: { title: "n (at each formula's temperature)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 }, height: 360,
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Transmission Bands</h3>
        <TransmissionBands rows={bandRows} markerUm={wavelength} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">n(λ, T) = n(λ, T₀) + (dn/dT)(T − T₀),  T_max = 2n/(n² + 1)</p>
          <p>
            n(λ, T₀) comes from each material&apos;s published Sellmeier formula at the temperature T₀ of its measurements,
            within the formula&apos;s wavelength range (the same data sets as the Material Dispersion calculator; the ordinary
            index for MgF₂). dn/dT is one room-temperature value per material, so treat n(T) far from T₀ as an estimate.
            T_max is the transmission of an uncoated, non-absorbing window with both surfaces&apos; multiple reflections added
            in intensity: an upper bound that absorption near the band edges lowers. Bands, dn/dT, conductivity and Knoop
            hardness are Crystran data-sheet values, and Amorphous Materials&apos; for AMTIR-1 and As₂S₃. KRS-5 shows only a data-sheet
            index at 10 µm; ZBLAN has no sourced band or thermal data.
          </p>
        </div>
      </div>
    </>
  );
}
