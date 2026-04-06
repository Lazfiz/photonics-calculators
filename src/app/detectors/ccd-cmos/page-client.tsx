"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function CCDvsCMOSPage() {
  const [pixelSize, setPixelSize] = useState(6.5);
  const [readNoiseCCD, setReadNoiseCCD] = useState(3);
  const [readNoiseCMOS, setReadNoiseCMOS] = useState(1.5);
  const [fullWell, setFullWell] = useState(20000);
  const [darkCurrent, setDarkCurrent] = useState(0.01);
  const [exposureTime, setExposureTime] = useState(1);

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
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Pixel Size (µm)</span><input type="number" value={pixelSize} onChange={e => setPixelSize(+e.target.value)} min={1} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">CCD Read Noise (e⁻)</span><input type="number" value={readNoiseCCD} onChange={e => setReadNoiseCCD(+e.target.value)} min={0.5} step="0.5" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">CMOS Read Noise (e⁻)</span><input type="number" value={readNoiseCMOS} onChange={e => setReadNoiseCMOS(+e.target.value)} min={0.3} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Full Well (e⁻)</span><input type="number" value={fullWell} onChange={e => setFullWell(+e.target.value)} min={1000} step="1000" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Dark Current (e⁻/px/s)</span><input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min={0} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Exposure Time (s)</span><input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min={0.001} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
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
