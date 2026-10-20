"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { beamRadius, divergenceHalfAngle, m2FromWaistDivergence, rayleighRange } from "../../../physics/wave-optics/gaussian-beam";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const COMPARE = [
  { m2: 1, color: "#22c55e" },
  { m2: 2, color: "#facc15" },
  { m2: 5, color: "#f87171" },
];

export default function M2FactorPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1064); // nm
  const [w0Raw, setW0] = useURLState("w0", 0.5); // mm, second-moment waist radius
  const [thetaRaw, setTheta] = useURLState("theta", 2); // mrad, full-angle divergence

  const wavelength = clamp(wavelengthRaw, 100, 20000, 1064);
  const w0_mm = clamp(w0Raw, 0.001, 100, 0.5);
  const theta_mrad = clamp(thetaRaw, 0.001, 1000, 2);

  const lambda = wavelength * 1e-9;
  const w0 = w0_mm * 1e-3;
  const halfAngle = theta_mrad * 1e-3 / 2;
  const m2 = m2FromWaistDivergence(lambda, w0, halfAngle);
  const impossible = m2 < 1;
  const tem00 = { lambda, w0 };
  const thetaDL_mrad = 2 * divergenceHalfAngle(tem00) * 1e3; // full angle of a TEM₀₀ beam with this waist
  const bpp = w0_mm * halfAngle * 1e3; // mm·mrad
  const zR_mm = rayleighRange({ lambda, w0, m2: Math.max(m2, 1) }) * 1e3;

  const zMax = 3 * rayleighRange(tem00) * 1e3;
  const zs = Array.from({ length: 201 }, (_, i) => -zMax + (i * 2 * zMax) / 200);
  const curve = (M: number) => zs.map((z) => ({ x: round6(z), y: round6(beamRadius({ lambda, w0, m2: M }, z * 1e-3) * 1e3) }));
  const series = [
    ...COMPARE.map(({ m2: M, color }) => ({ name: `M² = ${M}`, color, dashed: true, points: curve(M) })),
    ...(impossible ? [] : [{ name: `This beam, M² = ${fmt(m2, 3)}`, color: "#60a5fa", points: curve(m2) }]),
  ];

  const tone = impossible ? "red" : m2 <= 1.5 ? "green" : m2 <= 2 ? "yellow" : "orange";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={20000} />
        <ValidatedNumberInput label="Waist radius w₀ (mm, second moment)" value={w0Raw} onChange={setW0} min={0.001} max={100} />
        <ValidatedNumberInput label="Divergence θ (mrad, full angle)" value={thetaRaw} onChange={setTheta} min={0.001} max={1000} />
      </div>

      {impossible && (
        <p className="mb-6 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">
          M² below 1 is physically impossible: no beam diverges less than a TEM₀₀ Gaussian of the same waist. Check that
          w₀ is a radius (not a diameter), that θ is the full angle, and that both are second-moment (D4σ) or 1/e² widths
          measured as ISO 11146 describes.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="M² = π w₀ θ / (2λ)" value={fmt(m2)} subtext={impossible ? "Impossible: below 1" : "1 for a TEM₀₀ Gaussian"} tone={tone} />
        <ResultCard label="Beam parameter product w₀θ/2" value={`${fmt(bpp)} mm·mrad`} subtext={`TEM₀₀: λ/π = ${fmt(wavelength / Math.PI / 1000)} mm·mrad`} tone="green" />
        <ResultCard label="TEM₀₀ divergence (full angle)" value={`${fmt(thetaDL_mrad)} mrad`} subtext="2λ/(πw₀) for the same waist" tone="yellow" />
        <ResultCard label="Rayleigh range πw₀²/(M²λ)" value={impossible ? "—" : `${fmt(zR_mm)} mm`} subtext={impossible ? "Not defined for M² < 1" : undefined} tone="blue" />
      </div>

      <SimpleLineChart
        title="Beam radius around the waist for the same w₀"
        xLabel="Distance from waist z (mm)"
        yLabel="Beam radius w(z) (mm)"
        series={series}
      />
    </>
  );
}
