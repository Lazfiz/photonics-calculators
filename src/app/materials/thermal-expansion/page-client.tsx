"use client";

import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { expansionWaves, thermalExpansion } from "../../../physics/materials/thermal-expansion";

interface Material {
  name: string;
  alpha: number; // CTE in 10⁻⁶/K, near room temperature
  type: string;
  notes: string;
  /** Where α comes from (references on the page): data sheets, Kaye & Laby's 293 K table, or the slope of a NIST fit at 293 K. */
  source: "Crystran" | "SCHOTT" | "Corning" | "Kaye & Laby" | "NIST";
}

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const MATERIALS: Material[] = [
  { name: "Fused Silica", alpha: 0.55, type: "Glass", notes: "at 300 K", source: "Crystran" },
  { name: "ULE 7972", alpha: 0.03, type: "Glass", notes: "Corning titania-silica; mean α specified as 0 ± 0.03, 5–35 °C (limit shown)", source: "Corning" },
  { name: "Zerodur", alpha: 0.05, type: "Glass Ceramic", notes: "Expansion class 1: mean α 0 ± 0.05, 0–50 °C (limit shown); classes 0.007–0.1", source: "SCHOTT" },
  { name: "BK7", alpha: 7.1, type: "Glass", notes: "Standard optical glass", source: "Crystran" },
  { name: "Pyrex (Borosilicate)", alpha: 2.8, type: "Glass", notes: "at 293 K", source: "Kaye & Laby" },
  { name: "SF11", alpha: 6.1, type: "Glass", notes: "High-index flint; mean −30 to +70 °C (N-SF11: 8.5)", source: "SCHOTT" },
  { name: "Sapphire ∥ c", alpha: 5.6, type: "Crystal", notes: "5.0 perpendicular to the c-axis", source: "Crystran" },
  { name: "CaF₂", alpha: 18.85, type: "Crystal", notes: "Large expansion, needs care", source: "Crystran" },
  { name: "Si", alpha: 2.6, type: "Semiconductor", notes: "at 20 °C, increases with T", source: "Crystran" },
  { name: "Ge", alpha: 6.1, type: "Semiconductor", notes: "at 298 K", source: "Crystran" },
  { name: "ZnSe", alpha: 7.1, type: "II-VI", notes: "at 273 K", source: "Crystran" },
  { name: "Aluminum 6061-T6", alpha: 22.6, type: "Metal", notes: "Common mount material; at 293 K", source: "NIST" },
  { name: "Invar 36", alpha: 0.9, type: "Metal", notes: "Fe-36Ni near 293 K, ± 20 % (fit slope; mean 250–300 K 1.2); heat treatment changes it (Kaye & Laby: 0.13)", source: "NIST" },
  { name: "Stainless 304", alpha: 15.4, type: "Metal", notes: "at 293 K (Kaye & Laby, austenitic: 14.1)", source: "NIST" },
  { name: "Copper", alpha: 16.5, type: "Metal", notes: "Heat sinks, mirrors; at 293 K", source: "Kaye & Laby" },
  { name: "Diamond", alpha: 1.0, type: "Crystal", notes: "at 293 K", source: "Crystran" },
  { name: "MgF₂ ∥ c", alpha: 13.7, type: "Crystal", notes: "8.9 perpendicular to the c-axis", source: "Crystran" },
];
const materials = [...MATERIALS].sort((a, b) => a.alpha - b.alpha);

export default function ThermalExpansionPage() {
  const [alphaRaw, setAlpha] = useURLState("alpha", 7.1);
  const [dTRaw, setDT] = useURLState("dT", 100); // temperature change in °C
  const [lengthRaw, setLength] = useURLState("length", 100); // mm
  const alpha = clamp(alphaRaw, -50, 100, 7.1);
  const dT = clamp(dTRaw, -1000, 3000, 100);
  const length = clamp(lengthRaw, 0, 1e6, 100);

  const dL = thermalExpansion(alpha * 1e-6, length, dT); // mm, since L is in mm
  const strain = alpha * 1e-6 * dT;

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div>
          <ValidatedNumberInput label="CTE α (×10⁻⁶/K)" value={alphaRaw} onChange={setAlpha} min={-50} max={100} step="any" />
        </div>
        <div>
          <ValidatedNumberInput label="Temperature change ΔT (°C)" value={dTRaw} onChange={setDT} min={-1000} max={3000} step="any" />
        </div>
        <div>
          <ValidatedNumberInput label="Length L (mm)" value={lengthRaw} onChange={setLength} min={0} max={1000000} step="any" />
        </div>
      </div>

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
              <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer ${alpha === m.alpha ? "bg-blue-900/20" : ""}`}
                onClick={() => setAlpha(m.alpha)}>
                <td className="py-2 px-3 font-medium">{m.name}</td>
                <td className="py-2 px-3 text-gray-400">{m.type}</td>
                <td className="py-2 px-3 text-right font-mono text-blue-400">{m.alpha}</td>
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
