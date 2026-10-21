"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import TransmissionBands from "../../../components/transmission-bands";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CRYSTAL_SHEETS, DIAMOND_IR_SOURCE, DIAMOND_RANGE, diamondIndex } from "../../../physics/materials/crystal-properties";
import { MATERIALS } from "../../../physics/materials/sellmeier-data";
import { WINDOW_MATERIALS, fresnelLimitTransmission, transmits } from "../../../physics/materials/window-materials";

const WAVELENGTH_MIN_NM = 226;
const WAVELENGTH_MAX_NM = 20000;
const CHART_POINTS = 200;
const BAND_GAP_EV = 5.47; // indirect, room temperature (Clark, Dean & Harris 1964)
const sheet = CRYSTAL_SHEETS.diamond;
const diamond = WINDOW_MATERIALS.diamond;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

/** n(λ) on a log grid over 226 nm–20 µm, with a marker at the current λ. */
function indexChart(lambdaUm: number, n: number) {
  const [lo, hi] = DIAMOND_RANGE.map((x) => x * 1e6);
  const um = Array.from({ length: CHART_POINTS + 1 }, (_, k) => lo * (hi / lo) ** (k / CHART_POINTS));
  const traces = [{
    x: um.map(round6), y: um.map((x) => round6(diamondIndex(x * 1e-6).n)), type: "scatter", mode: "lines", name: "n",
    line: { color: "#60a5fa", width: 2 },
  }];
  if (!Number.isFinite(n)) return traces;
  return [...traces, { x: [round6(lambdaUm)], y: [round6(n)], type: "scatter", mode: "markers", name: "λ", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } }];
}

export default function DiamondOpticsPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 589); // nm
  const wavelength = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 589);
  const lambda = wavelength * 1e-9;
  const { n, source } = diamondIndex(lambda);
  const T = fresnelLimitTransmission(n);
  const R = ((n - 1) / (n + 1)) ** 2;
  const inBand = transmits(diamond, lambda);

  const chart = useMemo(() => indexChart(wavelength / 1000, n), [wavelength, n]);
  const bandRows = [{ key: "diamond", name: "Diamond", selected: true, bands: sheet.bands.map(([a, b]) => [a * 1e6, b * 1e6] as const) }];
  const properties: [string, string][] = [
    ["Indirect band gap", `${BAND_GAP_EV} eV (absorption edge ≈ 227 nm)`],
    ["Thermal conductivity", `${sheet.conductivity.para} W/(m·K) at 273 K`],
    ["dn/dT", `+${+(sheet.dnDT.para * 1e6).toPrecision(3)} ×10⁻⁶/K`],
    ["Thermal expansion", `${+(sheet.expansion.para * 1e6).toPrecision(3)} ×10⁻⁶/K at 293 K`],
    ["Knoop hardness", `${sheet.knoop} kg/mm² (with orientation)`],
    ["Young's modulus", `${sheet.youngs_GPa.para} GPa`],
    ["Density", `${sheet.density_g_cm3} g/cm³`],
    ["Specific heat", `${sheet.specificHeat_J_kgK} J/(kg·K) at 273 K`],
    ["Melting point", `${sheet.meltingPoint_C} °C (${sheet.meltingNote})`],
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <div className="text-xs text-gray-500 self-end">
          {source === "peter" ? MATERIALS.diamond.reference : source === "palik" ? `${DIAMOND_IR_SOURCE}, interpolated` : "Outside 226 nm–20 µm."}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label={`n at ${wavelength} nm`} value={Number.isFinite(n) ? n.toFixed(4) : "—"} tone="blue"
          subtext={source === "peter" ? "Peter's Sellmeier formula" : "Palik's values"} />
        <ResultCard label="Reflectance per surface" value={Number.isFinite(R) ? `${(100 * R).toFixed(2)} %` : "—"} tone="orange"
          subtext="((n − 1)/(n + 1))², normal incidence" />
        <ResultCard label="Fresnel-limited transmission" value={Number.isFinite(T) ? `${(100 * T).toFixed(1)} %` : "—"} tone="green"
          subtext={inBand ? "2n/(n² + 1): uncoated plate, both surfaces, no absorption" : "inside an absorption band (multiphonon 2.5–7 µm or the UV edge): lower"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Refractive index</h3>
          <ChartPanel data={chart} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (µm)", type: "log", gridcolor: "#374151" },
            yaxis: { title: "n", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 60 }, height: 320,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-3">Properties</h3>
          <table className="w-full text-sm">
            <tbody>
              {properties.map(([k, v]) => (
                <tr key={k}><td className="pr-4 py-1 text-gray-400">{k}</td><td className="py-1 text-gray-200">{v}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-2">Crystran data sheet (type IIa); band gap from Clark, Dean &amp; Harris (1964).</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Transmission bands</h3>
        <TransmissionBands rows={bandRows} markerUm={wavelength / 1000} />
        <p className="text-xs text-gray-500 mt-2">Type IIa, Crystran: 0.3–2.5 µm and 7 to beyond 100 µm. Poorer samples may cut off at 350 nm.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">n² = 1 + 0.3306 λ²/(λ² − 0.175²) + 4.3356 λ²/(λ² − 0.106²)  (λ in µm, 226–644 nm),  T_max = 2n/(n² + 1)</p>
          <p>
            Below 644 nm the index is Peter&apos;s Sellmeier formula, fitted to his own measurements; beyond it, Palik&apos;s
            tabulated values (0.656–20 µm) interpolated linearly in wavelength. Diamond is cubic, so it has one index. An uncoated,
            non-absorbing plate with both surfaces&apos; multiple reflections added in intensity transmits at most
            T = 2n/(n² + 1): about 71 % in the visible. Absorption in the two- and three-phonon band (2.5–7 µm), near the UV
            edge and from nitrogen impurities (type I diamond) lowers it.
          </p>
        </div>
      </div>
    </>
  );
}
