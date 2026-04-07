"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function DispersionCompensationPage() {
  const [wavelength, setWavelength] = useState(1550); // nm
  const [fiberLength, setFiberLength] = useState(80); // km
  const [dispersionParam, setDispersionParam] = useState(17); // ps/(nm·km)
  const [slope, setSlope] = useState(0.08); // ps/(nm²·km)
  const [zeroDispWavelength, setZeroDispWavelength] = useState(1310); // nm
  const [bitRate, setBitRate] = useState(10); // Gbps
  const [dcfRatio, setDcfRatio] = useState(0.2); // DCF length ratio

  const results = useMemo(() => {
    const lambda0 = zeroDispWavelength;
    const lambda = wavelength;
    const L = fiberLength;
    const D = dispersionParam;
    const S = slope;

    // Group Velocity Dispersion (GVD)
    const GVD = D * L; // ps/nm total

    // Calculate D from slope if using zero-dispersion wavelength
    const Dcalc = S * (lambda - lambda0) / 1000; // ps/(nm·km)

    // Third-Order Dispersion (TOD) / Dispersion slope
    const TOD = S * L; // ps/nm² total

    // Pulse broadening
    const spectralWidth = bitRate * 0.5; // nm (rough approximation)
    const pulseBroadening = Math.abs(GVD) * spectralWidth; // ps

    // Maximum bit rate for 1-bit dispersion limit
    const maxBitRate = 1 / (pulseBroadening * 1e-12) / 1e9; // Gbps

    // Dispersion-limited distance
    const dispersionLimitedDist = 0.25 / (Math.abs(D) * spectralWidth * spectralWidth); // km (1 dB penalty)

    // DCF compensation
    const DCF_D = -80; // ps/(nm·km) typical DCF dispersion
    const dcfLength = L * dcfRatio;
    const dcfDispersion = DCF_D * dcfLength;
    const residualDispersion = GVD + dcfDispersion;
    const compensationRatio = -dcfDispersion / GVD * 100;

    // Chirp compensation with pre-chirp
    const prechirpRequired = -GVD / 2; // ps/nm

    // Wavelength sweep for dispersion
    const wavelengths = Array.from({ length: 100 }, (_, i) => 1200 + i * 8);
    const dispersionVsWl = wavelengths.map((wl) => S * (wl - lambda0) / 1000);
    const accumulatedDisp = dispersionVsWl.map((d) => d * L);

    // Eye closure penalty vs residual dispersion
    const residualRange = Array.from({ length: 50 }, (_, i) => -500 + i * 20);
    const eyePenalty = residualRange.map((r) => {
      if (Math.abs(r) < 100) return 0.5 * Math.pow(r / 100, 2);
      return 1.5 * Math.pow(Math.abs(r) / 500, 1.5);
    });

    // Dispersion map
    const distances = Array.from({ length: 100 }, (_, i) => (i + 1) * (L / 100));
    const dispMap = distances.map((d) => Dcalc * d);
    const dispMapWithDCF = distances.map((d) => {
      const fiberDisp = Dcalc * d;
      if (d <= L * (1 - dcfRatio)) {
        return fiberDisp;
      } else {
        const dcfDist = d - L * (1 - dcfRatio);
        return Dcalc * L * (1 - dcfRatio) + DCF_D * dcfDist;
      }
    });

    return { GVD, Dcalc, TOD, pulseBroadening, maxBitRate, dispersionLimitedDist, dcfLength, dcfDispersion, residualDispersion, compensationRatio, prechirpRequired, wavelengths, dispersionVsWl, accumulatedDisp, residualRange, eyePenalty, distances, dispMap, dispMapWithDCF };
  }, [wavelength, fiberLength, dispersionParam, slope, zeroDispWavelength, bitRate, dcfRatio]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Dispersion Compensation" description="GVD and TOD compensation analysis for fiber optic links.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Fiber Parameters</h2>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "Fiber Length (km)", val: fiberLength, set: setFiberLength },
            { label: "Dispersion D (ps/nm·km)", val: dispersionParam, set: setDispersionParam },
            { label: "Dispersion Slope S (ps/nm²·km)", val: slope, set: setSlope },
            { label: "Zero-Dispersion λ₀ (nm)", val: zeroDispWavelength, set: setZeroDispWavelength },
            { label: "Bit Rate (Gbps)", val: bitRate, set: setBitRate },
            { label: "DCF Length Ratio", val: dcfRatio, set: setDcfRatio },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step="any" value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="GVD (total)" value={`${results.GVD.toFixed(1)} ps/nm`} />
            <ResultRow label="TOD (total)" value={`${results.TOD.toFixed(3)} ps/nm²`} />
            <ResultRow label="Pulse Broadening" value={`${results.pulseBroadening.toFixed(1)} ps`} />
            <ResultRow label="Max Bit Rate (disp. limited)" value={`${results.maxBitRate.toFixed(1)} Gbps`} />
            <ResultRow label="Disp. Limited Distance" value={`${results.dispersionLimitedDist.toFixed(1)} km`} />
            <ResultRow label="DCF Length" value={`${results.dcfLength.toFixed(1)} km`} />
            <ResultRow label="DCF Dispersion" value={`${results.dcfDispersion.toFixed(1)} ps/nm`} />
            <ResultRow label="Residual Dispersion" value={`${results.residualDispersion.toFixed(1)} ps/nm`} />
            <ResultRow label="Compensation Ratio" value={`${results.compensationRatio.toFixed(1)}%`} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Dispersion vs Wavelength</h2>
          <ChartPanel data={[
              { type: "scatter" as const, mode: "lines" as const, x: results.wavelengths, y: results.dispersionVsWl, name: "D(λ)", line: { color: "#3b82f6", width: 2 } },
              { type: "scatter" as const, mode: "lines" as const, x: results.wavelengths, y: results.accumulatedDisp, name: "Accumulated", yaxis: "y2", line: { color: "#22c55e", dash: "dash" } },
            ]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "D (ps/nm·km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis2: { title: "Accumulated (ps/nm)", overlaying: "y", side: "right", color: "#22c55e", gridcolor: "transparent" },
              margin: { l: 50, r: 60, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
              shapes: [{ type: "line", x0: zeroDispWavelength, x1: zeroDispWavelength, y0: -2, y1: 2, line: { color: "#f59e0b", dash: "dot" } }],
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Eye Closure Penalty vs Residual Dispersion</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.residualRange, y: results.eyePenalty, line: { color: "#ef4444", width: 2 } }]}
            layout={{
              xaxis: { title: "Residual Dispersion (ps/nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Eye Closure Penalty (dB)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Dispersion Map</h2>
          <ChartPanel data={[
              { type: "scatter" as const, mode: "lines" as const, x: results.distances, y: results.dispMap, name: "Without DCF", line: { color: "#3b82f6", width: 2 } },
              { type: "scatter" as const, mode: "lines" as const, x: results.distances, y: results.dispMapWithDCF, name: "With DCF", line: { color: "#22c55e", width: 2 } },
            ]}
            layout={{
              xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Accumulated Dispersion (ps/nm)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
