"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { inoueDepthOfField, quarterWaveDepth } from "../../../physics/imaging/optical-sectioning-thickness";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const nm = 1e-9;
const um = 1e-6;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function DepthOfFieldPage() {
  const [naRaw, setNa] = useURLState("na", 0.4);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550);
  const [magRaw, setMag] = useURLState("magnification", 40);
  const [pixelRaw, setPixel] = useURLState("pixelSize", 6.5);
  const [nRaw, setN] = useURLState("n", 1);
  const na = clamp(naRaw, 0.01, 1.7, 0.4);
  const lambdaNm = clamp(wavelengthRaw, 200, 2000, 550);
  const M = clamp(magRaw, 1, 200, 40);
  const eUm = clamp(pixelRaw, 0.1, 50, 6.5);
  const n = clamp(nRaw, 1, 2, 1);

  const dof = inoueDepthOfField(lambdaNm * nm, n, na, eUm * um, M);
  const exact = quarterWaveDepth(lambdaNm * nm, n, na);

  const naMax = Math.min(1.7, 0.99 * n);
  const naLo = Math.min(0.05, na);
  const nas = Array.from({ length: 150 }, (_, k) => naLo + (k * (naMax - naLo)) / 149);
  const curves = nas.map((a) => inoueDepthOfField(lambdaNm * nm, n, a, eUm * um, M));
  const chart = [
    { x: nas, y: curves.map((c) => c.total / um), type: "scatter" as const, mode: "lines" as const, name: "Total", line: { color: "#60a5fa" } },
    { x: nas, y: curves.map((c) => c.wave / um), type: "scatter" as const, mode: "lines" as const, name: "Wave term λ₀n/NA²", line: { color: "#34d399", dash: "dash" } },
    { x: nas, y: curves.map((c) => c.detector / um), type: "scatter" as const, mode: "lines" as const, name: "Detector term ne/(M·NA)", line: { color: "#fbbf24", dash: "dash" } },
    { x: nas, y: nas.map((a) => quarterWaveDepth(lambdaNm * nm, n, a) / um), type: "scatter" as const, mode: "lines" as const, name: "Wave term, non-paraxial", line: { color: "#a78bfa", dash: "dot" } },
    { x: [na], y: [dof.total / um], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 9 } },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Numerical aperture NA" value={naRaw} onChange={setNa} min={0.01} max={1.7} step="0.01" />
          <ValidatedNumberInput label="Vacuum wavelength λ₀ (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step="any" />
          <ValidatedNumberInput label="Lateral magnification M (×)" value={magRaw} onChange={setMag} min={1} max={200} step="any" />
          <ValidatedNumberInput label="Detector resolution e in the image plane (µm, e.g. pixel pitch)" value={pixelRaw} onChange={setPixel} min={0.1} max={50} step="any" />
          <ValidatedNumberInput label="Immersion medium index n (air 1, water 1.333, oil 1.515)" value={nRaw} onChange={setN} min={1} max={2} step="0.001" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {Number.isFinite(dof.total) ? (
            <>
              {row("Wave term λ₀n/NA²", fmt(dof.wave / um, 4, " µm"), "text-green-400")}
              {row("Detector term n·e/(M·NA)", fmt(dof.detector / um, 4, " µm"), "text-yellow-400")}
              {row("Total depth of field", fmt(dof.total / um, 4, " µm"), "text-blue-400 text-lg font-bold")}
              {row("Wave term without the paraxial step", fmt(exact / um, 4, " µm"), "text-purple-400")}
            </>
          ) : (
            <p className="text-red-400">The NA must be smaller than the refractive index n.</p>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Depth of field vs NA</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "NA", gridcolor: "#333" }, yaxis: { title: "Depth of field (µm)", type: "log", gridcolor: "#333" },
          margin: { l: 60, r: 20, t: 20, b: 60 }, showlegend: true,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>d = λ₀n/NA² + n·e/(M·NA)  (Inoué &amp; Spring)</p>
          <p>Non-paraxial wave term: λ₀/(2(n − √(n² − NA²)))</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          The wave term is the full depth over which defocus adds at most a quarter wave of path at the aperture edge
          (paraxial), half the distance from focus to the first axial zero, 2nλ₀/NA². The detector term is the defocus
          whose geometric blur spans the detector&apos;s resolution e referred to the object, e/M. Take e as the pixel
          pitch, or twice it for Nyquist sampling. n is the index between the cover glass and the front lens, so d is the
          range of focus travel; inside a specimen of index n_s the depth is about d·n_s/n (paraxial). At high NA the paraxial wave term overstates the depth: at NA 1.4 in
          oil it reads 0.43 µm against 0.29 µm without the approximation. The detector term n·e/(M·NA) is also paraxial; the exact geometry e·√(n² − NA²)/(M·NA) is smaller at high NA (0.027 vs 0.070 µm at NA 1.4 oil, 100×, 6.5 µm).
        </p>
      </div>
    </>
  );
}
