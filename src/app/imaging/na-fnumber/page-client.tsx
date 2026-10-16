"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { airyFirstZeroRadius, naFromFNumber, thinLensNa } from "../../../physics/imaging/diffraction-psf";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function NAFNumberPage() {
  const [fNumberRaw, setFNumber] = useURLState("fNumber", 2.8);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550); // nm
  const fNumber = clamp(fNumberRaw, 0.5, 100, 2.8);
  const wavelength = clamp(wavelengthRaw, 200, 20000, 550);
  const lambda = wavelength * 1e-9;

  const na = naFromFNumber(fNumber);
  const halfAngle = (Math.asin(na) * 180) / Math.PI;
  const tanNa = thinLensNa(fNumber);
  const airyDiameter = 2 * airyFirstZeroRadius(lambda, na); // 2.44 λ N

  const fNums = Array.from({ length: 196 }, (_, i) => 0.5 + i * 0.1);
  const chartData = [
    { x: fNums, y: fNums.map(naFromFNumber), type: "scatter" as const, mode: "lines" as const, name: "NA = 1/(2N), sine condition", line: { color: "#60a5fa" } },
    { x: fNums, y: fNums.map(thinLensNa), type: "scatter" as const, mode: "lines" as const, name: "1/√(1 + 4N²), thin-lens tangent form", line: { color: "#9ca3af", dash: "dash" } },
    { x: [fNumber], y: [na], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 10 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="f/# (N)" value={fNumberRaw} onChange={setFNumber} min={0.5} max={100} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">NA = 1/(2N) = <span className="text-blue-400 font-mono">{na.toFixed(4)}</span></p>
        <p className="text-gray-300">Half-angle of the cone = <span className="text-blue-400 font-mono">{halfAngle.toFixed(2)}°</span></p>
        <p className="text-gray-300">Airy disk diameter 2.44 λN at {wavelength} nm = <span className="text-blue-400 font-mono">{(airyDiameter * 1e6).toFixed(2)} µm</span></p>
        <p className="text-gray-500 text-sm">
          Thin-lens tangent form 1/√(1 + 4N²) = {tanNa.toFixed(4)} ({((1 - tanNa / na) * 100).toFixed(1)} % lower).
        </p>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        Object at infinity, lens in air. A corrected (aplanatic) lens obeys the sine condition, so its NA is exactly
        1/(2N) and f/0.5 is the limit NA = 1. Focused at a finite distance, the working f-number is about (1 + |m|)·N, which
        lowers the image-side NA.
      </p>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "f/#", gridcolor: "#374151" }, yaxis: { title: "Image-side NA", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true, showlegend: true }} />
    </>
  );
}
