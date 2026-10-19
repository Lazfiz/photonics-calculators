"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { inoueDepthOfField } from "../../../physics/imaging/optical-sectioning-thickness";
import { chiefRayAngle, magnificationChange, pupilDistanceFromSlope } from "../../../physics/imaging/telecentric";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const mm = 1e-3;
const um = 1e-6;
const nm = 1e-9;
const deg = Math.PI / 180;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function TelecentricityPage() {
  const [magRaw, setMagnification] = useURLState("magnification", 0.5);
  const [naRaw, setNa] = useURLState("na", 0.025);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550);
  const [blurRaw, setBlur] = useURLState("blur", 10);
  const [fieldRaw, setField] = useURLState("fieldHeight", 5);
  const [pupilRaw, setPupil] = useURLState("pupilDistance", 200);
  const [dzRaw, setDz] = useURLState("dz", 10);
  const [slopeRaw, setSlope] = useURLState("slope", 0.1);
  const m = clamp(magRaw, 0.01, 10, 0.5);
  const na = clamp(naRaw, 0.001, 0.5, 0.025);
  const wavelengthNm = clamp(wavelengthRaw, 200, 2000, 550);
  const blurUm = clamp(blurRaw, 0.5, 100, 10);
  const hMm = clamp(fieldRaw, 0.1, 200, 5);
  const sEPMm = clamp(pupilRaw, 10, 10000, 200);
  const dzMm = clamp(dzRaw, -50, 50, 10);
  const slopeDeg = clamp(slopeRaw, -2, 2, 0.1);

  const teleSMm = pupilDistanceFromSlope(hMm * mm, slopeDeg * deg) / mm;
  const ordinary = magnificationChange(dzMm * mm, sEPMm * mm);
  const telecentric = magnificationChange(dzMm * mm, teleSMm * mm);
  // Image-side shift of the field edge, m·h·Δm/m.
  const ordinaryShiftUm = (m * hMm * mm * ordinary) / um;
  const teleShiftUm = (m * hMm * mm * telecentric) / um;
  const chiefDeg = chiefRayAngle(hMm * mm, sEPMm * mm) / deg;
  const dof = inoueDepthOfField(wavelengthNm * nm, 1, na, blurUm * um, m);

  const span = Math.min(50, 0.9 * Math.min(sEPMm, Number.isFinite(teleSMm) ? Math.abs(teleSMm) : Infinity));
  const dzs = Array.from({ length: 101 }, (_, k) => -span + (2 * span * k) / 100);
  const chart = [
    { x: dzs, y: dzs.map((z) => 100 * magnificationChange(z * mm, sEPMm * mm)), type: "scatter" as const, mode: "lines" as const, name: `Ordinary lens, s_EP ${sEPMm} mm`, line: { color: "#f87171" } },
    { x: dzs, y: dzs.map((z) => 100 * magnificationChange(z * mm, teleSMm * mm)), type: "scatter" as const, mode: "lines" as const, name: `Telecentric, ${slopeDeg}° residual`, line: { color: "#60a5fa" } },
    { x: [dzMm, dzMm], y: [100 * ordinary, 100 * telecentric], type: "scatter" as const, mode: "markers" as const, name: "Current Δz", marker: { color: "#facc15", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Magnification |m|" value={magRaw} onChange={setMagnification} min={0.01} max={10} step="any" />
          <ValidatedNumberInput label="Object-side NA" value={naRaw} onChange={setNa} min={0.001} max={0.5} step="any" />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step="any" />
          <ValidatedNumberInput label="Acceptable blur at the sensor (µm)" value={blurRaw} onChange={setBlur} min={0.5} max={100} step="any" />
          <ValidatedNumberInput label="Object field height h (mm)" value={fieldRaw} onChange={setField} min={0.1} max={200} step="any" />
          <ValidatedNumberInput label="Ordinary lens: entrance pupil distance (mm)" value={pupilRaw} onChange={setPupil} min={10} max={10000} step="any" />
          <ValidatedNumberInput label="Object displacement Δz, + away (mm)" value={dzRaw} onChange={setDz} min={-50} max={50} step="any" />
          <ValidatedNumberInput label="Telecentric lens: residual slope at h (°)" value={slopeRaw} onChange={setSlope} min={-2} max={2} step="any" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Ordinary: chief ray at h, atan(h/s_EP)", fmt(chiefDeg, 3, "°"))}
          {row("Ordinary: Δm/m = −Δz/(s_EP + Δz)", fmt(100 * ordinary, 3, " %"), "text-red-400")}
          {row("Ordinary: edge image shift", fmt(ordinaryShiftUm, 2, " µm"), "text-red-400")}
          {row("Telecentric: equivalent pupil h/tan θ_t", Number.isFinite(teleSMm) ? fmt(teleSMm, 0, " mm") : "∞")}
          {row("Telecentric: Δm/m", fmt(100 * telecentric, 4, " %"), "text-blue-400")}
          {row("Telecentric: edge image shift", fmt(teleShiftUm, 2, " µm"), "text-blue-400")}
          {(Number.isNaN(ordinary) || Number.isNaN(telecentric)) && (
            <p className="text-sm text-yellow-400">— : the displacement would move the object through the entrance pupil.</p>
          )}
          {row("Depth of field, wave λ/NA²", fmt(dof.wave / mm, 3, " mm"))}
          {row("Depth of field, geometric e/(m·NA)", fmt(dof.detector / mm, 3, " mm"))}
          {row("Depth of field, total", fmt(dof.total / mm, 3, " mm"), "text-green-400")}
          <p className="text-xs text-gray-500">
            With the sensor fixed, an image point lands where its chief ray does, so a lens whose entrance pupil sits
            s_EP from the object changes magnification as the object moves. Telecentricity puts the pupil at infinity; a
            residual slope θ_t at the field edge acts like a distant pupil. A negative slope is hypercentric.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Magnification change vs object displacement</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Object displacement Δz (mm)", gridcolor: "#333" },
          yaxis: { title: "Δm/m (%)", gridcolor: "#333" },
          margin: { l: 70, r: 20, t: 20, b: 60 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
