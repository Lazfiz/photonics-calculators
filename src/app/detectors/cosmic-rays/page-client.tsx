"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function CosmicRaysPage() {
  const [sensorArea, setSensorArea] = useURLState("sensorArea", 1);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 1);
  const [flux, setFlux] = useURLState("flux", 1);
  const [pixelSize, setPixelSize] = useURLState("pixelSize", 10);
  const [energyDeposit, setEnergyDeposit] = useURLState("energyDeposit", 100);
  const [trackLength, setTrackLength] = useURLState("trackLength", 200);
  const [numFrames, setNumFrames] = useURLState("numFrames", 100);

  const fluxPerSec = flux / 60;
  const expectedHits = fluxPerSec * sensorArea * exposureTime;
  const totalDeposited = expectedHits * energyDeposit * trackLength;
  const pixelArea = pixelSize * pixelSize;
  const pixelFlux = expectedHits * trackLength * pixelSize * 1e-8 / sensorArea;
  const cleanPixels = Math.exp(-pixelFlux) * 100;

  const lgamma = (n: number) => { if (n <= 1) return 0; let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };

  const chartData = useMemo(() => {
    const times = Array.from({ length: 200 }, (_, i) => 0.01 + i * 10 / 200);
    const hits = times.map(t => fluxPerSec * sensorArea * t);
    let maxHits = times.map(t => { const mu = fluxPerSec * sensorArea * t; let k = mu; let sum = 0; for (let n = 0; n <= Math.max(10, mu + 5 * Math.sqrt(mu)); n++) { const lp = n * Math.log(Math.max(mu, 1e-300)) - mu - lgamma(n); sum += Math.exp(lp); if (sum >= 0.99) { k = n; break; } } return k; });
    return [
      { x: times, y: hits, type: "scatter", mode: "lines", name: "Expected Hits", line: { color: "#60a5fa", width: 2 } },
      { x: times, y: maxHits, type: "scatter", mode: "lines", name: "99th Percentile", line: { color: "#f87171", width: 2, dash: "dash" } },
    ];
  }, [fluxPerSec, sensorArea]);

  const areaVsHits = useMemo(() => {
    const areas = Array.from({ length: 100 }, (_, i) => 0.01 + i * 10 / 100);
    return [{ x: areas, y: areas.map(a => fluxPerSec * a * exposureTime), type: "scatter", mode: "lines", name: `Hits per ${exposureTime}s frame`, line: { color: "#34d399", width: 2 } }];
  }, [fluxPerSec, exposureTime]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Cosmic Ray Detection" description="Cosmic ray flux and impact on imaging sensors — estimate hit rates and affected pixels.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Sensor Area (cm²)" value={sensorArea} onChange={setSensorArea} min={0.01} step="0.1" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={0.001} step="0.1" />
        <ValidatedNumberInput label="Flux (hits/cm²/min)" value={flux} onChange={setFlux} min={0.01} step="0.1" />
        <ValidatedNumberInput label="Pixel Size (μm)" value={pixelSize} onChange={setPixelSize} min={1} step="1" />
        <ValidatedNumberInput label="Energy Deposit (e⁻/μm)" value={energyDeposit} onChange={setEnergyDeposit} min={1} step="5" />
        <ValidatedNumberInput label="Track Length (μm)" value={trackLength} onChange={setTrackLength} min={10} step="10" />
        <ValidatedNumberInput label="Frames for Statistics" value={numFrames} onChange={setNumFrames} min={1} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Expected Hits/Frame" value={expectedHits.toFixed(2)} tone="blue" />
        <ResultCard label="e⁻ Deposited/Hit" value={(energyDeposit * trackLength).toExponential(2)} tone="red" />
        <ResultCard label="Clean Pixels/Frame" value={`${cleanPixels.toFixed(2)}%`} tone="green" />
        <ResultCard label={`Hits in ${numFrames} frames`} value={`~${(expectedHits * numFrames).toFixed(0)}`} tone="yellow" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>Flux at sea level: ~1 hit/cm²/min</p><p>N_hits = Φ · A · t  (Poisson)</p><p>E_deposited ≈ 100 e⁻/μm in Si (MIP: 390 eV/μm ÷ 3.6 eV/pair)</p></div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Exposure Time (s)", gridcolor: "#374151" }, yaxis: { title: "Cosmic Ray Hits", gridcolor: "#374151" } }} />
      <h2 className="text-xl font-bold mt-8 mb-4">Hits vs Sensor Area</h2>
      <ChartPanel data={areaVsHits} layout={{ xaxis: { title: "Sensor Area (cm²)", gridcolor: "#374151" }, yaxis: { title: "Expected Hits per Frame", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
