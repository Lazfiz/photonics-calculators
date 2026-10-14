"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  AL_NABOULSI_LAMBDA, AL_NABOULSI_VISIBILITY, DB_PER_NEPER, aerosolExponent, alNaboulsiFogExtinction, totalExtinction,
  type AerosolLaw, type FogType,
} from "../../../physics/free-space-comms/atmospheric-attenuation";

type FogModel = AerosolLaw | FogType;
const MODELS: { id: FogModel; label: string; color: string }[] = [
  { id: "kim", label: "Kim", color: "#06b6d4" },
  { id: "kruse", label: "Kruse", color: "#f43f5e" },
  { id: "advection", label: "Al Naboulsi, advection fog", color: "#a78bfa" },
  { id: "radiation", label: "Al Naboulsi, radiation fog", color: "#facc15" },
];
const isModel = (s: string): s is FogModel => MODELS.some((m) => m.id === s);
const isAlNaboulsi = (m: FogModel): m is FogType => m === "advection" || m === "radiation";

const clamp = (x: number, lo: number, hi: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : lo);
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);

/** Extinction in km⁻¹ for λ in nm and V in km. */
function extinctionPerKm(model: FogModel, wavelengthNm: number, visibilityKm: number): number {
  const lambda = wavelengthNm * 1e-9;
  const V = visibilityKm * 1e3;
  const beta = isAlNaboulsi(model) ? alNaboulsiFogExtinction(lambda, V, model) : totalExtinction(lambda, V, model);
  return beta * 1e3;
}

export default function FogAttenuationPage() {
  const [visibilityRaw, setVisibility] = useURLState("visibility", 0.5); // km
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [rangeRaw, setRange] = useURLState("range", 1); // km
  const [modelRaw, setModel] = useURLState("model", "kim");
  const visibility = clamp(visibilityRaw, 0.01, 100);
  const wavelength = clamp(wavelengthRaw, 400, 2000);
  const range = clamp(rangeRaw, 0.001, 50);
  const model: FogModel = isModel(modelRaw) ? modelRaw : "kim";

  const calc = useMemo(() => {
    const sigma = extinctionPerKm(model, wavelength, visibility); // km⁻¹
    const alpha = sigma * DB_PER_NEPER; // dB/km
    const loss = alpha * range;
    const q = isAlNaboulsi(model) ? NaN : aerosolExponent(visibility * 1e3, model);
    const outside = isAlNaboulsi(model)
      ? wavelength < AL_NABOULSI_LAMBDA[0] * 1e9 || wavelength > AL_NABOULSI_LAMBDA[1] * 1e9
        || visibility < AL_NABOULSI_VISIBILITY[0] / 1e3 || visibility > AL_NABOULSI_VISIBILITY[1] / 1e3
      : wavelength > 1550;
    return { sigma, alpha, loss, transmittance: 10 ** (-loss / 10), q, outside };
  }, [model, wavelength, visibility, range]);

  const plotData = useMemo(() => {
    const logSpan = (lo: number, hi: number, n: number) =>
      Array.from({ length: n }, (_, i) => lo * (hi / lo) ** (i / (n - 1)));
    return MODELS.map((m) => {
      const vis = isAlNaboulsi(m.id) ? logSpan(0.05, 1, 60) : logSpan(0.05, 10, 120);
      return {
        x: vis, y: vis.map((v) => extinctionPerKm(m.id, wavelength, v) * DB_PER_NEPER),
        type: "scatter", mode: "lines", name: m.label,
        line: { color: m.color, width: m.id === model ? 3 : 1.5, dash: isAlNaboulsi(m.id) ? "dash" : "solid" },
      };
    });
  }, [wavelength, model]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Visibility (km)" value={visibility} onChange={setVisibility} min={0.01} max={100} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2000} />
        <ValidatedNumberInput label="Link range (km)" value={range} onChange={setRange} min={0.001} max={50} step="0.1" />
        <div>
          <label htmlFor="fog-model" className="block text-sm text-gray-400 mb-1">Model</label>
          <select id="fog-model" value={model} onChange={(e) => setModel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Specific attenuation" value={`${fmt(calc.alpha)} dB/km`} tone="cyan"
          subtext={`extinction ${fmt(calc.sigma)} km⁻¹ (Np/km)`} />
        <ResultCard label="Path loss" value={`${fmt(calc.loss)} dB`} tone="orange" subtext={`over ${range} km`} />
        <ResultCard label="Transmittance" value={calc.transmittance > 0 || !Number.isFinite(calc.loss) ? `${fmt(calc.transmittance * 100)} %` : "< 1e-300 %"} tone="green" />
        {!isAlNaboulsi(model) && (
          <ResultCard label="Exponent q" value={fmt(calc.q)} tone="purple"
            subtext={calc.q === 0 ? "no wavelength dependence" : `β ∝ λ^(−${fmt(calc.q)})`} />
        )}
      </div>
      {calc.outside && (
        <p className="mb-6 text-sm text-yellow-300">
          {isAlNaboulsi(model)
            ? "Outside the fitted range of Al Naboulsi's law (690–1550 nm, V = 50–1000 m): an extrapolation."
            : "Beyond 1550 nm the visibility laws are extrapolated."}
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Specific attenuation at {wavelength} nm</h3>
        <ChartPanel data={plotData} layout={{
          xaxis: { title: "Visibility (km)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          yaxis: { title: "Attenuation (dB/km)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          margin: { t: 20, r: 20, b: 50, l: 60 }, font: { color: "#9ca3af" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">Kim, Kruse: σ = σ_R(λ) + [3.912/V − σ_R(550 nm)] · (λ/550 nm)^(−q)</p>
        <p className="font-mono">Al Naboulsi: σ = (0.11478λ + 3.8367)/V (advection), (0.18126λ² + 0.13709λ + 3.7502)/V (radiation)</p>
        <p>
          σ is the extinction in km⁻¹ (nepers per km), with λ in µm and V in km; the attenuation in dB/km is
          10 log₁₀(e) ≈ 4.343 times larger. The visibility V (Koschmieder, 2 % contrast at 550 nm) fixes σ at 550 nm.
          Kim&apos;s exponent q is 1.6 (V &gt; 50 km), 1.3 (6–50 km), 0.16V + 0.34 (1–6 km), V − 0.5 (0.5–1 km) and 0 in
          fog below 0.5 km, where droplets are much larger than the wavelength. Kruse&apos;s older law keeps q = 0.585V^(1/3)
          below 6 km, so it predicts less loss at longer wavelengths even in dense fog; Kim et al. measured no such
          difference between 785 and 1550 nm there.
          Al Naboulsi fitted FASCOD results for advection fog (sea fog, droplet diameters near 20 µm) and radiation fog
          (inland, about 4 µm) over 690–1550 nm and V = 50–1000 m.
        </p>
        <p className="text-gray-500">
          Visibility laws give a mean loss for a typical droplet size distribution; measured fog attenuation scatters
          widely around them. Not modelled: absorption bands, rain and snow, turbulence, geometric loss.
        </p>
      </div>
    </>
  );
}
