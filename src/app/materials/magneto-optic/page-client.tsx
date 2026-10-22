"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  MAGNETO_OPTIC, faradayRotation, fieldForRotation, lengthForRotation, verdetConstant, type MagnetoOpticId,
} from "../../../physics/materials/faraday";

const IDS = ["tgg", "tsag", "cef3", "silica", "yig"] as const satisfies readonly MagnetoOpticId[];
const CURVE_IDS = ["tgg", "tsag", "cef3", "silica"] as const;
const COLORS: Record<MagnetoOpticId, string> = { tgg: "#60a5fa", tsag: "#34d399", cef3: "#fbbf24", silica: "#a78bfa", yig: "#f87171" };
const DEFAULT_ID: MagnetoOpticId = "tgg";
const WAVELENGTH_MIN_NM = 250;
const WAVELENGTH_MAX_NM = 2000;
const FIELD_MIN_T = 0.001;
const FIELD_MAX_T = 20;
const LENGTH_MIN_MM = 0.1;
const LENGTH_MAX_MM = 200;
const YIG_WAVELENGTH_NM = 1550;
const CHART_POINTS = 120;
const DEG = Math.PI / 180;
const QUARTER_PI = Math.PI / 4;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");
const layout = (x: string, y: string, logY = false) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, gridcolor: "#374151", ...(logY ? { type: "log" } : {}) },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 320,
});
const rangeText = (id: MagnetoOpticId) => {
  const [lo, hi] = MAGNETO_OPTIC[id].range;
  return lo === hi ? `${Math.round(lo * 1e9)} nm only` : `${Math.round(lo * 1e9)}–${Math.round(hi * 1e9)} nm`;
};

function verdetChart(selected: MagnetoOpticId, lambda_nm: number, V: number) {
  const traces: Record<string, unknown>[] = CURVE_IDS.map((id) => {
    const [lo, hi] = MAGNETO_OPTIC[id].range.map((x) => x * 1e9);
    const nm = Array.from({ length: CHART_POINTS + 1 }, (_, k) => lo + (k * (hi - lo)) / CHART_POINTS);
    const pts = nm.map((x) => ({ x, y: Math.abs(MAGNETO_OPTIC[id].verdet(x * 1e-9)) })).filter((p) => Number.isFinite(p.y) && p.y > 0);
    return { x: pts.map((p) => round6(p.x)), y: pts.map((p) => round6(p.y)), type: "scatter", mode: "lines", name: MAGNETO_OPTIC[id].name, line: { color: COLORS[id], width: 2 } };
  });
  if (selected !== "yig" && Number.isFinite(V) && V !== 0) {
    traces.push({ x: [round6(lambda_nm)], y: [round6(Math.abs(V))], type: "scatter", mode: "markers", name: "selected", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } });
  }
  return traces;
}

export default function MagnetoOpticPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 633); // nm
  const [fieldRaw, setField] = useURLState("fieldStrength", 0.5); // T
  const [lengthRaw, setLength] = useURLState("length", 20); // mm
  const material = (IDS as readonly string[]).includes(materialParam) ? (materialParam as MagnetoOpticId) : DEFAULT_ID;
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 633);
  const field = clamp(fieldRaw, FIELD_MIN_T, FIELD_MAX_T, 0.5);
  const length_mm = clamp(lengthRaw, LENGTH_MIN_MM, LENGTH_MAX_MM, 20);
  const lambda = wavelength_nm * 1e-9;
  const L = length_mm * 1e-3;
  const m = MAGNETO_OPTIC[material];
  const yig = m.kind === "ferrimagnetic";

  const choose = (id: MagnetoOpticId) => {
    setMaterial(id);
    if (id === "yig") setWavelength(YIG_WAVELENGTH_NM);
  };

  const V = verdetConstant(material, lambda);
  const [lo, hi] = m.range;
  const inRange = lambda >= lo * (1 - 1e-9) && lambda <= hi * (1 + 1e-9);
  const rotation_deg = (yig ? faradayRotation(V, 1, L) : faradayRotation(V, field, L)) / DEG;
  const field45 = yig ? NaN : fieldForRotation(V, L, QUARTER_PI);
  const length45_mm = (yig ? lengthForRotation(V, 1, QUARTER_PI) : lengthForRotation(V, field, QUARTER_PI)) * 1e3;
  const chart = verdetChart(material, wavelength_nm, V);
  const outside = "outside the fit range";
  const nonReciprocal = "non-reciprocal: a return pass doubles it, so an isolator's 45° becomes 90° and the input polarizer blocks the return";

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6" role="group" aria-label="Material">
        {IDS.map((id) => (
          <button key={id} onClick={() => choose(id)} aria-pressed={material === id}
            className={`px-3 py-2 rounded text-sm ${material === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {MAGNETO_OPTIC[id].name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <ValidatedNumberInput label="Magnetic field B (T)" value={fieldRaw} onChange={setField} min={FIELD_MIN_T} max={FIELD_MAX_T} step="0.01" />
        <ValidatedNumberInput label="Length L (mm)" value={lengthRaw} onChange={setLength} min={LENGTH_MIN_MM} max={LENGTH_MAX_MM} step="0.5" />
      </div>
      <p className="text-xs mb-6 text-gray-500">
        {m.kind}; {m.source}; fit range {rangeText(material)}.{" "}
        {!inRange && <span className="text-yellow-400">The wavelength is outside the fit range.</span>}
      </p>

      {yig ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <ResultCard label="Saturated rotation |θ/L|" value={Number.isFinite(V) ? `${sig(V, 4)} rad/m` : "—"} tone="blue"
              subtext={Number.isFinite(V) ? `${sig(V / DEG / 1e3, 4)} °/mm; ferrimagnetic, not a Verdet constant` : outside} />
            <ResultCard label={`Rotation of ${length_mm} mm`} value={Number.isFinite(rotation_deg) ? `${fmt(rotation_deg, 2)}°` : "—"} tone="green"
              subtext={Number.isFinite(rotation_deg) ? "above saturation; independent of B" : outside} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <ResultCard label="Field for 45° at this length" value="—" tone="orange" subtext="saturated: set by length" />
            <ResultCard label="Length for 45°" value={Number.isFinite(length45_mm) ? `${sig(length45_mm, 4)} mm` : "—"} tone="purple"
              subtext={Number.isFinite(length45_mm) ? nonReciprocal : outside} />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <ResultCard label="Verdet constant V" value={Number.isFinite(V) ? `${sig(V, 4)} rad/(T·m)` : "—"} tone="blue"
              subtext={Number.isFinite(V) ? (V < 0 ? "paramagnetic: negative" : "diamagnetic: positive") : outside} />
            <ResultCard label="Faraday rotation θ = V·B·L" value={Number.isFinite(rotation_deg) ? `${fmt(rotation_deg, 3)}°` : "—"} tone="green"
              subtext={Number.isFinite(rotation_deg) ? nonReciprocal : outside} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <ResultCard label="Field for 45° at this length" value={Number.isFinite(field45) ? `${sig(field45, 4)} T` : "—"} tone="orange"
              subtext={Number.isFinite(field45) ? undefined : outside} />
            <ResultCard label="Length for 45° at this field" value={Number.isFinite(length45_mm) ? `${sig(length45_mm, 4)} mm` : "—"} tone="purple"
              subtext={Number.isFinite(length45_mm) ? undefined : outside} />
          </div>
        </>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Verdet constant against wavelength</h3>
        <ChartPanel data={chart} layout={layout("Wavelength (nm)", "|V| (rad/(T·m))", true)} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Materials at {wavelength_nm} nm</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-4 py-1">Material</th><th className="pr-4 py-1">V (rad/(T·m))</th><th className="pr-4 py-1">Kind</th>
              <th className="pr-4 py-1">Range</th><th className="py-1">Source</th>
            </tr>
          </thead>
          <tbody>
            {IDS.map((id) => {
              const v = verdetConstant(id, lambda);
              return (
                <tr key={id} onClick={() => choose(id)} className={`cursor-pointer hover:bg-gray-800 ${id === material ? "bg-gray-800" : ""}`}>
                  <td className="pr-4 py-1"><span style={{ color: COLORS[id] }}>{MAGNETO_OPTIC[id].name}</span></td>
                  <td className="pr-4 py-1">{Number.isFinite(v) ? sig(v, 4) : "—"}{id === "yig" && Number.isFinite(v) ? " rad/m" : ""}</td>
                  <td className="pr-4 py-1 text-gray-300">{MAGNETO_OPTIC[id].kind}</td>
                  <td className="pr-4 py-1 text-gray-300">{rangeText(id)}</td>
                  <td className="py-1 text-gray-400">{MAGNETO_OPTIC[id].source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Click a row to select the material.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">θ = V B L</p>
          <p>
            Sign convention (Vojna et al.): V &lt; 0 when the medium rotates the polarization clockwise for light propagating
            along B. Tb³⁺ and Ce³⁺ paramagnets are negative, diamagnetic glass is positive. The rotation does not reverse with
            the beam, so a round trip doubles it.
          </p>
          <p className="font-mono">|V| = F λ₀²/(λ² − λ₀²) + G</p>
          <p>
            Single-transition fit of Vojna et al. 2019: TGG F 820.3 rad/(T·m), G −6.2, λ₀ 239.3 nm; TSAG F 756.7, λ₀ 262 nm;
            CeF₃ F 743.6, λ₀ 239 nm, stopped at 700 nm because it underestimates 1064 nm by 15 %. Fused silica uses
            V = α/(λ² − λ₀²) + β (Tran et al. 2024), fitted to 310 ± 3 °/(T·m) at 532 nm.
          </p>
          <p>
            YIG is ferrimagnetic: its rotation saturates (304 rad/m at 1550 nm) and stops growing with B, so the field input has
            no effect on it.
          </p>
        </div>
      </div>
    </>
  );
}
