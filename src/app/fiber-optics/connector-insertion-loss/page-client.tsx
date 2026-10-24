"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { gapEtalonTransmission, gaussianCoupling, gaussianCouplingWorstTilt, lossDb } from "../../../physics/fiber-optics/gaussian-coupling";

const UM = 1e-6;
const DEG = Math.PI / 180;
// Airy × Gaussian-diffraction gap model is within 0.02 dB of a multi-pass beam sum up to here (see the module).
const MAX_GAP_UM = 5;

// IEC 61753-1 single-mode attenuation grades, random mate: mean and the limit met by > 97 % of connections (dB).
// Grade A is not yet defined. Source: P. Kolesar, IEEE 802.3bm SMF ad hoc, 30 Apr 2013, slide 6.
const IL_GRADES: Record<string, { mean: number; max: number; note: string }> = {
  B: { mean: 0.12, max: 0.25, note: "" },
  C: { mean: 0.25, max: 0.5, note: "un-tuned LC" },
  D: { mean: 0.5, max: 1.0, note: "MPO" },
};
// IEC 61753-1 single-mode return-loss grades, random mate (dB); grade 1 is 55 dB unmated. Same source.
const RL_GRADES: Record<string, { rl: number; note: string }> = {
  "1": { rl: 60, note: "APC" },
  "2": { rl: 45, note: "" },
  "3": { rl: 35, note: "" },
  "4": { rl: 26, note: "" },
};

export default function ConnectorInsertionLossPage() {
  const [ilGradeRaw, setIlGrade] = useURLState("ilGrade", "C");
  const [rlGradeRaw, setRlGrade] = useURLState("rlGrade", "2");
  const [numConnectors, setNumConnectors] = useURLState("numConnectors", 4, { min: 1 });
  const [fiberCoreDiam, setFiberCoreDiam] = useURLState("fiberCoreDiam", 9, { min: 1 }); // µm MFD
  const [lateralOffset, setLateralOffset] = useURLState("lateralOffset", 0.3, { min: 0 }); // µm
  const [angularMisalign, setAngularMisalign] = useURLState("angularMisalign", 0.3, { min: 0, max: 29 }); // degrees
  const [gapDistance, setGapDistance] = useURLState("gapDistance", 0.05, { min: 0, max: MAX_GAP_UM }); // µm
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.447, { min: 1, max: 2 }); // fibre phase index (SMF-28 at 1550 nm; 1.4682 is its group index)
  const [gapIndex, setGapIndex] = useURLState("gapIndex", 1, { min: 1, max: 2 }); // air; ≈ 1.46 with index-matching gel
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 200, max: 5000 }); // nm

  const ilGrade = ilGradeRaw in IL_GRADES ? ilGradeRaw : "C";
  const rlGrade = rlGradeRaw in RL_GRADES ? rlGradeRaw : "2";
  const n = Math.max(1, Math.round(numConnectors));

  const calc = useMemo(() => {
    const valid = fiberCoreDiam > 0 && lateralOffset >= 0 && angularMisalign >= 0 && angularMisalign < 30 &&
      gapDistance >= 0 && gapDistance <= MAX_GAP_UM && refractiveIndex >= 1 && gapIndex >= 1 && wavelength > 0;
    if (!valid) return { latLoss: NaN, angLoss: NaN, gapLoss: NaN, totalLoss: NaN };
    const w = (fiberCoreDiam / 2) * UM;
    const lambda = wavelength * 1e-9;
    const d = lateralOffset * UM, tilt = angularMisalign * DEG, z = gapDistance * UM;
    // At physical contact (z = 0) the tilt happens in glass; across a gap, in the gap medium.
    const joint = { w1: w, w2: w, lambda, n: z === 0 ? refractiveIndex : gapIndex };
    // Reflections in the gap (Airy) times the Gaussian overlap; at physical contact (z = 0) the gap terms vanish.
    const etalon = gapEtalonTransmission(refractiveIndex, gapIndex, z, lambda);
    return {
      latLoss: lossDb(gaussianCoupling({ ...joint, offset: d })),
      angLoss: lossDb(gaussianCoupling({ ...joint, tilt })),
      gapLoss: lossDb(gaussianCoupling({ ...joint, gap: z }) * etalon),
      totalLoss: lossDb(gaussianCouplingWorstTilt({ ...joint, offset: d, tilt, gap: z }) * etalon),
    };
  }, [fiberCoreDiam, lateralOffset, angularMisalign, gapDistance, refractiveIndex, gapIndex, wavelength]);

  const grade = IL_GRADES[ilGrade];

  const offsetData = useMemo(() => {
    const offsets = Array.from({ length: 100 }, (_, i) => i * 0.05);
    const w = (fiberCoreDiam / 2) * UM;
    const loss = offsets.map(d => {
      const v = lossDb(gaussianCoupling({ w1: w, w2: w, lambda: wavelength * 1e-9, offset: d * UM }));
      return Number.isFinite(v) ? v : null;
    });
    return [{ x: offsets, y: loss, type: "scatter" as const, mode: "lines" as const, name: "Loss (dB)", line: { color: "#f87171", width: 2 } }];
  }, [fiberCoreDiam, wavelength]);

  const budgetData = useMemo(() => {
    const { mean, max } = IL_GRADES[ilGrade];
    const counts = Array.from({ length: 20 }, (_, i) => i + 1);
    return [
      { x: counts, y: counts.map(k => mean * k), type: "scatter" as const, mode: "lines" as const, name: `Grade ${ilGrade} mean`, line: { color: "#22c55e", width: 2 }, fill: "tozeroy" as const, fillcolor: "rgba(34,197,94,0.1)" },
      { x: counts, y: counts.map(k => max * k), type: "scatter" as const, mode: "lines" as const, name: `Grade ${ilGrade} limit (all at max)`, line: { color: "#f87171", width: 2, dash: "dash" } },
    ];
  }, [ilGrade]);

  const fmt = (v: number) => (v === Infinity ? "∞ dB" : Number.isFinite(v) ? `${v.toFixed(3)} dB` : "—");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">IEC 61753-1 Attenuation Grade</span>
          <select value={ilGrade} onChange={e => setIlGrade(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(IL_GRADES).map(([g, v]) => (
              <option key={g} value={g}>Grade {g}: {v.mean} dB mean, {v.max} dB max{v.note ? ` (${v.note})` : ""}</option>
            ))}
          </select>
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">IEC 61753-1 Return-Loss Grade</span>
          <select value={rlGrade} onChange={e => setRlGrade(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(RL_GRADES).map(([g, v]) => (
              <option key={g} value={g}>Grade {g}: ≥ {v.rl} dB{v.note ? ` (${v.note})` : ""}</option>
            ))}
          </select>
        </label>
        <ValidatedNumberInput label="Number of Connections" value={numConnectors} onChange={setNumConnectors} min={1} step="1" />
        <ValidatedNumberInput label="Lateral Offset (µm)" value={lateralOffset} onChange={setLateralOffset} min={0} step="0.05" />
        <ValidatedNumberInput label="Angular Misalign (°)" value={angularMisalign} onChange={setAngularMisalign} min={0} max={29} step="0.1" />
        <ValidatedNumberInput label="End-face Gap (µm, ≤ 5)" value={gapDistance} onChange={setGapDistance} min={0} max={MAX_GAP_UM} step="0.01" />
        <ValidatedNumberInput label="MFD (µm)" value={fiberCoreDiam} onChange={setFiberCoreDiam} min={1} step="0.1" />
        <ValidatedNumberInput label="Fibre Phase Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1} max={2} step="0.001" />
        <ValidatedNumberInput label="Gap Medium Index" value={gapIndex} onChange={setGapIndex} min={1} max={2} step="0.01" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={5000} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Loss</p>
          <p className="text-xl font-bold text-red-400">{fmt(calc.latLoss)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular Loss</p>
          <p className="text-xl font-bold text-blue-400">{fmt(calc.angLoss)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gap (diffraction + reflection)</p>
          <p className="text-xl font-bold text-yellow-400">{fmt(calc.gapLoss)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total per Connection</p>
          <p className="text-xl font-bold text-green-400">{fmt(calc.totalLoss)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">This Joint ×{n}</p>
          <p className="text-xl font-bold text-cyan-400">{fmt(calc.totalLoss * n)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Grade {ilGrade} Mean ×{n}</p>
          <p className="text-xl font-bold text-green-400">{(grade.mean * n).toFixed(2)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Grade {ilGrade} Limit ×{n}</p>
          <p className="text-xl font-bold text-red-400">{(grade.max * n).toFixed(2)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Grade {rlGrade} Return Loss</p>
          <p className="text-xl font-bold text-purple-400">≥ {RL_GRADES[rlGrade].rl} dB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Loss vs Lateral Offset</h3>
          <ChartPanel data={offsetData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Offset (µm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Loss (dB)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 300,
            shapes: [{ type: "line" as const, x0: lateralOffset, x1: lateralOffset, y0: 0, y1: 5, line: { color: "#fbbf24", dash: "dash" } }],
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Link Budget vs Number of Connections</h3>
          <ChartPanel data={budgetData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Number of Connections", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Total Loss (dB)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 300,
            legend: { bgcolor: "transparent", font: { color: "#9ca3af" } },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Formulas & Notes</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">Lateral: η = exp(−d²/w²); angular: η = exp(−(π n_gap w θ/λ)²); gap: η = 1/(1 + (λz/(2π n_gap w²))²)</p>
          <p className="font-mono">Gap reflections (Airy): T = 1/(1 + F sin²(2π n_gap z/λ)), F = 4R/(1 − R)², R = ((n_core − n_gap)/(n_core + n_gap))²</p>
          <p>Physical-contact (PC, UPC, APC) connectors have z = 0, so only offset and tilt remain, and the tilt is taken in
            glass (the fibre index). With a gap the total uses the unfavourable tilt sense. Use the phase index (≈ 1.447 for
            SMF-28 at 1550 nm), not the datasheet group index 1.4682. The grade limits are random-mate statistics; adding N
            limit values gives a pessimistic worst case.</p>
        </div>
      </div>
    </>
  );
}
