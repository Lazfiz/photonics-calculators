"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
// SPAD: Single-Photon Avalanche Diode
// PDE = η · P_geiger · P_quench
// Afterpulsing probability, dead time, DCR model
export default function SPADPage() {
  const [pde, setPde] = useURLState("pde", 0.4); // peak PDE
  const [dcr, setDcr] = useURLState("dcr", 100); // dark count rate per second
  const [deadTime, setDeadTime] = useURLState("deadTime", 50); // ns
  const [afterpulseProb, setAfterpulseProb] = useURLState("afterpulseProb", 0.02); // probability
  const [opticalPower, setOpticalPower] = useState(-60); // dBm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [temp, setTemp] = useState(-20); // °C

  const powerW = Math.pow(10, opticalPower / 10) * 1e-3;
  const photonEnergy = (6.626e-34 * 3e8) / (wavelength * 1e-9);
  const photonsPerSec = powerW / photonEnergy;

  const deadTimeFrac = 1 - Math.exp(-photonsPerSec * deadTime * 1e-9);
  const effectivePDE = pde * (1 - deadTimeFrac) * (1 - afterpulseProb);
  const detectionRate = photonsPerSec * effectivePDE;
  const snr = detectionRate > 0 ? detectionRate / Math.sqrt(detectionRate + dcr) : 0;

  // DCR vs temperature
  const dcrVsTemp = useMemo(() => {
    const temps = Array.from({ length: 200 }, (_, i) => -80 + i * 0.8);
    const dcrVals = temps.map(T => dcr * Math.pow(2, (T - temp) / 6));
    return { temps, dcrVals };
  }, [dcr, temp]);

  // SNR vs optical power
  const snrVsPower = useMemo(() => {
    const pwrDbm = Array.from({ length: 200 }, (_, i) => -90 + i * 0.5);
    const snrVals = pwrDbm.map(p => {
      const pw = Math.pow(10, p / 10) * 1e-3;
      const ph = pw / photonEnergy;
      const dt = 1 - Math.exp(-ph * deadTime * 1e-9);
      const epde = pde * (1 - dt) * (1 - afterpulseProb);
      const dr = ph * epde;
      return dr > 0 ? dr / Math.sqrt(dr + dcr) : 0;
    });
    return { pwrDbm, snrVals };
  }, [pde, dcr, deadTime, afterpulseProb, photonEnergy]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="SPAD Detector Calculator" description="Single-photon avalanche diode — PDE, DCR, dead time, afterpulsing, and SNR analysis.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Peak PDE" value={pde} onChange={setPde} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="Dark Count Rate (counts/s)" value={dcr} onChange={setDcr} min={1} step="10" />
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTime} onChange={setDeadTime} min={1} step="5" />
        <ValidatedNumberInput label="Afterpulsing Probability" value={afterpulseProb} onChange={setAfterpulseProb} min={0} max={0.5} step="0.005" />
        <ValidatedNumberInput label="Optical Power (dBm)" value={opticalPower} onChange={setOpticalPower} step="1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Photon Rate" value={`${photonsPerSec.toExponential(2)} /s`} tone="blue" />
        <ResultCard label="Detection Rate" value={`${detectionRate.toExponential(2)} /s`} tone="green" />
        <ResultCard label="SNR" value={`${snr.toFixed(2)}`} tone="yellow" />
        <ResultCard label="Effective PDE" value={`${(effectivePDE * 100).toFixed(1)}%`} tone="purple" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>PDE<sub>eff</sub> = PDE · (1 − P<sub>dead</sub>) · (1 − P<sub>AP</sub>)</p>
        <p>Photon rate: R<sub>ph</sub> = P / (hc/λ)</p>
        <p>SNR = R<sub>det</sub> / √(R<sub>det</sub> + DCR)</p>
        <p>DCR(T) ≈ DCR(T₀) · 2<sup>(T−T₀)/6</sup></p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={[
          { x: dcrVsTemp.temps, y: dcrVsTemp.dcrVals, type: "scatter", mode: "lines",
            name: "DCR", line: { color: "#f87171" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Dark Count Rate vs Temperature", font: { size: 12 } },
          xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
          yaxis: { title: "DCR (counts/s)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />

        <ChartPanel data={[
          { x: snrVsPower.pwrDbm, y: snrVsPower.snrVals, type: "scatter", mode: "lines",
            name: "SNR", line: { color: "#34d399" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "SNR vs Optical Power", font: { size: 12 } },
          xaxis: { title: "Power (dBm)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />
      </div>
    </CalculatorShell>
  );
}
