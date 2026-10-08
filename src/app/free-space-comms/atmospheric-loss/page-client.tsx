"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  DB_PER_NEPER, aerosolExtinction, kimExponent, rayleighExtinction,
} from "../../../physics/free-space-comms/atmospheric-attenuation";

// International visibility code classes (upper visibility limit of each class).
const weatherPresets = [
  { label: "Moderate fog", visibility: 0.5 },
  { label: "Thin fog", visibility: 2 },
  { label: "Haze", visibility: 4 },
  { label: "Clear", visibility: 20 },
  { label: "Very clear", visibility: 50 },
];
const COMMON_WAVELENGTHS = [532, 785, 850, 980, 1064, 1310, 1550];
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);

/** Attenuation coefficients in dB/km for λ in nm and visibility in km. */
function alphaDbPerKm(wavelengthNm: number, visibilityKm: number) {
  const lambda = wavelengthNm * 1e-9;
  const rayleigh = rayleighExtinction(lambda) * 1e3 * DB_PER_NEPER;
  const aerosol = aerosolExtinction(lambda, visibilityKm * 1e3) * 1e3 * DB_PER_NEPER;
  return { rayleigh, aerosol, total: rayleigh + aerosol };
}

export default function AtmosphericLossPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [visibility, setVisibility] = useURLState("visibility", 23); // km
  const [linkLength, setLinkLength] = useURLState("linkLength", 1); // km

  const calc = useMemo(() => {
    const a = alphaDbPerKm(wavelength, visibility);
    const totalLoss = a.total * linkLength;
    return { ...a, totalLoss, transmittance: 10 ** (-totalLoss / 10), q: kimExponent(visibility * 1e3) };
  }, [wavelength, visibility, linkLength]);

  const plotData = useMemo(() => {
    const wavelengths = Array.from({ length: 141 }, (_, i) => 400 + i * 10); // 400–1800 nm
    return [
      { x: wavelengths, y: wavelengths.map((wl) => alphaDbPerKm(wl, visibility).total), type: "scatter", mode: "lines", name: "Total α", line: { color: "#06b6d4", width: 2 } },
      { x: wavelengths, y: wavelengths.map((wl) => alphaDbPerKm(wl, visibility).rayleigh), type: "scatter", mode: "lines", name: "Rayleigh", line: { color: "#a78bfa", dash: "dot" } },
      { x: COMMON_WAVELENGTHS, y: COMMON_WAVELENGTHS.map((wl) => alphaDbPerKm(wl, visibility).total), type: "scatter", mode: "markers", name: "Common λ", marker: { color: "#f97316", size: 8 } },
    ];
  }, [visibility]);

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {weatherPresets.map((p) => (
          <button key={p.label} onClick={() => setVisibility(p.visibility)}
            className={`rounded-full border px-3 py-1 text-sm transition ${visibility === p.visibility ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            {p.label} (V = {p.visibility} km)
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2500} />
        <ValidatedNumberInput label="Visibility (km)" value={visibility} onChange={setVisibility} min={0.01} max={300} step="0.1" />
        <ValidatedNumberInput label="Link Length (km)" value={linkLength} onChange={setLinkLength} min={0.001} max={1000} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Attenuation α" value={`${fmt(calc.total)} dB/km`} tone="cyan" subtext={`= ${fmt(calc.total / DB_PER_NEPER)} km⁻¹ (Np/km)`} />
        <ResultCard label="Path loss" value={`${fmt(calc.totalLoss)} dB`} tone="orange" subtext={`over ${linkLength} km`} />
        <ResultCard label="Transmittance" value={`${fmt(calc.transmittance * 100, 4)} %`} tone="green" />
        <ResultCard label="Aerosol (Kim)" value={`${fmt(calc.aerosol)} dB/km`} tone="yellow" subtext={`q = ${fmt(calc.q)}`} />
        <ResultCard label="Rayleigh (molecular)" value={`${fmt(calc.rayleigh)} dB/km`} tone="purple" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Spectral attenuation at V = {visibility} km</h3>
        <ChartPanel data={plotData} layout={{
          xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "α (dB/km)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { x: 0.7, y: 0.98 },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">β(λ) = β_R(λ) + [3.912/V − β_R(550 nm)] · (λ/550 nm)^(−q),   α [dB/km] = 4.343 · β [km⁻¹]</p>
        <p>
          The visibility V (Koschmieder, 2 % contrast) fixes the total extinction at 550 nm. Rayleigh scattering of
          standard air is computed from its refractive index (Bucholtz, Appl. Opt. 34, 2765, 1995); the rest is aerosol
          and scales with Kim&apos;s exponent q: 1.6 (V &gt; 50 km), 1.3 (6–50 km), 0.16V + 0.34 (1–6 km), V − 0.5
          (0.5–1 km) and 0 in fog, where scattering no longer depends on wavelength (Kim, McArthur &amp; Korevaar,
          Proc. SPIE 4214, 26, 2001). β is in nepers per km; the loss in dB is 4.343 times larger.
        </p>
        <p className="text-gray-500">
          Not modelled: molecular absorption (water-vapour bands near 940, 1130, 1380 and 1870 nm; choose a wavelength
          in a transmission window), rain and snow, turbulence and geometric loss. Kim&apos;s law was fitted in the
          visible and near IR.
        </p>
      </div>
    </>
  );
}
