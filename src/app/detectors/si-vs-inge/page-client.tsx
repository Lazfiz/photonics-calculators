"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
// Si vs InGaAs detector comparison
// Si: 350-1100 nm, high QE, low dark current
// InGaAs: 900-1700 nm (extended to 2600), higher dark current, lower QE at visible
export default function SiVsInGaAsPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [opticalPowerDbm, setOpticalPowerDbm] = useState(-40);
  const [temperature, setTemperature] = useURLState("temperature", 25);

  const powerW = Math.pow(10, opticalPowerDbm / 10) * 1e-3;
  const photonEnergy = 6.626e-34 * 3e8 / (wavelength * 1e-9);
  const photonRate = powerW / photonEnergy;

  // Si parameters
  const siQE = getSiQE(wavelength);
  const siDarkCurrent = 0.01 * Math.pow(2, (temperature - 25) / 6); // nA
  const siNoiseFloor = 1e-12; // A/√Hz

  // InGaAs parameters
  const inGaAsQE = getInGaAsQE(wavelength);
  const inGaAsDarkCurrent = 5 * Math.pow(2, (temperature - 25) / 5); // nA (InGaAs doubles faster)
  const inGaAsNoiseFloor = 5e-12; // A/√Hz

  const siSignal = photonRate * siQE * 1.602e-19;
  const inGaAsSignal = photonRate * inGaAsQE * 1.602e-19;

  const q = 1.602e-19;
  const bw = 1e6; // 1 MHz measurement bandwidth
  const siSNR = siSignal / Math.sqrt(2 * q * siSignal * bw + siNoiseFloor ** 2 * bw + 2 * q * siDarkCurrent * 1e-9 * bw);
  const inGaAsSNR = inGaAsSignal / Math.sqrt(2 * q * inGaAsSignal * bw + inGaAsNoiseFloor ** 2 * bw + 2 * q * inGaAsDarkCurrent * 1e-9 * bw);

  function getSiQE(wl: number): number {
    if (wl < 350 || wl > 1100) return 0;
    if (wl < 500) return 0.65 + 0.3 * (wl - 350) / 150;
    if (wl < 900) return 0.95;
    return 0.95 * (1100 - wl) / 200;
  }

  function getInGaAsQE(wl: number): number {
    if (wl < 900 || wl > 1700) return 0;
    if (wl < 1000) return 0.1 * (wl - 900) / 100;
    if (wl < 1500) return 0.1 + 0.75 * (wl - 1000) / 500;
    return 0.85 * (1700 - wl) / 200;
  }

  // Spectral response comparison
  const spectralData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 300 + i * 4);
    return {
      wls,
      siQE: wls.map(getSiQE),
      inGaAsQE: wls.map(getInGaAsQE),
    };
  }, []);

  // SNR vs wavelength
  const snrVsWavelength = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 400 + i * 7);
    const siSNRs = wls.map(wl => {
      const pe = 6.626e-34 * 3e8 / (wl * 1e-9);
      const pr = powerW / pe;
      const qe = getSiQE(wl);
      const sig = pr * qe * 1.602e-19;
      const dc = 0.01 * Math.pow(2, (temperature - 25) / 6) * 1e-9; // Si dark current in A
      return qe > 0 ? sig / Math.sqrt(2 * 1.602e-19 * sig * 1e6 + siNoiseFloor ** 2 * 1e6 + 2 * 1.602e-19 * dc * 1e6) : 0;
    });
    const inGaAsSNRs = wls.map(wl => {
      const pe = 6.626e-34 * 3e8 / (wl * 1e-9);
      const pr = powerW / pe;
      const qe = getInGaAsQE(wl);
      const sig = pr * qe * 1.602e-19;
      const dc = 5 * Math.pow(2, (temperature - 25) / 5) * 1e-9; // InGaAs dark current in A
      return qe > 0 ? sig / Math.sqrt(2 * 1.602e-19 * sig * 1e6 + inGaAsNoiseFloor ** 2 * 1e6 + 2 * 1.602e-19 * dc * 1e6) : 0;
    });
    return { wls, siSNRs, inGaAsSNRs };
  }, [powerW, siNoiseFloor, inGaAsNoiseFloor, temperature]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="10" />
        <ValidatedNumberInput label="Optical Power (dBm)" value={opticalPowerDbm} onChange={setOpticalPowerDbm} step="1" />
        <ValidatedNumberInput label="Temperature (°C)" value={temperature} onChange={setTemperature} step="5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Si QE" value={`${(siQE * 100).toFixed(1)}%`} tone="blue" />
        <ResultCard label="InGaAs QE" value={`${(inGaAsQE * 100).toFixed(1)}%`} tone="orange" />
        <ResultCard label="Si SNR" value={siSNR > 0 ? siSNR.toFixed(1) : "N/A"} tone="green" />
        <ResultCard label="InGaAs SNR" value={inGaAsSNR > 0 ? inGaAsSNR.toFixed(1) : "N/A"} tone="yellow" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><strong className="text-blue-400">Si:</strong> 350–1100 nm, QE up to 95%, low dark current (~10 pA)</p>
        <p><strong className="text-orange-400">InGaAs:</strong> 900–1700 nm, QE up to 85%, higher dark current (~5 nA)</p>
        <p>InGaAs dark current doubles every ~5°C vs ~6°C for Si</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={[
          { x: spectralData.wls, y: spectralData.siQE, type: "scatter", mode: "lines",
            name: "Si", line: { color: "#60a5fa" }, fill: "tozeroy", fillcolor: "rgba(96,165,250,0.1)" },
          { x: spectralData.wls, y: spectralData.inGaAsQE, type: "scatter", mode: "lines",
            name: "InGaAs", line: { color: "#fb923c" }, fill: "tozeroy", fillcolor: "rgba(251,146,60,0.1)" },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Quantum Efficiency Spectra", font: { size: 12 } },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "QE", gridcolor: "#374151", range: [0, 1] },
          margin: { t: 40, r: 20, b: 50, l: 50 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />

        <ChartPanel data={[
          { x: snrVsWavelength.wls, y: snrVsWavelength.siSNRs, type: "scatter", mode: "lines",
            name: "Si SNR", line: { color: "#60a5fa" } },
          { x: snrVsWavelength.wls, y: snrVsWavelength.inGaAsSNRs, type: "scatter", mode: "lines",
            name: "InGaAs SNR", line: { color: "#fb923c" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "SNR vs Wavelength", font: { size: 12 } },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />
      </div>
    </div>
  );
}
