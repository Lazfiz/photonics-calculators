"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtNum, fmtPower, fmtTime, LIMIT_COLORS, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  correctionCB, correctionCE, exposureLimit, eyeLimits, limitMaxPower, photochemicalCrossover, T_MAX, timeT2,
} from "../../../physics/laser-safety/eye-exposure-limits";

export default function ThermalVsPhotochemicalPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 450); // nm
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 100); // s
  const [alphaMrad, setAlphaMrad] = useURLState("alpha", 1.5); // mrad, apparent source

  // ICNIRP 2013 retinal limits: src/physics/laser-safety/eye-exposure-limits.ts. SI inside.
  const lambda = Math.min(Math.max(wavelength, 400), 600) * 1e-9;
  const t = Math.min(Math.max(exposureTime, 1e-6), T_MAX);
  const alpha = Math.max(alphaMrad, 0) * 1e-3;

  const r = useMemo(() => {
    const limits = eyeLimits(lambda, alpha);
    const thermal = limits.find((l) => l.kind === "retinalThermal")!;
    const photo = limits.find((l) => l.kind === "retinalPhotochemical") ?? null; // none from 600 nm
    const hTh = exposureLimit(thermal, t);
    const hPh = photo ? exposureLimit(photo, t) : NaN; // NaN below 10 s
    return {
      thermal, photo, hTh, hPh,
      pTh: limitMaxPower(thermal, 0, t),
      pPh: photo ? limitMaxPower(photo, 0, t) : NaN,
      governing: photo && Number.isFinite(hPh) && hPh <= hTh ? photo.kind : thermal.kind,
      crossover: photochemicalCrossover(lambda, alpha),
    };
  }, [lambda, alpha, t]);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 241 }, (_, i) => 1e-6 * Math.pow(T_MAX / 1e-6, i / 240));
    const traces: Record<string, unknown>[] = [r.thermal, ...(r.photo ? [r.photo] : [])].map((limit) => ({
      ...finiteXY(times, times.map((x) => exposureLimit(limit, x) / x)),
      type: "scatter", mode: "lines", name: limit.kind === "retinalThermal" ? "Thermal" : "Photochemical",
      line: { color: LIMIT_COLORS[limit.kind] },
    }));
    const governingH = r.governing === "retinalThermal" ? r.hTh : r.hPh;
    traces.push({ x: [t], y: [governingH / t], type: "scatter", mode: "markers", name: "t", marker: { color: "#f87171", size: 9 } });
    return traces;
  }, [r, t]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm, 400–600)" value={wavelength} onChange={setWavelength} min={400} max={600} step="any" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={1e-6} max={30000} step="any" />
        <ValidatedNumberInput label="Source Subtense α (mrad)" value={alphaMrad} onChange={setAlphaMrad} min={0} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ResultCard label="Thermal limit at t" value={`${fmtNum(r.hTh)} J/m²`} subtext={`${fmtNum(r.hTh / t)} W/m², ${fmtPower(r.pTh)} through 7 mm`} tone="blue" />
        <ResultCard
          label="Photochemical limit at t"
          value={Number.isFinite(r.hPh) ? `${fmtNum(r.hPh)} J/m²` : r.photo ? "applies from 10 s" : "none from 600 nm"}
          subtext={Number.isFinite(r.hPh) ? `${fmtNum(r.hPh / t)} W/m², ${fmtPower(r.pPh)} through 7 mm` : undefined}
          tone="purple"
        />
        <ResultCard label="Governing at t" value={LIMIT_LABELS[r.governing]} tone="yellow" />
        <ResultCard
          label="Photochemical governs from"
          value={Number.isFinite(r.crossover) ? fmtTime(r.crossover) : "never (thermal lower to 30 000 s)"}
          tone="green"
        />
      </div>
      <p className="text-sm text-gray-400 mb-8">
        C_B = {fmtNum(correctionCB(lambda))}, C_E = {fmtNum(correctionCE(alpha, t))} at t, T₂ = {fmtNum(timeT2(alpha))} s.
      </p>

      <p className="text-sm text-gray-400 mb-8">
        Retinal limits from ICNIRP 2013 (Health Phys. 105:271, Tables 2–5), as corneal radiant exposure averaged over
        7 mm. Thermal: 18 C_E t^0.75 J/m² (2 mJ/m² below 5 µs), and from T₂ a constant irradiance; a point source
        (α ≤ 1.5 mrad) has 10 W/m² from 10 s. Photochemical (blue light), from 10 s: 100 C_B J/m² to 100 s, then
        C_B W/m², with C_B = 1 up to 450 nm and 10^(0.02(λ − 450)) above; C_E does not raise it. Both apply and the lower
        one governs. For a point source the photochemical limit takes over at ICNIRP&apos;s T₁: 10 s below 450 nm, 10 C_B
        s up to 500 nm; above 500 nm the 10 W/m² thermal limit stays lower. A larger source raises only the thermal
        limit, so the photochemical one takes over sooner and at longer wavelengths. For an extended source the
        photochemical exposure is measured over an 11 mrad field of view (to 100 s), which this page does not do.
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Exposure Time (s)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Limit as irradiance H/t (W/m²)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          Both retinal limits as irradiance at the cornea against exposure time; the lower curve governs.
        </p>
      </div>
    </>
  );
}
