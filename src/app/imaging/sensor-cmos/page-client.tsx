"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function SensorCMOSPage() {
  const [pixelPitch, setPixelPitch] = useURLState("pixelPitch", 6.5);
  const [wellCapacity, setWellCapacity] = useURLState("wellCapacity", 25000);
  const [readNoise, setReadNoise] = useURLState("readNoise", 1.5);
  const [darkCurrent, setDarkCurrent] = useURLState("darkCurrent", 0.1);
  const [conversionGain, setConversionGain] = useURLState("conversionGain", 2.5);
  const [quantumEfficiency, setQuantumEfficiency] = useURLState("quantumEfficiency", 0.7);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 100);

  const results = useMemo(() => {
    const fullWellElectrons = wellCapacity;
    const fullWellDN = wellCapacity / conversionGain;
    const darkElectrons = darkCurrent * exposureTime / 1000;
    const dynamicRange = 20 * Math.log10(fullWellElectrons / readNoise);
    const dynamicRangeDB = dynamicRange;
    const dynamicRangeBits = dynamicRange / 6.02;
    const dynamicRangeStops = dynamicRangeDB / 20 * 3; // approx
    const snrMax = fullWellElectrons / Math.sqrt(fullWellElectrons);
    const noiseFloor = Math.sqrt(readNoise * readNoise + darkElectrons);
    const drStops = Math.log2(fullWellElectrons / readNoise);

    const exposures: number[] = [];
    const snrVals: number[] = [];
    const darkNoiseVals: number[] = [];
    for (let t = 1; t <= 1000; t += 1) {
      exposures.push(t);
      const dE = darkCurrent * t / 1000;
      const totalNoise = Math.sqrt(readNoise * readNoise + dE);
      darkNoiseVals.push(dE);
      const signal = t / 1000 * 1000; // arbitrary signal rate
      snrVals.push(Math.min(signal, fullWellElectrons) / Math.sqrt(Math.min(signal, fullWellElectrons) + totalNoise * totalNoise));
    }

    return { fullWellDN, darkElectrons, dynamicRangeDB, dynamicRangeBits, drStops, snrMax, noiseFloor, exposures, snrVals, darkNoiseVals };
  }, [pixelPitch, wellCapacity, readNoise, darkCurrent, conversionGain, quantumEfficiency, exposureTime]);

  const plotData = useMemo(() => [
    {
      x: results.exposures, y: results.snrVals,
      type: "scatter" as const, mode: "lines" as const,
      name: "SNR", line: { color: "#60a5fa", width: 2 }, yaxis: "y",
    },
    {
      x: results.exposures, y: results.darkNoiseVals,
      type: "scatter" as const, mode: "lines" as const,
      name: "Dark noise (e⁻)", line: { color: "#f87171", width: 2, dash: "dash" }, yaxis: "y2",
    },
  ], [results]);

  const darkLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d1d5db" }, xaxis: { title: "Exposure Time (ms)", gridcolor: "#374151" },
    yaxis: { title: "SNR", gridcolor: "#374151" },
    yaxis2: { title: "Dark Noise (e⁻)", gridcolor: "#374151", overlaying: "y", side: "right" },
    legend: { x: 0.02, y: 0.95 }, margin: { t: 30, r: 60, b: 50, l: 60 },
  };

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="CMOS Sensor Design" description="Pixel design parameters, dynamic range, noise floor, and sensitivity calculations.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pixel Pitch (µm)</label>
            <ValidatedNumberInput label="Pixel Pitch (µm)" value={pixelPitch} onChange={setPixelPitch} min={0.5} max={50} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Well Capacity (e⁻)</label>
            <ValidatedNumberInput label="Full Well Capacity (e⁻)" value={wellCapacity} onChange={setWellCapacity} min={100} max={200000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Read Noise (e⁻ rms)</label>
            <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoise} onChange={setReadNoise} min={0.1} max={50} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dark Current (e⁻/s/pixel)</label>
            <ValidatedNumberInput label="Dark Current (e⁻/s/pixel)" value={darkCurrent} onChange={setDarkCurrent} min={0} max={100} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Conversion Gain (e⁻/DN)</label>
            <ValidatedNumberInput label="Conversion Gain (e⁻/DN)" value={conversionGain} onChange={setConversionGain} min={0.1} max={100} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quantum Efficiency</label>
            <ValidatedNumberInput label="Quantum Efficiency" value={quantumEfficiency} onChange={setQuantumEfficiency} min={0.01} max={1} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Exposure Time (ms)</label>
            <ValidatedNumberInput label="Exposure Time (ms)" value={exposureTime} onChange={setExposureTime} min={1} max={10000} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Full Well (DN)</div>
              <div className="text-xl font-mono text-blue-400">{results.fullWellDN.toFixed(0)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Dark Electrons</div>
              <div className="text-xl font-mono text-red-400">{results.darkElectrons.toFixed(2)} e⁻</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Dynamic Range</div>
              <div className="text-xl font-mono text-green-400">{results.dynamicRangeDB.toFixed(1)} dB</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Dynamic Range</div>
              <div className="text-xl font-mono text-green-400">{results.drStops.toFixed(1)} stops</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Max SNR (shot)</div>
              <div className="text-xl font-mono text-yellow-400">{results.snrMax.toFixed(1)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Noise Floor (e⁻)</div>
              <div className="text-xl font-mono text-purple-400">{results.noiseFloor.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <ChartPanel data={plotData} layout={darkLayout} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>DR = 20·log₁₀(FWC / σ_read) [dB]</p>
          <p>DR_stops = log₂(FWC / σ_read)</p>
          <p>N_dark = DCR · t_exp</p>
          <p>FWC_DN = FWC / K (K = conversion gain)</p>
          <p>SNR_max = √FWC (shot-noise limited)</p>
        </div>
        <div className="text-sm text-gray-400 mt-4 space-y-1">
          <p>CMOS sensors dominate modern microscopy due to their low read noise, fast frame rates, and on-chip ADC. Key tradeoffs: larger pixels → higher FWC and DR, smaller pixels → higher spatial resolution but lower per-pixel SNR.</p>
          <p>Back-side illuminated (BSI) sensors improve QE to &gt;90% by moving the wiring behind the photodiode. sCMOS sensors achieve &lt;1 e⁻ read noise with &gt;30,000 e⁻ FWC, yielding &gt;90 dB dynamic range.</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
