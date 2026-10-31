"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { DB_PER_NEPER, KOSCHMIEDER } from "../../../physics/free-space-comms/atmospheric-attenuation";
import {
  MM_PER_HOUR, type SnowType, snowPowerLaw, snowSpecificAttenuation,
} from "../../../physics/free-space-comms/precipitation";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function SnowAttenuationPage() {
  const [rateRaw, setSnowRate] = useURLState("snowRate", 1); // mm/h water equivalent
  const [lambdaRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [rangeRaw, setRange] = useURLState("range", 1); // km
  const [typeRaw, setSnowType] = useURLState("type", "dry");
  const snowRate = clamp(rateRaw, 0, 10, 1);
  const wavelength = clamp(lambdaRaw, 400, 2000, 1550);
  const range = clamp(rangeRaw, 0, 20, 1);
  const snowType: SnowType = typeRaw === "wet" ? "wet" : "dry";

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const specific = snowSpecificAttenuation(snowRate * MM_PER_HOUR, lambda, snowType) * 1e3; // dB/km
    const total = specific * range;
    // Visibility whose Koschmieder extinction 3.912/V equals this (wavelength-flat) extinction.
    const visibility = specific > 0 ? KOSCHMIEDER / (specific / DB_PER_NEPER) : Infinity;
    return { ...snowPowerLaw(lambda, snowType), specific, total, transmittance: 10 ** (-total / 10), visibility };
  }, [snowRate, wavelength, range, snowType]);

  const plotData = useMemo(() => {
    const rates = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.1);
    const lambda = wavelength * 1e-9;
    return (["dry", "wet"] as const).map((t) => ({
      x: rates,
      y: rates.map((S) => snowSpecificAttenuation(S * MM_PER_HOUR, lambda, t) * 1e3),
      type: "scatter", mode: "lines", name: `${t} snow`,
      line: { color: t === "dry" ? "#06b6d4" : "#f43f5e", width: t === snowType ? 3 : 1.5 },
    }));
  }, [wavelength, snowType]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Snowfall rate (mm/h water equiv.)" value={snowRate} onChange={setSnowRate} min={0} max={10} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2000} />
        <ValidatedNumberInput label="Link length (km)" value={range} onChange={setRange} min={0} max={20} step="0.1" />
        <div>
          <label htmlFor="snow-type" className="block text-sm text-gray-400 mb-1">Snow type</label>
          <select id="snow-type" value={snowType} onChange={(e) => setSnowType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
            <option value="dry">Dry snow</option>
            <option value="wet">Wet snow</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Specific attenuation γ" value={`${fmt(calc.specific)} dB/km`} tone="cyan"
          subtext={`a = ${calc.a.toFixed(4)}, b = ${calc.b}`} />
        <ResultCard label="Path attenuation" value={`${fmt(calc.total)} dB`} tone="orange" subtext={`over ${range} km`} />
        <ResultCard label="Transmittance" value={`${fmt(calc.transmittance * 100, 4)} %`} tone="green" />
        <ResultCard label="Koschmieder-equivalent visibility" value={Number.isFinite(calc.visibility) ? `${fmt(calc.visibility)} km` : "—"}
          tone="purple" subtext="3.912/V = this extinction; not a forecast" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Specific attenuation at {wavelength} nm</h3>
        <ChartPanel data={plotData} layout={{
          xaxis: { title: "Snowfall rate (mm/h water equiv.)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "γ (dB/km)", color: "#9ca3af", gridcolor: "#374151" },
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">γ = a·S^b [dB/km];  dry: a = 5.42×10⁻⁵ λ + 5.4958776, b = 1.38;  wet: a = 1.023×10⁻⁴ λ + 3.7855466, b = 0.72</p>
        <p>
          An empirical law from the TU Graz FSO group (Awan, PhD thesis 2010, eq. 3.29; Awan et al., WOCN 2009), λ in
          nm. The source calls S the precipitation rate recorded at weather stations without saying more; it is read
          here as mm/h of melted water, which matches observed snow visibilities better than snow depth. Snowflakes are much larger than
          the wavelength, so λ changes a by under 3 % across 780–1600 nm. Dry snow attenuates more than wet snow above
          0.59 mm/h; below that the wet-snow law is the higher one.
        </p>
        <p className="text-gray-500">
          Snowflake density, size and wetness vary widely, so a single rate can give a factor of several either way.
          Snow on the windows of the terminals, a common cause of outages, is not modelled.
        </p>
      </div>
    </>
  );
}
