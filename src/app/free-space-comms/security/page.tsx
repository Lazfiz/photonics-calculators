"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SecurityPage() {
  const [dataRate, setDataRate] = useState(10);
  const [linkRange, setLinkRange] = useState(1);
  const [txPower, setTxPower] = useState(10);
  const [rxAperture, setRxAperture] = useState(10);
  const [wavelength, setWavelength] = useState(1550);
  const [eveDistance, setEveDistance] = useState(10);
  const [eveAperture, setEveAperture] = useState(20);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    // Beam divergence (diffraction-limited)
    const txDia = 5e-3; // assume 5mm TX aperture
    const theta = lambda / (Math.PI * txDia / 2); // half-angle rad
    const fullDiv = 2 * theta * 1e3; // mrad

    // Beam diameter at legitimate receiver
    const beamAtRx = 2 * linkRange * 1e3 * theta;
    // Power density at legitimate receiver
    const beamArea = Math.PI * (beamAtRx / 2) ** 2;
    const powerDensityRx = Math.pow(10, txPower / 10) * 1e-3 / beamArea; // W/m²

    // Power at legitimate receiver
    const rxAntArea = Math.PI * (rxAperture * 1e-2 / 2) ** 2;
    const rxPower = powerDensityRx * rxAntArea;

    // Eve's intercept (off-axis)
    const beamAtEve = 2 * eveDistance * 1e3 * theta;
    const beamAreaEve = Math.PI * (beamAtEve / 2) ** 2;
    const evePowerDensity = Math.pow(10, txPower / 10) * 1e-3 / beamAreaEve;
    const eveAntArea = Math.PI * (eveAperture * 1e-2 / 2) ** 2;
    const evePower = evePowerDensity * eveAntArea;

    // Security metrics
    const powerRatio = 10 * Math.log10(rxPower / Math.max(evePower, 1e-30));
    const eveAdvantage = 10 * Math.log10(evePower / rxPower);

    // Quantum key rate (simplified BB84)
    const qber = 0.02; // assumed quantum bit error rate
    const siftedRate = dataRate * 1e9 * 0.5 * (1 - qber);
    const privacyAmplification = 1 - 2 * qber;
    const secureKeyRate = siftedRate * privacyAmplification;

    // Physical layer security: secrecy capacity
    const snrBob = rxPower / 1e-6; // noise floor -60 dBm
    const snrEve = evePower / 1e-6;
    const secrecyCapacity = Math.max(0, Math.log2(1 + snrBob) - Math.log2(1 + snrEve)) * 1e-9; // Gbps

    return {
      fullDiv, beamAtRx, powerDensityRx, rxPower, evePower, powerRatio, eveAdvantage,
      secureKeyRate, secrecyCapacity, snrBob, snrEve,
    };
  }, [dataRate, linkRange, txPower, rxAperture, wavelength, eveDistance, eveAperture]);

  const plotData = useMemo(() => {
    const distances = Array.from({ length: 200 }, (_, i) => 1 + i * 0.5);
    const lambda = wavelength * 1e-9;
    const txDia = 5e-3;
    const theta = lambda / (Math.PI * txDia / 2);
    const txPowerW = Math.pow(10, txPower / 10) * 1e-3;

    const evePowers = distances.map((d) => {
      const beamD = 2 * d * 1e3 * theta;
      return txPowerW / (Math.PI * (beamD / 2) ** 2) * Math.PI * (eveAperture * 1e-2 / 2) ** 2;
    });
    const bobPowers = distances.map(() => {
      const beamD = 2 * linkRange * 1e3 * theta;
      return txPowerW / (Math.PI * (beamD / 2) ** 2) * Math.PI * (rxAperture * 1e-2 / 2) ** 2;
    });

    return [
      { x: distances, y: evePowers.map(p => 10 * Math.log10(p * 1e3)), type: "scatter", mode: "lines", name: "Eve Power (dBm)", line: { color: "#f43f5e" } },
      { x: distances, y: bobPowers.map(() => 10 * Math.log10(bobPowers[0] * 1e3)), type: "scatter", mode: "lines", name: "Bob Power (dBm)", line: { color: "#22c55e", dash: "dash" } },
    ];
  }, [txPower, rxAperture, wavelength, linkRange, eveAperture]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      <Link href="/free-space-comms" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">← Back to Free-Space Comms</Link>
      <h1 className="text-3xl font-bold mb-6">FSO Security Analysis</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm">
        <p className="text-gray-400">FSO's narrow beam provides inherent physical-layer security. Analysis includes intercept risk, QKD key rates, and secrecy capacity:</p>
        <p className="text-cyan-300 mt-1 font-mono">C_s = max(0, log₂(1+SNR_Bob) − log₂(1+SNR_Eve))</p>
        <p className="text-gray-500 mt-1">BB84 secure key rate: R = R_sifted × (1 − 2·QBER)</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Link Parameters</h2>
          {[
            ["TX Power (dBm)", txPower, setTxPower],
            ["RX Aperture (cm)", rxAperture, setRxAperture],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["Link Range (km)", linkRange, setLinkRange],
            ["Data Rate (Gbps)", dataRate, setDataRate],
          ].map(([label, val, set]) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
          <h3 className="text-md font-semibold text-red-400 mt-4">Eavesdropper</h3>
          {[
            ["Eve Distance from TX (m)", eveDistance, setEveDistance],
            ["Eve Aperture (cm)", eveAperture, setEveAperture],
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
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Security Metrics</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Bob Power</span><span>{(10 * Math.log10(calc.rxPower * 1e3)).toFixed(1)} dBm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Eve Power</span><span className="text-red-400">{(10 * Math.log10(Math.max(calc.evePower, 1e-30) * 1e3)).toFixed(1)} dBm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Bob/Eve Power Ratio</span><span className="text-green-400">{calc.powerRatio.toFixed(1)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Secrecy Capacity</span><span className="text-yellow-400">{calc.secrecyCapacity.toFixed(3)} Gbps</span></div>
              <div className="flex justify-between"><span className="text-gray-400">BB84 Secure Key Rate</span><span>{(calc.secureKeyRate / 1e9).toFixed(2)} Gbps</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Beam Divergence</span><span>{calc.fullDiv.toFixed(2)} mrad</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Beam Dia at RX</span><span>{calc.beamAtRx.toFixed(1)} m</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <Plot data={plotData} layout={{
              xaxis: { title: "Eve Distance (m)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Intercepted Power (dBm)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { x: 0.02, y: 0.98 },
            }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
