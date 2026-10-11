"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CrystalNote, CrystalSelect, birefringenceOf, isCrystalId, materialRange } from "../../../components/crystal-select";
import { fix } from "../../../components/polarization-format";
import { plateThickness } from "../../../physics/polarization/retarders";

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
/** Retardance in waves folded to [0, 1): what the plate does to the polarization. */
const effective = (waves: number) => waves - Math.floor(waves);

export default function WaveplateThicknessPage() {
  const [material, setMaterial] = useURLState("crystal", "quartz");
  const [customDn, setCustomDn] = useURLState("birefringence", 0.0092);
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelengthNm", 550);
  const [fractionInput, setFraction] = useURLState("customRetardance", 0.25);
  const [orderInput, setOrder] = useURLState("order", 10);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const lambda0 = clamp(wavelengthNm, 200, 7000) * 1e-9;
  const f = clamp(fractionInput, 0.01, 0.99);
  const m = Math.round(clamp(orderInput, 0, 200));
  const cDn = clamp(customDn, -1, 1);

  const dn = birefringenceOf(material, cDn)(lambda0);
  const d0 = plateThickness(dn, lambda0, f);
  const dm = plateThickness(dn, lambda0, m + f);
  // Compound zero order: an order-m plate crossed with a plate of m whole waves leaves f waves.
  const dWhole = plateThickness(dn, lambda0, m);

  const chartData = (() => {
    const dnOf = birefringenceOf(material, cDn);
    const [lo, hi] = materialRange(material, [200e-9, 7000e-9]);
    const a = Math.max(lo, lambda0 / 1.5), b = Math.min(hi, lambda0 * 1.5);
    const l = Array.from({ length: 400 }, (_, i) => a + ((b - a) * i) / 399);
    const waves = (d: number) => l.map((x) => effective((Math.abs(dnOf(x)) * d) / x));
    return [
      { x: l.map((x) => x * 1e9), y: waves(d0), type: "scatter" as const, mode: "lines" as const, name: "Zero order", line: { color: "#60a5fa", width: 2 } },
      { x: l.map((x) => x * 1e9), y: waves(dm), type: "scatter" as const, mode: "lines" as const, name: `Order ${m}`, line: { color: "#f87171", width: 1.5 } },
      { x: [a * 1e9, b * 1e9], y: [f, f], type: "scatter" as const, mode: "lines" as const, name: "Target", line: { color: "#34d399", dash: "dash" } },
      { x: [lambda0 * 1e9], y: [f], type: "scatter" as const, mode: "markers" as const, name: "Design λ", marker: { color: "#fbbf24", size: 9 } },
    ];
  })();

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">d = (m + f)·λ / |n<sub>e</sub> − n<sub>o</sub>|</p>
        <p className="text-gray-500 text-xs mt-1">
          f = fraction of a wave (¼ for a quarter-wave plate), m = order (0 for a zero-order plate), Δn at the design wavelength.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <CrystalSelect value={material} onChange={setMaterial} />
        {!isCrystalId(material) && (
          <ValidatedNumberInput label="Birefringence Δn" value={customDn} onChange={setCustomDn} min={-1} max={1} step="0.0001" />
        )}
        <ValidatedNumberInput label="Design wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={200} max={7000} />
        <ValidatedNumberInput label="Retardance f (waves)" value={fractionInput} onChange={setFraction} min={0.01} max={0.99} step="0.01" />
        <ValidatedNumberInput label="Order m" value={orderInput} onChange={setOrder} min={0} max={200} step="1" />
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {[[0.25, "Quarter-wave"], [0.5, "Half-wave"]].map(([v, name]) => (
          <button key={name} onClick={() => setFraction(v as number)}
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">
            {name} (f = {v})
          </button>
        ))}
      </div>
      <CrystalNote material={material} lambda={lambda0} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">|Δn| at the design λ</p>
          <p className="text-2xl font-bold text-gray-200">{fix(Math.abs(dn), 5)}</p>
          <p className="text-xs text-gray-500">{!Number.isFinite(dn) || dn === 0 ? "" : dn > 0 ? "positive crystal: optic axis slow" : "negative crystal: optic axis fast"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Zero-order thickness</p>
          <p className="text-2xl font-bold text-blue-400">{fix(d0 * 1e6, 3)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Order-{m} thickness</p>
          <p className="text-2xl font-bold text-purple-400">{fix(dm * 1e6, 2)} µm</p>
          <p className="text-xs text-gray-500">{fix(m + f, 2)} waves</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Compound zero order</p>
          <p className="text-lg font-bold text-yellow-400">{m === 0 ? "—" : `${fix(dm * 1e6, 2)} − ${fix(dWhole * 1e6, 2)} µm`}</p>
          <p className="text-xs text-gray-500">two plates, axes crossed; same retardance as the zero-order plate</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Retardance against wavelength, folded to one wave (both plates designed at λ)</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Retardance mod 1 (waves)", gridcolor: "#374151", range: [0, 1] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </>
  );
}
