"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { nyquistPixel, objectFieldDiameter, objectFov, pixelFootprint } from "../../../physics/imaging/field-of-view";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const mm = 1e-3;
const um = 1e-6;
const nm = 1e-9;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function FOVCalculatorPage() {
  const [sensorWRaw, setSensorW] = useURLState("sensorW", 13.336);
  const [sensorHRaw, setSensorH] = useURLState("sensorH", 10.016);
  const [magRaw, setMag] = useURLState("mag", 20);
  const [pixelRaw, setPixelSize] = useURLState("pixelSize", 6.5);
  const [naRaw, setNa] = useURLState("na", 0.75);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550);
  const [fieldNumberRaw, setFieldNumber] = useURLState("fieldNumber", 22);
  const sensorW = clamp(sensorWRaw, 0.5, 100, 13.336);
  const sensorH = clamp(sensorHRaw, 0.5, 100, 10.016);
  const mag = clamp(magRaw, 0.01, 200, 20);
  const pixelUm = clamp(pixelRaw, 0.5, 50, 6.5);
  const na = clamp(naRaw, 0.01, 1.7, 0.75);
  const wavelengthNm = clamp(wavelengthRaw, 200, 2000, 550);
  const fieldNumber = clamp(fieldNumberRaw, 1, 30, 22);

  const fov = objectFov(sensorW * mm, sensorH * mm, mag);
  const footprintNm = pixelFootprint(pixelUm * um, mag) / nm;
  const nyquistNm = nyquistPixel(wavelengthNm * nm, na) / nm;
  const ratio = footprintNm / nyquistNm;
  const nyquistMag = (pixelUm * um) / (nyquistNm * nm);
  const eyepieceFieldMm = objectFieldDiameter(fieldNumber * mm, mag) / mm;
  const verdict = ratio > 1
    ? `undersampled by ${ratio.toFixed(2)}×: the camera loses detail the objective passes`
    : `sampled at ${(1 / ratio).toFixed(2)}× Nyquist`;

  const mags = Array.from({ length: 101 }, (_, k) => 10 ** (-1 + (3 * k) / 100));
  const chart = [
    { x: mags, y: mags.map((m) => objectFov(sensorW * mm, sensorH * mm, m).width / mm), type: "scatter" as const, mode: "lines" as const, name: "FOV width", line: { color: "#60a5fa" } },
    { x: mags, y: mags.map((m) => objectFov(sensorW * mm, sensorH * mm, m).height / mm), type: "scatter" as const, mode: "lines" as const, name: "FOV height", line: { color: "#34d399" } },
    { x: [mag, mag], y: [fov.width / mm, fov.height / mm], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Sensor width (mm)" value={sensorWRaw} onChange={setSensorW} min={0.5} max={100} step="any" />
          <ValidatedNumberInput label="Sensor height (mm)" value={sensorHRaw} onChange={setSensorH} min={0.5} max={100} step="any" />
          <ValidatedNumberInput label="Magnification at the sensor (×)" value={magRaw} onChange={setMag} min={0.01} max={200} step="any" />
          <ValidatedNumberInput label="Pixel size (µm)" value={pixelRaw} onChange={setPixelSize} min={0.5} max={50} step="any" />
          <ValidatedNumberInput label="Objective NA" value={naRaw} onChange={setNa} min={0.01} max={1.7} step="0.01" />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step="any" />
          <ValidatedNumberInput label="Eyepiece field number (mm)" value={fieldNumberRaw} onChange={setFieldNumber} min={1} max={30} step="any" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("FOV width, sensor/M", fmt(fov.width / mm, 4, " mm"), "text-blue-400")}
          {row("FOV height", fmt(fov.height / mm, 4, " mm"), "text-green-400")}
          {row("FOV diagonal", fmt(fov.diagonal / mm, 4, " mm"), "text-yellow-400")}
          {row("Pixel footprint p/M", fmt(footprintNm, 1, " nm"), "text-purple-400")}
          {row("Nyquist pixel λ/(4NA)", fmt(nyquistNm, 1, " nm"))}
          {row("Magnification for Nyquist", fmt(nyquistMag, 1, "×"))}
          {row("Eyepiece field FN/M", fmt(eyepieceFieldMm, 3, " mm"))}
          <p className="text-sm text-purple-400">The camera is {verdict}.</p>
          <p className="text-xs text-gray-500">
            The incoherent image carries spatial frequencies up to 2NA/λ; sampling them at Nyquist needs an object-side
            pixel no larger than λ/(4NA). The eyepiece field is the field stop FN seen through the objective.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Field of view vs magnification</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Magnification (×)", type: "log", gridcolor: "#333" },
          yaxis: { title: "Object-side FOV (mm)", type: "log", gridcolor: "#333" },
          margin: { l: 70, r: 20, t: 20, b: 60 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
