"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { radiusAtDistance, rayleighRange } from "../../../physics/wave-optics/gaussian-beam";
import { beamRadiusFromQ, bestLensPosition, qAfterLens, singleLensModeMatch } from "../../../physics/wave-optics/mode-matching";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

export default function ModeMatchingPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [w1Raw, setW1] = useURLState("w1", 50); // µm, input waist
  const [w2Raw, setW2] = useURLState("w2", 200); // µm, target waist
  const [dRaw, setD] = useURLState("d", 200); // mm, waist to waist
  const [fStockRaw, setFStock] = useURLState("f", 40); // mm, a lens you have

  const wavelength = clamp(wavelengthRaw, 200, 11000, 1550);
  const w1_um = clamp(w1Raw, 1, 10000, 50);
  const w2_um = clamp(w2Raw, 1, 10000, 200);
  const d_mm = clamp(dRaw, 0.1, 1e5, 200);
  const fStock_mm = clamp(fStockRaw, 0.1, 1e5, 40);

  const lambda = wavelength * 1e-9;
  const p = { lambda, w1: w1_um * 1e-6, w2: w2_um * 1e-6, d: d_mm * 1e-3 };
  const sol = singleLensModeMatch(p);
  const zR1_mm = rayleighRange({ lambda, w0: p.w1 }) * 1e3;
  const zR2_mm = rayleighRange({ lambda, w0: p.w2 }) * 1e3;
  const stock = bestLensPosition(p, fStock_mm * 1e-3);

  // Best coupling over lens position for each focal length.
  const fOpt_mm = sol.f * 1e3;
  const fLo = Math.min(0.5 * sol.f0 * 1e3, 0.8 * fStock_mm);
  const fHi = Math.max(4 * fOpt_mm, 1.25 * fStock_mm);
  const fs = Array.from({ length: 161 }, (_, i) => fLo + (i * (fHi - fLo)) / 160);
  const coupling = [
    { name: "Best η at each focal length", color: "#60a5fa", points: fs.map((f) => ({ x: round6(f), y: round6(bestLensPosition(p, f * 1e-3).eta * 100) })) },
    ...(sol.lensBetweenWaists ? [{ name: "Matching lens (η = 100 %)", color: "#f87171", showPoints: true, points: [{ x: round6(fOpt_mm), y: 100 }] }] : []),
    { name: "Your lens", color: "#facc15", showPoints: true, points: [{ x: round6(fStock_mm), y: round6(stock.eta * 100) }] },
  ];

  // Beam radius along the axis: input beam up to the lens, then the beam the lens makes.
  const radiusAfter = (f_mm: number, s_mm: number, z_mm: number) => {
    const q = qAfterLens(lambda, p.w1, s_mm * 1e-3, f_mm * 1e-3, (z_mm - s_mm) * 1e-3);
    return beamRadiusFromQ(q, lambda) * 1e6;
  };
  const inputRadius = (z_mm: number) => radiusAtDistance(w1_um, zR1_mm, z_mm); // µm; z, z_R both in mm
  const zLo = Math.min(0, sol.s1 * 1e3);
  const zHi = Math.max(d_mm, sol.s1 * 1e3);
  const zs = Array.from({ length: 241 }, (_, i) => zLo + (i * (zHi - zLo)) / 240);
  const profile = (f_mm: number, s_mm: number) =>
    zs.map((z) => ({ x: round6(z), y: round6(z <= s_mm ? inputRadius(z) : radiusAfter(f_mm, s_mm, z)) }));
  const beams = [
    { name: "Matching lens", color: "#34d399", points: Number.isFinite(sol.f) ? profile(fOpt_mm, sol.s1 * 1e3) : [] },
    { name: "Your lens at its best position", color: "#facc15", dashed: true, points: Number.isFinite(stock.s) ? profile(fStock_mm, stock.s * 1e3) : [] },
    { name: "Target beam", color: "#f87171", dashed: true, points: zs.map((z) => ({ x: round6(z), y: round6(w2_um * Math.hypot(1, (z - d_mm) / zR2_mm)) })) },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={11000} />
        <ValidatedNumberInput label="Input waist radius w₁ (µm, 1/e²)" value={w1Raw} onChange={setW1} min={1} max={10000} step="any" />
        <ValidatedNumberInput label="Target waist radius w₂ (µm, 1/e²)" value={w2Raw} onChange={setW2} min={1} max={10000} step="any" />
        <ValidatedNumberInput label="Waist-to-waist distance d (mm)" value={dRaw} onChange={setD} min={0.1} max={1e5} step="any" />
        <ValidatedNumberInput label="Your lens focal length (mm)" value={fStockRaw} onChange={setFStock} min={0.1} max={1e5} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Matching lens focal length f" value={`${fmt(fOpt_mm)} mm`} subtext="The one positive lens that couples 100 %" tone="blue" />
        <ResultCard label="Lens distance from input waist s₁" value={`${fmt(sol.s1 * 1e3)} mm`} tone="green" />
        <ResultCard label="Lens distance to target waist s₂" value={`${fmt(sol.s2 * 1e3)} mm`} tone="green" />
        <ResultCard label="Shortest usable focal length f₀ = πw₁w₂/λ" value={`${fmt(sol.f0 * 1e3)} mm`} tone="purple" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Magnification w₂/w₁" value={fmt(w2_um / w1_um)} tone="orange" />
        <ResultCard label="Rayleigh ranges z_R1 / z_R2" value={`${fmt(zR1_mm)} / ${fmt(zR2_mm)} mm`} tone="cyan" />
        <ResultCard label="Your lens: best distance from input waist" value={`${fmt(stock.s * 1e3)} mm`} tone="yellow" />
        <ResultCard label="Your lens: coupling η" value={`${fmt(stock.eta * 100)} %`} subtext="Best over positions between the waists" tone="yellow" />
      </div>

      {!sol.lensBetweenWaists && Number.isFinite(sol.f) && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The matching lens would sit {sol.s1 < 0 ? "before the input waist" : "after the target waist"}: d is shorter than
          one lens can bridge, so no single lens between the waists couples 100 %. Increase d or use two lenses.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>f₀ = πw₁w₂/λ; for f ≥ f₀: s₁ = f ± (w₁/w₂)√(f² − f₀²), s₂ = f ± (w₂/w₁)√(f² − f₀²), s₁ + s₂ = d.</p>
        <p>Coupling of beams q₁, q₂ at one plane (q = z + iz<sub>R</sub>): η = 4 Im q₁ Im q₂ / |q₁ − q₂*|², which includes both
          the size and the wavefront curvature mismatch.</p>
      </div>

      <div className="space-y-6">
        <SimpleLineChart title="Best coupling versus lens focal length" xLabel="Focal length f (mm)" yLabel="Coupling η (%)" series={coupling} />
        <SimpleLineChart title="Beam radius along the axis" xLabel="Distance from the input waist z (mm)" yLabel="Beam radius w (µm)" series={beams} />
      </div>
    </>
  );
}
