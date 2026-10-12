"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { angledFaceReflectance, returnLossDb } from "../../../physics/fiber-optics/gaussian-coupling";

const DEG = Math.PI / 180;
const ANGLE_PRESETS = [
  { label: "Flat / PC (0°)", angle: 0 },
  { label: "APC (8°)", angle: 8 },
];
// IEC 61753-1 single-mode return-loss grades for a mated connection, random mate (grade 1: 55 dB unmated).
// Source: P. Kolesar, IEEE 802.3bm SMF ad hoc, 30 Apr 2013, slide 6.
const RL_GRADES = [
  { grade: "1", rl: 60, note: "APC" },
  { grade: "2", rl: 45, note: "" },
  { grade: "3", rl: 35, note: "" },
  { grade: "4", rl: 26, note: "" },
];

export default function ConnectorReturnLossPage() {
  const [n1, setN1] = useURLState("n1", 1.447); // phase index of SMF-28 at 1550 nm (1.4682 is its group index)
  const [n2, setN2] = useURLState("n2", 1.0);
  const [angle, setAngle] = useURLState("angle", 0); // end-face polish angle, degrees
  const [mfd, setMfd] = useURLState("mfd", 10.4); // µm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm

  const calc = useMemo(() => {
    const valid = n1 >= 1 && n2 >= 1 && angle >= 0 && angle < 45 && mfd > 0 && wavelength > 0;
    const R = valid ? angledFaceReflectance(n1, n2, angle * DEG, (mfd / 2) * 1e-6, wavelength * 1e-9) : NaN;
    const Rflat = valid ? angledFaceReflectance(n1, n2, 0, (mfd / 2) * 1e-6, wavelength * 1e-9) : NaN;
    return { R, rl: returnLossDb(R), rlFlat: returnLossDb(Rflat) };
  }, [n1, n2, angle, mfd, wavelength]);

  const chartData = useMemo(() => {
    const angles = Array.from({ length: 121 }, (_, i) => i * 0.1);
    const w = (mfd / 2) * 1e-6, lambda = wavelength * 1e-9;
    // Plotly can't draw Infinity (n₁ = n₂): show those points as gaps.
    const rl = angles.map(a => {
      const v = returnLossDb(angledFaceReflectance(n1, n2, a * DEG, w, lambda));
      return Number.isFinite(v) ? v : null;
    });
    return [
      { x: angles, y: rl, type: "scatter" as const, mode: "lines" as const, name: "Return loss", line: { color: "#f87171" } },
      { x: [angle], y: [Number.isFinite(calc.rl) ? calc.rl : null], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#60a5fa", size: 12 } },
    ];
  }, [n1, n2, mfd, wavelength, angle, calc.rl]);

  const fmtRl = (v: number) => (v === Infinity ? "∞ (no index step)" : Number.isFinite(v) ? `${v.toFixed(1)} dB` : "—");

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {ANGLE_PRESETS.map((p) => (
          <button key={p.label} onClick={() => setAngle(p.angle)} className={`rounded-full border px-3 py-1 text-sm transition ${angle === p.angle ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{p.label}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <ValidatedNumberInput label="Fiber Phase Index" value={n1} onChange={setN1} min={1.0} max={2.0} step="0.001" />
        <ValidatedNumberInput label="External Index" value={n2} onChange={setN2} min={1.0} max={2.0} step="0.001" />
        <ValidatedNumberInput label="End-face Angle (°)" value={angle} onChange={setAngle} min={0} max={20} step="0.5" />
        <ValidatedNumberInput label="MFD (µm)" value={mfd} onChange={setMfd} min={1} max={50} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Return Loss (this face)</p>
          <p className="text-2xl font-bold text-blue-400">{fmtRl(calc.rl)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Flat-face Fresnel RL</p>
          <p className="text-2xl font-bold text-green-400">{fmtRl(calc.rlFlat)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Reflectance into the Mode</p>
          <p className="text-2xl font-bold text-yellow-400">{Number.isFinite(calc.R) ? calc.R.toExponential(2) : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Reflected Power</p>
          <p className="text-2xl font-bold text-red-400">{Number.isFinite(calc.R) ? `${(calc.R * 100).toPrecision(3)}%` : "—"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "End-face Angle (°)", gridcolor: "#374151" },
          yaxis: { title: "Return Loss (dB)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <p>Flat face: R = ((n₁ − n₂)/(n₁ + n₂))². Angled face at α: unpolarized Fresnel R(α) times the coupling of the
          reflected beam, tilted by 2α, back into the mode: exp(−(2π n₁ w α/λ)²), w = MFD/2. For angled faces this is an
          optimistic bound: the true LP01 mode has wider far-field tails than a Gaussian, and surface scatter adds to it, so
          APC connectors are specified at ≥ 55 dB unmated and ≥ 60 dB mated (IEC grade 1), well below the ≈ 94 dB computed
          here for 8°.</p>
        <p>This is the open (unmated) end face against a medium of index n₂. A mated physical-contact connector has no gap;
          its return loss is set by polish quality and is specified by grade (IEC 61753-1, random mate):{" "}
          {RL_GRADES.map((g) => `grade ${g.grade} ≥ ${g.rl} dB${g.note ? ` (${g.note})` : ""}`).join(", ")}.</p>
      </div>
    </>
  );
}
