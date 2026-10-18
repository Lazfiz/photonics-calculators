"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  depthOfFocus, fresnelNumber, fresnelReconstructionPitch, hologramNA, inlineMinDistance, maxInterferenceAngle, replayField,
} from "../../../physics/imaging/holography";
import { sinc } from "../../../physics/math";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toPrecision(digits)}${unit}` : "—");

export default function DigitalHolographyPage() {
  const [lambdaRaw, setLambda] = useURLState("wavelengthNm", 532);
  const [pitchRaw, setPitch] = useURLState("pixelSizeUm", 6.5);
  const [nRaw, setN] = useURLState("sensorWidth", 2048);
  const [zRaw, setZ] = useURLState("propagationDistanceMm", 200);
  const [objRaw, setObj] = useURLState("objectSizeUm", 500);
  const lambdaNm = clamp(lambdaRaw, 350, 1100, 532);
  const pitchUm = clamp(pitchRaw, 0.5, 20, 6.5);
  const N = Math.round(clamp(nRaw, 64, 8192, 2048));
  const zMm = clamp(zRaw, 1, 2000, 200);
  const objUm = clamp(objRaw, 0, 20000, 500);

  const lambda = lambdaNm * 1e-9;
  const dx = pitchUm * 1e-6;
  const z = zMm * 1e-3;
  const L = N * dx;
  const NA = hologramNA(N, dx, z);
  const pitch = fresnelReconstructionPitch(lambda, z, N, dx);
  const field = replayField(lambda, z, dx);
  const dof = depthOfFocus(lambda, NA);
  const thetaMax = maxInterferenceAngle(lambda, dx);
  const zMin = inlineMinDistance(lambda, N, dx, objUm * 1e-6);
  const zMatched = inlineMinDistance(lambda, N, dx, 0); // λz/(NΔx) = Δx here
  const NF = fresnelNumber(objUm * 0.5e-6, lambda, z);
  const sampled = z >= zMin;

  const zAxis = Array.from({ length: 121 }, (_, i) => (i + 1) * (Math.max(2 * zMin, 1.2 * z) * 1e3) / 121);
  const pitchChart = [
    { x: zAxis, y: zAxis.map((d) => fresnelReconstructionPitch(lambda, d * 1e-3, N, dx) * 1e6), type: "scatter" as const, mode: "lines" as const, name: "λz/(NΔx)", line: { color: "#a78bfa" } },
    { x: [zAxis[0], zAxis[zAxis.length - 1]], y: [pitchUm, pitchUm], type: "scatter" as const, mode: "lines" as const, name: "Sensor pixel Δx", line: { color: "#60a5fa", dash: "dot" } },
    { x: [zMin * 1e3, zMin * 1e3], y: [0, fresnelReconstructionPitch(lambda, zAxis[zAxis.length - 1] * 1e-3, N, dx) * 1e6], type: "scatter" as const, mode: "lines" as const, name: "In-line z_min", line: { color: "#facc15", dash: "dash" } },
    { x: [zMm], y: [pitch * 1e6], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 10 } },
  ];

  const xs = Array.from({ length: 241 }, (_, i) => -4 * pitch * 1e6 + (i * 8 * pitch * 1e6) / 240);
  const psfChart = [
    { x: xs, y: xs.map((x) => sinc((Math.PI * x * 1e-6) / pitch) ** 2), type: "scatter" as const, mode: "lines" as const, name: "Point image, intensity", line: { color: "#34d399" } },
  ];

  const layout = (x: string, y: string, extra: object = {}) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 20, t: 20, b: 60 },
    xaxis: { title: x, gridcolor: "#333" }, yaxis: { title: y, gridcolor: "#333", ...extra }, showlegend: true,
  });

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Wavelength λ (nm)" value={lambdaRaw} onChange={setLambda} min={350} max={1100} step="1" />
          <ValidatedNumberInput label="Sensor pixel pitch Δx (µm)" value={pitchRaw} onChange={setPitch} min={0.5} max={20} step="0.1" />
          <ValidatedNumberInput label="Pixels per axis N" value={nRaw} onChange={setN} min={64} max={8192} step="64" />
          <ValidatedNumberInput label="Recording distance z (mm)" value={zRaw} onChange={setZ} min={1} max={2000} step="1" />
          <ValidatedNumberInput label="Object size D (µm)" value={objRaw} onChange={setObj} min={0} max={20000} step="10" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Sensor size NΔx", fmt(L * 1e3, 4, " mm"))}
          {row("Numerical aperture NΔx/(2z)", fmt(NA, 4), "text-blue-400")}
          {row("Image pixel and resolution λz/(NΔx)", fmt(pitch * 1e6, 4, " µm"), "text-green-400")}
          {row("Reconstructed field λz/Δx", fmt(field * 1e3, 4, " mm"))}
          {row("Depth of focus λ/NA²", fmt(dof * 1e6, 4, " µm"), "text-green-400")}
          {row("Largest reference angle 2 arcsin(λ/4Δx)", fmt((thetaMax * 180) / Math.PI, 4, "°"), "text-purple-400")}
          {row("Fresnel number (D/2)²/(λz)", fmt(NF, 4))}
          {row("Shortest in-line distance Δx(NΔx + D)/λ", fmt(zMin * 1e3, 4, " mm"), "text-yellow-400")}
          {row("In-line hologram sampled", sampled ? "yes" : "no: aliased", sampled ? "text-green-400" : "text-red-400")}
          <p className="text-xs text-gray-500">
            At z = NΔx²/λ = {fmt(zMatched * 1e3, 4, " mm")} the image pixel equals the sensor pixel; closer in, the
            angular-spectrum method keeps Δx while the Fresnel transform gives a finer, undersampled grid.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Image pixel against recording distance</h2>
          <ChartPanel data={pitchChart} layout={layout("Recording distance z (mm)", "Pixel (µm)")} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Reconstructed point (one axis)</h2>
          <ChartPanel data={psfChart} layout={layout("Position (µm)", "Relative intensity", { range: [0, 1.05] })} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>Fresnel reconstruction: Δξ = λz/(NΔx), field NΔξ = λz/Δx, point image sinc²(πx/Δξ)</p>
          <p>NA = NΔx/(2z), depth of focus λ/NA², θ_max = 2 arcsin(λ/(4Δx))</p>
          <p>In-line sampling: (NΔx + D)/(2z) ≤ λ/(2Δx) ⇒ z ≥ Δx(NΔx + D)/λ</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Scalar, paraxial Fresnel diffraction with a plane reference wave and a square sensor of N × N square pixels with
          full fill factor (Schnars & Jüptner 2002). The reconstructed point is the Fourier transform of the sensor
          aperture, a sinc whose first zero is one image pixel. An off-axis hologram must also separate the twin image and
          the zero order, which needs a larger angle or distance; the pixel fill factor, noise and the object&apos;s own
          speckle are not included.
        </p>
      </div>
    </>
  );
}
