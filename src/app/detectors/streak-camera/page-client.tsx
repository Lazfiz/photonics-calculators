"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function StreakCameraPage() {
  const [sweepSpeed, setSweepSpeed] = useURLState("sweepSpeed", 10); // mm/ns
  const [slitWidth, setSlitWidth] = useURLState("slitWidth", 50); // µm
  const [magnification, setMagnification] = useURLState("magnification", 1.5);
  const [ccdPixelSize, setCcdPixelSize] = useURLState("ccdPixelSize", 13); // µm
  const [temporalResolution, setTemporalResolution] = useURLState("temporalResolution", 2); // ps (system limited)
  const [dynamicRange, setDynamicRange] = useURLState("dynamicRange", 1000); // counts

  const results = useMemo(() => {
    const timePerPixel = (ccdPixelSize / (sweepSpeed * 1e3)) * 1e3; // ps per pixel: µm / (mm/ns) = ns → ps
    const timePerSlit = (slitWidth * magnification) / (sweepSpeed * 1e3) * 1e3; // ps (slit image on CCD = slitWidth * M)
    const effectiveTimeRes = Math.max(temporalResolution, timePerSlit, timePerPixel);
    const totalTimeWindow = 2048 * timePerPixel; // ps (assuming 2048 pixels)
    const spatialRes = slitWidth; // µm at photocathode (slit is at cathode)
    return { timePerPixel, timePerSlit, effectiveTimeRes, totalTimeWindow, spatialRes };
  }, [sweepSpeed, slitWidth, magnification, ccdPixelSize, temporalResolution, dynamicRange]);

  const chartData = useMemo(() => {
    const speeds = Array.from({ length: 100 }, (_, i) => 1 + i * 0.5);
    const tpp = speeds.map(s => (ccdPixelSize / (s * 1e3)) * 1e3);
    const tps = speeds.map(s => (slitWidth * magnification) / (s * 1e3) * 1e3);
    const eff = speeds.map(s => Math.max(temporalResolution, (slitWidth * magnification) / (s * 1e3) * 1e3, (ccdPixelSize / (s * 1e3)) * 1e3));
    const window = speeds.map(s => 2048 * (ccdPixelSize / (s * 1e3)) * 1e3);
    return [
      { x: speeds, y: tpp, type: "scatter", mode: "lines", name: "Time/pixel (ps)", line: { color: "#60a5fa" } },
      { x: speeds, y: eff, type: "scatter", mode: "lines", name: "Effective time res (ps)", line: { color: "#f87171" } },
      { x: speeds, y: window, type: "scatter", mode: "lines", name: "Time window (ps)", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [sweepSpeed, slitWidth, magnification, ccdPixelSize, temporalResolution]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Streak Camera" description="Streak camera basics calculator. Models temporal resolution, sweep speed, time window, and spatial resolution trade-offs.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Sweep Speed (mm/ns)" value={sweepSpeed} onChange={setSweepSpeed} step="0.5" />
        <ValidatedNumberInput label="Slit Width (µm)" value={slitWidth} onChange={setSlitWidth} />
        <ValidatedNumberInput label="Magnification" value={magnification} onChange={setMagnification} step="0.1" />
        <ValidatedNumberInput label="CCD Pixel Size (µm)" value={ccdPixelSize} onChange={setCcdPixelSize} />
        <ValidatedNumberInput label="System Temporal Limit (ps)" value={temporalResolution} onChange={setTemporalResolution} />
        <ValidatedNumberInput label="Dynamic Range (counts)" value={dynamicRange} onChange={setDynamicRange} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-1">
        <p className="text-gray-300">Time per pixel = <span className="text-blue-400 font-mono">{results.timePerPixel.toFixed(2)} ps</span></p>
        <p className="text-gray-300">Time per slit width = <span className="text-blue-400 font-mono">{results.timePerSlit.toFixed(2)} ps</span></p>
        <p className="text-gray-300">Effective temporal resolution = <span className="text-blue-400 font-mono">{results.effectiveTimeRes.toFixed(2)} ps</span></p>
        <p className="text-gray-300">Total time window (2048px) = <span className="text-blue-400 font-mono">{(results.totalTimeWindow / 1000).toFixed(2)} ns</span></p>
        <p className="text-gray-300">Spatial resolution at cathode = <span className="text-blue-400 font-mono">{results.spatialRes.toFixed(1)} µm</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>Δt<sub>pixel</sub> = p<sub>CCD</sub> / v<sub>sweep</sub></p>
        <p>Δt<sub>slit</sub> = w<sub>slit</sub> · M / v<sub>sweep</sub></p>
        <p>Δt<sub>eff</sub> = max(Δt<sub>slit</sub>, Δt<sub>pixel</sub>, Δt<sub>system</sub>)</p>
        <p>T<sub>window</sub> = N<sub>pixels</sub> · Δt<sub>pixel</sub></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Sweep Speed (mm/ns)", gridcolor: "#374151" },
        yaxis: { title: "Time Resolution (ps)", gridcolor: "#374151" },
        yaxis2: { title: "Time Window (ps)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 80 }, autosize: true, showlegend: true
      }} />
    </CalculatorShell>
  );
}
