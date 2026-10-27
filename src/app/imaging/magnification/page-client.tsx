"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { exitPupilDiameter, objectiveMag, totalMag, usefulMagRange } from "../../../physics/imaging/microscope";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const mm = 1e-3;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function MagnificationPage() {
  const [objFocalRaw, setObjFocal] = useURLState("objFocal", 10);
  const [tubeFocalRaw, setTubeFocal] = useURLState("tubeFocal", 200);
  const [adapterRaw, setAdapter] = useURLState("adapterMag", 0.5);
  const [eyepieceRaw, setEyepiece] = useURLState("eyepieceMag", 15);
  const [naRaw, setNa] = useURLState("na", 0.4);
  const fObjMm = clamp(objFocalRaw, 1, 100, 10);
  const fTubeMm = clamp(tubeFocalRaw, 50, 400, 200);
  const adapter = clamp(adapterRaw, 0.1, 5, 0.5);
  const eyepiece = clamp(eyepieceRaw, 1, 30, 15);
  const na = clamp(naRaw, 0.01, 1.7, 0.4);

  const Mobj = objectiveMag(fObjMm * mm, fTubeMm * mm);
  const Mcam = totalMag(Mobj, adapter);
  const Mvis = totalMag(Mobj, eyepiece);
  const useful = usefulMagRange(na);
  const pupilMm = exitPupilDiameter(na, Mvis) / mm;
  const verdict = Mvis < useful.min
    ? "below the useful range: the eye cannot resolve all the detail the objective passes"
    : Mvis > useful.max
      ? "above the useful range: empty magnification"
      : "within the useful range";

  const fs = Array.from({ length: 101 }, (_, k) => 10 ** (k / 50));
  const chart = [
    { x: fs, y: fs.map((f) => totalMag(objectiveMag(f * mm, fTubeMm * mm), eyepiece)), type: "scatter" as const, mode: "lines" as const, name: `Visual, ${eyepiece}× eyepiece`, line: { color: "#60a5fa" } },
    { x: fs, y: fs.map((f) => totalMag(objectiveMag(f * mm, fTubeMm * mm), adapter)), type: "scatter" as const, mode: "lines" as const, name: `Camera, ${adapter}× adapter`, line: { color: "#34d399" } },
    { x: [fObjMm, fObjMm], y: [Mcam, Mvis], type: "scatter" as const, mode: "markers" as const, name: "Current objective", marker: { color: "#f87171", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Objective focal length f_obj (mm)" value={objFocalRaw} onChange={setObjFocal} min={1} max={100} step="any" />
          <ValidatedNumberInput label="Tube lens focal length f_TL (mm)" value={tubeFocalRaw} onChange={setTubeFocal} min={50} max={400} step="any" />
          <ValidatedNumberInput label="Camera adapter magnification (×)" value={adapterRaw} onChange={setAdapter} min={0.1} max={5} step="any" />
          <ValidatedNumberInput label="Eyepiece magnification (×)" value={eyepieceRaw} onChange={setEyepiece} min={1} max={30} step="any" />
          <ValidatedNumberInput label="Objective NA" value={naRaw} onChange={setNa} min={0.01} max={1.7} step="0.01" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Objective magnification f_TL/f_obj", fmt(Mobj, 2, "×"), "text-blue-400")}
          {row("On the camera, M_obj × adapter", fmt(Mcam, 2, "×"), "text-green-400")}
          {row("Visual, M_obj × eyepiece", fmt(Mvis, 1, "×"), "text-yellow-400")}
          {row("Useful visual range 500–1000 × NA", `${fmt(useful.min, 0)}–${fmt(useful.max, 0)}×`)}
          {row("Exit pupil 500 mm · NA / M", fmt(pupilMm, 3, " mm"))}
          <p className="text-sm text-purple-400">Visual magnification {verdict}.</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Magnification vs objective focal length</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Objective focal length (mm)", type: "log", gridcolor: "#333" },
          yaxis: { title: "Magnification (×)", type: "log", gridcolor: "#333" },
          margin: { l: 70, r: 20, t: 20, b: 60 }, showlegend: true,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>M_obj = f_TL / f_obj; M_camera = M_obj · M_adapter; M_visual = M_obj · M_eyepiece</p>
          <p>Useful visual magnification 500·NA to 1000·NA; exit pupil 500 mm · NA / M_visual</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Infinity-corrected microscope: the tube lens forms the intermediate image. A C-mount camera adapter is a relay
          with its own magnification (0.35×, 0.5×, 0.63×, 1×), independent of the tube lens. An objective&apos;s marked
          magnification assumes its maker&apos;s tube lens (Nikon and Leica 200 mm, Olympus 180 mm, Zeiss 164.5 mm), so its
          focal length is that length divided by the marking; behind another tube lens it scales with f_TL. Eyepiece
          power refers to a 250 mm viewing distance. In the useful range the exit pupil is 0.5–1 mm.
        </p>
      </div>
    </>
  );
}
