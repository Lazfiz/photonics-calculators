"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { gaussianCoupling, gaussianCouplingWorstTilt, lossDb } from "../../../physics/fiber-optics/gaussian-coupling";

const UM = 1e-6;
const DEG = Math.PI / 180;

export default function SpliceLossPage() {
  const [lateralOffset, setLateralOffset] = useURLState("lateralOffset", 0.5, { min: 0 }); // µm
  const [angularMisalign, setAngularMisalign] = useURLState("angularMisalign", 0.5, { min: 0, max: 29 }); // degrees
  const [coreDiam, setCoreDiam] = useURLState("coreDiam", 9, { min: 1 }); // µm, MFD of fibre 1 (SMF-28 ≈ 9.2 at 1310, 10.4 at 1550)
  const [mfd2, setMfd2] = useURLState("mfd2", 9, { min: 1 }); // µm, MFD of fibre 2
  const [gap, setGap] = useURLState("gap", 0, { min: 0 }); // µm
  const [gapIndex, setGapIndex] = useURLState("gapIndex", 1.45, { min: 1, max: 2 }); // medium the tilt and gap are in: 1 air, ≈ 1.45 fusion splice or gel
  const [wavelength_nm, setWavelength] = useURLState("wavelength", 1550, { min: 200, max: 5000 });

  const calc = useMemo(() => {
    const valid = lateralOffset >= 0 && angularMisalign >= 0 && angularMisalign < 30 && coreDiam > 0 && mfd2 > 0 &&
      gap >= 0 && gapIndex >= 1 && wavelength_nm > 0;
    const base = {
      w1: (coreDiam / 2) * UM, w2: (mfd2 / 2) * UM, lambda: wavelength_nm * 1e-9, n: gapIndex,
    };
    const d = lateralOffset * UM, tilt = angularMisalign * DEG, z = gap * UM;
    const loss = (j: Partial<typeof base> & { offset?: number; tilt?: number; gap?: number }) =>
      valid ? lossDb(gaussianCouplingWorstTilt({ ...base, ...j })) : NaN;
    const w = (coreDiam / 2) * UM;
    return {
      // Each effect alone between equal modes of fibre 1's radius, then the mismatch alone, then the full joint.
      latLoss: loss({ w2: w, offset: d }),
      angLoss: loss({ w2: w, tilt }),
      gapLoss: loss({ w2: w, gap: z }),
      mismatchLoss: loss({}),
      totalLoss: loss({ offset: d, tilt, gap: z }),
    };
  }, [lateralOffset, angularMisalign, coreDiam, mfd2, gap, gapIndex, wavelength_nm]);

  const chartData = useMemo(() => {
    // Equal modes of fibre 1's radius, as in the Lateral and Angular cards. Plotly can't draw Infinity: use gaps.
    const w = (coreDiam / 2) * UM;
    const base = { w1: w, w2: w, lambda: wavelength_nm * 1e-9, n: Math.max(gapIndex, 1) };
    const finite = (v: number) => (Number.isFinite(v) ? v : null);
    const offsets = Array.from({ length: 100 }, (_, i) => i * 0.05);
    const angles = Array.from({ length: 100 }, (_, i) => i * 0.02);
    const latLosses = offsets.map(d => finite(lossDb(gaussianCoupling({ ...base, offset: d * UM }))));
    const angLosses = angles.map(a => finite(lossDb(gaussianCoupling({ ...base, tilt: a * DEG }))));

    return [
      { x: offsets, y: latLosses, type: "scatter" as const, mode: "lines" as const, name: "Lateral", line: { color: "#f87171" }, xaxis: "x", yaxis: "y" },
      { x: angles, y: angLosses, type: "scatter" as const, mode: "lines" as const, name: "Angular", line: { color: "#60a5fa" }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [coreDiam, wavelength_nm, gapIndex]);

  const fmt = (v: number) => (v === Infinity ? "∞ dB" : Number.isFinite(v) ? `${v.toFixed(3)} dB` : "—");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Lateral Offset (µm)" value={lateralOffset} onChange={setLateralOffset} min={0} step="any" />
        <ValidatedNumberInput label="Angular Misalignment (°)" value={angularMisalign} onChange={setAngularMisalign} min={0} max={29} step="any" />
        <ValidatedNumberInput label="End-face Gap (µm)" value={gap} onChange={setGap} min={0} step="any" />
        <ValidatedNumberInput label="Medium Index (1 air, 1.45 fusion/gel)" value={gapIndex} onChange={setGapIndex} min={1} max={2} step="any" />
        <ValidatedNumberInput label="MFD, Fibre 1 (µm)" value={coreDiam} onChange={setCoreDiam} min={1} step="any" />
        <ValidatedNumberInput label="MFD, Fibre 2 (µm)" value={mfd2} onChange={setMfd2} min={1} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength_nm} onChange={setWavelength} min={200} max={5000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral</p>
          <p className="text-xl font-bold text-red-400">{fmt(calc.latLoss)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular</p>
          <p className="text-xl font-bold text-blue-400">{fmt(calc.angLoss)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gap</p>
          <p className="text-xl font-bold text-yellow-400">{fmt(calc.gapLoss)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">MFD Mismatch</p>
          <p className="text-xl font-bold text-purple-400">{fmt(calc.mismatchLoss)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total (combined)</p>
          <p className="text-xl font-bold text-green-400">{fmt(calc.totalLoss)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Lateral Offset (µm)", gridcolor: "#374151", domain: [0, 0.47] },
          yaxis: { title: "Loss (dB)", gridcolor: "#374151", color: "#f87171" },
          xaxis2: { title: "Angular Misalign (°)", gridcolor: "#374151", anchor: "y2", domain: [0.55, 1] },
          yaxis2: { title: "Loss (dB)", gridcolor: "#374151", color: "#60a5fa", anchor: "x2" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-1">
        <p>Equal modes (w = MFD/2): offset η = exp(−d²/w²), tilt η = exp(−(π n w θ/λ)²), gap η = 1/(1 + (λz/(2π n w²))²).</p>
        <p>MFD mismatch η = (2w₁w₂/(w₁² + w₂²))². The total is the full Gaussian overlap of all effects together, with the
          tilt in its unfavourable sense; with a gap it is not exactly the sum of the separate losses. n is the index of the
          medium the tilt and gap are in (glass for a fusion splice). Fresnel reflection at an air gap is not included.</p>
      </div>
    </>
  );
}
