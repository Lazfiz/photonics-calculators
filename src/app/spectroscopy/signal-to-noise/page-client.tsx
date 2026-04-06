"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function SignalToNoisePage() {
  const [signalPhotons, setSignalPhotons] = useURLState("signalPhotons", 10000);
  const [darkCurrent, setDarkCurrent] = useURLState("darkCurrent", 100);
  const [readNoise, setReadNoise] = useURLState("readNoise", 10);
  const [nScans, setNScans] = useURLState("nScans", 1);
  const [detectorNoise, setDetectorNoise] = useURLState("detectorNoise", 50);

  const snr = useMemo(() => {
    const S = signalPhotons;
    const N_dark = darkCurrent;
    const N_read = readNoise * readNoise;
    const N_det = detectorNoise;
    const N_total = Math.sqrt(S + N_dark + N_read + N_det * N_det);
    return (S / N_total) * Math.sqrt(nScans);
  }, [signalPhotons, darkCurrent, readNoise, nScans, detectorNoise]);

  const chartData = useMemo(() => {
    const photons = Array.from({ length: 200 }, (_, i) => 10 + (i / 200) * 100000);
    const snrSingle = photons.map(S => {
      const N = Math.sqrt(S + darkCurrent + readNoise * readNoise + detectorNoise * detectorNoise);
      return S / N;
    });
    const snrMulti = photons.map(S => {
      const N = Math.sqrt(S + darkCurrent + readNoise * readNoise + detectorNoise * detectorNoise);
      return (S / N) * Math.sqrt(nScans);
    });

    return [
      { x: photons, y: snrSingle, type: "scatter" as const, mode: "lines" as const, name: "1 scan", line: { color: "#60a5fa" } },
      { x: photons, y: snrMulti, type: "scatter" as const, mode: "lines" as const, name: `${nScans} scans`, line: { color: "#34d399" } },
      { x: [signalPhotons], y: [snr], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [signalPhotons, darkCurrent, readNoise, nScans, detectorNoise]);

  const snrShotOnly = signalPhotons / Math.sqrt(signalPhotons);
  const noiseBreakdown = {
    shot: Math.sqrt(signalPhotons),
    dark: Math.sqrt(darkCurrent),
    read: readNoise,
    detector: detectorNoise,
    total: Math.sqrt(signalPhotons + darkCurrent + readNoise * readNoise + detectorNoise * detectorNoise),
  };

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Signal-to-Noise Ratio" description="Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <ValidatedNumberInput label="Signal Photons" value={signalPhotons} onChange={setSignalPhotons} min={1} />
        <ValidatedNumberInput label="Dark Current (e⁻)" value={darkCurrent} onChange={setDarkCurrent} min={0} />
        <ValidatedNumberInput label="Read Noise (e⁻)" value={readNoise} onChange={setReadNoise} min={0} />
        <ValidatedNumberInput label="Detector Noise (e⁻)" value={detectorNoise} onChange={setDetectorNoise} min={0} />
        <ValidatedNumberInput label="# Scans (co-adds)" value={nScans} onChange={setNScans} min={1} max={10000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total SNR</p>
          <p className="text-xl font-bold text-green-400">{snr.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Shot-noise-limited SNR</p>
          <p className="text-xl font-bold text-blue-400">{snrShotOnly.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Noise Breakdown (e⁻ rms)</h3>
        <p className="text-sm text-gray-300">Shot: <span className="text-blue-400">{noiseBreakdown.shot.toFixed(1)}</span> | Dark: <span className="text-yellow-400">{noiseBreakdown.dark.toFixed(1)}</span> | Read: <span className="text-red-400">{noiseBreakdown.read.toFixed(1)}</span> | Det: <span className="text-purple-400">{noiseBreakdown.detector.toFixed(1)}</span> | Total: <span className="text-green-400">{noiseBreakdown.total.toFixed(1)}</span></p>
        <p className="text-gray-300 text-sm mt-2"><span className="text-blue-400 font-mono">SNR = S·√M / √(S + N_dark + N_read² + N_det²)</span></p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Signal Photons", gridcolor: "#374151", type: "log" },
          yaxis: { title: "SNR", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.01, y: 0.99 },
        }} />
      </div>
    </CalculatorShell>
  );
}
