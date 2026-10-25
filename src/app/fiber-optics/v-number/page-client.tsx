"use client";

import { useMemo, useState } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { LP11_CUTOFF_V, lp11CutoffWavelength, vNumber } from "../../../physics/fiber-optics/macro-bending-loss";
import { numericalAperture } from "../../../physics/fiber-optics/step-index-modes";
import {
  MAX_EXACT_MODE_V, asymptoticModeCount, countModes, guidedLpModes,
} from "../../../physics/fiber-optics/step-index-modes";

const MAX_LISTED_MODES = 12;

export default function VNumberCalculator() {
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.1, { min: 0.1, max: 1000 }); // µm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 100, max: 20000 }); // nm
  const [inputMode, setInputMode] = useState<"na" | "indices">("na");
  const [na, setNa] = useURLState("na", 0.1246, { min: 0.001, max: 1 });
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.4494, { min: 1, max: 4 });
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.444, { min: 1, max: 4 });

  const calc = useMemo(() => {
    const NA = inputMode === "na" ? na : numericalAperture(coreIndex, claddingIndex);
    // n₁ only enters the NA; any n₁ > NA is valid when NA is entered directly.
    const fiber = { a: coreRadius * 1e-6, n1: inputMode === "na" ? Math.max(1, 2 * NA) : coreIndex, NA };
    const V = vNumber(fiber, wavelength * 1e-9);
    const lpModes = guidedLpModes(V);
    return {
      NA,
      fiber,
      V,
      cutoff_nm: lp11CutoffWavelength(fiber) * 1e9,
      modes: countModes(lpModes),
      approx: asymptoticModeCount(V),
      lpModes,
      acceptance_deg: NA <= 1 ? (Math.asin(NA) * 180) / Math.PI : NaN,
    };
  }, [inputMode, na, coreIndex, claddingIndex, coreRadius, wavelength]);

  const invalidReason =
    inputMode === "indices" && !(claddingIndex < coreIndex)
      ? "The cladding index must be below the core index."
      : !Number.isFinite(calc.V)
        ? "Enter a positive core radius, wavelength and NA (NA < n₁)."
        : null;
  const singleMode = calc.V < LP11_CUTOFF_V;

  const chartData = useMemo(() => {
    if (!Number.isFinite(calc.NA)) return [];
    // 600–2000 nm, widened to keep the entered wavelength inside the plot.
    const lo = Math.min(600, 0.8 * wavelength);
    const hi = Math.max(2000, 1.2 * wavelength);
    const wl = Array.from({ length: 141 }, (_, i) => lo + ((hi - lo) * i) / 140);
    const v = wl.map((w) => vNumber(calc.fiber, w * 1e-9));
    const traces: Record<string, unknown>[] = [
      { x: wl, y: v, type: "scatter" as const, mode: "lines" as const, name: "V-number", line: { color: "#3b82f6", width: 2 } },
      { x: [lo, hi], y: [LP11_CUTOFF_V, LP11_CUTOFF_V], type: "scatter" as const, mode: "lines" as const, name: "LP11 cutoff (V = 2.405)", line: { color: "#ef4444", width: 2, dash: "dash" as const } },
    ];
    if (Number.isFinite(calc.V)) {
      traces.push({ x: [wavelength], y: [calc.V], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#22c55e", size: 10 } });
    }
    return traces;
  }, [calc.NA, calc.V, calc.fiber, wavelength]);

  const modeList = calc.lpModes.slice(0, MAX_LISTED_MODES).map(({ l, m }) => `LP${l}${m}`).join(", ");

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <ValidatedNumberInput label="Core Radius (µm)" value={coreRadius} onChange={setCoreRadius} min={0.1} max={1000} step="0.1" />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={100} max={20000} step="1" />
          <div>
            <label htmlFor="v-input-mode" className="block text-sm font-medium mb-2">Input Mode</label>
            <select
              id="v-input-mode"
              value={inputMode}
              onChange={(e) => setInputMode(e.target.value as "na" | "indices")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="na">Numerical Aperture</option>
              <option value="indices">Core/Cladding Indices</option>
            </select>
          </div>
          {inputMode === "na" ? (
            <ValidatedNumberInput label="Numerical Aperture (NA)" value={na} onChange={setNa} min={0.001} max={1} step="0.001" />
          ) : (
            <>
              <ValidatedNumberInput label="Core Refractive Index (n₁)" value={coreIndex} onChange={setCoreIndex} min={1} max={4} step="0.0001" />
              <ValidatedNumberInput label="Cladding Refractive Index (n₂)" value={claddingIndex} onChange={setCladdingIndex} min={1} max={4} step="0.0001" />
            </>
          )}
        </div>

        <div className="space-y-4">
          {invalidReason ? (
            <p className="text-sm text-yellow-300" role="status">No result: {invalidReason}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <ResultCard label="V-number" value={calc.V.toFixed(3)} tone={singleMode ? "green" : "yellow"} subtext={singleMode ? "V < 2.405: single-mode (LP01 only)" : "V ≥ 2.405: multimode"} />
              <ResultCard label="Numerical aperture" value={calc.NA.toFixed(4)} tone="blue" subtext={Number.isFinite(calc.acceptance_deg) ? `Acceptance half-angle ${calc.acceptance_deg.toFixed(2)}° in air` : undefined} />
              <ResultCard label="LP11 cutoff wavelength" value={`${calc.cutoff_nm.toFixed(0)} nm`} tone="purple" subtext="λc = 2πa·NA/2.405; single-mode above it" />
              <ResultCard
                label="Guided modes"
                value={Number.isFinite(calc.modes) ? `${calc.modes}` : `≈ ${Math.round(calc.approx)}`}
                tone="cyan"
                subtext={Number.isFinite(calc.modes) ? `Exact count (V²/2 ≈ ${calc.approx.toFixed(1)}); ${calc.lpModes.length} LP modes` : `V²/2 estimate (exact count up to V = ${MAX_EXACT_MODE_V})`}
              />
            </div>
          )}
          {!invalidReason && calc.lpModes.length > 0 && (
            <p className="text-sm text-gray-400">
              Guided LP modes: {modeList}
              {calc.lpModes.length > MAX_LISTED_MODES ? ` and ${calc.lpModes.length - MAX_LISTED_MODES} more` : ""}.
            </p>
          )}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-sm text-gray-300 space-y-1">
            <p className="font-mono">V = 2π a NA / λ,  NA = √(n₁² − n₂²)</p>
            <p>
              LP_lm is guided above its cutoff: the m-th zero of J_(l−1) (LP_0m: the (m−1)-th zero of J₁; LP01 has none).
              Each LP_0m carries 2 modes and each LP_lm (l ≥ 1) carries 4. For large V the count tends to V²/2 (Gloge 1971).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-lg font-semibold mb-3">V-Number vs Wavelength</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "V-number", gridcolor: "#374151", color: "#9ca3af" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 50, l: 60 }, height: 360,
          legend: { bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
        }} />
      </div>
    </>
  );
}
