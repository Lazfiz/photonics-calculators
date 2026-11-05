"use client";

import { useState } from "react";

import { useURLState } from "../../../hooks/use-url-state";
import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  alphaPpm, CTE_TABLE, expansionWaves, SI_ALPHA_T_MAX, SI_ALPHA_T_MIN, siliconAlpha, siliconExpansion, siliconMeanAlpha,
  thermalExpansion,
} from "../../../physics/materials/thermal-expansion";

const DT_MIN = -273;
const DT_MAX = 3000;
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
// The table in the page unit, 10⁻⁶/K.
const materials = CTE_TABLE.map((m) => ({ ...m, ppm: alphaPpm(m.alpha) }));
const K0 = 273.15;
// Silicon α(T) over the fit's whole range, 10⁻⁶/K, every 10 K.
const siCurve = Array.from({ length: (SI_ALPHA_T_MAX - SI_ALPHA_T_MIN) / 10 + 1 }, (_, i) => {
  const T = SI_ALPHA_T_MIN + 10 * i;
  return { x: T, y: siliconAlpha(T) * 1e6 };
});
const fmtLength = (dL_mm: number) => (Math.abs(dL_mm) >= 0.001 ? `${dL_mm.toFixed(4)} mm` : `${(dL_mm * 1000).toFixed(3)} µm`);

export default function ThermalExpansionPage() {
  const [alphaRaw, setAlpha] = useURLState("alpha", 7.1);
  const [dTRaw, setDT] = useURLState("dT", 100); // temperature change in °C
  const [lengthRaw, setLength] = useURLState("length", 100); // mm
  const [t0Raw, setT0] = useURLState("t0", 20); // start temperature in °C, for the silicon α(T) section
  const [selected, setSelected] = useState<string | null>(null); // preset row last clicked; cleared when α is edited by hand
  const alpha = clamp(alphaRaw, -50, 100, 7.1);
  const dT = clamp(dTRaw, DT_MIN, DT_MAX, 100);
  const length = clamp(lengthRaw, 0, 1e6, 100);
  const t0 = clamp(t0Raw, -273.15, 3000, 20);

  const dL = thermalExpansion(alpha * 1e-6, length, dT); // mm, since L is in mm
  const strain = alpha * 1e-6 * dT;

  // Silicon with α(T) from T₀ to T₀ + ΔT (Okada & Tokumaru 1984); NaN when either end leaves 120–1500 K.
  const T1 = t0 + K0;
  const T2 = T1 + dT;
  const siInRange = T1 >= SI_ALPHA_T_MIN && T1 <= SI_ALPHA_T_MAX && T2 >= SI_ALPHA_T_MIN && T2 <= SI_ALPHA_T_MAX;
  const siDL = siliconExpansion(length, T1, T2); // mm, since L is in mm
  const siMean = siliconMeanAlpha(T1, T2) * 1e6;
  const siConstDL = thermalExpansion(siliconAlpha(T1), length, dT); // α frozen at T₀

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div>
          <ValidatedNumberInput label="CTE α (×10⁻⁶/K)" value={alphaRaw} onChange={(v) => { setSelected(null); setAlpha(v); }} min={-50} max={100} step="any" />
        </div>
        <div>
          <ValidatedNumberInput label="Temperature change ΔT (°C)" value={dTRaw} onChange={setDT} min={DT_MIN} max={DT_MAX} step="any" />
        </div>
        <div>
          <ValidatedNumberInput label="Length L (mm)" value={lengthRaw} onChange={setLength} min={0} max={1000000} step="any" />
        </div>
      </div>

      {Math.abs(dT) > 50 && (
        <p className="text-sm mb-4 text-yellow-400">
          α itself changes with temperature; over large ranges use the mean α of the range (Si: 2.92 × 10⁻⁶/K from 300 to 400 K
          vs 2.57 at 300 K, Okada &amp; Tokumaru 1984; the silicon section below integrates α(T)).
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ΔL (expansion)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{Math.abs(dL) >= 0.001 ? `${dL.toFixed(4)} mm` : `${(dL * 1000).toFixed(2)} µm`}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strain ε</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{strain.toExponential(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ΔL / λ (at 633nm)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{expansionWaves(dL * 1e-3, 633e-9).toFixed(1)} waves</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Silicon: α(T) integrated from T₀ to T₀ + ΔT</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <div>
          <ValidatedNumberInput label="Start temperature T₀ (°C)" value={t0Raw} onChange={setT0} min={-273.15} max={3000} step="any" />
        </div>
      </div>
      {siInRange ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">α(T₀) → α(T₀ + ΔT)</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{(siliconAlpha(T1) * 1e6).toFixed(3)} → {(siliconAlpha(T2) * 1e6).toFixed(3)}</p>
            <p className="text-xs text-gray-500 mt-1">10⁻⁶/K at {T1.toFixed(1)} K and {T2.toFixed(1)} K</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Mean α over the range</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{siMean.toFixed(3)}</p>
            <p className="text-xs text-gray-500 mt-1">10⁻⁶/K, ∫α dT / ΔT</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">ΔL of Si with α(T)</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{fmtLength(siDL)}</p>
            <p className="text-xs text-gray-500 mt-1">L · expm1(∫α dT)</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">ΔL with α frozen at T₀</p>
            <p className="text-2xl font-bold text-gray-300 mt-1">{fmtLength(siConstDL)}</p>
            <p className="text-xs text-gray-500 mt-1">{siDL !== 0 ? `${(100 * (siConstDL / siDL - 1)).toFixed(1)} % vs α(T)` : "ΔT = 0"}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm mb-4 text-yellow-400">
          The fit holds from {SI_ALPHA_T_MIN} to {SI_ALPHA_T_MAX} K ({(SI_ALPHA_T_MIN - K0).toFixed(2)} to {(SI_ALPHA_T_MAX - K0).toFixed(2)} °C);
          T₀ = {T1.toFixed(1)} K and T₀ + ΔT = {T2.toFixed(1)} K must both lie in it.
        </p>
      )}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <SimpleLineChart bare title="Silicon α(T), Okada & Tokumaru 1984 (±0.2 × 10⁻⁶/K)" xLabel="Temperature (K)" yLabel="α (10⁻⁶/K)"
          series={[
            { name: "α(T)", color: "#60a5fa", points: siCurve },
            ...(siInRange ? [{ name: "T₀, T₀ + ΔT", color: "#fbbf24", showPoints: true, points: [T1, T2].map((T) => ({ x: T, y: siliconAlpha(T) * 1e6 })) }] : []),
          ]} />
      </div>

      <h2 className="text-xl font-bold mb-4">Reference CTE Values (×10⁻⁶/K)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-2 px-3">Material</th>
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-right py-2 px-3">α (10⁻⁶/K)</th>
              <th className="text-left py-2 px-3">Notes</th>
              <th className="text-left py-2 px-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => (
              <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer ${selected === m.name && alpha === m.ppm ? "bg-blue-900/20" : ""}`}
                onClick={() => { setSelected(m.name); setAlpha(m.ppm); }}>
                <td className="py-2 px-3 font-medium">{m.name}</td>
                <td className="py-2 px-3 text-gray-400">{m.type}</td>
                <td className="py-2 px-3 text-right font-mono text-blue-400">{m.ppm}</td>
                <td className="py-2 px-3 text-gray-500">{m.notes}</td>
                <td className="py-2 px-3 text-gray-500">{m.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
