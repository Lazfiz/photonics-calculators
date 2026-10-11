"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CrystalNote, CrystalSelect, isCrystalId, resolveIndices } from "../../../components/crystal-select";
import { fix } from "../../../components/polarization-format";
import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS } from "../../../physics/materials/uniaxial-data";
import { glanWindow, splitterAngles, type SplitterType } from "../../../physics/polarization/prism-polarizers";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const deg = (rad: number, digits = 2) => (Number.isFinite(rad) ? `${fix(rad / DEG, digits)}°` : "—");

type Design = "glan" | SplitterType;
const DESIGNS: Record<Design, { label: string; text: string }> = {
  glan: {
    label: "Glan-Taylor",
    text: "Air-spaced Glan-Taylor: the higher-index ray is totally reflected at the gap, the other passes undeviated. One output beam.",
  },
  wollaston: {
    label: "Wollaston",
    text: "Optic axes along x then y (both across the beam): the two polarizations leave on either side of the axis.",
  },
  rochon: {
    label: "Rochon",
    text: "Optic axis along the beam in the first wedge, along y in the second: p leaves undeviated, s is deviated.",
  },
  senarmont: {
    label: "Sénarmont",
    text: "Optic axis along the beam in the first wedge, along x in the second: s leaves undeviated, p is deviated.",
  },
};
const isDesign = (v: string): v is Design => v in DESIGNS;

export default function BirefringentPolarizerPage() {
  const [material, setMaterial] = useURLState("crystal", "calcite");
  const [customNo, setCustomNo] = useURLState("nO", 1.658);
  const [customNe, setCustomNe] = useURLState("nE", 1.486);
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelength", 589);
  const [angleIn, setPrismAngleDeg] = useURLState("prismAngleDeg", 20);
  const [designIn, setDesign] = useURLState("type", "wollaston");

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const design: Design = isDesign(designIn) ? designIn : "wollaston";
  const lambda = clamp(wavelengthNm, 200, 7000) * 1e-9;
  const alpha = clamp(angleIn, 1, 80) * DEG;
  const cNo = clamp(customNo, 1, 5);
  const cNe = clamp(customNe, 1, 5);

  const { no, ne } = resolveIndices(material, lambda, cNo, cNe);
  const split = design === "glan" ? null : splitterAngles(design, no, ne, alpha);
  const glan = design === "glan" ? glanWindow({ no, ne, hypotenuse: alpha, gapIndex: 1, axis: "in-plane" }) : null;

  const angleChart = useMemo(() => {
    const a = Array.from({ length: 159 }, (_, i) => 1 + i * 0.5);
    if (design === "glan") {
      const w = a.map((x) => glanWindow({ no, ne, hypotenuse: x * DEG, gapIndex: 1, axis: "in-plane" }));
      return [
        { x: a, y: w.map((v) => v.upper / DEG), type: "scatter" as const, mode: "lines" as const, name: "Upper edge", line: { color: "#f87171", width: 2 } },
        { x: a, y: w.map((v) => v.lower / DEG), type: "scatter" as const, mode: "lines" as const, name: "Lower edge", line: { color: "#60a5fa", width: 2 } },
      ];
    }
    const s = a.map((x) => splitterAngles(design, no, ne, x * DEG));
    return [
      { x: a, y: s.map((v) => v.separation / DEG), type: "scatter" as const, mode: "lines" as const, name: "Exact", line: { color: "#60a5fa", width: 2 } },
      { x: a, y: s.map((v) => v.smallAngle / DEG), type: "scatter" as const, mode: "lines" as const, name: design === "wollaston" ? "2|Δn| tan α" : "|Δn| tan α", line: { color: "#9ca3af", dash: "dash" } },
    ];
  }, [design, no, ne]);

  const materialChart = useMemo(() => {
    const ids = CRYSTAL_IDS;
    return [{
      x: ids.map((id) => UNIAXIAL_CRYSTALS[id].name),
      y: ids.map((id) => {
        const n = resolveIndices(id, lambda, NaN, NaN);
        return Math.abs(n.ne - n.no);
      }),
      type: "bar" as const, name: "|Δn|", marker: { color: "#60a5fa" },
    }];
  }, [lambda]);

  const layout = (x: string, y: string) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: x, gridcolor: "#374151" },
    yaxis: { title: y, gridcolor: "#374151" },
    margin: { t: 20, r: 20, b: 60, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>Each face conserves the tangential wave vector; in a uniaxial crystal the wave takes the normal component its index surface allows.</p>
        <p>Wollaston: n₁ sin α = n₂ sin β, &nbsp;sin ε = n₂ sin(β − α); &nbsp;split ≈ 2|Δn| tan α</p>
        <p>Glan: the higher-index ray is totally reflected when k<sub>t</sub> ≥ 1 at the gap</p>
      </div>

      <div role="group" aria-label="Design" className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(DESIGNS) as Design[]).map((t) => (
          <button key={t} onClick={() => setDesign(t)} className={`text-sm px-4 py-2 rounded ${design === t ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}>
            {DESIGNS[t].label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <CrystalSelect value={material} onChange={setMaterial} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={200} max={7000} step="1" />
        <ValidatedNumberInput label={design === "glan" ? "Hypotenuse angle (°)" : "Wedge angle α (°)"} value={angleIn} onChange={setPrismAngleDeg} min={1} max={80} step="0.5" />
        {!isCrystalId(material) && (
          <>
            <ValidatedNumberInput label={<>n<sub>o</sub></>} value={customNo} onChange={setCustomNo} min={1} max={5} step="0.001" />
            <ValidatedNumberInput label={<>n<sub>e</sub></>} value={customNe} onChange={setCustomNe} min={1} max={5} step="0.001" />
          </>
        )}
      </div>
      <CrystalNote material={material} lambda={lambda} />
      <p className="text-sm text-gray-300 mb-6">{DESIGNS[design].text} Normal incidence on the entrance face; s is polarized along y (across the plane of the drawing), p in it.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n<sub>o</sub> / n<sub>e</sub></p>
          <p className="text-xl font-bold text-blue-400">{fix(no, 5)} / {fix(ne, 5)}</p>
          <p className="text-xs text-gray-500">Δn = {fix(ne - no, 5)}</p>
        </div>
        {split && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Exit angles in air</p>
              <p className="text-sm font-mono text-gray-200">s: {deg(split.s, 3)}</p>
              <p className="text-sm font-mono text-gray-200">p: {deg(split.p, 3)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Angle between the beams</p>
              <p className="text-2xl font-bold text-yellow-400">{deg(split.separation, 3)}</p>
              <p className="text-xs text-gray-500">first-order estimate {deg(split.smallAngle, 3)} ({fix((split.smallAngle / split.separation - 1) * 100, 2)} %)</p>
            </div>
          </>
        )}
        {glan && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Polarizing window (external angle)</p>
              <p className="text-xl font-bold text-green-400">{deg(glan.lower)} … {deg(glan.upper)}</p>
              <p className="text-xs text-gray-500">{glan.axialPolarized ? "includes the axial ray" : "the axial ray is not polarized"}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Symmetric half-field</p>
              <p className="text-2xl font-bold text-yellow-400">±{deg(glan.halfField)}</p>
              <p className="text-xs text-gray-500">more on the Glan prism page</p>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">{design === "glan" ? "Window edges against the hypotenuse angle" : "Beam separation against the wedge angle"}</h3>
          <ChartPanel data={angleChart} layout={layout(design === "glan" ? "Hypotenuse angle (°)" : "Wedge angle α (°)", design === "glan" ? "External angle (°)" : "Separation (°)")} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">|Δn| of the listed crystals at {fix(lambda * 1e9, 0)} nm</h3>
          <ChartPanel data={materialChart} layout={layout("", "|Δn|")} />
        </div>
      </div>
    </>
  );
}
