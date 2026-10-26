"use client";

import { useMemo } from "react";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import { useURLState } from "../../../hooks/use-url-state";
import { gaussianCoupling, lossDb, waistFromNA } from "../../../physics/fiber-optics/gaussian-coupling";

const wavelengthPresets = [850, 1310, 1550];
const UM = 1e-6;

export default function CouplingEfficiencyCalculator() {
  const [sourceNa, setSourceNa] = useURLState("sourceNa", 0.22, { min: 0.02, max: 0.5 });
  const [mfd, setMfd] = useURLState("mfd", 10.4, { min: 2, max: 30 });
  const [lateralOffset, setLateralOffset] = useURLState("lateralOffset", 0, { min: 0, max: 20 });
  const [angularMisalign, setAngularMisalign] = useURLState("angularMisalign", 0, { min: 0, max: 5 });
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 400, max: 2000 });
  const [mediumIndex, setMediumIndex] = useURLState("mediumIndex", 1.0, { min: 1.0, max: 1.5 });

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const valid = sourceNa > 0 && sourceNa < 1 && mfd > 0 && lateralOffset >= 0 && angularMisalign >= 0 &&
      angularMisalign < 30 && wavelength > 0 && mediumIndex >= 1;
    // Beam waist from its far-field 1/e² divergence, placed on the fibre face (Kogelnik & Li 1966).
    const w1 = valid ? waistFromNA(sourceNa, lambda) : NaN;
    const w2 = valid ? (mfd / 2) * UM : NaN;
    const joint = { w1, w2, lambda, n: mediumIndex };
    const offset = lateralOffset * UM, tilt = (angularMisalign * Math.PI) / 180;
    const mismatch = gaussianCoupling(joint);
    const total = gaussianCoupling({ ...joint, offset, tilt });
    return {
      w1_um: w1 / UM, w2_um: w2 / UM, mismatch, total, lossDb: lossDb(total),
      fiberModeNa: lambda / (Math.PI * w2), // divergence of the fibre mode, same relation
      lateral: gaussianCoupling({ ...joint, offset }) / mismatch,
      angular: gaussianCoupling({ ...joint, tilt }) / mismatch,
    };
  }, [sourceNa, mfd, lateralOffset, angularMisalign, wavelength, mediumIndex]);

  const series = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const joint = {
      w1: waistFromNA(sourceNa, lambda), w2: (mfd / 2) * UM, lambda, n: Math.max(1, mediumIndex),
      tilt: (angularMisalign * Math.PI) / 180,
    };
    const offsets = Array.from({ length: 180 }, (_, i) => (i * 20) / 179);
    const efficiencies = offsets.map((offset) => gaussianCoupling({ ...joint, offset: offset * UM }) * 100);
    return [
      { name: "Coupling efficiency", color: "#3b82f6", points: offsets.map((x, i) => ({ x, y: efficiencies[i] })) },
      { name: "Current point", color: "#22c55e", points: [{ x: lateralOffset, y: gaussianCoupling({ ...joint, offset: lateralOffset * UM }) * 100 }] },
    ];
  }, [sourceNa, mfd, wavelength, mediumIndex, angularMisalign, lateralOffset]);

  const pct = (v: number, digits: number) => (Number.isFinite(v) ? `${(v * 100).toFixed(digits)}%` : "—");

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button key={preset} onClick={() => setWavelength(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset} nm</button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Beam divergence NA (1/e² half-angle)" value={sourceNa} onChange={setSourceNa} min={0.02} max={0.5} step={0.01} />
        <InputSlider label="Fibre mode field diameter" value={mfd} onChange={setMfd} min={2} max={30} step={0.1} unit="µm" />
        <InputSlider label="Lateral offset" value={lateralOffset} onChange={setLateralOffset} min={0} max={20} step={0.1} unit="µm" />
        <InputSlider label="Angular misalignment" value={angularMisalign} onChange={setAngularMisalign} min={0} max={5} step={0.1} unit="deg" />
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={400} max={2000} step={1} unit="nm" />
        <InputSlider label="Medium index n" value={mediumIndex} onChange={setMediumIndex} min={1.0} max={1.5} step={0.01} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="Total coupling" value={pct(calc.total, 2)} tone={calc.total > 0.6 ? "green" : calc.total > 0.2 ? "yellow" : "red"} />
        <ResultCard label="Insertion loss" value={Number.isFinite(calc.lossDb) ? `${calc.lossDb.toFixed(2)} dB` : calc.lossDb === Infinity ? "∞ dB" : "—"} tone="blue" />
        <ResultCard label="Mode mismatch" value={pct(calc.mismatch, 1)} tone="purple" />
        <ResultCard label="Beam waist w₀ / fibre mode w" value={Number.isFinite(calc.w1_um) ? `${calc.w1_um.toFixed(2)} / ${calc.w2_um.toFixed(2)} µm` : "—"} tone={sourceNa > 0.3 ? "orange" : "yellow"} subtext={sourceNa > 0.3 ? "NA > 0.3: beyond the paraxial Gaussian model" : undefined} />
        <ResultCard label="Fibre mode NA λ/(πw)" value={Number.isFinite(calc.fiberModeNa) ? calc.fiberModeNa.toFixed(3) : "—"} tone="blue" />
        <ResultCard label="Offset factor" value={pct(calc.lateral, 1)} tone="green" />
        <ResultCard label="Tilt factor" value={pct(calc.angular, 1)} tone="green" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Beam waist w₀ = λ/(π·NA), fibre mode radius w = MFD/2, both on the fibre face.</p>
        <p>η<sub>mismatch</sub> = (2w₀w/(w₀² + w²))²; η<sub>offset</sub> = exp(−2d²/(w₀² + w²));
          η<sub>tilt</sub> = exp(−2(π n θ/λ)² w₀²w²/(w₀² + w²)).</p>
        <p>Best coupling is when the beam NA equals the fibre mode NA. Paraxial: reliable for NA ≲ 0.3 (w₀ ≳ λ). Single-mode Gaussian model: for a multimode fibre
          or an extended source, use the étendue (NA and core area) instead.</p>
      </div>

      <SimpleLineChart
        title="Coupling efficiency vs lateral offset"
        xLabel="Lateral offset (µm)"
        yLabel="Coupling efficiency (%)"
        series={series}
      />
    </>
  );
}
