"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function AnsiIecComparisonPage() {
  const [wavelength, setWavelength] = useState(632);
  const [exposureTime, setExposureTime] = useState(0.25);
  const [pulseEnergy, setPulseEnergy] = useState(1); // µJ

  // ANSI Z136.1 MPE (J/cm²) for intrabeam, 400-700nm
  // Returns radiant exposure in J/cm²
  const ansiMPE = (wl: number, t: number) => {
    const lam = wl / 1000; // µm
    if (lam >= 0.4 && lam < 0.7) {
      if (t <= 0.7) return 1.8e-3 * Math.pow(t, 0.75);
      return 1e-3 * Math.pow(t, 0.75);
    }
    if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      return 1.8e-3 * CA * Math.pow(Math.min(t, 0.7), 0.75);
    }
    // UV/IR simplified
    return 1e-3 * Math.pow(t, 0.75);
  };

  // IEC 60825-1 AEL (J into 7mm aperture). Convert to J/cm² for comparison.
  const pupilArea = Math.PI * 0.35 * 0.35; // cm² (7mm diameter)
  const iecMPE = (wl: number, t: number) => {
    const lam = wl / 1000;
    if (lam >= 0.4 && lam < 0.7) {
      if (t <= 0.7) return 7.9e-4 * Math.pow(t, 0.75) / pupilArea;
      return 3.9e-4 * Math.pow(t, 0.75) / pupilArea;
    }
    if (lam >= 0.7 && lam < 1.05) {
      const C4 = Math.pow(10, 0.02 * (lam - 0.7));
      return 7.9e-4 * C4 * Math.pow(Math.min(t, 0.7), 0.75) / pupilArea;
    }
    return 7.9e-4 * Math.pow(t, 0.75) / pupilArea;
  };

  const results = useMemo(() => {
    const mpe_ansi = ansiMPE(wavelength, exposureTime); // J/cm²
    const mpe_iec = iecMPE(wavelength, exposureTime); // J/cm² (converted from AEL)
    const mpe_ansi_mJ = mpe_ansi * 1000;
    const mpe_iec_mJ = mpe_iec * 1000;
    const pulse_mJ = pulseEnergy / 1000;
    // Convert pulse energy to J/cm² via 7mm pupil for comparison
    const pulse_Jcm2 = (pulseEnergy * 1e-6) / pupilArea;
    const ratio_ansi = mpe_ansi / pulse_Jcm2;
    const ratio_iec = mpe_iec / pulse_Jcm2;

    return { mpe_ansi_mJ, mpe_iec_mJ, pulse_mJ, ratio_ansi, ratio_iec };
  }, [wavelength, exposureTime, pulseEnergy]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 600 }, (_, i) => 300 + i);
    const ansiVals = wls.map(w => ansiMPE(w, exposureTime) * 1000);
    const iecVals = wls.map(w => iecMPE(w, exposureTime) * 1000);

    return [
      { x: wls, y: ansiVals, type: "scatter" as const, mode: "lines" as const, name: "ANSI Z136.1 MPE (mJ/cm²)", line: { color: "#60a5fa" } },
      { x: iecVals.map((_, i) => wls[i]), y: iecVals, type: "scatter" as const, mode: "lines" as const, name: "IEC 60825-1 AEL (mJ/cm²)", line: { color: "#f472b6" } },
    ];
  }, [exposureTime]);

  const layout = {
    paper_bgcolor: "#030712",
    plot_bgcolor: "#030712",
    font: { color: "#9ca3af" },
    xaxis: { title: "Wavelength (nm)", gridcolor: "#1f2937", color: "#9ca3af" },
    yaxis: { title: "Exposure Limit (mJ)", gridcolor: "#1f2937", color: "#9ca3af", type: "log" as const },
    margin: { t: 30, b: 50, l: 60, r: 20 },
    legend: { font: { color: "#d1d5db" } },
  };

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="ANSI vs IEC MPE Comparison" description="Compares Maximum Permissible Exposure (ANSI Z136.1) with Accessible Emission Limits (IEC 60825-1) across wavelengths.">
            
      <LaserSafetyDisclaimer />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Exposure Time (s)</label>
          <input type="number" step="0.01" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Pulse Energy (µJ)</label>
          <input type="number" step="0.1" value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">ANSI MPE</div>
          <div className="text-2xl font-bold text-blue-400">{results.mpe_ansi_mJ.toExponential(2)}</div>
          <div className="text-xs text-gray-500">mJ/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">IEC MPE (converted)</div>
          <div className="text-2xl font-bold text-pink-400">{results.mpe_iec_mJ.toExponential(2)}</div>
          <div className="text-xs text-gray-500">mJ/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Safety Margin</div>
          <div className={`text-2xl font-bold ${Math.min(results.ratio_ansi, results.ratio_iec) >= 1 ? "text-green-400" : "text-red-400"}`}>
            {Math.min(results.ratio_ansi, results.ratio_iec).toFixed(1)}×
          </div>
          <div className="text-xs text-gray-500">most restrictive</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <p className="text-gray-500 mb-1">Key Formulas:</p>
        <p>ANSI (400-700nm, t≤0.7s): MPE = 1.8×10⁻³ × t<sup>0.75</sup> J/cm²</p>
        <p>ANSI (700-1050nm): MPE = 1.8×10⁻³ × C<sub>A</sub> × t<sup>0.75</sup> J/cm², where C<sub>A</sub> = 10<sup>0.002(λ-700)</sup></p>
        <p>IEC Class 1 AEL: ~7.9×10⁻⁴ × t<sup>0.75</sup> J (into 7mm aperture)</p>
      </div>

      <ChartPanel data={chartData} layout={layout} className="w-full h-[400px]" />
    </CalculatorShell>
  );
}
