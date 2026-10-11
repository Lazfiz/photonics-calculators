"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CrystalNote, CrystalSelect, birefringenceOf, isCrystalId, materialRange, resolveIndices } from "../../../components/crystal-select";
import { fix, plateTypeLabel } from "../../../components/polarization-format";
import { fullWaveWavelengths, plateOrder, retardance } from "../../../physics/polarization/retarders";

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const CHART_RANGE: [number, number] = [300e-9, 1500e-9];
const MAX_MARKERS = 40;

export default function BirefringencePage() {
  const [material, setMaterial] = useURLState("crystal", "quartz");
  const [customNo, setCustomNo] = useURLState("no", 1.5443);
  const [customNe, setCustomNe] = useURLState("ne", 1.5534);
  const [thicknessMm, setThicknessMm] = useURLState("thickness", 1.0);
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelength", 550);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const d = clamp(thicknessMm, 0.001, 50) * 1e-3;
  const lambda = clamp(wavelengthNm, 200, 7000) * 1e-9;
  const cNo = clamp(customNo, 1, 5);
  const cNe = clamp(customNe, 1, 5);

  const { no, ne } = resolveIndices(material, lambda, cNo, cNe);
  const dn = ne - no;
  const gamma = retardance(dn, d, lambda);
  const order = plateOrder(dn, d, lambda);

  const { curve, crossings } = useMemo(() => {
    const [lo, hi] = materialRange(material, CHART_RANGE);
    const a = Math.max(lo, CHART_RANGE[0]), b = Math.min(hi, CHART_RANGE[1]);
    const dnOf = birefringenceOf(material, cNe - cNo);
    const l = Array.from({ length: 400 }, (_, i) => a + ((b - a) * i) / 399);
    const crossings = a < b ? fullWaveWavelengths(dnOf, d, a, b) : [];
    return { curve: { l, waves: l.map((x) => (Math.abs(dnOf(x)) * d) / x) }, crossings };
  }, [material, cNo, cNe, d]);

  const shown = crossings.slice(-MAX_MARKERS);

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>Δn = n<sub>e</sub> − n<sub>o</sub>, &nbsp;Γ = 2πΔn·d/λ</p>
        <p>Full-wave wavelengths: |Δn(λ)|·d/λ = m (m = 1, 2, …): dark between crossed polarizers</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <CrystalSelect value={material} onChange={setMaterial} />
        <ValidatedNumberInput label="Thickness (mm)" value={thicknessMm} onChange={setThicknessMm} min={0.001} max={50} step="0.01" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={200} max={7000} step="1" />
        {!isCrystalId(material) && (
          <>
            <ValidatedNumberInput label="Ordinary index (nₒ)" value={customNo} onChange={setCustomNo} min={1} max={5} step="0.0001" />
            <ValidatedNumberInput label="Extraordinary index (nₑ)" value={customNe} onChange={setCustomNe} min={1} max={5} step="0.0001" />
          </>
        )}
      </div>
      <CrystalNote material={material} lambda={lambda} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="nₒ / nₑ" value={`${fix(no, 5)} / ${fix(ne, 5)}`} />
            <ResultRow label="Birefringence Δn = nₑ − nₒ" value={fix(dn, 5)} />
            <ResultRow label="Crystal sign" value={!Number.isFinite(dn) ? "—" : dn > 0 ? "positive (optic axis slow)" : dn < 0 ? "negative (optic axis fast)" : "isotropic"} />
            <ResultRow label="Phase retardation Γ" value={`${fix(gamma, 4)} rad`} />
            <ResultRow label="Retardation (waves)" value={fix(order.waves, 4)} />
            <ResultRow label="Retardation (degrees)" value={`${fix((gamma * 180) / Math.PI, 2)}°`} />
            <ResultRow label="Order / fraction of a wave" value={Number.isFinite(order.waves) ? `${order.order} + ${fix(order.fraction, 4)}` : "—"} />
            <ResultRow label="Acts as" value={plateTypeLabel(order.fraction)} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-2">Full-wave wavelengths in the chart range</h2>
          {crossings.length === 0 ? (
            <p className="text-sm text-gray-400">None: the plate is less than one wave over the whole range.</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">
                {crossings.length} wavelengths{crossings.length > MAX_MARKERS ? `; the longest ${MAX_MARKERS} shown` : ""} (nm):
              </p>
              <div className="flex flex-wrap gap-2">
                {shown.map((l) => (
                  <span key={l} className="px-2 py-0.5 text-xs bg-gray-800 rounded">{(l * 1e9).toFixed(1)}</span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Retardation against wavelength</h2>
          <ChartPanel
            data={[
              { type: "scatter", mode: "lines", x: curve.l.map((x) => x * 1e9), y: curve.waves, line: { color: "#3b82f6", width: 2 }, name: "|Δn|·d/λ (waves)" },
              { type: "scatter", mode: "markers", x: shown.map((x) => x * 1e9), y: shown.map((x) => Math.round((Math.abs(birefringenceOf(material, cNe - cNo)(x)) * d) / x)), marker: { size: 6, color: "#34d399" }, name: "Full wave" },
              { type: "scatter", mode: "markers", x: [lambda * 1e9], y: [order.waves], marker: { size: 10, color: "#f59e0b" }, name: "Selected λ" },
            ]}
            layout={{
              xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
              yaxis: { title: "Retardation (waves)", gridcolor: "#374151", color: "#9ca3af" },
              paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              margin: { l: 50, r: 20, t: 20, b: 40 }, showlegend: true,
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
