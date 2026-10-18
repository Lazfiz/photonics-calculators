"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { exitPupilDiameter, totalMag, usefulMagRange } from "../../../physics/imaging/microscope";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const mm = 1e-3;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function PupilMatchingPage() {
  const [naRaw, setNa] = useURLState("objectiveNA", 0.75);
  const [objMagRaw, setObjMag] = useURLState("objectiveMag", 40);
  const [eyepieceRaw, setEyepiece] = useURLState("eyepieceMag", 10);
  const [eyePupilRaw, setEyePupil] = useURLState("eyePupil", 4);
  const na = clamp(naRaw, 0.01, 1.7, 0.75);
  const Mobj = clamp(objMagRaw, 1, 200, 40);
  const Meye = clamp(eyepieceRaw, 1, 30, 10);
  const eyePupilMm = clamp(eyePupilRaw, 1, 8, 4);

  const M = totalMag(Mobj, Meye);
  const pupilMm = exitPupilDiameter(na, M) / mm;
  const useful = usefulMagRange(na);
  const eyepieceRange = { min: useful.min / Mobj, max: useful.max / Mobj };
  const filled = Math.min(1, pupilMm / eyePupilMm);
  const verdict = pupilMm > 1
    ? "larger than 1 mm: magnification below 500·NA, the eye cannot resolve all the detail the objective passes"
    : pupilMm < 0.5
      ? "smaller than 0.5 mm: magnification above 1000·NA is empty"
      : "between 0.5 and 1 mm: the useful range";

  const nas = Array.from({ length: 171 }, (_, k) => 0.01 + k * 0.01);
  const chart = [
    { x: nas, y: nas.map((a) => exitPupilDiameter(a, M) / mm), type: "scatter" as const, mode: "lines" as const, name: `Exit pupil at ${fmt(M, 0)}×`, line: { color: "#60a5fa" } },
    { x: [0.01, 1.71], y: [1, 1], type: "scatter" as const, mode: "lines" as const, name: "1 mm (M = 500·NA)", line: { color: "#34d399", dash: "dash" } },
    { x: [0.01, 1.71], y: [0.5, 0.5], type: "scatter" as const, mode: "lines" as const, name: "0.5 mm (M = 1000·NA)", line: { color: "#fbbf24", dash: "dash" } },
    { x: [na], y: [pupilMm], type: "scatter" as const, mode: "markers" as const, name: "Current objective", marker: { color: "#f87171", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Objective NA" value={naRaw} onChange={setNa} min={0.01} max={1.7} step="0.01" />
          <ValidatedNumberInput label="Objective magnification (×)" value={objMagRaw} onChange={setObjMag} min={1} max={200} step="any" />
          <ValidatedNumberInput label="Eyepiece magnification (×)" value={eyepieceRaw} onChange={setEyepiece} min={1} max={30} step="any" />
          <ValidatedNumberInput label="Eye pupil diameter (mm)" value={eyePupilRaw} onChange={setEyePupil} min={1} max={8} step="0.5" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Visual magnification M_obj · M_eye", fmt(M, 0, "×"))}
          {row("Exit pupil 500 mm · NA / M", fmt(pupilMm, 3, " mm"), "text-blue-400")}
          {row("Useful magnification 500–1000 × NA", `${fmt(useful.min, 0)}–${fmt(useful.max, 0)}×`, "text-green-400")}
          {row("Eyepieces for the useful range", `${fmt(eyepieceRange.min, 1)}–${fmt(eyepieceRange.max, 1)}×`, "text-yellow-400")}
          {row("Share of the eye pupil diameter used", fmt(100 * filled, 0, " %"))}
          <p className="text-sm text-purple-400">Exit pupil {verdict}.</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Exit pupil vs objective NA</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Objective NA", gridcolor: "#333" }, yaxis: { title: "Exit pupil (mm)", gridcolor: "#333" },
          margin: { l: 60, r: 20, t: 20, b: 60 }, showlegend: true,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>Back aperture 2·f_obj·NA, imaged by f_eye/f_TL: D = 2·f_obj·NA·f_eye/f_TL</p>
          <p>With M_obj = f_TL/f_obj and M_eye = 250 mm/f_eye: D = 500 mm · NA / (M_obj · M_eye)</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          The tube lens focal length cancels, so the marked magnifications and the NA fix the exit pupil. It is usually
          far smaller than the eye pupil (0.5–1 mm in the useful range against 2–8 mm); at low magnification (2×/0.1
          with a 10× eyepiece: 2.5 mm) it can exceed a daylight eye pupil, which then clips it. While the exit pupil is
          the smaller, retinal image brightness scales as (NA/M)², its square. An exit pupil above about 1 mm wastes
          resolution because the eye, not the objective, limits it.
        </p>
      </div>
    </>
  );
}
