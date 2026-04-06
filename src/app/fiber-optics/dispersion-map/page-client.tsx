"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function DispersionMapPage() {
  const [lengthSMF, setLengthSMF] = useState(80);
  const [lengthDCF, setLengthDCF] = useState(15);
  const [dispSMF, setDispSMF] = useState(17);
  const [dispDCF, setDispDCF] = useState(-100);
  const [slopeSMF, setSlopeSMF] = useState(0.056);
  const [slopeDCF, setSlopeDCF] = useState(-0.2);
  const [wavelength, setWavelength] = useState(1550);

  const totalDispSMF = lengthSMF * dispSMF;
  const totalDispDCF = lengthDCF * dispDCF;
  const netDispersion = totalDispSMF + totalDispDCF;
  const totalLength = lengthSMF + lengthDCF;

  const slopeCompensation = (lengthSMF * slopeSMF + lengthDCF * slopeDCF) / (lengthSMF + lengthDCF);
  const residualSlope = lengthSMF * slopeSMF + lengthDCF * slopeDCF;

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 100 }, (_, i) => 1530 + i);
    const dispVsWl = wls.map(wl => {
      const deltaWl = (wl - wavelength) / 10;
      return lengthSMF * (dispSMF + slopeSMF * deltaWl) + lengthDCF * (dispDCF + slopeDCF * deltaWl);
    });
    return [
      { x: wls, y: dispVsWl, type: "scatter" as const, mode: "lines" as const, name: "Net Dispersion", line: { color: "#60a5fa" } },
      { x: [wavelength], y: [netDispersion], type: "scatter" as const, mode: "markers" as const, name: "Operating λ", marker: { color: "#f87171", size: 12 } },
    ];
  }, [lengthSMF, lengthDCF, dispSMF, dispDCF, slopeSMF, slopeDCF, wavelength, netDispersion]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Dispersion Map Calculator" description="Design a dispersion map for a fiber link using SMF and DCF segments.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">SMF Length (km)</span>
          <input type="number" value={lengthSMF} onChange={e => setLengthSMF(+e.target.value)} min={0} max={500}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">SMF Dispersion (ps/nm/km)</span>
          <input type="number" value={dispSMF} onChange={e => setDispSMF(+e.target.value)} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">SMF Slope (ps/nm²/km)</span>
          <input type="number" value={slopeSMF} onChange={e => setSlopeSMF(+e.target.value)} step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">DCF Length (km)</span>
          <input type="number" value={lengthDCF} onChange={e => setLengthDCF(+e.target.value)} min={0} max={100}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">DCF Dispersion (ps/nm/km)</span>
          <input type="number" value={dispDCF} onChange={e => setDispDCF(+e.target.value)} step="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">DCF Slope (ps/nm²/km)</span>
          <input type="number" value={slopeDCF} onChange={e => setSlopeDCF(+e.target.value)} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Net Dispersion</p>
          <p className={`text-2xl font-bold ${Math.abs(netDispersion) < 100 ? "text-green-400" : "text-yellow-400"}`}>{netDispersion.toFixed(0)} ps/nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SMF Total</p>
          <p className="text-2xl font-bold text-blue-400">{totalDispSMF.toFixed(0)} ps/nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DCF Total</p>
          <p className="text-2xl font-bold text-purple-400">{totalDispDCF.toFixed(0)} ps/nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Residual Slope</p>
          <p className="text-2xl font-bold text-orange-400">{residualSlope.toFixed(3)} ps/nm²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Net Dispersion (ps/nm)", gridcolor: "#374151", zerolinecolor: "#4b5563" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
