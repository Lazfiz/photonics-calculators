"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function DispersionShiftedCalculator() {
  const [fiberType, setFiberType] = useState<"DSF" | "NZDSF+" | "NZDSF-" | "DCF">("NZDSF+");
  const [wavelength, setWavelength] = useState(1550);
  const [coreRadius, setCoreRadius] = useState(4.2);
  const [deltaProfile, setDeltaProfile] = useState(0.008); // relative index difference
  const [fiberLength, setFiberLength] = useState(80); // km
  const [bitRate, setBitRate] = useState(10); // Gbps

  // Dispersion parameters per fiber type
  const params = {
    DSF: { zeroDispWavelength: 1550, slope: 0.085, dispersion1550: 0, attenuation: 0.21 },
    "NZDSF+": { zeroDispWavelength: 1450, slope: 0.06, dispersion1550: 4.5, attenuation: 0.22 },
    "NZDSF-": { zeroDispWavelength: 1580, slope: 0.06, dispersion1550: -4.0, attenuation: 0.22 },
    DCF: { zeroDispWavelength: 1550, slope: -0.15, dispersion1550: -80, attenuation: 0.55 },
  };

  const p = params[fiberType];
  const dispersionAtWavelength = useMemo(() => {
    return p.slope * (wavelength - p.zeroDispWavelength);
  }, [wavelength, p]);

  // Total accumulated dispersion
  const totalDispersion = dispersionAtWavelength * fiberLength;

  // Dispersion-limited distance
  const dispersionLimitedDistance = useMemo(() => {
    // Approx: L_max ≈ 1 / (4 · D · σ_λ · B) for NRZ
    // Using spectral width ≈ 0.1 nm for typical laser
    const sigmaLambda = 0.1; // nm
    if (Math.abs(dispersionAtWavelength) < 0.01) return Infinity;
    return 1e5 / (4 * Math.abs(dispersionAtWavelength) * sigmaLambda * bitRate);
  }, [dispersionAtWavelength, bitRate]);

  // Plot: dispersion vs wavelength
  const plotData = useMemo(() => {
    const wavelengths: number[] = [];
    const dispersions: number[] = [];

    for (let w = 1200; w <= 1700; w += 5) {
      wavelengths.push(w);
      dispersions.push(p.slope * (w - p.zeroDispWavelength));
    }

    return [
      {
        x: wavelengths, y: dispersions, type: "scatter" as const, mode: "lines" as const,
        name: "Dispersion", line: { color: "#3b82f6", width: 2 },
      },
      {
        x: [wavelength], y: [dispersionAtWavelength], type: "scatter" as const, mode: "markers" as const,
        name: "Current λ", marker: { color: "#22c55e", size: 12 },
      },
      {
        x: [1200, 1700], y: [0, 0], type: "scatter" as const, mode: "lines" as const,
        name: "Zero dispersion", line: { color: "#ef4444", width: 1, dash: "dash" as const },
      },
    ];
  }, [wavelength, p, dispersionAtWavelength]);

  const layout = {
    title: "Dispersion vs Wavelength",
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Dispersion D (ps/(nm·km))", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true,
    legend: { x: 0.02, y: 0.98 }, height: 400,
  };

  const totalAttenuation = p.attenuation * fiberLength;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Type</label>
              <select value={fiberType} onChange={(e) => setFiberType(e.target.value as "DSF" | "NZDSF+" | "NZDSF-" | "DCF")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                <option value="DSF">DSF (Zero at 1550 nm)</option>
                <option value="NZDSF+">NZ-DSF+ (Positive slope)</option>
                <option value="NZDSF-">NZ-DSF− (Negative slope)</option>
                <option value="DCF">Dispersion Compensating Fiber</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wavelength (nm)</label>
              <input type="number" value={wavelength} onChange={(e) => setWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Length (km)</label>
              <input type="number" value={fiberLength} onChange={(e) => setFiberLength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bit Rate (Gbps)</label>
              <input type="number" value={bitRate} onChange={(e) => setBitRate(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Zero-Disp λ₀:</span><span className="font-mono">{p.zeroDispWavelength} nm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Dispersion slope S:</span><span className="font-mono">{p.slope} ps/(nm²·km)</span></div>
                <div className="flex justify-between"><span className="text-gray-400">D(λ):</span><span className={`font-mono text-lg ${dispersionAtWavelength === 0 ? "text-green-400" : "text-blue-400"}`}>{dispersionAtWavelength.toFixed(2)} ps/(nm·km)</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total dispersion:</span><span className="font-mono">{totalDispersion.toFixed(1)} ps/nm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Attenuation:</span><span className="font-mono">{p.attenuation} dB/km</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total loss:</span><span className="font-mono">{totalAttenuation.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Dispersion limit:</span><span className="font-mono">{dispersionLimitedDistance === Infinity ? "∞" : dispersionLimitedDistance.toFixed(0) + " km"}</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">D(λ) ≈ S · (λ - λ₀)</p>
              <p className="font-mono text-sm mt-1">D_total = D · L</p>
              <p className="font-mono text-sm mt-1">L_max ≈ 10⁵ / (4·|D|·σ_λ·B) km</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <ChartPanel data={plotData} layout={layout} />
        </div>
      </div>
    </div>
  );
}
