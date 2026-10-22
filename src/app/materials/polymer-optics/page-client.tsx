"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  POLYMERS,
  corecladNA,
  normalReflectance,
  polymerAbbe,
  polymerDnDlambda,
  polymerGroupIndex,
  polymerIndex,
  polymerRange,
  type PolymerId,
} from "../../../physics/materials/polymer-optics";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const IDS = Object.keys(POLYMERS) as PolymerId[];
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4"];
const NM = 1e-9;

// Module level so the React Compiler keeps the page component: each fit over its own range, 5 nm steps.
function curves() {
  return IDS.map((k, i) => {
    const d = POLYMERS[k].dispersion;
    const [lo, hi] = polymerRange(d);
    const points = [];
    for (let w = Math.ceil(lo / NM / 5) * 5; w <= hi / NM; w += 5) points.push({ x: w, y: Number(polymerIndex(d, w * NM).toFixed(6)) });
    return { name: POLYMERS[k].name, color: COLORS[i % COLORS.length], points };
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

const rangeText = (k: PolymerId) => {
  const [lo, hi] = polymerRange(POLYMERS[k].dispersion);
  return `${Math.round(lo / NM)}–${Math.round(hi / NM)} nm`;
};

export default function PolymerOpticsPage() {
  const [polymerRaw, setPolymer] = useURLState("polymer", "pmma");
  const [claddingRaw, setCladding] = useURLState("cladding", "none");
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 633); // nm

  const id = IDS.find((k) => k === polymerRaw) ?? "pmma";
  const cladId = IDS.find((k) => k === claddingRaw && k !== id);
  const d = POLYMERS[id].dispersion;
  const lambda = clamp(wavelengthRaw, 320, 1620, 633) * NM;

  const n = polymerIndex(d, lambda);
  const ng = polymerGroupIndex(d, lambda);
  const dndl = polymerDnDlambda(d, lambda);
  const vd = polymerAbbe(d);
  const R = normalReflectance(n);
  const n2 = cladId ? polymerIndex(POLYMERS[cladId].dispersion, lambda) : NaN;
  const na = corecladNA(n, n2);
  const outside = !Number.isFinite(n);
  const naNote = !cladId ? "choose a cladding"
    : !Number.isFinite(n2) ? `cladding fit covers ${rangeText(cladId)}`
    : !(na > 0) && Number.isFinite(n) ? "cladding index ≥ core index: no guiding"
    : `cladding n = ${n2.toFixed(5)}`;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <label htmlFor="polymer" className="block text-sm font-medium mb-2">Polymer (core)</label>
          <select id="polymer" value={id} onChange={(e) => setPolymer(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
            {IDS.map((k) => <option key={k} value={k}>{POLYMERS[k].name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cladding" className="block text-sm font-medium mb-2">Cladding</label>
          <select id="cladding" value={cladId ?? "none"} onChange={(e) => setCladding(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
            <option value="none">None</option>
            {IDS.filter((k) => k !== id).map((k) => <option key={k} value={k}>{POLYMERS[k].name}</option>)}
          </select>
        </div>
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={320} max={1620} step="any" />
      </div>
      {outside && (
        <p className="text-sm text-amber-400 mb-6">
          {POLYMERS[id].name}: the fit covers {rangeText(id)} only.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card label={`Refractive index n at ${(lambda / NM).toFixed(1)} nm`} value={show(n, () => n.toFixed(5))}
          sub={`fit range ${rangeText(id)}`} tone="text-blue-400" />
        <Card label="Group index n_g" value={show(ng, () => ng.toFixed(5))}
          sub={show(dndl, () => `dn/dλ = ${(dndl * 1e-6).toFixed(5)} µm⁻¹`)} tone="text-green-400" />
        <Card label="Abbe number V_d" value={show(vd, () => vd.toFixed(1))}
          sub="(n_d − 1)/(n_F − n_C) from the fit" tone="text-amber-400" />
        <Card label="Reflectance per surface" value={show(R, () => `${(R * 100).toFixed(3)} %`)}
          sub="normal incidence, in air" tone="text-purple-400" />
        <Card label="Numerical aperture" value={cladId ? show(na, () => (na >= 1 ? "≥ 1" : na.toFixed(4))) : "—"}
          sub={naNote}
          tone="text-red-400" />
        <Card label="Acceptance half-angle" value={show(na, () => `${((Math.asin(Math.min(na, 1)) * 180) / Math.PI).toFixed(2)}°`)}
          sub="arcsin(NA), launch from air" tone="text-cyan-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <SimpleLineChart title="Refractive index over each fit's range" xLabel="Wavelength (nm)" yLabel="n" series={curves()} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-3">Polymers</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-1">Polymer</th><th className="text-right py-1">n_d</th>
              <th className="text-right py-1">V_d</th><th className="text-right py-1">Range</th>
              <th className="text-left py-1 pl-4">Source</th>
            </tr>
          </thead>
          <tbody>
            {IDS.map((k) => (
              <tr key={k} className="border-b border-gray-800/50">
                <td className="py-1">{POLYMERS[k].name}</td>
                <td className="text-right py-1">{polymerIndex(POLYMERS[k].dispersion, 587.5618 * NM).toFixed(4)}</td>
                <td className="text-right py-1">{polymerAbbe(POLYMERS[k].dispersion).toFixed(1)}</td>
                <td className="text-right py-1 whitespace-nowrap">{rangeText(k)}</td>
                <td className="py-1 pl-4 text-xs text-gray-400">{POLYMERS[k].reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Sellmeier n² = 1 + Bλ²/(λ² − C); PMMA n² = A + Σ Bᵢλ^pᵢ; Cauchy n = A + B/λ² + C/λ⁴</p>
          <p>n_g = n − λ dn/dλ,   R = ((n − 1)/(n + 1))²,   NA = √(n₁² − n₂²)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Each fit holds only inside its measured range. Indices vary by grade, cure and temperature: two PMMA
          samples differ by up to 0.003. With index accuracy ±0.001 and n_F − n_C ≈ 0.01, the Abbe numbers from
          these fits are good to about 10 %. Absorption and loss are not modelled; C–H vibrational overtones make
          these polymers lossy in the near infrared.
        </p>
      </div>
    </>
  );
}
