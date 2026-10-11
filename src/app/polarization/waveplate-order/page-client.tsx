"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CrystalNote, CrystalSelect, birefringenceOf, isCrystalId, materialRange } from "../../../components/crystal-select";
import { fix, plateTypeLabel } from "../../../components/polarization-format";
import { plateOrder, plateThickness } from "../../../physics/polarization/retarders";

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const CHART_RANGE: [number, number] = [300e-9, 1100e-9];

export default function WaveplateOrderPage() {
  const [material, setMaterial] = useURLState("crystal", "quartz");
  const [customDn, setCustomDn] = useURLState("birefringence", 0.009);
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelength", 550);
  const [thicknessUm, setThicknessUm] = useURLState("thickness", 100);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const lambda = clamp(wavelengthNm, 200, 7000) * 1e-9;
  const d = clamp(thicknessUm, 0.1, 50000) * 1e-6;
  const cDn = clamp(customDn, -1, 1);

  const dnOf = useMemo(() => birefringenceOf(material, cDn), [material, cDn]);
  const dn = dnOf(lambda);
  const o = plateOrder(dn, d, lambda);
  const phase = 2 * Math.PI * o.waves;

  const curves = useMemo(() => {
    const [lo, hi] = materialRange(material, CHART_RANGE);
    const a = Math.max(lo, CHART_RANGE[0]), b = Math.min(hi, CHART_RANGE[1]);
    // Enough points to resolve the fastest fringe: ≥ 20 per wave of retardance change across the range.
    const span = (Math.abs(dnOf(a)) * d) / a - (Math.abs(dnOf(b)) * d) / b;
    const N = Math.min(20000, Math.max(400, Math.ceil(20 * Math.abs(span))));
    const l = Array.from({ length: N }, (_, i) => a + ((b - a) * i) / (N - 1));
    const waves = l.map((x) => (Math.abs(dnOf(x)) * d) / x);
    return {
      nm: l.map((x) => x * 1e9),
      transmission: waves.map((w) => Math.sin(Math.PI * w) ** 2),
      phaseDeg: waves.map((w) => (w - Math.floor(w)) * 360),
    };
  }, [material, dnOf, d]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <CrystalSelect value={material} onChange={setMaterial} />
        {!isCrystalId(material) && (
          <ValidatedNumberInput label="Birefringence Δn" value={customDn} onChange={setCustomDn} min={-1} max={1} step="0.0001" />
        )}
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={200} max={7000} step="1" />
        <ValidatedNumberInput label="Thickness (μm)" value={thicknessUm} onChange={setThicknessUm} min={0.1} max={50000} step="any" />
      </div>
      <CrystalNote material={material} lambda={lambda} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Birefringence Δn = nₑ − nₒ" value={fix(dn, 5)} />
            <ResultRow label="Retardation |Δn|·d" value={`${fix(Math.abs(dn) * d * 1e9, 2)} nm`} />
            <ResultRow label="Phase retardation" value={`${fix(phase, 3)} rad (${fix(phase * 180 / Math.PI, 1)}°)`} />
            <ResultRow label="Waves |Δn|·d/λ" value={fix(o.waves, 4)} />
            <ResultRow label="Order" value={Number.isFinite(o.waves) ? (o.order === 0 ? "0 (zero order)" : String(o.order)) : "—"} />
            <ResultRow label="Fraction of a wave left over" value={`${fix(o.fraction, 4)} (${fix(o.fraction * 360, 1)}°)`} />
            <ResultRow label="Acts as" value={plateTypeLabel(o.fraction)} />
            <ResultRow label="Fast axis" value={!Number.isFinite(dn) || dn === 0 ? "—" : dn > 0 ? "ordinary (⊥ optic axis)" : "extraordinary (optic axis)"} />
            <ResultRow label="Zero-order QWP / HWP" value={`${fix(plateThickness(dn, lambda, 0.25) * 1e6, 2)} / ${fix(plateThickness(dn, lambda, 0.5) * 1e6, 2)} μm`} />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-1">Transmission between crossed polarizers</h2>
          <p className="text-xs text-gray-500 mb-3">Plate axes at 45° to the polarizer: T = sin²(Γ/2).</p>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: curves.nm, y: curves.transmission, line: { color: "#3b82f6", width: 1.5 } }]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Transmission", color: "#9ca3af", gridcolor: "#374151", range: [0, 1.05] },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
          />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Retardance against wavelength, folded to one wave</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "markers" as const, x: curves.nm, y: curves.phaseDeg, marker: { color: "#22c55e", size: 2 } }]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Retardance mod 360 (°)", color: "#9ca3af", gridcolor: "#374151", range: [0, 360] },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
          />
        </div>
      </div>
    </>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
