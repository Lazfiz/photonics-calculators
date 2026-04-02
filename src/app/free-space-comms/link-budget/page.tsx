"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function LinkBudgetPage() {
  const [txPower, setTxPower] = useState(10);
  const [txGain, setTxGain] = useState(30);
  const [range, setRange] = useState(1);
  const [rxAperture, setRxAperture] = useState(10);
  const [rxGain, setRxGain] = useState(40);
  const [wavelength, setWavelength] = useState(1550);
  const [atmosphere, setAtmosphere] = useState(3);
  const [misc, setMisc] = useState(2);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const R = range * 1e3;
    const fspl = 20 * Math.log10(4 * Math.PI * R / lambda);
    const pr = txPower + txGain + rxGain - fspl - atmosphere - misc;
    return { fspl, pr, margin: pr - (-30) };
  }, [txPower, txGain, range, rxGain, wavelength, atmosphere, misc, rxAperture]);

  const plotData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const ranges = Array.from({ length: 200 }, (_, i) => 0.01 + i * 0.05);
    const powers = ranges.map((r) => {
      const R = r * 1e3;
      const fspl = 20 * Math.log10(4 * Math.PI * R / lambda);
      return txPower + txGain + rxGain - fspl - atmosphere - misc;
    });
    return [{ x: ranges, y: powers, type: "scatter", mode: "lines", name: "Rx Power", line: { color: "#06b6d4" } }];
  }, [txPower, txGain, rxGain, wavelength, atmosphere, misc]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      <Link href="/free-space-comms" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">← Back to Free-Space Comms</Link>
      <h1 className="text-3xl font-bold mb-6">Link Budget Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["TX Power (dBm)", txPower, setTxPower],
            ["TX Gain (dBi)", txGain, setTxGain],
            ["Range (km)", range, setRange],
            ["RX Aperture (cm)", rxAperture, setRxAperture],
            ["RX Gain (dBi)", rxGain, setRxGain],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["Atmospheric Loss (dB)", atmosphere, setAtmosphere],
            ["Misc Loss (dB)", misc, setMisc],
          ].map(([label, val, set]) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">FSPL</span><span>{calc.fspl.toFixed(1)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Received Power</span><span>{calc.pr.toFixed(1)} dBm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Margin (vs −30 dBm)</span>
                <span className={calc.margin >= 0 ? "text-green-400" : "text-red-400"}>{calc.margin.toFixed(1)} dB</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <Plot data={plotData} layout={{
              xaxis: { title: "Range (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Rx Power (dBm)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
