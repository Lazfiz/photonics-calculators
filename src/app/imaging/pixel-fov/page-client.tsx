"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { nyquistFrequency, pixelIfov, subtendedAngle } from "../../../physics/imaging/field-of-view";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const mm = 1e-3;
const um = 1e-6;
const arcsec = Math.PI / (180 * 3600);
const deg = Math.PI / 180;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function PixelFovPage() {
  const [pixelRaw, setPixelSizeUm] = useURLState("pixelSizeUm", 6.5);
  const [focalRaw, setFocalLengthMm] = useURLState("focalLengthMm", 50);
  const [binningRaw, setBinning] = useURLState("binning", 1);
  const [pixelsRaw, setPixels] = useURLState("pixels", 2048);
  const pixelUm = clamp(pixelRaw, 1, 50, 6.5);
  const focalMm = clamp(focalRaw, 1, 10000, 50);
  const binning = Math.round(clamp(binningRaw, 1, 4, 1));
  const pixels = Math.round(clamp(pixelsRaw, 1, 20000, 2048));

  const ifov = pixelIfov(pixelUm * um, focalMm * mm, binning);
  const effectiveUm = pixelUm * binning;
  const sensorLpMm = nyquistFrequency(effectiveUm * um) * mm;
  const angularNyquist = nyquistFrequency(ifov) / 1000; // cycles per mrad
  const fullFieldDeg = subtendedAngle(pixels * pixelUm * um, focalMm * mm) / deg;

  const fls = Array.from({ length: 101 }, (_, k) => 10 ** (k / 25));
  const chart = [
    { x: fls, y: fls.map((f) => pixelIfov(pixelUm * um, f * mm, binning) / arcsec), type: "scatter" as const, mode: "lines" as const, name: `Pixel IFOV, ${binning}×${binning}`, line: { color: "#60a5fa", width: 2 } },
    { x: [focalMm], y: [ifov / arcsec], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 10 } },
  ];

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">IFOV = 2·atan(b·p / 2f) ≈ b·p / f</p>
        <p className="text-gray-500 text-xs mt-1">p = pixel pitch, b = binning, f = focal length of a lens focused at infinity</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Pixel size (µm)" value={pixelRaw} onChange={setPixelSizeUm} min={1} max={50} step="0.1" />
          <ValidatedNumberInput label="Focal length (mm)" value={focalRaw} onChange={setFocalLengthMm} min={1} max={10000} step="0.1" />
          <label className="block">
            <span className="text-sm text-gray-300">Binning</span>
            <select value={binning} onChange={(e) => setBinning(+e.target.value)}
              className="mt-2 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
              <option value={1}>1×1</option>
              <option value={2}>2×2</option>
              <option value={3}>3×3</option>
              <option value={4}>4×4</option>
            </select>
          </label>
          <ValidatedNumberInput label="Pixels across the sensor" value={pixelsRaw} onChange={setPixels} min={1} max={20000} step="1" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Pixel IFOV", fmt(ifov / arcsec, 2, "″"), "text-blue-400")}
          {row("Pixel IFOV", fmt(ifov * 1e6, 1, " µrad"), "text-green-400")}
          {row("Effective pixel", fmt(effectiveUm, 1, " µm"), "text-yellow-400")}
          {row("Sensor Nyquist 1/(2bp)", fmt(sensorLpMm, 1, " lp/mm"), "text-purple-400")}
          {row("Angular Nyquist 1/(2·IFOV)", fmt(angularNyquist, 2, " cycles/mrad"))}
          {row("Full field across the sensor", fmt(fullFieldDeg, 2, "°"))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Pixel IFOV vs focal length</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Focal length (mm)", type: "log", gridcolor: "#333" },
          yaxis: { title: "Pixel IFOV (arcsec)", type: "log", gridcolor: "#333" },
          margin: { l: 70, r: 20, t: 20, b: 60 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
