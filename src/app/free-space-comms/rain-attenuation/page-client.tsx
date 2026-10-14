"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  MM_PER_HOUR, RAIN_PATH_MAX, RAIN_SHAPES, type RainShape, rainPathAttenuation, rainPowerLaw,
} from "../../../physics/free-space-comms/precipitation";

const ratePresets = [
  { label: "Light", rate: 2.5 },
  { label: "Moderate", rate: 12.5 },
  { label: "Heavy", rate: 25 },
  { label: "Very heavy", rate: 50 },
  { label: "Tropical", rate: 100 },
];
const COLORS = ["#f43f5e", "#f97316", "#06b6d4", "#a78bfa", "#22c55e"];
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const muLabel = (mu: number) => `µ = ${mu < 0 ? "−" : ""}${Math.abs(mu)}`;
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function RainAttenuationPage() {
  const [rateRaw, setRainRate] = useURLState("rainRate", 25); // mm/h
  const [rangeRaw, setRange] = useURLState("range", 1); // km
  const [muRaw, setMu] = useURLState("mu", 0);
  const rainRate = clamp(rateRaw, 0, 300, 25);
  const range = clamp(rangeRaw, 0, 20, 1);
  const mu = clamp(Math.round(muRaw), -2, 2, 0) as RainShape;

  const calc = useMemo(() => {
    const r = rainPathAttenuation(rainRate * MM_PER_HOUR, range * 1e3, mu);
    return { ...r, ...rainPowerLaw(mu), transmittance: 10 ** (-r.attenuation / 10) };
  }, [rainRate, range, mu]);

  const plotData = useMemo(() => {
    const rates = Array.from({ length: 150 }, (_, i) => 1 + i);
    return RAIN_SHAPES.map((m, i) => ({
      x: rates,
      y: rates.map((R) => rainPathAttenuation(R * MM_PER_HOUR, range * 1e3, m).attenuation),
      type: "scatter", mode: "lines", name: muLabel(m),
      line: { color: COLORS[i], width: m === mu ? 3 : 1.5, dash: m === mu ? "solid" : "dot" },
    }));
  }, [range, mu]);

  const outOfRange = range * 1e3 > RAIN_PATH_MAX;

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {ratePresets.map((p) => (
          <button key={p.label} onClick={() => setRainRate(p.rate)}
            className={`rounded-full border px-3 py-1 text-sm transition ${rainRate === p.rate ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            {p.label} ({p.rate} mm/h)
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Rain rate (mm/h)" value={rainRate} onChange={setRainRate} min={0} max={300} step="0.5" />
        <ValidatedNumberInput label="Link length (km)" value={range} onChange={setRange} min={0} max={20} step="0.1" />
        <div>
          <label htmlFor="rain-mu" className="block text-sm text-gray-400 mb-1">Drop-size shape µ (gamma DSD)</label>
          <select id="rain-mu" value={mu} onChange={(e) => setMu(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
            {RAIN_SHAPES.map((m) => <option key={m} value={m}>{muLabel(m)}{m === 0 ? " (exponential DSD)" : ""}</option>)}
          </select>
        </div>
      </div>

      {outOfRange && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-900/20 p-3 text-sm text-yellow-200">
          ITU-R P.1814-1 states its path model for links up to 5 km; beyond that the result is an extrapolation.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Specific attenuation γ" value={`${fmt(calc.specific * 1e3)} dB/km`} tone="cyan"
          subtext={`k = ${calc.k}, α = ${calc.alpha}`} />
        <ResultCard label="Path attenuation A" value={`${fmt(calc.attenuation)} dB`} tone="orange" subtext={`over ${range} km`} />
        <ResultCard label="Transmittance" value={`${fmt(calc.transmittance * 100, 4)} %`} tone="green" />
        <ResultCard label="Path reduction F" value={fmt(calc.reduction, 4)} tone="purple" subtext={`A′ = γ L F = ${fmt(calc.reduced)} dB`} />
        <ResultCard label="Multiple-scattering gain" value={`${fmt(calc.gain)} dB`} tone="yellow"
          subtext={rainRate < 1 ? "below 1 mm/h: fit replaced, scaled with A′" : calc.gain !== calc.gainFit ? "clamped to [0, A′]" : "A = A′ − G_ms"} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Path attenuation over {range} km</h3>
        <ChartPanel data={plotData} layout={{
          xaxis: { title: "Rain rate (mm/h)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "A (dB)", color: "#9ca3af", gridcolor: "#374151" },
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model (Rec. ITU-R P.1814-1, 2025)</h3>
        <p className="font-mono">γ = k·R^α [dB/km],   F = 1 / (1 + L(R − 6.2)/2623),   A = γ·L·F − a_ms·L^b_ms</p>
        <p>
          Raindrops (radius 0.1–4 mm) are far larger than the wavelength, so rain attenuation is the same in the 780–850 nm
          and 1520–1600 nm bands. k and α come from Mie theory over a gamma drop-size distribution whose shape µ
          measurements put between −2 and 2. F accounts for rain cells being smaller than the link, and the
          multiple-scattering gain G_ms = a_ms·L^b_ms (a_ms, b_ms quadratic in ln R) for light scattered forward into
          the receiver. R in mm/h, L in km.
        </p>
        <p className="text-gray-500">
          Below 1 mm/h the G_ms fit misbehaves (it turns negative, or grows as the rain stops), so there the gain is
          taken proportional to A′, matching the fit at 1 mm/h. Not
          modelled: rain-rate statistics along the path (the Recommendation combines them with fog via CCDFs), wet
          windows, and turbulence.
        </p>
      </div>
    </>
  );
}
