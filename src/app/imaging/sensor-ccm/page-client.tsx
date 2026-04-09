"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function SensorCCMPage() {
  const [wellCapacity, setWellCapacity] = useURLState("wellCapacity", 80000);
  const [readNoise, setReadNoise] = useURLState("readNoise", 8);
  const [darkCurrent, setDarkCurrent] = useURLState("darkCurrent", 0.005);
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 1000);
  const [quantumEfficiency, setQuantumEfficiency] = useURLState("quantumEfficiency", 0.92);
  const [coolingTemp, setCoolingTemp] = useState(-70);
  const [bitDepth, setBitDepth] = useURLState("bitDepth", 16);
  const [pixelPitch, setPixelPitch] = useURLState("pixelPitch", 16);

  const results = useMemo(() => {
    const darkElectrons = darkCurrent * exposureTime / 1000;
    const tempFactor = Math.pow(2, (coolingTemp - (-20)) / 6); // dark doubles per 6°C
    const darkElectronsCooled = darkElectrons * tempFactor;
    const dynamicRangeDB = 20 * Math.log10(wellCapacity / readNoise);
    const drStops = Math.log2(wellCapacity / readNoise);
    const drBits = dynamicRangeDB / 6.02;
    const maxDN = Math.pow(2, bitDepth) - 1;
    const electronsPerDN = wellCapacity / maxDN;
    const snrMax = wellCapacity / Math.sqrt(wellCapacity);
    const noiseFloor = Math.sqrt(readNoise * readNoise + darkElectronsCooled);

    const temps: number[] = [];
    const darkVals: number[] = [];
    for (let t = -80; t <= 20; t += 2) {
      temps.push(t);
      const factor = Math.pow(2, (t - (-20)) / 6);
      darkVals.push(darkCurrent * exposureTime / 1000 * factor);
    }

    return { darkElectrons, darkElectronsCooled, dynamicRangeDB, drStops, drBits, electronsPerDN, snrMax, noiseFloor, temps, darkVals };
  }, [wellCapacity, readNoise, darkCurrent, exposureTime, quantumEfficiency, coolingTemp, bitDepth, pixelPitch]);

  const plotData = useMemo(() => [
    {
      x: results.temps, y: results.darkVals,
      type: "scatter" as const, mode: "lines" as const,
      name: "Dark electrons", line: { color: "#f87171", width: 2 },
    },
    {
      x: [coolingTemp], y: [results.darkElectronsCooled],
      type: "scatter" as const, mode: "markers" as const,
      name: "Current temp", marker: { color: "#60a5fa", size: 10 },
    },
  ], [results]);

  const darkLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d1d5db" }, xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
    yaxis: { title: "Dark Noise (e⁻)", gridcolor: "#374151" },
    legend: { x: 0.02, y: 0.95 }, margin: { t: 30, r: 30, b: 50, l: 60 },
  };

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="CCD/CCM Sensor Design" description="CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pixel Pitch (µm)</label>
            <ValidatedNumberInput label="Pixel Pitch (µm)" value={pixelPitch} onChange={setPixelPitch} min={1} max={50} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Well Capacity (e⁻)</label>
            <ValidatedNumberInput label="Full Well Capacity (e⁻)" value={wellCapacity} onChange={setWellCapacity} min={1000} max={500000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Read Noise (e⁻ rms)</label>
            <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoise} onChange={setReadNoise} min={1} max={100} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dark Current at 25°C (e⁻/s/pixel)</label>
            <ValidatedNumberInput label="Dark Current at 25°C (e⁻/s/pixel)" value={darkCurrent} onChange={setDarkCurrent} min={0.001} max={10} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cooling Temperature (°C)</label>
            <ValidatedNumberInput label="Cooling Temperature (°C)" value={coolingTemp} onChange={setCoolingTemp} min={-100} max={25} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Exposure Time (ms)</label>
            <ValidatedNumberInput label="Exposure Time (ms)" value={exposureTime} onChange={setExposureTime} min={1} max={60000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">ADC Bit Depth</label>
            <ValidatedNumberInput label="ADC Bit Depth" value={bitDepth} onChange={setBitDepth} min={8} max={24} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Dark Electrons (cooled)</div>
              <div className="text-xl font-mono text-red-400">{results.darkElectronsCooled.toFixed(3)} e⁻</div>
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
              <div className="text-xs text-gray-400">Effective DR Bits</div>
              <div className="text-xl font-mono text-blue-400">{results.drBits.toFixed(1)} bit</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">e⁻/DN</div>
              <div className="text-xl font-mono text-yellow-400">{results.electronsPerDN.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Noise Floor</div>
              <div className="text-xl font-mono text-purple-400">{results.noiseFloor.toFixed(2)} e⁻</div>
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
          <p>N_dark(T) = DCR · t_exp · 2^((T - T_ref) / 6)</p>
          <p>DR = 20·log₁₀(FWC / σ_read)</p>
          <p>DR_stops = log₂(FWC / σ_read)</p>
          <p>e⁻/DN = FWC / (2^bits - 1)</p>
          <p>σ_total = √(σ²_read + N_dark)</p>
        </div>
        <div className="text-sm text-gray-400 mt-4 space-y-1">
          <p>CCDs still excel in low-light scientific imaging due to their high quantum efficiency (&gt;95% back-thinned), large full-well capacity, and uniform pixel response. Thermoelectric (TEC) cooling is essential: dark current roughly doubles every 6°C.</p>
          <p>Deep-cooled CCDs (-70°C to -100°C) achieve dark current &lt;0.001 e⁻/s, enabling hour-long exposures. EMCCDs add on-chip electron multiplication for sub-electron effective read noise at the cost of excess noise factor √2.</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
