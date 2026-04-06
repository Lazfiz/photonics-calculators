"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

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
        <ValidatedNumberInput label="SMF Length (km)" value={lengthSMF} onChange={setLengthSMF} min={0} max={500} />
        <ValidatedNumberInput label="SMF Dispersion (ps/nm/km)" value={dispSMF} onChange={setDispSMF} step="0.1" />
        <ValidatedNumberInput label="SMF Slope (ps/nm²/km)" value={slopeSMF} onChange={setSlopeSMF} step="0.001" />
        <ValidatedNumberInput label="DCF Length (km)" value={lengthDCF} onChange={setLengthDCF} min={0} max={100} />
        <ValidatedNumberInput label="DCF Dispersion (ps/nm/km)" value={dispDCF} onChange={setDispDCF} step="1" />
        <ValidatedNumberInput label="DCF Slope (ps/nm²/km)" value={slopeDCF} onChange={setSlopeDCF} step="0.01" />
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
