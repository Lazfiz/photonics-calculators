"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function CCDvsCMOSPage() {
  const [pixelSize, setPixelSize] = useURLState("pixelSize", 6.5);
  const [readNoiseCCD, setReadNoiseCCD] = useURLState("readNoiseCCD", 3);
  const [readNoiseCMOS, setReadNoiseCMOS] = useURLState("readNoiseCMOS", 1.5);
  const [fullWell, setFullWell] = useURLState("fullWell", 20000);
  const [darkCurrent, setDarkCurrent] = useURLState("darkCurrent", 0.01);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 1);

  const darkNoise = Math.sqrt(darkCurrent * exposureTime);
  const ccdSNR = fullWell > 0 ? fullWell / Math.sqrt(fullWell + readNoiseCCD ** 2 + darkNoise ** 2) : 0;
  const cmosSNR = fullWell > 0 ? fullWell / Math.sqrt(fullWell + readNoiseCMOS ** 2 + darkNoise ** 2) : 0;
  const dynamicRangeCCD = fullWell / readNoiseCCD;
  const dynamicRangeCMOS = fullWell / readNoiseCMOS;

  const chartData = useMemo(() => {
    const signals = Array.from({ length: 100 }, (_, i) => (i + 1) * (fullWell / 100));
    const dn = Math.sqrt(darkCurrent * exposureTime);
    return [
      { x: signals, y: signals.map(s => s / Math.sqrt(Math.max(s, 1) + readNoiseCCD ** 2 + dn ** 2)), type: "scatter" as const, mode: "lines" as const, name: "CCD", line: { color: "#60a5fa" } },
      { x: signals, y: signals.map(s => s / Math.sqrt(Math.max(s, 1) + readNoiseCMOS ** 2 + dn ** 2)), type: "scatter" as const, mode: "lines" as const, name: "CMOS", line: { color: "#34d399" } },
    ];
  }, [fullWell, readNoiseCCD, readNoiseCMOS, darkCurrent, exposureTime]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="CCD vs CMOS Comparison" description="Compare SNR and dynamic range between CCD and CMOS detectors.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pixel Size (µm)" value={pixelSize} onChange={setPixelSize} min={1} step="any" />
        <ValidatedNumberInput label="CCD Read Noise (e⁻)" value={readNoiseCCD} onChange={setReadNoiseCCD} min={0.5} step="0.5" />
        <ValidatedNumberInput label="CMOS Read Noise (e⁻)" value={readNoiseCMOS} onChange={setReadNoiseCMOS} min={0.3} step="0.1" />
        <ValidatedNumberInput label="Full Well (e⁻)" value={fullWell} onChange={setFullWell} min={1000} step="1000" />
        <ValidatedNumberInput label="Dark Current (e⁻/px/s)" value={darkCurrent} onChange={setDarkCurrent} min={0} step="any" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={0.001} step="any" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="CCD SNR (full well)" value={ccdSNR.toFixed(1)} tone="blue" />
        <ResultCard label="CMOS SNR (full well)" value={cmosSNR.toFixed(1)} tone="green" />
        <ResultCard label="CCD Dynamic Range" value={`${(20 * Math.log10(dynamicRangeCCD)).toFixed(1)} dB`} tone="yellow" />
        <ResultCard label="CMOS Dynamic Range" value={`${(20 * Math.log10(dynamicRangeCMOS)).toFixed(1)} dB`} tone="purple" />
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Signal (e⁻)", gridcolor: "#374151" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
