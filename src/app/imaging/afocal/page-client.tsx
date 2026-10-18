"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { focalDistances, twoElementPower, twoLensABCD } from "../../../physics/imaging/gaussian-optics";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const DEG = Math.PI / 180;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function AfocalPage() {
  const [f1Raw, setF1] = useURLState("f1Mm", 100);
  const [f2Raw, setF2] = useURLState("f2Mm", 200);
  const [separationRaw, setSeparation] = useURLState("separationMm", 300);
  const [angleRaw, setAngle] = useURLState("objectAngleDeg", 2); // input field half-angle
  const [beamRaw, setBeam] = useURLState("beamDiameterMm", 5); // collimated input beam
  const f1 = clamp(f1Raw, -5000, 5000, 100);
  const f2 = clamp(f2Raw, -5000, 5000, 200);
  const t = clamp(separationRaw, 0, 10000, 300);
  const thetaDeg = clamp(angleRaw, 0, 30, 2);
  const beam = clamp(beamRaw, 0.1, 500, 5);

  const tAfocal = f1 + f2;
  const abcd = twoLensABCD(f1, f2, t);
  const { efl, bfd, ffd } = focalDistances(abcd);
  const powerD = twoElementPower(1000 / f1, 1000 / f2, t / 1000); // dioptres

  let problem = "";
  if (Math.abs(f1) < 0.1 || Math.abs(f2) < 0.1) problem = "Each focal length must be non-zero (at least 0.1 mm in magnitude).";
  const afocalPossible = tAfocal > 0;
  // Afocal within 1 µm of spacing: then C = 0 to rounding.
  const afocal = !problem && afocalPossible && Math.abs(t - tAfocal) < 1e-3;
  const M = -f1 / f2; // angular magnification of the afocal design
  const kind = f1 > 0 && f2 > 0 ? "Keplerian (inverted, real intermediate focus)" : "Galilean (upright, no real focus)";
  const thetaOut = Math.atan(M * Math.tan(thetaDeg * DEG)) / DEG;

  const notice = problem
    ? ""
    : !afocalPossible
      ? `f₁ + f₂ = ${tAfocal.toFixed(1)} mm ≤ 0: no positive spacing makes these lenses afocal.`
      : afocal
        ? ""
        : `The spacing is ${(t - tAfocal).toFixed(3)} mm from the afocal spacing f₁ + f₂, so the system has power and a collimated beam leaves it converging or diverging.`;

  // System power against spacing: a straight line through 0 at t = f₁ + f₂.
  const tLo = Math.max(0, Math.min(t, tAfocal) - 0.3 * Math.max(Math.abs(tAfocal), 50));
  const tHi = Math.max(t, tAfocal) + 0.3 * Math.max(Math.abs(tAfocal), 50);
  const ts = [tLo, tHi];
  const chart = problem ? [] : [
    { x: ts, y: ts.map((s) => twoElementPower(1000 / f1, 1000 / f2, s / 1000)), type: "scatter" as const, mode: "lines" as const, name: "System power (D)", line: { color: "#60a5fa" } },
    { x: [t], y: [powerD], type: "scatter" as const, mode: "markers" as const, name: "Current spacing", marker: { color: "#f87171", size: 10 } },
    ...(afocalPossible ? [{ x: [tAfocal], y: [0], type: "scatter" as const, mode: "markers" as const, name: "Afocal (f₁ + f₂)", marker: { color: "#4ade80", size: 10, symbol: "diamond" } }] : []),
  ];

  const layout = { paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 70, r: 20, t: 20, b: 60 } };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Lens 1 (objective) focal length f₁ (mm)" value={f1Raw} onChange={setF1} min={-5000} max={5000} step="0.1" />
          <ValidatedNumberInput label="Lens 2 (eyepiece) focal length f₂ (mm)" value={f2Raw} onChange={setF2} min={-5000} max={5000} step="0.1" />
          <ValidatedNumberInput label="Lens spacing t (mm)" value={separationRaw} onChange={setSeparation} min={0} max={10000} step="0.1" />
          <ValidatedNumberInput label="Input field half-angle θ (°)" value={angleRaw} onChange={setAngle} min={0} max={30} step="0.1" />
          <ValidatedNumberInput label="Input beam diameter (mm)" value={beamRaw} onChange={setBeam} min={0.1} max={500} step="0.1" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {problem ? (
            <p className="text-red-400">{problem}</p>
          ) : (
            <>
              {row("Afocal spacing f₁ + f₂", fmt(tAfocal, 2, " mm"), "text-green-400")}
              {row("System matrix A, B", `${fmt(abcd.A, 4)}, ${fmt(abcd.B, 2)} mm`)}
              {row("System matrix C, D", `${fmt(abcd.C * 1000, 4)} D, ${fmt(abcd.D, 4)}`)}
              {afocal ? (
                <>
                  {row("Type", kind, "text-purple-400")}
                  {row("Angular magnification M = −f₁/f₂", fmt(M, 4, "×"), "text-blue-400")}
                  {row("Output half-angle, tan θ′ = M tan θ", fmt(thetaOut, 3, "°"), "text-yellow-400")}
                  {row("Output beam diameter |f₂/f₁|·D", fmt(beam * Math.abs(f2 / f1), 3, " mm"))}
                  {f1 > 0 && f2 > 0 && row("Intermediate image (field stop) diameter 2f₁ tan θ", fmt(2 * f1 * Math.tan(thetaDeg * DEG), 3, " mm"))}
                </>
              ) : (
                <>
                  {row("System power", fmt(powerD, 4, " D"), "text-blue-400")}
                  {row("Effective focal length −1/C", fmt(efl, 2, " mm"))}
                  {row("Back focal distance −A/C (from lens 2)", fmt(bfd, 2, " mm"), "text-yellow-400")}
                  {row("Front focal distance −D/C (before lens 1)", fmt(ffd, 2, " mm"))}
                </>
              )}
            </>
          )}
          {notice && <p className="text-yellow-400 text-sm">{notice}</p>}
        </div>
      </div>

      {chart.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">System power vs lens spacing</h2>
          <ChartPanel data={chart} layout={{ ...layout, xaxis: { title: "Lens spacing t (mm)", gridcolor: "#333" }, yaxis: { title: "Power (D)", gridcolor: "#333" }, showlegend: true }} />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>[A B; C D] = L(f₂)·T(t)·L(f₁): A = 1 − t/f₁, B = t, C = −1/f₁ − 1/f₂ + t/(f₁f₂), D = 1 − t/f₂</p>
          <p>Power φ = −C = φ₁ + φ₂ − tφ₁φ₂; afocal when C = 0, t = f₁ + f₂</p>
          <p>Afocal: M = D = −f₁/f₂, beam size × A = −f₂/f₁</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Paraxial thin lenses in air. Keplerian telescopes (both lenses positive) invert the image and have a real
          intermediate focus where a field stop or spatial filter can sit; Galilean ones (one negative lens) are upright
          and shorter. As a beam expander, either scales a collimated beam&apos;s diameter by |f₂/f₁| and divides its
          divergence by the same ratio. Away from the afocal spacing the system has power, and the angle a ray leaves at
          depends on its height, so it has no single angular magnification.
        </p>
      </div>
    </>
  );
}
