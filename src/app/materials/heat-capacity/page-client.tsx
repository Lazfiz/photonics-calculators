"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  HEAT_CAPACITY_MATERIALS,
  heatInput,
  scaledHeatCapacity,
  type HeatCapacityMaterialId,
} from "../../../physics/materials/heat-capacity";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const IDS = Object.keys(HEAT_CAPACITY_MATERIALS) as HeatCapacityMaterialId[];
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];
const CHART_T = Array.from({ length: 100 }, (_, i) => 10 * (i + 1));

// Module level so the React Compiler keeps the page component: 400 curve points, each a Debye quadrature.
function presetCurves() {
  return IDS.map((k, i) => {
    const m = HEAT_CAPACITY_MATERIALS[k];
    return {
      name: m.name, color: COLORS[i % COLORS.length],
      points: CHART_T.map((T) => ({ x: T, y: Number((scaledHeatCapacity(m.cRef, m.tRef, m.thetaD, T) / 1000).toFixed(6)) })),
    };
  });
}

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function HeatCapacityPage() {
  const [materialRaw, setMaterial] = useURLState("material", "si");
  const [cRefRaw, setCRef] = useURLState("cRef", 0); // J/(kg·K); 0 = the preset
  const [thetaRaw, setTheta] = useURLState("thetaD", 0); // K; 0 = the preset
  const [rhoRaw, setRho] = useURLState("density", 0); // g/cm³; 0 = the preset
  const [tempRaw, setTemp] = useURLState("temp", 300); // K
  const [massRaw, setMass] = useURLState("mass", 10); // g
  const [t1Raw, setT1] = useURLState("t1", 293.15); // K
  const [t2Raw, setT2] = useURLState("t2", 473.15); // K

  const id = IDS.find((k) => k === materialRaw) ?? "si";
  const mat = HEAT_CAPACITY_MATERIALS[id];
  const cRefInput = cRefRaw > 0 ? cRefRaw : Number(mat.cRef.toFixed(1));
  const thetaInput = thetaRaw > 0 ? thetaRaw : mat.thetaD;
  const rhoInput = rhoRaw > 0 ? rhoRaw : mat.density / 1000;
  const cRef = clamp(cRefInput, 1, 1e4, mat.cRef);
  const thetaD = clamp(thetaInput, 10, 5000, mat.thetaD);
  const density = clamp(rhoInput, 0.1, 25, 2.33) * 1000;
  const T = clamp(tempRaw, 1, 1000, 300);
  const mass = clamp(massRaw, 0, 1e6, 10) / 1000;
  const T1 = clamp(t1Raw, 1, 1000, 293.15);
  const T2 = clamp(t2Raw, 1, 1000, 473.15);

  const cp = scaledHeatCapacity(cRef, mat.tRef, thetaD, T);
  const q = heatInput(cRef, mat.tRef, thetaD, mass, T1, T2);
  const meanCp = T1 === T2 ? NaN : q / (mass * (T2 - T1));
  const choose = (k: string) => { setMaterial(k); setCRef(0); setTheta(0); setRho(0); };

  const series = [
    ...presetCurves(),
    ...(cRefRaw > 0 || thetaRaw > 0 ? [{
      name: "Your values", color: "#e5e7eb", dashed: true,
      points: CHART_T.map((t) => ({ x: t, y: Number((scaledHeatCapacity(cRef, mat.tRef, thetaD, t) / 1000).toFixed(6)) })),
    }] : []),
  ];

  return (
    <>
      <div className="mb-6">
        <label htmlFor="material" className="block text-sm font-medium mb-2">Material</label>
        <select id="material" value={id} onChange={(e) => choose(e.target.value)}
          className="w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
          {IDS.map((k) => <option key={k} value={k}>{HEAT_CAPACITY_MATERIALS[k].name}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          Choosing a material fills its measured specific heat at {mat.tRef} K, Debye temperature and density. Enter
          another material&apos;s values (its c_p at room temperature) to use the same model for it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label={`c_p at ${mat.tRef} K (J/(kg·K))`} value={cRefInput} onChange={setCRef} min={1} max={10000} step="any" />
        <ValidatedNumberInput label="Debye Temperature θ_D (K)" value={thetaInput} onChange={setTheta} min={10} max={5000} step="any" />
        <ValidatedNumberInput label="Density (g/cm³)" value={rhoInput} onChange={setRho} min={0.1} max={25} step="any" />
        <ValidatedNumberInput label="Temperature (K)" value={tempRaw} onChange={setTemp} min={1} max={1000} step="any" />
        <ValidatedNumberInput label="Mass (g)" value={massRaw} onChange={setMass} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="From T₁ (K)" value={t1Raw} onChange={setT1} min={1} max={1000} step="any" />
        <ValidatedNumberInput label="To T₂ (K)" value={t2Raw} onChange={setT2} min={1} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card label="Specific Heat c_p(T)" value={show(cp, () => `${(cp / 1000).toFixed(4)} J/(g·K)`)}
          sub={show(cp, () => `${cp.toFixed(1)} J/(kg·K) at ${T} K`)} tone="text-blue-400" />
        <Card label="Volumetric ρ·c_p" value={show(cp, () => `${(density * cp / 1e6).toFixed(3)} MJ/(m³·K)`)}
          sub="heat per unit volume and kelvin" tone="text-red-400" />
        <Card label="Heat T₁ → T₂" value={show(q, () => (Math.abs(q) >= 1e4 ? `${(q / 1000).toFixed(3)} kJ` : `${q.toFixed(1)} J`))}
          sub={q < 0 ? "negative: heat released on cooling" : "m ∫ c_p dT"} tone="text-green-400" />
        <Card label="Mean c_p over T₁–T₂" value={show(meanCp, () => `${(meanCp / 1000).toFixed(4)} J/(g·K)`)}
          sub={T1 === T2 ? "T₁ = T₂" : `${(T1 - 273.15).toFixed(1)} °C → ${(T2 - 273.15).toFixed(1)} °C`} tone="text-yellow-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <SimpleLineChart title="Specific heat of the presets, scaled Debye model" xLabel="Temperature (K)" yLabel="c_p (J/(g·K))" series={series} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-3">Preset Materials</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-1">Material</th><th className="text-right py-1">c_p (J/(kg·K))</th>
              <th className="text-right py-1">at (K)</th><th className="text-right py-1">θ_D (K)</th>
              <th className="text-right py-1">Density (g/cm³)</th>
            </tr>
          </thead>
          <tbody>
            {IDS.map((k) => {
              const m = HEAT_CAPACITY_MATERIALS[k];
              return (
                <tr key={k} className="border-b border-gray-800/50">
                  <td className="py-1">{m.name}</td>
                  <td className="text-right py-1">{m.cRef.toFixed(1)}</td>
                  <td className="text-right py-1">{m.tRef}</td>
                  <td className="text-right py-1">{m.thetaD}</td>
                  <td className="text-right py-1">{(m.density / 1000).toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>C_V/(3Nk_B) = D(x) = (3/x³) ∫₀ˣ t⁴eᵗ/(eᵗ − 1)² dt, x = θ_D/T</p>
          <p>c_p(T) = c_p(T_ref) · D(θ_D/T)/D(θ_D/T_ref)</p>
          <p>Q = m ∫ c_p dT</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          The Debye curve gives the shape, the measured value its scale. One θ_D serves all temperatures, and the
          harmonic model has no c_p − c_V or anharmonic term, so above room temperature it runs low: silicon at
          1000 K comes out 8 % below the measured value. One θ_D also drifts away from room temperature: sapphire is 9 % low
          at 200 K and 37 % low at 100 K, and MgO runs 8–9 % high from 500 to 1000 K. Glasses have no preset (no cited θ_D), nor has diamond: its
          low-temperature θ_D of 2250 K gives half its measured c_p at 273 K.
        </p>
      </div>
    </>
  );
}
