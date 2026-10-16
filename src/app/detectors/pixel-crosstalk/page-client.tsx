"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  columnShares,
  crosstalkKernelMtf,
  neighbourFraction,
  pixelApertureMtf,
  seibCollection,
  seibDiffusionFloor,
  seibDiffusionMtf,
} from "../../../physics/detectors/sensor-mtf";
import { siliconAbsorption } from "../../../physics/materials/silicon-absorption";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const pct = (x: number, digits = 2) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");

export default function PixelCrosstalkPage() {
  const [pitchRaw, setPixelPitch] = useURLState("pixelPitch", 5.0); // µm
  const [depletionRaw, setDepletionDepth] = useURLState("depletionDepth", 10); // µm
  const [diffusionRaw, setDiffusionLength] = useURLState("diffusionLength", 20); // µm, field-free region
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550); // nm
  const [kernelRaw, setCrosstalkCoeff] = useURLState("crosstalkCoeff", 0.03); // fraction sent to both neighbours

  const pixelPitch = clamp(pitchRaw, 1, 50, 5);
  const depletionDepth = clamp(depletionRaw, 0, 100, 10);
  const diffusionLength = clamp(diffusionRaw, 1, 200, 20);
  const wavelength = clamp(wavelengthRaw, 300, 1100, 550);
  const kernel = clamp(kernelRaw, 0, 0.5, 0.03);

  // SI inside.
  const pitch = pixelPitch * 1e-6;
  const W = depletionDepth * 1e-6;
  const L0 = diffusionLength * 1e-6;
  const nyquist = 1 / (2 * pitch);

  const diffusion = (lambdaNm: number) => {
    const alpha = siliconAbsorption(lambdaNm * 1e-9);
    const floor = seibDiffusionFloor(alpha, W, L0);
    const shares = columnShares(f => seibDiffusionMtf(f, alpha, W, L0), pitch, floor);
    return { alpha, shares, diffusionCrosstalk: 2 * shares[1], total: neighbourFraction(shares, kernel) };
  };
  const here = diffusion(wavelength);
  const belowDepletion = Math.exp(-here.alpha * W);
  const collected = seibCollection(0, here.alpha, W, L0);
  const beyond = 1 - here.shares[0] - 2 * here.shares[1];
  const mtfAt = (f: number) => {
    const pixel = pixelApertureMtf(f, pitch);
    const seib = seibDiffusionMtf(f, here.alpha, W, L0);
    return { pixel, seib, total: pixel * seib * crosstalkKernelMtf(f, pitch, kernel) };
  };
  const atNyquist = mtfAt(nyquist);

  const wls = Array.from({ length: 81 }, (_, i) => 300 + 10 * i);
  const sweep = wls.map(diffusion);
  const crosstalkData = [
    { x: wls, y: sweep.map(s => s.diffusionCrosstalk * 100), type: "scatter" as const, mode: "lines" as const, name: "Diffusion (Seib)", line: { color: "#60a5fa" } },
    { x: wls, y: sweep.map(s => s.total * 100), type: "scatter" as const, mode: "lines" as const, name: "Diffusion + kernel X", line: { color: "#f87171", width: 2 } },
    { x: [wavelength], y: [here.total * 100], type: "scatter" as const, mode: "markers" as const, name: "Selected λ", marker: { color: "#fbbf24", size: 10 } },
  ];

  const freq = Array.from({ length: 201 }, (_, i) => (i / 200) * 2 * nyquist);
  const mtfs = freq.map(mtfAt);
  const lpmm = freq.map(f => f / 1000);
  const mtfData = [
    { x: lpmm, y: mtfs.map(m => m.total), type: "scatter" as const, mode: "lines" as const, name: "Pixel × diffusion × kernel", line: { color: "#34d399", width: 2 } },
    { x: lpmm, y: mtfs.map(m => m.pixel * m.seib), type: "scatter" as const, mode: "lines" as const, name: "Pixel × diffusion", line: { color: "#60a5fa", dash: "dot" } },
    { x: lpmm, y: mtfs.map(m => m.pixel), type: "scatter" as const, mode: "lines" as const, name: "Pixel aperture", line: { color: "#9ca3af", dash: "dash" } },
    { x: [nyquist / 1000, nyquist / 1000], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "Nyquist", line: { color: "#6b7280", width: 1, dash: "dot" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pixel pitch p (µm)" value={pitchRaw} onChange={setPixelPitch} min={1} max={50} step="0.1" />
        <ValidatedNumberInput label="Depletion depth W (µm)" value={depletionRaw} onChange={setDepletionDepth} min={0} max={100} step="1" />
        <ValidatedNumberInput label="Diffusion length L₀ below it (µm)" value={diffusionRaw} onChange={setDiffusionLength} min={1} max={200} step="1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={1100} step="10" />
        <ValidatedNumberInput label="Kernel crosstalk X (both neighbours)" value={kernelRaw} onChange={setCrosstalkCoeff} min={0} max={0.5} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Absorption depth 1/α" value={`${(1e6 / here.alpha).toPrecision(3)} µm`} subtext="Si at 300 K (Green 2008)" tone="blue" />
        <ResultCard label="Absorbed below the depletion layer" value={pct(belowDepletion)} subtext={`e^(−αW); ${pct(collected, 1)} of the absorbed charge is collected`} tone="purple" />
        <ResultCard label="Diffusion crosstalk" value={pct(here.diffusionCrosstalk)} subtext={`to the two neighbouring columns; ${pct(beyond)} lands farther out`} tone="green" />
        <ResultCard label="Total neighbour crosstalk" value={pct(here.total)} subtext="diffusion followed by the kernel X" tone="red" />
        <ResultCard label="MTF at Nyquist" value={pct(atNyquist.total, 1)} subtext={`pixel 2/π × diffusion ${atNyquist.seib.toFixed(3)} × kernel ${(1 - 2 * kernel).toFixed(3)}`} tone="yellow" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Seib diffusion MTF: η(f) = 1 − e<sup>−αW</sup>/(1 + α L<sub>f</sub>), 1/L<sub>f</sub>² = 1/L₀² + (2π f)², MTF = η(f)/η(0).</p>
        <p>Column shares for one uniformly lit column: C<sub>n</sub> = 2∫ MTF(u/p) sinc²(π u) cos(2π n u) du; diffusion crosstalk = 2C₁.</p>
        <p>Kernel [X/2, 1 − X, X/2]: MTF = 1 − X + X cos(2π f p), so 1 − 2X at f<sub>N</sub> = 1/(2p).</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Neighbour crosstalk vs wavelength</p>
          <ChartPanel data={crosstalkData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Crosstalk (%)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">MTF at {wavelength} nm</p>
          <ChartPanel data={mtfData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 },
            xaxis: { title: "Spatial frequency (lp/mm)", gridcolor: "#374151" },
            yaxis: { title: "MTF", range: [0, 1.05], gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 },
          }} />
        </div>
      </div>
    </>
  );
}
