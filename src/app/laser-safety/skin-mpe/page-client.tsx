"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtNum as fmt, fmtPower } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  apertureIrradiance, exposureLimit, limitingAperture, limitMaxPower, T_MAX, T_MIN,
} from "../../../physics/laser-safety/eye-exposure-limits";
import { skinLimit } from "../../../physics/laser-safety/skin-exposure-limits";

export default function SkinMpePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1064); // nm
  const [power, setPower] = useURLState("power", 1000); // mW
  const [beamDiameter, setBeamDiameter] = useURLState("beamDiameter", 5); // mm, 1/e²
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10); // s

  // ICNIRP 2013 Table 7 skin limit: src/physics/laser-safety/skin-exposure-limits.ts. SI inside.
  const lambda = wavelength * 1e-9;
  const P = Math.max(power, 0) * 1e-3;
  const d = Math.max(beamDiameter, 0) * 1e-3;
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);
  const exposedArea = (Math.PI * d * d) / 4;

  const r = useMemo(() => {
    const limit = skinLimit(lambda, exposedArea);
    if (!limit) return null;
    const H = exposureLimit(limit, t);
    const D = limitingAperture(limit, t);
    const E = apertureIrradiance(P, d, D);
    const pMax = limitMaxPower(limit, d, t);
    return { H, D, E, pMax, ratio: P / pMax };
  }, [lambda, exposedArea, P, d, t]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 601 }, (_, i) => 180 * Math.pow(1e6 / 180, i / 600));
    const limits = wls.map((nm) => {
      const l = skinLimit(nm * 1e-9, exposedArea);
      return l ? exposureLimit(l, t) : NaN;
    });
    const beam = wls.map((nm) => {
      const l = skinLimit(nm * 1e-9, exposedArea);
      return l ? apertureIrradiance(P, d, limitingAperture(l, t)) * t : NaN;
    });
    const traces: Record<string, unknown>[] = [
      { ...finiteXY(wls, limits), type: "scatter", mode: "lines", name: "Skin limit", line: { color: "#60a5fa" } },
    ];
    if (P > 0) {
      traces.push({ ...finiteXY(wls, beam), type: "scatter", mode: "lines", name: "Beam, 3.5 mm avg", line: { color: "#f87171", dash: "dash" } });
    }
    if (r) traces.push({ x: [wavelength], y: [r.H], type: "scatter", mode: "markers", name: "λ", marker: { color: "#fbbf24", size: 9 } });
    return traces;
  }, [exposedArea, t, P, d, r, wavelength]);

  const narrow = d > 0 && d < 1e-3;
  const peak = (8 * P) / (Math.PI * d * d);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Beam Diameter, 1/e² (mm)" value={beamDiameter} onChange={setBeamDiameter} min={0.01} step="any" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
      </div>

      {r ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <ResultCard label="Skin limit H" value={`${fmt(r.H)} J/m² (${fmt(r.H * 1e-4)} J/cm²)`} tone="blue" />
            <ResultCard label="As irradiance H/t" value={`${fmt(r.H / t)} W/m² (${fmt((r.H / t) * 1e-4)} W/cm²)`} tone="blue" />
            <ResultCard label="Beam over 3.5 mm" value={`${fmt(r.E)} W/m² (${fmt(r.E * 1e-4)} W/cm²)`} tone="yellow" />
            <ResultCard label="Max power for this time" value={fmtPower(r.pMax)} tone="green" />
          </div>
          <div className={`rounded-lg border p-4 mb-4 ${r.ratio > 1 ? "border-red-800 bg-red-950/40" : "border-green-800 bg-green-950/30"}`}>
            <p className="text-sm text-gray-400">Power / max power</p>
            <p className={`text-2xl font-bold ${r.ratio > 1 ? "text-red-400" : "text-green-400"}`}>
              {fmt(r.ratio)}× {r.ratio > 1 ? "— exceeds the skin limit" : "— within the skin limit"}
            </p>
          </div>
          {narrow && (
            <p className="text-sm text-amber-300 mb-4">
              The beam is under 1 mm. ICNIRP (Table 7 note b) says to compare the actual exposure, not the 3.5 mm average,
              with the limit. The peak irradiance 8P/(πd²) is {fmt(peak)} W/m², {fmt((peak * t) / r.H)}× the limit.
            </p>
          )}
        </>
      ) : (
        <p className="text-amber-300 mb-4">The skin limits cover 180 nm to 1 mm.</p>
      )}

      <p className="text-sm text-gray-400 mb-8">
        Skin exposure limit from ICNIRP 2013 (Health Phys. 105:271, Table 7) for one exposure of 1 ns to 30 000 s. From
        400 to 1400 nm: 200 C_A J/m² up to 100 ns, 1.1×10⁴ C_A t^0.25 J/m² up to 10 s, then 2 C_A kW/m², with C_A = 1
        below 700 nm, rising to 5 at 1050 nm. In the UV and above 1400 nm the skin has the eye&apos;s corneal limit. Above
        1400 nm and beyond 10 s, an exposed area over 0.01 m² (here the area inside the 1/e² diameter) lowers the CW
        limit from 1000 W/m² to 10/A W/m², and to 100 W/m² above 0.1 m². The beam is a round Gaussian averaged over a
        3.5 mm aperture (11 mm from 100 µm). The max power is the largest that stays within the limit at every duration
        up to t; the tables&apos; rounded joints can make it up to 2 % lower than the limit at t alone.
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Radiant exposure at t (J/m²)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          The skin limit across the spectrum for the chosen exposure time, and the beam&apos;s radiant exposure over the
          averaging aperture.
        </p>
      </div>
    </>
  );
}
