"use client";

// Crystal picker shared by the birefringence pages: the uniaxial Sellmeier sets plus a custom option.
import { refractiveIndex } from "../physics/materials/sellmeier";
import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS, crystalRange, type CrystalId } from "../physics/materials/uniaxial-data";

export const CUSTOM = "custom";

export function isCrystalId(v: string): v is CrystalId {
  return (CRYSTAL_IDS as readonly string[]).includes(v);
}

/** n_o and n_e at λ (m): the crystal's fits (NaN outside their range) or the custom values. */
export function resolveIndices(material: string, lambda: number, customNo: number, customNe: number): { no: number; ne: number } {
  if (!isCrystalId(material)) return { no: customNo, ne: customNe };
  const [lo, hi] = crystalRange(material);
  if (!(lambda >= lo && lambda <= hi)) return { no: NaN, ne: NaN };
  const c = UNIAXIAL_CRYSTALS[material];
  return { no: refractiveIndex(c.o, lambda), ne: refractiveIndex(c.e, lambda) };
}

/** Δn(λ) = n_e − n_o for a crystal, or a constant for the custom option. */
export function birefringenceOf(material: string, customDn: number): (lambda: number) => number {
  if (!isCrystalId(material)) return () => customDn;
  return (lambda) => {
    const { no, ne } = resolveIndices(material, lambda, NaN, NaN);
    return ne - no;
  };
}

/** Wavelength range (m) where Δn(λ) is defined: the fit range, or `fallback` for custom indices. */
export function materialRange(material: string, fallback: [number, number]): [number, number] {
  return isCrystalId(material) ? crystalRange(material) : fallback;
}

/** Source of the data set and its range, or why λ is outside it. */
export function crystalNote(material: string, lambda: number): { text: string; warn: boolean } {
  if (!isCrystalId(material)) return { text: "Custom indices are held constant at every wavelength (no dispersion).", warn: false };
  const [lo, hi] = crystalRange(material);
  const range = `${Math.round(lo * 1e9)}–${Math.round(hi * 1e9)} nm`;
  if (!(lambda >= lo && lambda <= hi)) return { text: `The wavelength is outside this data set's range (${range}).`, warn: true };
  const c = UNIAXIAL_CRYSTALS[material];
  const temp = c.temperature_C === null ? "room temperature" : `${c.temperature_C} °C`;
  return { text: `Sellmeier fit: ${c.reference}; ${range}, ${temp}.`, warn: false };
}

export function CrystalSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
      <span className="text-sm text-gray-300">Crystal</span>
      <select
        value={isCrystalId(value) ? value : CUSTOM}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
      >
        {CRYSTAL_IDS.map((id) => (
          <option key={id} value={id}>{UNIAXIAL_CRYSTALS[id].name}</option>
        ))}
        <option value={CUSTOM}>Custom (no dispersion)</option>
      </select>
    </label>
  );
}

export function CrystalNote({ material, lambda }: { material: string; lambda: number }) {
  const note = crystalNote(material, lambda);
  return <p className={`text-xs mb-6 ${note.warn ? "text-yellow-400" : "text-gray-500"}`}>{note.text}</p>;
}
