"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  BINARY_AMPLITUDE_EFFICIENCY, fresnelReconstructionPitch, phaseQuantizationEfficiency, pixelEnvelope, replayField, slmMaxAngle,
} from "../../../physics/imaging/holography";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toPrecision(digits)}${unit}` : "—");
const BIT_DEPTHS = [1, 2, 3, 4, 6, 8, 10];

export default function CGHPage() {
  const [lambdaRaw, setLambda] = useURLState("wavelengthNm", 633);
  const [pitchRaw, setPitch] = useURLState("pixelPitchUm", 8);
  const [nxRaw, setNx] = useURLState("slmWidth", 1920);
  const [nyRaw, setNy] = useURLState("slmHeight", 1080);
  const [zRaw, setZ] = useURLState("reconstructionDistMm", 500);
  const [bitsRaw, setBits] = useURLState("bitDepth", 8);
  const [fillRaw, setFill] = useURLState("fillFactor", 0.9);
  const [typeRaw, setType] = useURLState("modulation", "phase");
  const lambdaNm = clamp(lambdaRaw, 350, 1600, 633);
  const pitchUm = clamp(pitchRaw, 1, 50, 8);
  const Nx = Math.round(clamp(nxRaw, 64, 8192, 1920));
  const Ny = Math.round(clamp(nyRaw, 64, 8192, 1080));
  const zMm = clamp(zRaw, 10, 5000, 500);
  const bits = BIT_DEPTHS.includes(bitsRaw) ? bitsRaw : 8;
  const fill = clamp(fillRaw, 0.1, 1, 0.9);
  const amplitude = typeRaw === "amplitude";

  const lambda = lambdaNm * 1e-9;
  const dx = pitchUm * 1e-6;
  const z = zMm * 1e-3;
  const levels = 2 ** bits;
  const thetaMax = slmMaxAngle(lambda, dx);
  const field = replayField(lambda, z, dx);
  const spotX = fresnelReconstructionPitch(lambda, z, Nx, dx);
  const spotY = fresnelReconstructionPitch(lambda, z, Ny, dx);
  const angularRes = lambda / (Nx * dx);
  const efficiency = amplitude ? BINARY_AMPLITUDE_EFFICIENCY : phaseQuantizationEfficiency(levels);
  const edge = pixelEnvelope(1 / (2 * dx), dx, fill);
  const memoryMB = (Nx * Ny * (amplitude ? 1 : bits)) / 8 / 1e6;

  const effChart = [
    { x: BIT_DEPTHS, y: BIT_DEPTHS.map((b) => phaseQuantizationEfficiency(2 ** b)), type: "scatter" as const, mode: "lines+markers" as const, name: "Phase, 2^bits levels", line: { color: "#34d399" } },
    { x: [1, 10], y: [BINARY_AMPLITUDE_EFFICIENCY, BINARY_AMPLITUDE_EFFICIENCY], type: "scatter" as const, mode: "lines" as const, name: "Binary amplitude", line: { color: "#f87171", dash: "dash" } },
    { x: [amplitude ? 1 : bits], y: [efficiency], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } },
  ];

  const half = (field * 1e3) / 2; // mm
  const xs = Array.from({ length: 201 }, (_, i) => -half + (i * 2 * half) / 200);
  const freq = (xMm: number) => (xMm * 1e-3) / (lambda * z); // spatial frequency on the SLM for replay position x
  const envChart = [
    { x: xs, y: xs.map((x) => pixelEnvelope(freq(x), dx, fill)), type: "scatter" as const, mode: "lines" as const, name: `Fill factor ${fill}`, line: { color: "#60a5fa" } },
    { x: xs, y: xs.map((x) => pixelEnvelope(freq(x), dx, 1)), type: "scatter" as const, mode: "lines" as const, name: "Fill factor 1", line: { color: "#a78bfa", dash: "dot" } },
  ];

  const layout = (x: string, y: string, extra: object = {}) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 20, t: 20, b: 60 },
    xaxis: { title: x, gridcolor: "#333" }, yaxis: { title: y, gridcolor: "#333", ...extra }, showlegend: true,
  });

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Wavelength λ (nm)" value={lambdaRaw} onChange={setLambda} min={350} max={1600} step="1" />
          <ValidatedNumberInput label="SLM pixel pitch Δx (µm)" value={pitchRaw} onChange={setPitch} min={1} max={50} step="0.1" />
          <ValidatedNumberInput label="SLM width N_x (px)" value={nxRaw} onChange={setNx} min={64} max={8192} step="64" />
          <ValidatedNumberInput label="SLM height N_y (px)" value={nyRaw} onChange={setNy} min={64} max={8192} step="64" />
          <ValidatedNumberInput label="Replay distance or Fourier-lens focal length z (mm)" value={zRaw} onChange={setZ} min={10} max={5000} step="10" />
          <ValidatedNumberInput label="Pixel fill factor (area)" value={fillRaw} onChange={setFill} min={0.1} max={1} step="0.05" />
          <div>
            <label className="block text-sm text-gray-400 mb-1">Modulation</label>
            <select value={amplitude ? "amplitude" : "phase"} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="phase">Phase (kinoform)</option>
              <option value="amplitude">Binary amplitude</option>
            </select>
          </div>
          {!amplitude && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Phase bit depth</label>
              <select value={bits} onChange={(e) => setBits(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                {BIT_DEPTHS.map((b) => (
                  <option key={b} value={b}>{b} bit ({2 ** b} levels)</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Largest diffraction angle arcsin(λ/2Δx)", fmt((thetaMax * 180) / Math.PI, 4, "°"), "text-purple-400")}
          {row("Replay field λz/Δx", fmt(field * 1e3, 4, " mm"), "text-green-400")}
          {row("Replay spot λz/(NΔx), x × y", `${fmt(spotX * 1e6, 4)} × ${fmt(spotY * 1e6, 4, " µm")}`, "text-green-400")}
          {row("Resolvable spots N_x × N_y", `${Nx} × ${Ny}`)}
          {row("Angular resolution λ/(N_xΔx)", fmt(angularRes * 1e3, 4, " mrad"))}
          {row("First-order efficiency", fmt(efficiency * 100, 4, " %"), "text-yellow-400")}
          {row("Pixel envelope at the field edge", fmt(edge, 3), "text-blue-400")}
          {row("SLM aperture N_xΔx × N_yΔx", `${fmt(Nx * pitchUm * 1e-3, 4)} × ${fmt(Ny * pitchUm * 1e-3, 4, " mm")}`)}
          {row("Hologram frame size", fmt(memoryMB, 4, " MB"))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">First-order efficiency against bit depth</h2>
          <ChartPanel data={effChart} layout={layout("Phase bit depth", "Efficiency", { range: [0, 1.05] })} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Pixel envelope across the replay field (x)</h2>
          <ChartPanel data={envChart} layout={layout("Replay position (mm)", "Relative intensity", { range: [0, 1.05] })} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>θ_max = arcsin(λ/(2Δx)), replay field λz/Δx, spot λz/(NΔx)</p>
          <p>η = sinc²(π/L) for L phase levels (4/π² = 40.5 % binary), 1/π² = 10.1 % binary amplitude</p>
          <p>Envelope sinc²(π√F Δx f), f = x/(λz); at the field edge sinc²(π√F/2)</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Scalar paraxial replay of a pixelated SLM, either in the Fresnel region at distance z or in the focal plane of a
          lens of focal length z. The replayed pattern repeats every λz/Δx; beyond it lie the higher orders. The
          efficiency is the first-order efficiency of an L-level phase staircase (Swanson 1989) and assumes ideal phase
          levels; fringing fields between pixels, phase flicker, the zero order from the dead space and the iterative
          algorithm&apos;s own error are not included. The frame size counts the bits per pixel only.
        </p>
      </div>
    </>
  );
}
