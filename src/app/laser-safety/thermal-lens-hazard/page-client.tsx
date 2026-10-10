"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtNum, fmtPower, fmtTime } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  FILTER_MATERIALS, filterTemperatureRise, timeToTemperatureRise, type FilterMaterialKey, type HeatDeposition,
} from "../../../physics/laser-safety/filter-heating";

const AMBIENT_C = 25;
const T_CHART = [1e-3, 1e3] as const; // s

export default function ThermalLensHazardPage() {
  const [power, setPower] = useURLState("power", 2000); // mW
  const [beamDiameter, setBeamDiameter] = useURLState("beamDiameter", 5); // mm, 1/e²
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 5); // s
  const [materialKey, setMaterialKey] = useURLState("material", "polycarbonate");
  const [absorption, setAbsorption] = useURLState("absorption", 0.95); // fraction of the incident power
  const [depositionKey, setDepositionKey] = useURLState("deposition", "surface");
  const [thickness, setThickness] = useURLState("thickness", 3); // mm

  // Gaussian beam heating an insulated plate: src/physics/laser-safety/filter-heating.ts. SI inside.
  const key: FilterMaterialKey = materialKey in FILTER_MATERIALS ? (materialKey as FilterMaterialKey) : "polycarbonate";
  const material = FILTER_MATERIALS[key];
  const deposition: HeatDeposition = depositionKey === "volume" ? "volume" : "surface";
  const pAbs = Math.max(power, 0) * 1e-3 * Math.min(Math.max(absorption, 0), 1);
  const d = Math.max(beamDiameter, 1e-3) * 1e-3;
  const L = Math.max(thickness, 0.01) * 1e-3;
  const t = Math.min(Math.max(exposureTime, 1e-9), 3e4);
  const dTAllowed = material.tg - AMBIENT_C;

  const dT = filterTemperatureRise(pAbs, d, L, t, material, deposition);
  const tSoft = useMemo(() => timeToTemperatureRise(dTAllowed, pAbs, d, L, material, deposition), [dTAllowed, pAbs, d, L, material, deposition]);
  const pMaxAbs = dT > 0 ? (pAbs * dTAllowed) / dT : Infinity;
  const fails = dT >= dTAllowed;
  const meanIrradiance = (Math.max(power, 0) * 1e-3) / ((Math.PI * d * d) / 4) / 1e4; // W/cm²

  const chartData = useMemo(() => {
    const ts = Array.from({ length: 121 }, (_, i) => T_CHART[0] * Math.pow(T_CHART[1] / T_CHART[0], i / 120));
    const rise = finiteXY(ts, ts.map((x) => filterTemperatureRise(pAbs, d, L, x, material, deposition)));
    return [
      { ...rise, type: "scatter", mode: "lines", name: "ΔT", line: { color: "#f87171" } },
      { x: [...T_CHART], y: [dTAllowed, dTAllowed], type: "scatter", mode: "lines", name: "To T_g", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [pAbs, d, L, material, deposition, dTAllowed]);

  const selectClass = "mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white";
  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser power on the filter (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Beam diameter on the filter, 1/e² (mm)" value={beamDiameter} onChange={setBeamDiameter} min={0.001} step="any" />
        <div>
          <ValidatedNumberInput label="Exposure time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
          <p className="text-xs text-gray-500 mt-2">EN 207 tests eyewear against a CW beam for 5 s (50 pulses for pulsed lasers).</p>
        </div>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Filter or lens material</span>
          <select value={key} onChange={(e) => setMaterialKey(e.target.value)} className={selectClass}>
            {(Object.keys(FILTER_MATERIALS) as FilterMaterialKey[]).map((k) => (
              <option key={k} value={k}>
                {FILTER_MATERIALS[k].label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <ValidatedNumberInput label="Fraction of the power absorbed" value={absorption} onChange={setAbsorption} min={0} max={1} step="any" />
          <p className="text-xs text-gray-500 mt-2">
            An absorbing filter at its design wavelength takes nearly all of it (the rest is reflected); a clear lens a
            fraction of a percent.
          </p>
        </div>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">The power is absorbed</span>
          <select value={deposition} onChange={(e) => setDepositionKey(e.target.value)} className={selectClass}>
            <option value="surface">near the front face (absorbing filter)</option>
            <option value="volume">evenly through the thickness (weak absorber)</option>
          </select>
        </label>
        <ValidatedNumberInput label="Thickness (mm)" value={thickness} onChange={setThickness} min={0.01} step="any" />
      </div>

      {Number.isFinite(dT) ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <ResultCard
            label={`Temperature rise at the beam centre after ${fmtTime(t)}`}
            value={`${fmtNum(dT)} K`}
            tone={fails ? "red" : dT > dTAllowed / 2 ? "yellow" : "green"}
            subtext={`${fmtNum(AMBIENT_C + dT)} °C against T_g = ${material.tg} °C: ${fails ? "the filter softens" : "below the glass transition"}`}
          />
          <ResultCard label={`Time to reach T_g (${material.tg} °C)`} value={fmtTime(tSoft)} tone={fails ? "red" : "blue"} />
          <ResultCard
            label={`Largest absorbed power for ${fmtTime(t)}`}
            value={fmtPower(pMaxAbs)}
            tone="purple"
            subtext={`Absorbed now: ${fmtPower(pAbs)}`}
          />
          <ResultCard label="Mean irradiance on the filter, P/(πd²/4)" value={`${fmtNum(meanIrradiance)} W/cm²`} tone="cyan" />
        </div>
      ) : (
        <p className="text-amber-300 mb-6">Enter a positive beam diameter and thickness.</p>
      )}

      <ChartPanel
        data={chartData}
        layout={{ xaxis: { title: "Exposure time (s)", type: "log" }, yaxis: { title: "Temperature rise (K)", type: "log" } }}
        title="Temperature rise at the beam centre"
      />
      <p className="text-xs text-gray-500 mt-2 mb-6">
        Rise against exposure time (log scales); dashed: the rise that takes the material from {AMBIENT_C} °C to its glass
        transition.
      </p>

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          Heat conduction from a Gaussian beam into a laterally infinite plate with insulated faces (Carslaw &amp; Jaeger).
          Absorbed near the front face, the rise is √2 P/(π<sup>1.5</sup> K w) · arctan(√(8κt)/w) while the heat stays
          within the thickness (it tends to Lax&apos;s P/(√(2π) K w)), plus the heat reflected by the back face; absorbed
          evenly, it is P/(4πKL) · ln(1 + 8κt/w²). w is the 1/e² radius, κ = K/(ρc).
        </p>
        <p>
          The rise is proportional to the absorbed power. No cooling by air or the frame is included, so long exposures
          are overstated. Plastics soften at their glass transition (polycarbonate ≈ 145 °C, PMMA ≈ 105 °C), and dyes can
          bleach before that; glass can crack from thermal stress at a far smaller rise than its 557 °C transition. These
          are estimates: eyewear is rated by test (EN 207 LB numbers), and the rating on the frame takes precedence.
        </p>
      </div>
    </>
  );
}
