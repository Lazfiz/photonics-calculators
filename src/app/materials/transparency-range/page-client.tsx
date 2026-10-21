"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import TransmissionBands from "../../../components/transmission-bands";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  WINDOW_MATERIALS, fresnelLimitTransmission, hasFormula, surfaceReflectance, transmits, windowIndex, type WindowMaterialId,
} from "../../../physics/materials/window-materials";

const WINDOW_IDS: WindowMaterialId[] = [
  "lif", "mgf2", "caf2", "baf2", "sapphire", "fusedSilica", "quartz", "bk7", "diamond", "nacl", "kbr", "csi", "krs5",
  "zns", "znse", "si", "ge",
];
const DEFAULT_MATERIAL: WindowMaterialId = "fusedSilica";
const WAVELENGTH_MIN_NM = 100;
const WAVELENGTH_MAX_NM = 100000;
const DEFAULT_WAVELENGTH_NM = 1550;
const CHART_POINTS = 160;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const pct = (x: number) => (Number.isFinite(x) ? `${(100 * x).toFixed(1)} %` : "—");
const bandText = (bands: readonly (readonly [number, number])[]) =>
  bands.map(([lo, hi]) => `${+(lo * 1e6).toPrecision(3)}–${+(hi * 1e6).toPrecision(3)} µm`).join(", ");

/** T_max(λ) and n(λ) of one material over each transmission band that its formula covers (one trace per band). */
function windowSeries(id: WindowMaterialId) {
  const m = WINDOW_MATERIALS[id];
  const d = m.dispersion;
  if (!hasFormula(d)) return [];
  return m.bands.flatMap(([bLo, bHi], b) => {
    const lo = Math.max(bLo, d.model.range[0]);
    const hi = Math.min(bHi, d.model.range[1]);
    if (!(hi > lo)) return [];
    const um = Array.from({ length: CHART_POINTS + 1 }, (_, k) => lo * (hi / lo) ** (k / CHART_POINTS) * 1e6);
    const n = um.map((x) => windowIndex(m, x * 1e-6));
    const keep = n.map(Number.isFinite);
    const x = um.filter((_, k) => keep[k]).map((v) => Math.round(v * 1e6) / 1e6);
    const ns = n.filter((_, k) => keep[k]);
    return [
      {
        x, y: ns.map((v) => Math.round(1e6 * fresnelLimitTransmission(v)) / 1e4), type: "scatter", mode: "lines",
        name: b === 0 ? "T_max (%)" : undefined, line: { color: "#34d399", width: 2.5 },
      },
      {
        x, y: ns.map((v) => Math.round(v * 1e6) / 1e6), type: "scatter", mode: "lines", yaxis: "y2",
        name: b === 0 ? "n (right axis)" : undefined, line: { color: "#60a5fa", width: 1.5, dash: "dash" },
      },
    ];
  });
}

export default function TransparencyRangePage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", DEFAULT_WAVELENGTH_NM); // nm
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_MATERIAL);
  const wavelength = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, DEFAULT_WAVELENGTH_NM);
  const material = (WINDOW_IDS as string[]).includes(materialParam) ? (materialParam as WindowMaterialId) : DEFAULT_MATERIAL;
  const lambda = wavelength * 1e-9;
  const um = wavelength / 1000;

  const rows = WINDOW_IDS.map((id) => {
    const m = WINDOW_MATERIALS[id];
    const n = windowIndex(m, lambda);
    return { id, m, n, inBand: transmits(m, lambda), T: fresnelLimitTransmission(n) };
  });
  const sel = rows.find((r) => r.id === material)!;
  const d = sel.m.dispersion;
  const chart = useMemo(() => windowSeries(material), [material]);

  let nSubtext: string;
  if (!hasFormula(d)) nSubtext = `No dispersion formula here. n = ${d.n} at ${d.lambda * 1e6} µm (${d.source})`;
  else if (!Number.isFinite(sel.n)) {
    const [lo, hi] = d.model.range.map((x) => +(x * 1e6).toPrecision(3));
    nSubtext = `outside the formula's ${lo}–${hi} µm range`;
  } else nSubtext = d.reference;

  const tSubtext = !sel.inBand ? "outside the transmission band: the material absorbs"
    : Number.isFinite(sel.T) ? "2n/(n² + 1): uncoated, both surfaces, no absorption" : "needs the index at this wavelength";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} />
        <div>
          <label htmlFor="material" className="block text-sm text-gray-300 mb-1">Material</label>
          <select id="material" value={material} onChange={(e) => setMaterial(e.target.value)}
            className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm">
            {WINDOW_IDS.map((id) => <option key={id} value={id}>{WINDOW_MATERIALS[id].name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label={`n at ${um} µm`} value={Number.isFinite(sel.n) ? sel.n.toFixed(5) : "—"} tone="blue" subtext={nSubtext} />
        <ResultCard label="Reflectance per surface" value={pct(surfaceReflectance(sel.n))} tone="orange" subtext="((n − 1)/(n + 1))², normal incidence" />
        <ResultCard label="Fresnel-limited transmission" value={sel.inBand ? pct(sel.T) : "opaque"} tone="green" subtext={tSubtext} />
        <ResultCard label="Transmission band" value={bandText(sel.m.bands)} tone="gray" subtext={sel.m.note} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">{WINDOW_MATERIALS[material].name}: T_max and n across its bands</h3>
        {chart.length ? (
          <ChartPanel data={chart} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (µm)", type: "log", gridcolor: "#374151" },
            yaxis: { title: "Fresnel-limited T (%)", gridcolor: "#374151" },
            yaxis2: { title: "n", overlaying: "y", side: "right" },
            margin: { t: 20, r: 60, b: 50, l: 60 }, height: 340,
          }} />
        ) : (
          <p className="text-sm text-gray-400">No dispersion formula for this material, so no curve: see the index note above.</p>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Transmission Bands</h3>
        <TransmissionBands markerUm={um}
          rows={rows.map((r) => ({ key: r.id, name: r.m.name.split(" (")[0], selected: r.id === material, bands: r.m.bands.map(([lo, hi]) => [lo * 1e6, hi * 1e6] as const) }))} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">All materials at {um} µm</h3>
        <table className="w-full text-sm">
          <thead className="text-gray-400 text-left">
            <tr><th className="py-1 pr-3">Material</th><th className="py-1 pr-3">Band</th><th className="py-1 pr-3">n</th><th className="py-1">T_max</th></tr>
          </thead>
          <tbody>
            {[...rows].sort((a, b) => Number(b.inBand) - Number(a.inBand)).map((r) => (
              <tr key={r.id} className={`border-t border-gray-800 ${r.id === material ? "text-white font-semibold" : "text-gray-300"}`}>
                <td className="py-1 pr-3">
                  <button className="underline-offset-2 hover:underline" onClick={() => setMaterial(r.id)}>{r.m.name}</button>
                </td>
                <td className="py-1 pr-3">{bandText(r.m.bands)}</td>
                <td className="py-1 pr-3">{Number.isFinite(r.n) ? r.n.toFixed(4) : "—"}</td>
                <td className={`py-1 ${r.inBand ? "text-green-400" : "text-gray-500"}`}>{r.inBand ? pct(r.T) : "opaque"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">R = ((n − 1)/(n + 1))²,  T_max = (1 − R)/(1 + R) = 2n/(n² + 1)</p>
          <p>
            An uncoated window that does not absorb, at normal incidence, with the multiple reflections between its two
            surfaces added in intensity (no thin-film fringes). Absorption only lowers T, most near the band edges, so T_max
            is an upper bound inside the band. n comes from each material&apos;s published Sellmeier formula (the ordinary
            index for sapphire, crystal quartz and MgF₂, as for a c-cut window). The bands are the Crystran data-sheet
            transmission ranges; their edges depend on thickness and grade.
          </p>
        </div>
      </div>
    </>
  );
}
