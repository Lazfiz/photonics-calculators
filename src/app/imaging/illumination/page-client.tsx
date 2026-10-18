"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { objectFieldDiameter } from "../../../physics/imaging/field-of-view";
import { abbePeriodLimit, apertureDiameter, rayleighCondenserResolution } from "../../../physics/imaging/microscope";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const mm = 1e-3;
const nm = 1e-9;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function IlluminationPage() {
  const [objMagRaw, setObjMag] = useURLState("objMag", 40);
  const [objNaRaw, setObjNa] = useURLState("objNa", 0.95);
  const [tubeFocalRaw, setTubeFocal] = useURLState("tubeFocal", 200);
  const [condNaRaw, setCondNa] = useURLState("condenserNa", 0.9);
  const [condFocalRaw, setCondFocal] = useURLState("condenserFocal", 12);
  const [fieldNumberRaw, setFieldNumber] = useURLState("fieldNumber", 20);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550);
  const Mobj = clamp(objMagRaw, 1, 200, 40);
  const naObj = clamp(objNaRaw, 0.01, 1.7, 0.95);
  const fTubeMm = clamp(tubeFocalRaw, 50, 400, 200);
  const naCond = clamp(condNaRaw, 0, 1.4, 0.9);
  const fCondMm = clamp(condFocalRaw, 2, 100, 12);
  const fnMm = clamp(fieldNumberRaw, 1, 30, 20);
  const lambdaNm = clamp(wavelengthRaw, 200, 2000, 550);

  const fObjMm = fTubeMm / Mobj;
  const fovUm = objectFieldDiameter(fnMm * mm, Mobj) / 1e-6;
  const backApertureMm = apertureDiameter(fObjMm * mm, naObj) / mm;
  const ratio = naCond / naObj;
  const irisImageMm = backApertureMm * Math.min(ratio, 1);
  const irisMm = apertureDiameter(fCondMm * mm, naCond) / mm;
  const abbeNm = abbePeriodLimit(lambdaNm * nm, naObj, naCond) / nm;
  const rayleighNm = rayleighCondenserResolution(lambdaNm * nm, naObj, naCond) / nm;
  const advice = ratio > 1
    ? "The condenser cone is wider than the objective accepts: the excess adds glare, not resolution."
    : ratio > 0.8
      ? "Above the usual 0.7–0.8: close to full resolution, but low contrast and more glare."
      : ratio >= 0.7
        ? "Within the usual 0.7–0.8 setting."
        : "Below 0.7: more contrast and depth of field, lower resolution and visible diffraction fringes.";

  const ratios = Array.from({ length: 151 }, (_, k) => k * 0.01);
  const chart = [
    { x: ratios, y: ratios.map((r) => abbePeriodLimit(lambdaNm * nm, naObj, r * naObj) / nm), type: "scatter" as const, mode: "lines" as const, name: "Abbe period λ/(NA_obj + NA_c)", line: { color: "#60a5fa" } },
    { x: ratios, y: ratios.map((r) => rayleighCondenserResolution(lambdaNm * nm, naObj, r * naObj) / nm), type: "scatter" as const, mode: "lines" as const, name: "Rayleigh 1.22λ/(NA_obj + NA_c)", line: { color: "#34d399" } },
    { x: [ratio, ratio], y: [abbeNm, rayleighNm], type: "scatter" as const, mode: "markers" as const, name: "Current condenser", marker: { color: "#f87171", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Objective magnification (×)" value={objMagRaw} onChange={setObjMag} min={1} max={200} step="any" />
          <ValidatedNumberInput label="Objective NA" value={objNaRaw} onChange={setObjNa} min={0.01} max={1.7} step="0.01" />
          <ValidatedNumberInput label="Tube lens focal length (mm)" value={tubeFocalRaw} onChange={setTubeFocal} min={50} max={400} step="any" />
          <ValidatedNumberInput label="Condenser NA (aperture diaphragm setting)" value={condNaRaw} onChange={setCondNa} min={0} max={1.4} step="0.01" />
          <ValidatedNumberInput label="Condenser focal length (mm)" value={condFocalRaw} onChange={setCondFocal} min={2} max={100} step="any" />
          <ValidatedNumberInput label="Eyepiece field number (mm)" value={fieldNumberRaw} onChange={setFieldNumber} min={1} max={30} step="any" />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step="any" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Field of view FN/M (field diaphragm to open to)", fmt(fovUm, 0, " µm"), "text-blue-400")}
          {row("Objective focal length f_TL/M", fmt(fObjMm, 2, " mm"))}
          {row("Objective back aperture 2·f_obj·NA", fmt(backApertureMm, 2, " mm"))}
          {row("Condenser iris image in it", `${fmt(irisImageMm, 2, " mm")} (${fmt(100 * Math.min(ratio, 1), 0, " %")})`, "text-yellow-400")}
          {row("Condenser iris diameter 2·f_c·NA_c", fmt(irisMm, 1, " mm"))}
          {row("Usual condenser NA, 0.7–0.8 × NA_obj", `${fmt(0.7 * naObj, 2)}–${fmt(0.8 * naObj, 2)}`, "text-green-400")}
          {row("Abbe period limit λ/(NA_obj + NA_c)", fmt(abbeNm, 1, " nm"), "text-purple-400")}
          {row("Rayleigh rule of thumb 1.22λ/(NA_obj + NA_c)", fmt(rayleighNm, 1, " nm"), "text-purple-400")}
          <p className="text-sm text-gray-300">{advice}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Resolution vs condenser aperture</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "NA_c / NA_obj", gridcolor: "#333" }, yaxis: { title: "Resolution (nm)", gridcolor: "#333" },
          margin: { l: 60, r: 20, t: 20, b: 60 }, showlegend: true,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>Field of view = FN / M_obj; pupil diameters 2·f·NA (Abbe sine condition)</p>
          <p>d = λ / (NA_obj + NA_c), or 1.22λ / (NA_obj + NA_c) as a two-point rule of thumb, NA_c ≤ NA_obj</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Köhler illumination images the lamp into the condenser aperture diaphragm, which is in turn imaged into the
          objective&apos;s back focal plane, and images the field diaphragm onto the specimen. Open the field diaphragm
          just past the field of view; the aperture diaphragm sets the condenser NA, usually 0.7–0.8 of the
          objective&apos;s, a trade between resolution and contrast. Condenser light beyond the objective NA misses the
          objective unless the specimen scatters it, as in darkfield, so in brightfield it adds glare and no
          resolution. A closed condenser (NA_c → 0) gives
          coherent illumination and the Abbe limit λ/NA_obj. The 1.22 form is the Rayleigh criterion only at
          NA_c = NA_obj (0.61λ/NA, incoherent); with coherent light two-point resolution depends on their relative phase.
        </p>
      </div>
    </>
  );
}
