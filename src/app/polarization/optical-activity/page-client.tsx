"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export default function OpticalActivityPage() {
  const [specificRotation, setSpecificRotation] = useURLState("specificRotation", 66.5); // [α] for sucrose at 589nm
  const [concentration, setConcentration] = useURLState("concentration", 10); // g/100mL
  const [pathLength, setPathLength] = useURLState("pathLength", 1.0); // dm
  const [temperature, setTemperature] = useURLState("temperature", 20); // °C
  const [wavelength, setWavelength] = useURLState("wavelength", 589); // nm (Na D-line)
  const [sample, setSample] = useState<"sucrose" | "glucose" | "fructose" | "custom">("sucrose");

  // Sample presets
  const samples: Record<string, { alpha: number; name: string }> = {
    sucrose: { alpha: 66.5, name: "Sucrose" },
    glucose: { alpha: 52.7, name: "D-Glucose" },
    fructose: { alpha: -92.0, name: "D-Fructose" },
    custom: { alpha: 0, name: "Custom" },
  };

  // Observed rotation
  const observedRotation = useMemo(() => {
    // [α] = α_obs / (c · l)
    // α_obs = [α] · c · l
    const alpha = specificRotation;
    const c = concentration;
    const l = pathLength;
    return alpha * c * l;
  }, [specificRotation, concentration, pathLength]);

  // Wavelength dependence (Biot's law: rotation ∝ 1/λ²)
  const wavelengthCorrected = useMemo(() => {
    const refWl = 589; // Na D-line reference
    const factor = (refWl / wavelength) ** 2;
    return specificRotation * factor;
  }, [specificRotation, wavelength]);

  // Temperature correction (approximate)
  const tempCorrected = useMemo(() => {
    // d[α]/dT ≈ 0.01 °C⁻¹ for many sugars
    const refTemp = 20;
    const tempCoeff = 0.01;
    return wavelengthCorrected * (1 + tempCoeff * (temperature - refTemp));
  }, [wavelengthCorrected, temperature]);

  // Final observed rotation with corrections
  const finalRotation = useMemo(() => {
    return tempCorrected * concentration * pathLength;
  }, [tempCorrected, concentration, pathLength]);

  // Molar rotation
  const molarRotation = useMemo(() => {
    // [M] = [α] · M / 100
    const MW = 342.3; // sucrose molecular weight g/mol
    return specificRotation * MW / 100;
  }, [specificRotation]);

  // Dispersion curve
  const dispersionData = useMemo(() => {
    const wls = Array.from({ length: 100 }, (_, i) => 400 + i * 3);
    const rotations = wls.map((wl) => specificRotation * (589 / wl) ** 2);
    return { wls, rotations };
  }, [specificRotation]);

  // Temperature dependence
  const tempData = useMemo(() => {
    const temps = Array.from({ length: 80 }, (_, i) => 0 + i * 0.5);
    const rotations = temps.map((t) => specificRotation * (1 + 0.01 * (t - 20)));
    return { temps, rotations };
  }, [specificRotation]);

  const plotLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#111827",
    font: { color: "#e5e7eb" },
    margin: { t: 30, b: 40, l: 60, r: 10 },
    xaxis: { color: "#9ca3af", gridcolor: "#374151" },
    yaxis: { color: "#9ca3af", gridcolor: "#374151" },
    legend: { font: { color: "#9ca3af" } },
  };

  const handleSampleChange = (s: "sucrose" | "glucose" | "fructose" | "custom") => {
    setSample(s);
    if (s !== "custom") {
      setSpecificRotation(samples[s].alpha);
    }
  };

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Optical Activity" description="Calculate optical rotation from specific rotation, concentration, and path length with wavelength/temperature corrections.">
            
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Sample Selection</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["sucrose", "glucose", "fructose", "custom"] as const).map((s) => (
              <button key={s} onClick={() => handleSampleChange(s)}
                className={`px-3 py-1 text-xs rounded ${sample === s ? "bg-blue-600" : "bg-gray-800 border border-gray-700 hover:border-blue-500"}`}>
                {samples[s]?.name || "Custom"}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Specific rotation [α]<sub>D</sub><sup>20</sup> (deg·mL/g·dm)</label>
            <input type="number" step={0.1} value={specificRotation} onChange={(e) => setSpecificRotation(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Concentration (g/100mL)</label>
            <input type="number" step={0.1} value={concentration} onChange={(e) => setConcentration(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Path length (dm)</label>
            <input type="number" step={0.1} value={pathLength} onChange={(e) => setPathLength(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Temperature (°C)</label>
            <input type="number" step={0.1} value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Wavelength (nm)</label>
            <input type="number" value={wavelength} onChange={(e) => setWavelength(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setWavelength(589)} className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">Na D-line</button>
            <button onClick={() => setWavelength(546)} className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">Hg e-line</button>
            <button onClick={() => setWavelength(633)} className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">HeNe</button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Calculated Results</h2>
          <div className="space-y-1">
            <ResultRow label="Observed rotation (uncorrected)" value={`${observedRotation.toFixed(2)}°`} />
            <ResultRow label="Wavelength-corrected [α]" value={`${wavelengthCorrected.toFixed(2)}°·mL/g·dm`} />
            <ResultRow label="Temp. & wavelength corrected [α]" value={`${tempCorrected.toFixed(2)}°·mL/g·dm`} />
            <ResultRow label="Final observed rotation" value={`${finalRotation.toFixed(2)}°`} />
            <ResultRow label="Molar rotation [M]" value={`${molarRotation.toFixed(1)}°·cm²·dmol⁻¹`} />
          </div>
          <div className="mt-4 p-4 bg-gray-800 rounded-lg text-center">
            <div className="text-sm text-gray-400">Observed Rotation</div>
            <div className={`text-3xl font-bold ${finalRotation > 0 ? "text-green-400" : finalRotation < 0 ? "text-red-400" : "text-gray-400"}`}>
              {finalRotation > 0 ? "+" : ""}{finalRotation.toFixed(2)}°
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {finalRotation > 0 ? "Dextrorotatory (right)" : finalRotation < 0 ? "Levotorotatory (left)" : "No rotation"}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Polarization plane rotated {finalRotation > 0 ? "clockwise" : finalRotation < 0 ? "counter-clockwise" : "not at all"}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Polarization Diagram</h2>
          <div className="relative w-48 h-48 mx-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Reference grid */}
              <line x1="0" y1="100" x2="200" y2="100" stroke="#4b5563" strokeWidth="1" />
              <line x1="100" y1="0" x2="100" y2="200" stroke="#4b5563" strokeWidth="1" />
              {/* Incident polarization (horizontal) */}
              <line x1="20" y1="100" x2="180" y2="100" stroke="#3b82f6" strokeWidth="3" />
              <circle cx="20" cy="100" r="4" fill="#3b82f6" />
              <circle cx="180" cy="100" r="4" fill="#3b82f6" />
              {/* Rotated polarization */}
              <g transform={`rotate(${finalRotation * 2}, 100, 100)`}>
                <line x1="30" y1="100" x2="170" y2="100" stroke="#22c55e" strokeWidth="2" strokeDasharray="5,3" />
                <circle cx="30" cy="100" r="3" fill="#22c55e" />
                <circle cx="170" cy="100" r="3" fill="#22c55e" />
              </g>
              {/* Arc showing rotation */}
              <path d={`M 140 100 A 40 40 0 ${Math.abs(finalRotation) > 90 ? 1 : 0} ${finalRotation > 0 ? 1 : 0} ${140 + 40 * Math.sin(finalRotation * Math.PI / 180)} ${100 - 40 * Math.cos(finalRotation * Math.PI / 180)}`}
                fill="none" stroke="#f59e0b" strokeWidth="2" />
              <text x="100" y="185" textAnchor="middle" fill="#9ca3af" fontSize="10">Rotation: {finalRotation.toFixed(1)}°</text>
            </svg>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Input</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block border-dashed" /> Output</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Rotatory Dispersion (Biot&apos;s Law)</h2>
          <ChartPanel data={[
            { x: dispersionData.wls, y: dispersionData.rotations, type: "scatter", mode: "lines", line: { color: "#a855f7" } },
            { x: [wavelength], y: [wavelengthCorrected], type: "scatter", mode: "markers", marker: { color: "#f59e0b", size: 10 } },
          ]} layout={{ ...plotLayout, height: 250, xaxis: { ...plotLayout.xaxis, title: "Wavelength (nm)" }, yaxis: { ...plotLayout.yaxis, title: "[α] (deg·mL/g·dm)" } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Temperature Dependence</h2>
          <ChartPanel data={[
            { x: tempData.temps, y: tempData.rotations, type: "scatter", mode: "lines", line: { color: "#ef4444" } },
            { x: [temperature], y: [tempCorrected], type: "scatter", mode: "markers", marker: { color: "#f59e0b", size: 10 } },
          ]} layout={{ ...plotLayout, height: 250, xaxis: { ...plotLayout.xaxis, title: "Temperature (°C)" }, yaxis: { ...plotLayout.yaxis, title: "[α] (deg·mL/g·dm)" } }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>α<sub>obs</sub> = [α]<sub>λ</sub><sup>T</sup> · c · l &nbsp;— observed rotation</p>
          <p>[α]<sub>λ</sub> = [α]<sub>D</sub> · (589/λ)² &nbsp;— Biot&apos;s law (rotatory dispersion)</p>
          <p>[α]<sup>T</sup> = [α]<sup>20</sup> · (1 + k · (T − 20)) &nbsp;— temperature correction</p>
          <p>[M] = [α] · M<sub>W</sub> / 100 &nbsp;— molar rotation</p>
          <p>Dextrorotatory (+): rotates plane right (clockwise)</p>
          <p>Levotorotatory (−): rotates plane left (counter-clockwise)</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Common Optically Active Substances</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">Substance</th>
                <th className="text-right py-2 px-2">[α]<sub>D</sub><sup>20</sup></th>
                <th className="text-left py-2 px-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-2 px-2">Sucrose</td>
                <td className="text-right py-2 px-2">+66.5°</td>
                <td className="py-2 px-2 text-gray-400">Table sugar</td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-2 px-2">D-Glucose</td>
                <td className="text-right py-2 px-2">+52.7°</td>
                <td className="py-2 px-2 text-gray-400">Blood sugar</td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-2 px-2">D-Fructose</td>
                <td className="text-right py-2 px-2">−92.0°</td>
                <td className="py-2 px-2 text-gray-400">Fruit sugar (levo)</td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-2 px-2">Quartz (α)</td>
                <td className="text-right py-2 px-2">~+21°/mm</td>
                <td className="py-2 px-2 text-gray-400">Crystal, λ=589nm</td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-2 px-2">Lactic acid</td>
                <td className="text-right py-2 px-2">−2.6°</td>
                <td className="py-2 px-2 text-gray-400">In muscles</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </CalculatorShell>
  );
}
