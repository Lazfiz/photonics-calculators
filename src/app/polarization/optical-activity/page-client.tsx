"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import {
  MOLAR_ROTATION_CONV_PER_SI, SPECIFIC_ROTATION_SI_PER_CONV, SUCROSE_DISPERSION_RANGE, SUCROSE_TEMPERATURE_COEFFICIENT, T_REF,
  drudeSpecificRotation, molarRotation, observedRotation, outputAzimuth, specificRotationFromObserved,
  sucroseSpecificRotation, temperatureCorrected,
} from "../../../physics/polarization/optical-activity";
import RotationDiagram from "./rotation-diagram";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const nm = (m: number) => Number((m * 1e9).toFixed(4));
const SUC_LO = nm(SUCROSE_DISPERSION_RANGE[0]), SUC_HI = nm(SUCROSE_DISPERSION_RANGE[1]);

type Substance = "sucrose" | "custom";

/** [α] at 20 °C in rad·m²/kg: the NIST/ICUMSA sucrose curve, or the one-term Drude form of the custom substance. */
function specificRotationSI(s: Substance, alphaRefConv: number, lambdaRef_nm: number, lambda0_nm: number, lambda: number): number {
  return s === "sucrose"
    ? sucroseSpecificRotation(lambda)
    : drudeSpecificRotation(alphaRefConv * SPECIFIC_ROTATION_SI_PER_CONV, lambdaRef_nm * 1e-9, lambda, lambda0_nm * 1e-9);
}

const sense = (a: number) =>
  !Number.isFinite(a) ? "—"
    : a > 0 ? "dextrorotatory (+): clockwise, seen looking toward the source"
    : a < 0 ? "laevorotatory (−): counter-clockwise, seen looking toward the source"
    : "no rotation";

/** A value with its unit, or "—" when it is undefined. */
const val = (v: number, digits: number, unit: string) => (Number.isFinite(v) ? `${fix(v, digits)}${unit}` : "—");
const SR = " deg·mL·g⁻¹·dm⁻¹";

const tab = (on: boolean) => `text-sm px-4 py-2 rounded ${on ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`;

export default function OpticalActivityPage() {
  const [substanceIn, setSubstance] = useURLState("substance", "sucrose");
  const [modeIn, setMode] = useURLState("mode", "predict");
  const [lambdaIn, setLambda] = useURLState("wavelength", 589.44);
  const [alphaRefIn, setAlphaRef] = useURLState("alphaRef", 66.524);
  const [lambdaRefIn, setLambdaRef] = useURLState("lambdaRef", 589.44);
  const [lambda0In, setLambda0] = useURLState("lambda0", 0);
  const [cIn, setC] = useURLState("concentration", 26.016);
  const [lIn, setL] = useURLState("pathLength", 2);
  const [tempIn, setTemp] = useURLState("temperature", 20);
  const [kSucIn, setKSuc] = useURLState("tempCoeff", SUCROSE_TEMPERATURE_COEFFICIENT);
  const [kCusIn, setKCus] = useURLState("tempCoeffCustom", 0);
  const [massIn, setMass] = useURLState("molarMass", 342.297);
  const [azimuthIn, setAzimuth] = useURLState("inputAzimuth", 0);
  const [measuredIn, setMeasured] = useURLState("measuredRotation", 34.6);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const substance: Substance = substanceIn === "custom" ? "custom" : "sucrose";
  const measuredMode = modeIn === "measured";
  const [lamLo, lamHi] = substance === "sucrose" ? [SUC_LO, SUC_HI] : [300, 1100];
  const lambda_nm = clamp(lambdaIn, lamLo, lamHi);
  const alphaRef = clamp(alphaRefIn, -10000, 10000);
  const lambdaRef_nm = clamp(lambdaRefIn, 200, 2000);
  const lambda0_nm = clamp(lambda0In, 0, 1000);
  const c_g100mL = clamp(cIn, 0, 100);
  const l_dm = clamp(lIn, 0, 50);
  const temp_C = clamp(tempIn, 0, 100);
  const k = clamp(substance === "sucrose" ? kSucIn : kCusIn, -0.01, 0.01);
  const mass_g = clamp(massIn, 1, 10000);
  const azimuth_deg = clamp(azimuthIn, -180, 180);
  const measured_deg = clamp(measuredIn, -36000, 36000);

  // SI at the physics boundary.
  const alpha20 = specificRotationSI(substance, alphaRef, lambdaRef_nm, lambda0_nm, lambda_nm * 1e-9);
  const alphaT = temperatureCorrected(alpha20, k, T_REF + (temp_C - 20));
  const c = c_g100mL * 10; // g/100 mL -> kg/m³
  const l = l_dm * 0.1; // dm -> m
  const alpha = observedRotation(alphaT, c, l);
  const azimuthOut = outputAzimuth(azimuth_deg * DEG, alpha);
  const specMeasured = specificRotationFromObserved(measured_deg * DEG, c, l);
  const molar = molarRotation(measuredMode ? specMeasured : alphaT, mass_g * 1e-3);
  const conv = (rad: number) => rad / SPECIFIC_ROTATION_SI_PER_CONV; // rad·m²/kg -> deg·mL·g⁻¹·dm⁻¹
  const wrap90 = (a: number) => a - Math.PI * Math.round(a / Math.PI);
  const drudeBad = substance === "custom" && !Number.isFinite(alpha20);

  const chart = (() => {
    const lo = substance === "sucrose" ? SUC_LO : Math.max(300, lambda0_nm + 20);
    const hi = substance === "sucrose" ? SUC_HI : 1100;
    const x = Array.from({ length: 200 }, (_, i) => lo + ((hi - lo) * i) / 199);
    const y = x.map((v) => specificRotationSI(substance, alphaRef, lambdaRef_nm, lambda0_nm, v * 1e-9) / SPECIFIC_ROTATION_SI_PER_CONV);
    const here = specificRotationSI(substance, alphaRef, lambdaRef_nm, lambda0_nm, lambda_nm * 1e-9) / SPECIFIC_ROTATION_SI_PER_CONV;
    const data: Record<string, unknown>[] = [
      { x, y, type: "scatter", mode: "lines", name: "[α] at 20 °C", line: { color: "#60a5fa", width: 2 } },
    ];
    if (Number.isFinite(here)) data.push({ x: [lambda_nm], y: [here], type: "scatter", mode: "markers", name: "Current λ", line: { color: "#facc15" }, marker: { color: "#facc15", size: 7 } });
    return data;
  })();

  const layout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "[α] (deg·mL·g⁻¹·dm⁻¹)", gridcolor: "#374151" },
    margin: { t: 20, r: 20, b: 60, l: 70 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
  };

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>α = [α] c l &nbsp;(Biot; α &gt; 0 dextrorotatory), &nbsp;[α]<sub>T</sub> = [α]<sub>20 °C</sub> [1 + k (T − 20 °C)]</p>
        <p>output azimuth = θ<sub>in</sub> − α, &nbsp;[M] = [α] M / 100 &nbsp;(deg·cm²·dmol⁻¹, M in g/mol)</p>
        <p>sucrose: NIST SRM 17e / ICUMSA dispersion (used by NIST from 546 to 883 nm); custom: [α] ∝ 1/(λ² − λ₀²)</p>
      </div>

      <div className="flex flex-wrap gap-6 mb-4">
        <div role="group" aria-label="Substance" className="flex flex-wrap gap-2">
          <button onClick={() => setSubstance("sucrose")} aria-pressed={substance === "sucrose"} className={tab(substance === "sucrose")}>Sucrose (NIST)</button>
          <button onClick={() => setSubstance("custom")} aria-pressed={substance === "custom"} className={tab(substance === "custom")}>Custom substance</button>
        </div>
        <div role="group" aria-label="Mode" className="flex flex-wrap gap-2">
          <button onClick={() => setMode("predict")} aria-pressed={!measuredMode} className={tab(!measuredMode)}>Predict the rotation</button>
          <button onClick={() => setMode("measured")} aria-pressed={measuredMode} className={tab(measuredMode)}>From a measured rotation</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <ValidatedNumberInput label="Vacuum wavelength λ (nm)" value={lambda_nm} onChange={setLambda} min={lamLo} max={lamHi} step="0.1" />
        <ValidatedNumberInput label="Concentration c (g/100 mL)" value={c_g100mL} onChange={setC} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="Path length l (dm)" value={l_dm} onChange={setL} min={0} max={50} step="0.1" />
        <ValidatedNumberInput label="Molar mass M (g/mol)" value={mass_g} onChange={setMass} min={1} max={10000} step="0.001" />
        <ValidatedNumberInput label="Temperature (°C)" value={temp_C} onChange={setTemp} min={0} max={100} step="0.5" />
        <ValidatedNumberInput label="Temperature coefficient k (1/°C)" value={k}
          onChange={substance === "sucrose" ? setKSuc : setKCus} min={-0.01} max={0.01} step="0.00001" />
        {measuredMode ? (
          <ValidatedNumberInput label="Measured rotation α (°, + clockwise seen toward the source)" value={measured_deg} onChange={setMeasured} min={-36000} max={36000} step="0.01" />
        ) : (
          <ValidatedNumberInput label="Input azimuth θ_in (°)" value={azimuth_deg} onChange={setAzimuth} min={-180} max={180} step="1" />
        )}
        {substance === "custom" && (
          <>
            <ValidatedNumberInput label="[α] at the reference λ (deg·mL·g⁻¹·dm⁻¹)" value={alphaRef} onChange={setAlphaRef} min={-10000} max={10000} step="0.001" />
            <ValidatedNumberInput label="Reference wavelength λ_ref (nm)" value={lambdaRef_nm} onChange={setLambdaRef} min={200} max={2000} step="0.01" />
            <ValidatedNumberInput label="Drude λ₀ (nm)" value={lambda0_nm} onChange={setLambda0} min={0} max={1000} step="1" />
          </>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-6">
        {substance === "sucrose"
          ? `Sucrose: [α] = 66.524 deg·mL·g⁻¹·dm⁻¹ at 20 °C and 589.44 nm (vacuum); NIST uses the dispersion equation from ${fix(SUC_LO, 1)} to ${fix(SUC_HI, 1)} nm. The default k is Schönrock's value for the normal sugar solution (26.016 g/100 mL), a linear fit for a few degrees around 20 °C.`
          : "Custom: one-term Drude, [α] ∝ 1/(λ² − λ₀²); λ₀ = 0 is Biot's 1/λ² law. k = 0 means no temperature dependence."}
        {" "}Concentration is mass per solution volume made up at 20 °C; [α] is taken as independent of concentration.
      </p>
      {substance === "sucrose" && Math.abs(temp_C - 20) > 5 && (
        <p className="text-sm text-yellow-400 mb-4" role="status">
          The default linear temperature term is fitted within a few degrees of 20 °C; at {fix(temp_C, 1)} °C the corrected [α] is an extrapolation.
        </p>
      )}
      {drudeBad && <p className="text-sm text-yellow-400 mb-4">The Drude form needs λ and λ_ref above λ₀: no rotation can be computed.</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] mb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultCard label="[α] at λ and 20 °C" value={val(conv(alpha20), 3, SR)} tone="blue" />
          {measuredMode ? (
            <ResultCard label="[α] from the measured rotation" value={val(conv(specMeasured), 3, SR)} tone="green"
              subtext={Number.isFinite(specMeasured) ? sense(specMeasured) : "Needs c > 0 and l > 0."} />
          ) : (
            <>
              <ResultCard label={`[α] at ${fix(temp_C, 1)} °C`} value={val(conv(alphaT), 3, SR)} tone="blue" />
              <ResultCard label="Observed rotation α" value={val(alpha / DEG, 3, "°")} tone="green" subtext={sense(alpha)} />
              <ResultCard label="Output azimuth" value={val(wrap90(azimuthOut) / DEG, 3, "°")} tone="yellow" subtext={`θ_in − α = ${val(azimuthOut / DEG, 3, "°")} (a line repeats every 180°)`} />
            </>
          )}
          <ResultCard label="Molar rotation [M]" value={val(molar * MOLAR_ROTATION_CONV_PER_SI, 2, " deg·cm²·dmol⁻¹")} tone="purple" />
          {measuredMode && substance === "sucrose" && (
            <ResultCard label={`Model [α] at λ and ${fix(temp_C, 1)} °C`} value={val(conv(alphaT), 3, SR)} tone="gray" subtext="for comparison with the measured value" />
          )}
        </div>
        {!measuredMode && (
          <div className="flex flex-col items-center gap-1">
            <RotationDiagram thetaIn={azimuth_deg * DEG} alpha={alpha} />
            <p className="text-xs text-gray-400">Seen looking toward the source.</p>
            <p className="text-xs text-gray-500">Solid: input θ_in. Dashed: output. Arrow: α (reduced to ±180°).</p>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Specific rotation against wavelength at 20 °C</h3>
        <ChartPanel data={chart} layout={layout} />
        <p className="text-xs text-gray-500 mt-2">
          {substance === "sucrose" ? `NIST SRM 17e ICUMSA curve over ${fix(SUC_LO, 1)}–${fix(SUC_HI, 1)} nm` : "Drude curve of the custom substance"}; the marker is the current wavelength.
        </p>
      </div>
    </>
  );
}
