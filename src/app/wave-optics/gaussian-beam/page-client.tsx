"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  beamParameterProduct, beamRadius, divergenceHalfAngle, gouyPhase, rayleighRange, wavefrontRadius,
} from "../../../physics/wave-optics/gaussian-beam";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const wavelengthPresets = [532, 1064, 1550];
const deg = 180 / Math.PI;

export default function GaussianBeamPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [waistRaw, setWaist] = useURLState("waist", 10); // µm
  const [zRaw, setZ] = useURLState("z", 1); // mm from the waist

  const wavelength = clamp(wavelengthRaw, 200, 11000, 1550);
  const waist = clamp(waistRaw, 1, 10000, 10);
  const z_mm = clamp(zRaw, -1e6, 1e6, 1);

  const beam = { lambda: wavelength * 1e-9, w0: waist * 1e-6 };
  const z = z_mm * 1e-3;
  const zR_mm = rayleighRange(beam) * 1e3;
  const theta_mrad = divergenceHalfAngle(beam) * 1e3;
  const bpp = beamParameterProduct(beam) * 1e6; // mm·mrad
  const w_um = beamRadius(beam, z) * 1e6;
  const R_mm = wavefrontRadius(beam, z) * 1e3;
  const psiDeg = gouyPhase(beam, z) * deg;
  const paraxial = theta_mrad < 100;

  const zMax = Math.max(4 * zR_mm, 1.2 * Math.abs(z_mm));
  const zs = Array.from({ length: 221 }, (_, i) => -zMax + (i * 2 * zMax) / 220);
  const envelope = [
    { name: "Beam radius w(z)", color: "#60a5fa", points: zs.map((x) => ({ x: round6(x), y: round6(beamRadius(beam, x * 1e-3) * 1e6) })) },
    { name: "Waist", color: "#f87171", dashed: true, points: [{ x: 0, y: 0 }, { x: 0, y: waist }] },
    { name: "Distance z", color: "#facc15", showPoints: true, points: [{ x: round6(z_mm), y: round6(w_um) }] },
  ];
  const gouy = [
    { name: "Gouy phase ψ(z)", color: "#a78bfa", points: zs.map((x) => ({ x: round6(x), y: round6(gouyPhase(beam, x * 1e-3) * deg) })) },
    { name: "Distance z", color: "#facc15", showPoints: true, points: [{ x: round6(z_mm), y: round6(psiDeg) }] },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button
            key={preset}
            onClick={() => setWavelength(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset} nm
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <InputSlider label="Wavelength λ" value={wavelengthRaw} onChange={setWavelength} min={200} max={11000} step={1} unit="nm" />
        <ValidatedNumberInput label="Beam waist radius w₀ (µm, 1/e²)" value={waistRaw} onChange={setWaist} min={1} max={10000} />
        <ValidatedNumberInput label="Distance from waist z (mm)" value={zRaw} onChange={setZ} min={-1e6} max={1e6} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Rayleigh range z_R" value={`${fmt(zR_mm)} mm`} tone="blue" />
        <ResultCard label="Far-field divergence θ (half angle)" value={`${fmt(theta_mrad)} mrad`} tone="green" />
        <ResultCard label="Beam parameter product w₀θ" value={`${fmt(bpp)} mm·mrad`} tone="yellow" />
        <ResultCard label="Confocal parameter 2z_R" value={`${fmt(2 * zR_mm)} mm`} tone="purple" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Beam radius w(z)" value={`${fmt(w_um)} µm`} tone="cyan" />
        <ResultCard
          label="Wavefront radius R(z)"
          value={Number.isFinite(R_mm) ? `${fmt(R_mm)} mm` : "∞"}
          subtext={z_mm === 0 ? "Flat wavefront at the waist" : "Minimum |R| = 2z_R at z = ±z_R"}
          tone="orange"
        />
        <ResultCard label="Gouy phase ψ(z)" value={`${fmt(psiDeg)}°`} subtext="Total shift through focus: 180° (π)" tone="purple" />
      </div>

      {!paraxial && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The divergence exceeds 0.1 rad: the waist is only a few wavelengths across, so the paraxial Gaussian beam
          model loses accuracy.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>z<sub>R</sub> = πw₀²/λ, &nbsp; θ = λ/(πw₀)</p>
        <p>w(z) = w₀ √(1 + (z/z<sub>R</sub>)²), &nbsp; R(z) = z (1 + (z<sub>R</sub>/z)²)</p>
        <p>ψ(z) = arctan(z/z<sub>R</sub>): the extra phase relative to a plane wave (the wavefronts run ahead of a plane wavethe phase lag behind a plane wave; a TEMmnapos;s); a TEMmn mode picks up (m + n + 1)ψ.</p>
      </div>

      <div className="space-y-6">
        <SimpleLineChart title="Gaussian beam envelope" xLabel="Propagation distance z (mm)" yLabel="Beam radius w(z) (µm)" series={envelope} />
        <SimpleLineChart title="Gouy phase through focus" xLabel="Propagation distance z (mm)" yLabel="Gouy phase ψ (°)" series={gouy} />
      </div>
    </>
  );
}
