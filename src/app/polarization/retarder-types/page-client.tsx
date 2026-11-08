"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import { retarderRow, retarderTypes, type RetarderType } from "../../../physics/polarization/retarders";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const fold = (w: number) => w - Math.floor(w);
const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#22c55e", "#a855f7"];

const NOTES: Record<RetarderType["id"], string> = {
  zero: "Thin plate, often cemented to a window.",
  multi: "One thick plate: right only near λ₀.",
  compound: "Zero-order dispersion, multi-order tilt sensitivity.",
  achromatic: "Exact at λ₁ and λ₂.",
  rhomb: "Total internal reflection: nearly achromatic; displaces the beam.",
};

/** Description of the plates of one type (µm). */
function platesText(t: RetarderType): string {
  const um = (d: number, k = 1) => fix(d * 1e6, k);
  switch (t.id) {
    case "zero":
    case "multi": return `quartz ${um(t.d[0])} µm`;
    case "compound": return `quartz ${um(t.d[0])} − ${um(t.d[1])} µm, crossed`;
    case "achromatic": return `quartz ${um(t.d[0])} + MgF₂ ${um(t.d[1])} µm, crossed`;
    case "rhomb": return `N-BK7, ${t.reflections} reflections at ${fix((t.theta ?? NaN) / DEG, 2)}°`;
  }
}

/** Band in nm: one decimal when it is narrower than 20 nm. */
function bandText([a, b]: [number, number]): string {
  const digits = (b - a) * 1e9 < 20 ? 1 : 0;
  return `${fix(a * 1e9, digits)}–${fix(b * 1e9, digits)}`;
}

export default function RetarderTypesPage() {
  const [wavelengthNm, setWavelength] = useURLState("wavelength", 550);
  const [targetInput, setTarget] = useURLState("retardance", 0.25);
  const [orderInput, setOrder] = useURLState("order", 10);
  const [lambda1Nm, setLambda1] = useURLState("lambda1", 510);
  const [lambda2Nm, setLambda2] = useURLState("lambda2", 600);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const lambda0 = clamp(wavelengthNm, 350, 1800) * 1e-9;
  const R = clamp(targetInput, 0.05, 0.95);
  const m = Math.round(clamp(orderInput, 1, 100));
  const lambda1 = clamp(lambda1Nm, 350, 1800) * 1e-9;
  const lambda2 = clamp(lambda2Nm, 350, 1800) * 1e-9;

  const types = useMemo(() => retarderTypes(lambda0, R, m, lambda1, lambda2), [lambda0, R, m, lambda1, lambda2]);

  const rows = useMemo(() => types.map((t) => ({ t, ...retarderRow(t, lambda0, R) })), [types, lambda0, R]);

  const spectral = useMemo(() => {
    const l = Array.from({ length: 600 }, (_, i) => 350e-9 * (1100 / 350) ** (i / 599));
    return types.map((t, k) => ({
      x: l.map((x) => x * 1e9),
      y: l.map((x) => { const w = Math.abs(t.waves(x, 0)); return t.folded ? fold(w) : w; }),
      name: t.name, type: "scatter" as const, mode: "lines" as const,
      line: { color: COLORS[k], width: 2, dash: k === 2 ? ("dot" as const) : undefined },
    }));
  }, [types]);

  const tiltChart = useMemo(() => {
    const a = Array.from({ length: 101 }, (_, i) => i * 0.1);
    return types.map((t, k) => {
      const w0 = Math.abs(t.waves(lambda0, 0));
      return {
        x: a, y: a.map((x) => Math.abs(t.waves(lambda0, x * DEG)) - w0),
        name: t.name, type: "scatter" as const, mode: "lines" as const, line: { color: COLORS[k], width: 2 },
      };
    });
  }, [types, lambda0]);

  const plotLayout = (x: string, y: string) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "#111827", font: { color: "#e5e7eb" },
    margin: { t: 30, b: 40, l: 60, r: 10 }, height: 320,
    xaxis: { color: "#9ca3af", gridcolor: "#374151", title: x },
    yaxis: { color: "#9ca3af", gridcolor: "#374151", title: y },
    legend: { font: { color: "#9ca3af" } },
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-4">
        <ValidatedNumberInput label="Design wavelength λ₀ (nm)" value={wavelengthNm} onChange={setWavelength} min={350} max={1800} step="1" />
        <ValidatedNumberInput label="Target retardance (waves)" value={targetInput} onChange={setTarget} min={0.05} max={0.95} step="0.01" />
        <ValidatedNumberInput label="Multi-order m" value={orderInput} onChange={setOrder} min={1} max={100} step="1" />
        <ValidatedNumberInput label="Achromat λ₁ (nm)" value={lambda1Nm} onChange={setLambda1} min={350} max={1800} step="1" />
        <ValidatedNumberInput label="Achromat λ₂ (nm)" value={lambda2Nm} onChange={setLambda2} min={350} max={1800} step="1" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[0.25, 0.5].map((r) => (
          <button key={r} onClick={() => setTarget(r)}
            className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">
            λ/{(1 / r).toFixed(0)}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Retardance against wavelength (multi-order folded to one wave)</h2>
        <ChartPanel bare data={spectral} layout={plotLayout("Wavelength (nm)", "Retardance (waves)")} />
        <p className="text-xs text-gray-500 mt-2">The compound zero-order curve (dotted) lies on the zero-order one: only d₁ − d₂ counts at normal incidence.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Retardance change against tilt at λ₀</h2>
        <ChartPanel bare data={tiltChart} layout={plotLayout("Angle of incidence (°)", "Change (waves)")} />
        <p className="text-xs text-gray-500 mt-2">
          Tilt in the plane holding the first plate&apos;s optic axis (the rhomb: in its plane of reflection). Tilting about the
          other axis changes the sign for the plates.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4">Comparison at λ₀ = {fix(lambda0 * 1e9, 0)} nm, target {fix(R, 3)} waves</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Plates</th>
                <th className="text-right py-2 px-2">Retardance (waves)</th>
                <th className="text-right py-2 px-2">Band within ±1 % (nm)</th>
                <th className="text-right py-2 px-2">Change at 5° tilt (waves)</th>
                <th className="text-left py-2 px-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.t.id} className="border-b border-gray-800">
                  <td className="py-2 px-2 font-medium">{r.t.name}</td>
                  <td className="py-2 px-2">{platesText(r.t)}</td>
                  <td className="text-right py-2 px-2 font-mono">{fix(r.at, 4)}</td>
                  <td className="text-right py-2 px-2 font-mono">
                    {Number.isFinite(r.band[0]) ? bandText(r.band) : "—"}
                  </td>
                  <td className="text-right py-2 px-2 font-mono">{fix(r.tilt, 4)}</td>
                  <td className="py-2 px-2 text-gray-400">{NOTES[r.t.id]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Indices: quartz (Ghosh 1999), MgF₂ (Dodge 1984), N-BK7 (SCHOTT). Bands are searched from 300 to 2000 nm. The
          achromat&apos;s curve depends on Δn at the 10⁻⁵ level; real plates are trimmed after polishing.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Γ = 2π·Δn(λ)·d/λ; order-m plate: d = (m + f)·λ₀/|Δn(λ₀)|</p>
          <p>Crossed plates: Γ = 2π(Δn₁d₁ − Δn₂d₂)/λ; achromat: Γ(λ₁) = Γ(λ₂) = target</p>
          <p>Tilted plate: Γ = (2πd/λ)(k<sub>z,e</sub> − k<sub>z,o</sub>)</p>
          <p>Total internal reflection: tan(δ/2) = cos θ·√(sin²θ − 1/n²)/sin²θ</p>
        </div>
      </div>
    </>
  );
}
