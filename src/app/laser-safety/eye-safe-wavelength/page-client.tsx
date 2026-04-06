"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function EyeSafeWavelengthPage() {
  const [pulseEnergy, setPulseEnergy] = useState(100); // mJ
  const [pulseWidth, setPulseWidth] = useState(10); // ns
  const [repetitionRate, setRepetitionRate] = useState(10); // Hz
  const [beamDiam, setBeamDiam] = useState(5); // mm

  const results = useMemo(() => {
    const E = pulseEnergy / 1000; // J
    const tp = pulseWidth * 1e-9; // s
    const f = repetitionRate;
    const a = beamDiam / 1000; // m
    const area = Math.PI * (a / 2) ** 2 * 1e4; // cm²

    // Retinal hazard: 400-1400 nm — cornea focuses onto retina
    // Eye-safe: 1400-1500 nm (retina transparent), 1500-1800 nm, 2000+ nm
    // Water absorption peaks make cornea absorb, protecting retina

    // MPE for different regions (simplified single pulse)
    const regions = [
      { name: "UV-B (280-315 nm)", range: [280, 315], mpe: 0.003 * Math.pow(tp, 0.75) * 1e6 }, // µJ/cm²
      { name: "UV-A (315-400 nm)", range: [315, 400], mpe: 0.56 * Math.pow(tp, 0.75) * 1e3 },
      { name: "Visible (400-700 nm)", range: [400, 700], mpe: 1.8 * Math.pow(tp, 0.75) * 1e3 },
      { name: "Near-IR A (700-1050 nm)", range: [700, 1050], mpe: 1.8 * 1.5 * Math.pow(tp, 0.75) * 1e3 },
      { name: "Near-IR B (1050-1400 nm)", range: [1050, 1400], mpe: 5.0 * Math.pow(tp, 0.75) * 1e3 },
      { name: "Eye-safe (1400-1500 nm)", range: [1400, 1500], mpe: 100 }, // ~100 mJ/cm²
      { name: "Mid-IR (1500-1800 nm)", range: [1500, 1800], mpe: 100 },
      { name: "Mid-IR (1800-2600 nm)", range: [1800, 2600], mpe: 100 },
      { name: "Far-IR (2600-10000 nm)", range: [2600, 10000], mpe: 10 },
    ];

    // Corneal fluence from our pulse
    const cornealFluence = (E / area) * 1000; // mJ/cm²

    // Retinal spot: cornea focuses with ~17mm focal length
    // retinal spot ~ 10-20 µm, so fluence amplified ~10^5
    const retinalMagnification = (17e-3 / a) ** 2; // approx
    const retinalFluence = cornealFluence * retinalMagnification;

    // Water absorption (per cm of water/tissue)
    const waterAbsorption = (wl: number) => {
      if (wl < 400) return 0.1;
      if (wl < 1400) return 0.01; // very transparent — retinal hazard
      if (wl < 1500) return 100; // strong absorption — eye safe
      if (wl < 1800) return 50;
      if (wl < 3000) return 1000;
      return 10000;
    };

    return { regions, cornealFluence, retinalFluence, retinalMagnification, waterAbsorption };
  }, [pulseEnergy, pulseWidth, beamDiam]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 280 + i * 20);
    const mpeCurve = wls.map(wl => {
      const tp = pulseWidth * 1e-9;
      if (wl < 315) return 0.003 * Math.pow(tp, 0.75) * 1e6;
      if (wl < 400) return 0.56 * Math.pow(tp, 0.75) * 1e3;
      if (wl < 700) return 1.8 * Math.pow(tp, 0.75) * 1e3;
      if (wl < 1050) return 1.8 * 1.5 * Math.pow(tp, 0.75) * 1e3;
      if (wl < 1400) return 5.0 * Math.pow(tp, 0.75) * 1e3;
      return 100;
    });
    const hazardLine = wls.map(() => results.cornealFluence);

    // Eye-safe band highlight
    const eyeSafe = wls.map(wl => wl >= 1400 && wl <= 1500 ? results.cornealFluence : null);

    return [
      { x: wls, y: mpeCurve, type: "scatter" as const, mode: "lines" as const, name: "MPE (single pulse)", line: { color: "#60a5fa", width: 2 } },
      { x: wls, y: hazardLine, type: "scatter" as const, mode: "lines" as const, name: "Corneal Fluence", line: { color: "#f87171", dash: "dash" } },
      { x: wls, y: eyeSafe, type: "scatter" as const, mode: "lines" as const, name: "Eye-safe band", fill: "tozeroy" as const, fillcolor: "rgba(74,222,128,0.15)", line: { color: "transparent" } },
    ];
  }, [results, pulseWidth]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Eye-Safe Wavelength Region" description="Identifies the eye-safe wavelength bands (1400–1500 nm, 1500–1800 nm) where corneal absorption protects the retina. Compare your laser&apos;s fluence against spectral MPE.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Pulse Energy (mJ)" value={pulseEnergy} onChange={setPulseEnergy} min={0.001} step="any" />
        <ValidatedNumberInput label="Pulse Width (ns)" value={pulseWidth} onChange={setPulseWidth} min={0.1} step="any" />
        <ValidatedNumberInput label="Repetition Rate (Hz)" value={repetitionRate} onChange={setRepetitionRate} min={1} />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDiam} onChange={setBeamDiam} min={0.1} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Corneal Fluence</p>
          <p className="text-3xl font-bold text-blue-400">{results.cornealFluence.toFixed(2)} mJ/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Est. Retinal Fluence (400-1400nm)</p>
          <p className="text-3xl font-bold text-red-400">{results.retinalFluence.toFixed(1)} mJ/cm²</p>
          <p className="text-sm text-gray-500 mt-1">Magnification: {results.retinalMagnification.toFixed(0)}×</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "MPE / Fluence (mJ/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Spectral Region Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead><tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2">Region</th><th className="text-left py-2">Range</th>
              <th className="text-left py-2">MPE (mJ/cm²)</th><th className="text-left py-2">Status</th>
            </tr></thead>
            <tbody>
              {results.regions.map((r, i) => {
                const safe = results.cornealFluence < r.mpe;
                return (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2">{r.range[0]}–{r.range[1]} nm</td>
                    <td className="py-2">{r.mpe.toFixed(2)}</td>
                    <td className={`py-2 ${safe ? "text-green-400" : "text-red-400"}`}>{safe ? "✓ Safe" : "✗ Exceeds MPE"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-gray-300 text-sm space-y-2 font-mono">
          <p>Eye-safe band: 1400–1500 nm (water absorption peak)</p>
          <p>Retinal magnification ≈ (f<sub>eye</sub>/r<sub>beam</sub>)² ≈ (17mm/a)²</p>
          <p>Retinal hazard zone: 400–1400 nm (cornea + lens transparent)</p>
          <p>Corneal hazard zone: &lt; 400 nm (UV) and &gt; 1400 nm (IR absorbed)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
