"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";

const wavelengthPresets = [850, 1310, 1550];

export default function CouplingEfficiencyCalculator() {
  const [sourceNa, setSourceNa] = useState(0.22);
  const [fiberNa, setFiberNa] = useState(0.12);
  const [mfd, setMfd] = useState(10.4);
  const [lateralOffset, setLateralOffset] = useState(0);
  const [angularMisalign, setAngularMisalign] = useState(0);
  const [wavelength, setWavelength] = useState(1550);

  const w0 = useMemo(() => mfd / 2, [mfd]);
  const naMismatchLoss = useMemo(() => (sourceNa <= fiberNa ? 1 : (fiberNa / sourceNa) ** 2), [sourceNa, fiberNa]);
  const lateralCoupling = useMemo(() => Math.exp(-((lateralOffset / w0) ** 2)), [lateralOffset, w0]);
  const angularCoupling = useMemo(() => {
    const theta = (angularMisalign * Math.PI) / 180;
    const lambda = wavelength * 1e-3;
    const n = 1.46;
    const exponent = ((Math.PI * n * w0 * theta) / lambda) ** 2;
    return Math.exp(-exponent);
  }, [angularMisalign, w0, wavelength]);
  const totalCoupling = useMemo(() => naMismatchLoss * lateralCoupling * angularCoupling, [naMismatchLoss, lateralCoupling, angularCoupling]);
  const lossDb = totalCoupling === 0 ? Infinity : -10 * Math.log10(totalCoupling);

  const plotData = useMemo(() => {
    const offsets = Array.from({ length: 180 }, (_, i) => (i * 20) / 179);
    const efficiencies = offsets.map((offset) => Math.exp(-((offset / w0) ** 2)) * angularCoupling * naMismatchLoss * 100);
    return [
      { x: offsets, y: efficiencies, type: "scatter" as const, mode: "lines", name: "Coupling efficiency", line: { color: "#3b82f6", width: 3 } },
      { x: [lateralOffset], y: [totalCoupling * 100], type: "scatter" as const, mode: "markers", name: "Current", marker: { color: "#22c55e", size: 12 } },
    ];
  }, [w0, angularCoupling, naMismatchLoss, lateralOffset, totalCoupling]);

  return (
    <CalculatorShell
      backHref="/fiber-optics"
      backLabel="Fiber Optics"
      title="Fiber Coupling Efficiency"
      description="Estimate Gaussian-to-fiber coupling loss from NA mismatch, lateral offset, and angular misalignment."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button key={preset} onClick={() => setWavelength(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset} nm</button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Source NA" value={sourceNa} onChange={setSourceNa} min={0.05} max={0.5} step={0.01} />
        <InputSlider label="Fiber NA" value={fiberNa} onChange={setFiberNa} min={0.05} max={0.5} step={0.01} />
        <InputSlider label="Mode field diameter" value={mfd} onChange={setMfd} min={4} max={30} step={0.1} unit="µm" />
        <InputSlider label="Lateral offset" value={lateralOffset} onChange={setLateralOffset} min={0} max={20} step={0.1} unit="µm" />
        <InputSlider label="Angular misalignment" value={angularMisalign} onChange={setAngularMisalign} min={0} max={5} step={0.1} unit="deg" />
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={850} max={1650} step={1} unit="nm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="Total coupling" value={`${(totalCoupling * 100).toFixed(2)}%`} tone={totalCoupling > 0.6 ? "green" : totalCoupling > 0.2 ? "yellow" : "red"} />
        <ResultCard label="Insertion loss" value={isFinite(lossDb) ? `${lossDb.toFixed(2)} dB` : "∞ dB"} tone="blue" />
        <ResultCard label="NA mismatch" value={`${(naMismatchLoss * 100).toFixed(1)}%`} tone="purple" />
        <ResultCard label="Mode radius w₀" value={`${w0.toFixed(2)} µm`} tone="yellow" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>η<sub>lateral</sub> = exp(-(offset / w₀)²)</p>
        <p>η<sub>angular</sub> = exp(-(π·n·w₀·θ / λ)²)</p>
        <p>η<sub>NA</sub> = (NA<sub>fiber</sub> / NA<sub>source</sub>)² when the source overfills the fiber acceptance cone.</p>
      </div>

      <ChartPanel
        data={plotData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Lateral offset (µm)", gridcolor: "#374151" },
          yaxis: { title: "Coupling efficiency (%)", gridcolor: "#374151", range: [0, 105] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          showlegend: false,
        }}
      />
    </CalculatorShell>
  );
}
