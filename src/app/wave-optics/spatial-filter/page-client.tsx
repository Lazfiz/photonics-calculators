"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  airyDiskDiameter, focusedSpotRadius, pinholeFarFieldIntensity, pinholeRadiusForTransmission, pinholeTransmission,
} from "../../../physics/wave-optics/spatial-filter";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const pct = (x: number) => (Number.isFinite(x) ? `${(100 * x).toFixed(x > 0.999 ? 3 : 2)} %` : "—");

export default function SpatialFilterPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1064); // nm
  const [dInRaw, setDIn] = useURLState("inputBeamDiam", 1000); // µm, 1/e² diameter at the lens
  const [fRaw, setF] = useURLState("focalLength", 50); // mm, focusing lens
  const [m2Raw, setM2] = useURLState("m2", 1);
  const [pinholeRaw, setPinhole] = useURLState("pinhole", 100); // µm, pinhole diameter
  const [f2Raw, setF2] = useURLState("f2", 100); // mm, collimating lens

  const wavelength = clamp(wavelengthRaw, 200, 11000, 1064);
  const dIn_um = clamp(dInRaw, 10, 1e5, 1000);
  const f_mm = clamp(fRaw, 1, 1e4, 50);
  const m2 = clamp(m2Raw, 1, 50, 1);
  const f2_mm = clamp(f2Raw, 1, 1e4, 100);

  const lambda = wavelength * 1e-9;
  const wIn = dIn_um * 0.5e-6;
  const wf = focusedSpotRadius(lambda, wIn, f_mm * 1e-3); // TEM₀₀
  const w = m2 * wf; // embedded Gaussian of the real beam
  const w_um = w * 1e6;
  // A pinhole wider than 5 spot radii clips nothing (T = 1 − 2e−22); the cap also bounds the far-field quadrature.
  const pinhole_um = clamp(pinholeRaw, 0.5, Math.max(1, 10 * w_um), 100);
  const a = pinhole_um * 0.5e-6;

  const T = pinholeTransmission(a, w);
  const recommended_um = 3 * w_um; // 1.5 × the focal spot's 1/e² diameter: T = 98.9 %
  const d99_um = 2 * pinholeRadiusForTransmission(0.99, w) * 1e6;
  const airy_um = airyDiskDiameter(lambda, f_mm * 1e-3, dIn_um * 1e-6) * 1e6;
  const cutoffPeriod_um = ((lambda * f_mm * 1e-3) / a) * 1e6; // input structure finer than this is blocked
  const dOut_mm = (dIn_um * 1e-3 * f2_mm) / f_mm;

  const dMax = Math.max(8 * w_um, 1.2 * pinhole_um);
  const ds = Array.from({ length: 201 }, (_, i) => (i * dMax) / 200);
  const throughput = [
    { name: "Throughput", color: "#60a5fa", points: ds.map((D) => ({ x: round6(D), y: round6(100 * pinholeTransmission(D * 0.5e-6, w)) })) },
    { name: "Recommended (3w_f)", color: "#34d399", showPoints: true, points: [{ x: round6(recommended_um), y: round6(100 * pinholeTransmission(1.5 * w, w)) }] },
    { name: "Your pinhole", color: "#facc15", showPoints: true, points: [{ x: round6(pinhole_um), y: round6(100 * T) }] },
  ];

  // Beam at the collimating lens (far field of the pinhole), relative to the peak of the uncut beam.
  const W_mm = ((lambda * f2_mm * 1e-3) / (Math.PI * w)) * 1e3;
  const rhos = Array.from({ length: 121 }, (_, i) => (i * 2.5 * W_mm) / 120);
  const keep = (y: number) => (Number.isFinite(y) && y > 1e-12 ? round6(y) : null);
  const farField = [
    { name: "Without pinhole", color: "#9ca3af", dashed: true, points: rhos.map((r) => ({ x: round6(r), y: keep(Math.exp((-2 * r * r) / (W_mm * W_mm))) })) },
    { name: "Through your pinhole", color: "#f472b6", points: rhos.map((r) => ({ x: round6(r), y: keep(pinholeFarFieldIntensity(lambda, w, a, f2_mm * 1e-3, r * 1e-3)) })) },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={11000} />
        <ValidatedNumberInput label="Input beam 1/e² diameter at the lens (µm)" value={dInRaw} onChange={setDIn} min={10} max={1e5} />
        <ValidatedNumberInput label="Focusing lens focal length f (mm)" value={fRaw} onChange={setF} min={1} max={1e4} step="any" />
        <ValidatedNumberInput label="Beam quality M²" value={m2Raw} onChange={setM2} min={1} max={50} step="0.1" />
        <ValidatedNumberInput label="Pinhole diameter (µm)" value={pinholeRaw} onChange={setPinhole} min={0.5} max={Math.max(1, 10 * w_um)} step="any" />
        <ValidatedNumberInput label="Collimating lens focal length (mm)" value={f2Raw} onChange={setF2} min={1} max={1e4} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Focal spot 1/e² diameter 2w_f" value={`${fmt(2 * w_um)} µm`} subtext={m2 > 1 ? `TEM₀₀: ${fmt(2 * wf * 1e6)} µm` : "w_f = M²λf/(πw_in)"} tone="blue" />
        <ResultCard label="Recommended pinhole 3w_f" value={`${fmt(recommended_um)} µm`} subtext="1.5 × the spot diameter: passes 98.89 %" tone="green" />
        <ResultCard label="Smallest pinhole for 99 %" value={`${fmt(d99_um)} µm`} tone="green" />
        <ResultCard label="Your pinhole passes" value={pct(T)} subtext={`${fmt(pinhole_um / (2 * w_um), 3)} × the spot diameter`} tone="yellow" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ResultCard label="Finest input structure passed" value={`${fmt(cutoffPeriod_um)} µm period`} subtext="Noise of shorter period, λf/a, is blocked" tone="purple" />
        <ResultCard label="Output beam 1/e² diameter" value={`${fmt(dOut_mm)} mm`} subtext="After the collimating lens, uncut beam" tone="cyan" />
        <ResultCard label="Airy diameter 2.44λf/D (flat-top input)" value={`${fmt(airy_um)} µm`} subtext="For comparison: a uniformly filled aperture" tone="orange" />
      </div>

      {T < 0.9 && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The pinhole clips the Gaussian itself: it passes {pct(T)} and adds diffraction rings to the output beam (lower
          chart). A pinhole of about 1.5 × the spot diameter keeps the beam clean while still blocking the noise.
        </p>
      )}
      {m2 > 1 && (
        <p className="mb-6 rounded-lg border border-gray-700 bg-gray-900/60 p-3 text-sm text-gray-300">
          For M² &gt; 1 the spot and the throughput use a Gaussian M² times wider: an estimate. A spatial filter passes the
          TEM₀₀ part and strips the rest, so the real throughput of a poor beam is lower.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>w<sub>f</sub> = M²λf/(πw<sub>in</sub>), &nbsp; T = 1 − exp(−2a²/w<sub>f</sub>²) for a pinhole of radius a</p>
        <p>Output field: E(ρ) ∝ ∫₀ᵃ exp(−r²/w<sub>f</sub>²) J₀(2πrρ/(λf₂)) r dr, the Hankel transform of the cut Gaussian.</p>
      </div>

      <div className="space-y-6">
        <SimpleLineChart title="Pinhole throughput" xLabel="Pinhole diameter (µm)" yLabel="Power through the pinhole (%)" series={throughput} />
        <SimpleLineChart
          title="Beam profile at the collimating lens"
          xLabel="Radius ρ (mm)"
          yLabel="Intensity (relative to the uncut peak)"
          yScale="log"
          series={farField}
        />
      </div>
    </>
  );
}
