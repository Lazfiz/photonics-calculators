"use client";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cylinderCentreRise, rodThermalLens, slabConductionRise } from "../../../physics/materials/thermal-conduction";
import { WINDOW_MATERIALS, type WindowMaterialId } from "../../../physics/materials/window-materials";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const IDS = (Object.keys(WINDOW_MATERIALS) as WindowMaterialId[]).filter((k) => WINDOW_MATERIALS[k].conductivity !== null);
const BY_K = [...IDS].sort((a, b) => (WINDOW_MATERIALS[b].conductivity ?? 0) - (WINDOW_MATERIALS[a].conductivity ?? 0));
const DNDT_PRESET = 1e6; // URL sentinel outside the input range (±1000): use the preset dn/dT, so 0 is a valid entry
const PPM = 1e-6; // the dn/dT input unit, 1/K

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function ThermalConductivityPage() {
  const [materialRaw, setMaterial] = useURLState("material", "fusedSilica");
  const [kRaw, setK] = useURLState("k", 0); // W/(m·K); 0 = the preset
  const [dndtRaw, setDndt] = useURLState("dndT", DNDT_PRESET); // 1e-6/K; DNDT_PRESET = the preset
  const [thickRaw, setThick] = useURLState("thickness", 10); // mm
  const [areaRaw, setArea] = useURLState("area", 100); // mm²
  const [powerRaw, setPower] = useURLState("power", 1); // W absorbed

  const id = IDS.find((k) => k === materialRaw) ?? "fusedSilica";
  const mat = WINDOW_MATERIALS[id];
  const kInput = kRaw > 0 ? kRaw : (mat.conductivity ?? 1);
  const presetDndt = mat.dnDT === null ? NaN : Number((mat.dnDT / PPM).toPrecision(4));
  const dndtInput = dndtRaw !== DNDT_PRESET ? dndtRaw : presetDndt;
  const k = clamp(kInput, 0.01, 1e4, 1);
  const dndT = Number.isFinite(dndtInput) ? clamp(dndtInput, -1000, 1000, 0) * PPM : NaN;
  const d = clamp(thickRaw, 0.01, 1000, 10) * 1e-3;
  const area = clamp(areaRaw, 1e-4, 1e6, 100) * 1e-6;
  const P = clamp(powerRaw, 0, 1e5, 1);

  const faceRise = slabConductionRise(P, d, k, area);
  const centreRise = cylinderCentreRise(P, k, d);
  const f = rodThermalLens(P, k, area, dndT);
  const choose = (key: string) => { setMaterial(key); setK(0); setDndt(DNDT_PRESET); };

  return (
    <>
      <div className="mb-6">
        <label htmlFor="material" className="block text-sm font-medium mb-2">Material</label>
        <select id="material" value={id} onChange={(e) => choose(e.target.value)}
          className="w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
          {IDS.map((key) => <option key={key} value={key}>{WINDOW_MATERIALS[key].name}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          Choosing a material fills its room-temperature conductivity and dn/dT from the Crystran data sheet
          {mat.note ? ` (${mat.note})` : ""}. Edit either for another material or temperature.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Thermal Conductivity k (W/(m·K))" value={kInput} onChange={setK} min={0.01} max={10000} step="any" />
        <ValidatedNumberInput label="dn/dT (×10⁻⁶ /K)" value={Number.isFinite(dndtInput) ? dndtInput : 0} onChange={setDndt} min={-1000} max={1000} step="any" />
        <ValidatedNumberInput label="Thickness or Path Length d (mm)" value={thickRaw} onChange={setThick} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Heated Area A (mm²)" value={areaRaw} onChange={setArea} min={0.0001} max={1e6} step="any" />
        <ValidatedNumberInput label="Absorbed Power P (W)" value={powerRaw} onChange={setPower} min={0} max={1e5} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card label="Thermal Resistance d/(kA)" value={show(faceRise, () => `${(d / (k * area)).toPrecision(4)} K/W`)}
          sub="face to face, heat flowing through the thickness" tone="text-blue-400" />
        <Card label="Face-to-Face ΔT" value={show(faceRise, () => `${faceRise.toPrecision(4)} K`)}
          sub="P d/(kA): P conducted through a slab of area A; heat absorbed at one face and removed at the other; for bulk absorption cooled at one face the drop is half" tone="text-red-400" />
        <Card label="Heat Flux" value={`${(P / area / 1e4).toPrecision(4)} W/cm²`} sub="P/A" tone="text-gray-200" />
        <Card label="Beam Centre-to-Edge ΔT" value={show(centreRise, () => `${centreRise.toPrecision(4)} K`)}
          sub="P/(4πkd): P absorbed uniformly along d inside A, radial heat flow" tone="text-yellow-400" />
        <Card label="Thermal Lens f (dn/dT only)"
          value={!Number.isFinite(dndT) ? "—" : f === Infinity ? "none" : `${f.toPrecision(4)} m`}
          sub={!Number.isFinite(dndT) ? "enter dn/dT: none on the data sheet for this material"
            : f < 0 ? "negative: a diverging lens (dn/dT < 0)" : "2kA/(P dn/dT), no stress or end-face terms"} tone="text-green-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-3">Room-Temperature Data (Crystran)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-1">Material</th><th className="text-right py-1">k (W/(m·K))</th>
              <th className="text-right py-1">dn/dT (×10⁻⁶ /K)</th>
            </tr>
          </thead>
          <tbody>
            {BY_K.map((key) => {
              const m = WINDOW_MATERIALS[key];
              return (
                <tr key={key} className="border-b border-gray-800/50">
                  <td className="py-1">{m.name}</td>
                  <td className="text-right py-1">{m.conductivity}</td>
                  <td className="text-right py-1">{m.dnDT === null ? "—" : Number((m.dnDT / PPM).toPrecision(4))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>ΔT = P d/(kA)  (Fourier&apos;s law through a slab)</p>
          <p>T(r) = T(0) − Q r²/(4k), Q = P/(A d): ΔT₀ = P/(4πkd)</p>
          <p>f = (kA/P)(½ dn/dT)⁻¹ = 2kA/(P dn/dT)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Steady state with a constant k at room temperature. The lens is Koechner&apos;s result for a uniformly
          heated rod with radial heat flow; inside a top-hat beam the curvature depends only on Q/k, so it holds in
          a wider window too. A slab cooled through both faces has twice the lens power. Not modelled: the
          stress-optic and end-bulging lens terms, a Gaussian heat profile, axial heat flow in a thin window, and
          k(T), which rises steeply in crystals below room temperature.
        </p>
      </div>
    </>
  );
}
