"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CrystalNote, CrystalSelect, isCrystalId, materialRange, resolveIndices } from "../../../components/crystal-select";
import { fix } from "../../../components/polarization-format";
import {
  glanBalancedHypotenuse, glanWaves, glanWindow, type GlanAxis, type GlanFailure, type GlanPrism,
} from "../../../physics/polarization/prism-polarizers";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const deg = (rad: number, digits = 2) => (Number.isFinite(rad) ? `${fix(rad / DEG, digits)}°` : "—");

type PrismType = "taylor" | "foucault" | "thompson";
const TYPES: Record<PrismType, { label: string; axis: GlanAxis; air: boolean; hypotenuse: number }> = {
  taylor: { label: "Glan-Taylor (air, axis in the plane)", axis: "in-plane", air: true, hypotenuse: 38.5 },
  foucault: { label: "Glan-Foucault (air, axis ⟂ plane)", axis: "perpendicular", air: true, hypotenuse: 38.5 },
  thompson: { label: "Glan-Thompson (cement, axis ⟂ plane)", axis: "perpendicular", air: false, hypotenuse: 71.6 },
};
const isType = (v: string): v is PrismType => v in TYPES;

const LIMIT_TEXT: Record<GlanFailure, string> = {
  leaks: "the reflected ray starts to leak through",
  blocked: "the passed ray starts to be totally reflected",
  grazing: "the ray no longer reaches the hypotenuse",
};

/** Tangential wave vector of the o and e waves at the hypotenuse against the external angle, −30° to 30°. */
function ktCurves(p: GlanPrism) {
  const phi = Array.from({ length: 241 }, (_, i) => -30 + i * 0.25);
  const waves = phi.map((x) => glanWaves(p, x * DEG));
  const kt = (h: { kt: number; reaches: boolean }) => (h.reaches ? h.kt : NaN);
  return [
    { x: phi, y: waves.map((v) => kt(v.o)), type: "scatter" as const, mode: "lines" as const, name: "o wave kₜ", line: { color: "#60a5fa", width: 2 } },
    { x: phi, y: waves.map((v) => kt(v.e)), type: "scatter" as const, mode: "lines" as const, name: "e wave kₜ", line: { color: "#f87171", width: 2 } },
    { x: [-30, 30], y: [p.gapIndex, p.gapIndex], type: "scatter" as const, mode: "lines" as const, name: "Gap index (TIR above)", line: { color: "#fbbf24", dash: "dash" } },
  ];
}

/** Window edges against wavelength over the crystal fit range (clipped to 250–3000 nm). */
function windowSpectrum(material: string, cNo: number, cNe: number, hypotenuse: number, gapIndex: number, axis: GlanAxis) {
  const [lo, hi] = materialRange(material, [300e-9, 2000e-9]);
  const a = Math.max(lo, 250e-9), b = Math.min(hi, 3000e-9);
  const l = Array.from({ length: 120 }, (_, i) => a + ((b - a) * i) / 119);
  const windows = l.map((x) => {
    const n = resolveIndices(material, x, cNo, cNe);
    return glanWindow({ no: n.no, ne: n.ne, hypotenuse, gapIndex, axis });
  });
  const nm = l.map((x) => x * 1e9);
  return [
    { x: nm, y: windows.map((v) => v.upper / DEG), type: "scatter" as const, mode: "lines" as const, name: "Upper edge", line: { color: "#f87171", width: 2 } },
    { x: nm, y: windows.map((v) => v.lower / DEG), type: "scatter" as const, mode: "lines" as const, name: "Lower edge", line: { color: "#60a5fa", width: 2 } },
  ];
}

export default function GlansPrismPage() {
  const [material, setMaterial] = useURLState("crystal", "calcite");
  const [customNo, setCustomNo] = useURLState("nO", 1.658);
  const [customNe, setCustomNe] = useURLState("nE", 1.486);
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelength", 589);
  const [cutIn, setCutAngleDeg] = useURLState("cutAngleDeg", 38.5);
  const [typeIn, setType] = useURLState("type", "taylor");
  const [cementIn, setCement] = useURLState("cementIndex", 1.55);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const type: PrismType = isType(typeIn) ? typeIn : "taylor";
  const lambda = clamp(wavelengthNm, 200, 7000) * 1e-9;
  const hypotenuse = clamp(cutIn, 10, 85) * DEG;
  const cement = clamp(cementIn, 1.3, 1.8);
  const cNo = clamp(customNo, 1, 5);
  const cNe = clamp(customNe, 1, 5);
  const { axis, air } = TYPES[type];
  const gapIndex = air ? 1 : cement;

  const { no, ne } = resolveIndices(material, lambda, cNo, cNe);
  const prism = { no, ne, hypotenuse, gapIndex, axis };
  const w = glanWindow(prism);
  const balanced = glanBalancedHypotenuse({ no, ne, gapIndex, axis });
  const positive = ne > no;
  const passed = positive ? "o" : "e";

  const ktChart = ktCurves(prism);
  const spectralChart = windowSpectrum(material, cNo, cNe, hypotenuse, gapIndex, axis);

  const layout = (x: string, y: string) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: x, gridcolor: "#374151" },
    yaxis: { title: y, gridcolor: "#374151" },
    margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>sin φ = k<sub>x</sub> (air) → o and e waves in the crystal; at the hypotenuse k<sub>t</sub> = k<sub>x</sub> cos θ<sub>h</sub> + k<sub>z</sub> sin θ<sub>h</sub></p>
        <p>total internal reflection when k<sub>t</sub> ≥ n<sub>gap</sub>; polarized: the higher-index wave reflected, the other transmitted</p>
        <p>length/aperture L/A = tan θ<sub>h</sub></p>
      </div>

      <div role="group" aria-label="Prism type" className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(TYPES) as PrismType[]).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setCutAngleDeg(TYPES[t].hypotenuse); }}
            className={`text-sm px-4 py-2 rounded ${type === t ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}
          >
            {TYPES[t].label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <CrystalSelect value={material} onChange={setMaterial} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={200} max={7000} step="1" />
        <ValidatedNumberInput label={<>Hypotenuse angle θ<sub>h</sub> (°)</>} value={cutIn} onChange={setCutAngleDeg} min={10} max={85} step="0.1" />
        {!air && <ValidatedNumberInput label="Cement index" value={cementIn} onChange={setCement} min={1.3} max={1.8} step="0.01" />}
        {!isCrystalId(material) && (
          <>
            <ValidatedNumberInput label={<>n<sub>o</sub></>} value={customNo} onChange={setCustomNo} min={1} max={5} step="0.001" />
            <ValidatedNumberInput label={<>n<sub>e</sub></>} value={customNe} onChange={setCustomNe} min={1} max={5} step="0.001" />
          </>
        )}
      </div>
      <CrystalNote material={material} lambda={lambda} />

      <p className="text-xs text-gray-500 mb-4">
        θ<sub>h</sub> is the axial ray&apos;s angle of incidence on the hypotenuse (the angle between hypotenuse and entrance
        face). φ is the ray&apos;s angle in air from the entrance-face normal, in the plane of incidence of the hypotenuse;
        φ &gt; 0 meets the hypotenuse more steeply. The optic axis is parallel to the entrance face.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {Number.isFinite(balanced) && (
          <button onClick={() => setCutAngleDeg(Math.round((balanced / DEG) * 100) / 100)} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">
            Balanced θₕ ({fix(balanced / DEG, 2)}°): window centred on the axis
          </button>
        )}
      </div>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n<sub>o</sub> / n<sub>e</sub></p>
          <p className="text-xl font-bold text-blue-400">{fix(no, 5)} / {fix(ne, 5)}</p>
          <p className="text-xs text-gray-500">critical angles {deg(Math.asin(gapIndex / no))} (o), {deg(Math.asin(gapIndex / ne))} (e, axial); passes the {passed} ray</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Polarizing window (external φ)</p>
          <p className="text-xl font-bold text-green-400">{deg(w.lower)} … {deg(w.upper)}</p>
          <p className="text-xs text-gray-500">full width {deg(w.upper - w.lower)}{w.axialPolarized ? "" : "; the axial ray is not polarized"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Symmetric half-field</p>
          <p className="text-2xl font-bold text-yellow-400">±{deg(w.halfField)}</p>
          <p className="text-xs text-gray-500">lower edge: {w.lowerLimit ? LIMIT_TEXT[w.lowerLimit] : "—"}; upper: {w.upperLimit ? LIMIT_TEXT[w.upperLimit] : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Length / aperture</p>
          <p className="text-2xl font-bold text-purple-400">{fix(Math.tan(hypotenuse), 3)}</p>
          <p className="text-xs text-gray-500">per prism pair, L/A = tan θ<sub>h</sub></p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Tangential wave vector at the hypotenuse against φ</h3>
          <ChartPanel data={ktChart} layout={layout("External angle φ (°)", "kₜ (units of k₀)")} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Window edges against wavelength (this θ<sub>h</sub>)</h3>
          <ChartPanel data={spectralChart} layout={layout("Wavelength (nm)", "External angle (°)")} />
        </div>
      </div>
    </>
  );
}
