"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtNum, fmtPower } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  alphaMax, correctionCE, exposureLimit, eyeLimits, limitMaxPower, T_MAX, T_MIN, timeT2,
} from "../../../physics/laser-safety/eye-exposure-limits";

export default function ExtendedSourcePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1064); // nm
  const [alphaMrad, setAlphaMrad] = useURLState("alpha", 50); // mrad, apparent source
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10); // s

  // ICNIRP 2013 retinal thermal limit with C_E and T₂: src/physics/laser-safety/eye-exposure-limits.ts. SI inside.
  const lambda = Math.min(Math.max(wavelength, 400), 1399.999) * 1e-9;
  const alpha = Math.max(alphaMrad, 0) * 1e-3;
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);

  const r = useMemo(() => {
    const point = eyeLimits(lambda)[0];
    const extended = eyeLimits(lambda, alpha)[0];
    const hPoint = exposureLimit(point, t);
    const hExt = exposureLimit(extended, t);
    return {
      point, extended, hPoint, hExt,
      pPoint: limitMaxPower(point, 0, t),
      pExt: limitMaxPower(extended, 0, t),
      ce: correctionCE(alpha, t),
      aMax: alphaMax(t),
      T2: timeT2(alpha),
    };
  }, [lambda, alpha, t]);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 271 }, (_, i) => T_MIN * Math.pow(T_MAX / T_MIN, i / 270));
    return [
      { ...finiteXY(times, times.map((x) => exposureLimit(r.point, x) / x)), type: "scatter", mode: "lines", name: "Point source", line: { color: "#60a5fa" } },
      { ...finiteXY(times, times.map((x) => exposureLimit(r.extended, x) / x)), type: "scatter", mode: "lines", name: `α = ${fmtNum(alphaMrad)} mrad`, line: { color: "#34d399" } },
      { x: [t], y: [r.hExt / t], type: "scatter", mode: "markers", name: "t", marker: { color: "#f87171", size: 9 } },
    ];
  }, [r, alphaMrad, t]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm, 400–1400)" value={wavelength} onChange={setWavelength} min={400} max={1399} step="any" />
        <ValidatedNumberInput label="Source Subtense α (mrad)" value={alphaMrad} onChange={setAlphaMrad} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="C_E at t" value={fmtNum(r.ce)} subtext={`α_max(t) = ${fmtNum(r.aMax * 1e3)} mrad`} tone="blue" />
        <ResultCard label="T₂" value={`${fmtNum(r.T2)} s`} subtext="from T₂ the thermal limit is a constant irradiance" tone="purple" />
        <ResultCard label="Extended / point limit" value={`${fmtNum(r.hExt / r.hPoint)}×`} tone="green" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ResultCard label="Point-source thermal limit" value={`${fmtNum(r.hPoint)} J/m²`} subtext={`${fmtNum(r.hPoint / t)} W/m², ${fmtPower(r.pPoint)} through 7 mm`} tone="yellow" />
        <ResultCard label="Extended-source thermal limit" value={`${fmtNum(r.hExt)} J/m²`} subtext={`${fmtNum(r.hExt / t)} W/m², ${fmtPower(r.pExt)} through 7 mm`} tone="yellow" />
      </div>

      <p className="text-sm text-gray-400 mb-8">
        An apparent source subtending α larger than α_min = 1.5 mrad forms a larger retinal image, so the retinal thermal
        limit rises by C_E (C₆ in IEC 60825-1), from ICNIRP 2013 (Health Phys. 105:271, Tables 2, 4 and 5): C_E = α/α_min
        up to α_max, then α_max/α_min, measured with a field of view γ = α_max. α_max grows with exposure time: 5 mrad
        below 625 µs, 200 t^0.5 mrad, then 100 mrad from 0.25 s. Eye movements spread a long exposure, so from
        T₂ = 10 × 10^((α − 1.5)/98.5) s (100 s above 100 mrad) the limit is the constant irradiance 18 C_A C_C C_E T₂^−0.25
        W/m²; a point source keeps 10 C_A C_C W/m² from 10 s. Only the retinal thermal limit (400–1400 nm) has C_E: the
        photochemical limit (400–600 nm, from 10 s) is not raised, though its exposure is measured over an 11 mrad field
        of view, and the corneal limits outside 400–1400 nm don&apos;t depend on α. The power is for a beam inside the
        7 mm aperture. A collimated laser beam is a point source; α matters for diffuse reflections, diffusers and
        arrays.
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Exposure Time (s)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Thermal limit as irradiance H/t (W/m²)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          Retinal thermal limit against exposure time for a point source and for the chosen α.
        </p>
      </div>
    </>
  );
}
