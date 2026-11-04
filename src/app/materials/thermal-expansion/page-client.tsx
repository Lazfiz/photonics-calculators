"use client";

import { useState } from "react";

import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { alphaPpm, CTE_TABLE, expansionWaves, thermalExpansion } from "../../../physics/materials/thermal-expansion";

const DT_MIN = -273;
const DT_MAX = 3000;
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
// The table in the page unit, 10⁻⁶/K.
const materials = CTE_TABLE.map((m) => ({ ...m, ppm: alphaPpm(m.alpha) }));

export default function ThermalExpansionPage() {
  const [alphaRaw, setAlpha] = useURLState("alpha", 7.1);
  const [dTRaw, setDT] = useURLState("dT", 100); // temperature change in °C
  const [lengthRaw, setLength] = useURLState("length", 100); // mm
  const [selected, setSelected] = useState<string | null>(null); // preset row last clicked; cleared when α is edited by hand
  const alpha = clamp(alphaRaw, -50, 100, 7.1);
  const dT = clamp(dTRaw, DT_MIN, DT_MAX, 100);
  const length = clamp(lengthRaw, 0, 1e6, 100);

  const dL = thermalExpansion(alpha * 1e-6, length, dT); // mm, since L is in mm
  const strain = alpha * 1e-6 * dT;

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
          α itself changes with temperature; over large ranges use the mean α of the range (Si: 2.9 × 10⁻⁶/K from 300 to 400 K
          vs 2.6 at 293 K, Okada &amp; Tokumaru 1984).
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
