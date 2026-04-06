"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";

const presets = [
  { label: "Tight pointing", wavelength: 1550, txBeamWaist: 2.5, jitterRMS: 0.5, misalign: 0.2, rxAperture: 10 },
  { label: "Moderate jitter", wavelength: 1550, txBeamWaist: 2.5, jitterRMS: 2, misalign: 1, rxAperture: 10 },
  { label: "Small aperture", wavelength: 1550, txBeamWaist: 2.5, jitterRMS: 1, misalign: 0.5, rxAperture: 4 },
];
const currentHref = "/free-space-comms/pointing-loss";

export default function PointingLossPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [txBeamWaist, setTxBeamWaist] = useURLState("txBeamWaist", 2.5);
  const [jitterRMS, setJitterRMS] = useURLState("jitterRMS", 1);
  const [misalign, setMisalign] = useURLState("misalign", 0);
  const [rxAperture, setRxAperture] = useURLState("rxAperture", 10);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const w0 = txBeamWaist * 1e-2;
    const thetaDiv = lambda / (Math.PI * w0);
    const thetaDivUrad = thetaDiv * 1e6;
    const totalErrorRad = Math.sqrt(jitterRMS * jitterRMS + misalign * misalign) * 1e-6;
    const zR = Math.PI * w0 * w0 / lambda;
    const R = 1000;
    const wR = w0 * Math.sqrt(1 + (R / zR) ** 2);
    const etaPoint = Math.exp((-2 * totalErrorRad * totalErrorRad) / (thetaDiv * thetaDiv));
    const pointingLoss = -10 * Math.log10(Math.max(etaPoint, 1e-12));
    const offsetAtRx = totalErrorRad * R;
    const rxRadius = (rxAperture * 1e-2) / 2;
    const etaAperture = 1 - Math.exp(-2 * (rxRadius / wR) ** 2);
    const etaCombined = etaPoint * etaAperture;
    const totalLoss = -10 * Math.log10(Math.max(etaCombined, 1e-12));
    return { thetaDivUrad, pointingLoss, etaPoint, etaAperture, etaCombined, totalLoss, wRcm: wR * 100, offsetCm: offsetAtRx * 100 };
  }, [wavelength, txBeamWaist, jitterRMS, misalign, rxAperture]);

  const series = useMemo(() => {
    const jitterVals = Array.from({ length: 120 }, (_, i) => 0.05 + i * 0.1);
    const lambda = wavelength * 1e-9;
    const w0 = txBeamWaist * 1e-2;
    const thetaDiv = lambda / (Math.PI * w0);
    const rxRadius = (rxAperture * 1e-2) / 2;
    const zR = Math.PI * w0 * w0 / lambda;
    const R = 1000;
    const wR = w0 * Math.sqrt(1 + (R / zR) ** 2);
    const etaAp = 1 - Math.exp(-2 * (rxRadius / wR) ** 2);
    const losses = jitterVals.map((j) => {
      const err = Math.sqrt(j * j + misalign * misalign) * 1e-6;
      const eta = Math.exp((-2 * err * err) / (thetaDiv * thetaDiv));
      return -10 * Math.log10(Math.max(eta, 1e-12));
    });
    const totalLosses = jitterVals.map((j) => {
      const err = Math.sqrt(j * j + misalign * misalign) * 1e-6;
      const eta = Math.exp((-2 * err * err) / (thetaDiv * thetaDiv));
      return -10 * Math.log10(Math.max(eta * etaAp, 1e-12));
    });
    return [
      { name: "Pointing only", color: "#06b6d4", points: jitterVals.map((x, i) => ({ x, y: losses[i] })) },
      { name: "Pointing + aperture", color: "#f97316", dashed: true, points: jitterVals.map((x, i) => ({ x, y: totalLosses[i] })) },
      { name: "Current jitter", color: "#22c55e", showPoints: true, points: [{ x: jitterRMS, y: calc.totalLoss }] },
    ];
  }, [wavelength, txBeamWaist, misalign, rxAperture, jitterRMS, calc.totalLoss]);

  return (
    <CalculatorShell backHref="/free-space-comms" backLabel="Free-Space Comms" title="Pointing Loss" description="Interactive FSO pointing-loss calculator with jitter, misalignment, beam waist, and aperture coupling.">
      <div className="mb-5 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button key={preset.label} onClick={() => { setWavelength(preset.wavelength); setTxBeamWaist(preset.txBeamWaist); setJitterRMS(preset.jitterRMS); setMisalign(preset.misalign); setRxAperture(preset.rxAperture); }} className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset.wavelength && txBeamWaist === preset.txBeamWaist && jitterRMS === preset.jitterRMS && misalign === preset.misalign && rxAperture === preset.rxAperture ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset.label}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={850} max={2000} step={1} unit="nm" />
        <InputSlider label="TX beam waist" value={txBeamWaist} onChange={setTxBeamWaist} min={0.5} max={10} step={0.1} unit="cm" />
        <InputSlider label="Jitter RMS" value={jitterRMS} onChange={setJitterRMS} min={0} max={20} step={0.1} unit="μrad" />
        <InputSlider label="Static misalignment" value={misalign} onChange={setMisalign} min={0} max={20} step={0.1} unit="μrad" />
        <InputSlider label="RX aperture" value={rxAperture} onChange={setRxAperture} min={1} max={30} step={0.1} unit="cm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Beam divergence" value={`${calc.thetaDivUrad.toFixed(1)} μrad`} tone="blue" />
        <ResultCard label="Beam radius @ 1 km" value={`${calc.wRcm.toFixed(1)} cm`} tone="green" />
        <ResultCard label="Pointing offset @ 1 km" value={`${calc.offsetCm.toFixed(2)} cm`} tone="yellow" />
        <ResultCard label="Pointing η" value={`${(calc.etaPoint * 100).toFixed(2)}%`} tone="purple" />
        <ResultCard label="Aperture η" value={`${(calc.etaAperture * 100).toFixed(2)}%`} tone="blue" />
        <ResultCard label="Combined loss" value={`${calc.totalLoss.toFixed(2)} dB`} tone="red" />
      </div>

      <SimpleLineChart title="Loss vs jitter RMS" xLabel="Jitter RMS (μrad)" yLabel="Loss (dB)" series={series} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
