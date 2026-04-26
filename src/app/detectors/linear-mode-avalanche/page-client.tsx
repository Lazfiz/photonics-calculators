"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
// McIntyre excess noise factor: F(M) = k·M + (1-k)·(2 - 1/M)
// k = ionization ratio (β/α for electron-initiated APDs)
// References: McIntyre 1966, Nature Communications Materials 2024
export default function LinearModeAPDPage() {
  const [gain, setGain] = useURLState("gain", 100);
  const [material, setMaterial] = useState<"si" | "ingaas" | "ge" | "custom">("si");
  const [ionizationRatio, setIonizationRatio] = useURLState("ionizationRatio", 0.02);
  const [useCustomF, setUseCustomF] = useState(false);
  const [customF, setCustomF] = useURLState("customF", 2.5);
  const [quantumEff, setQuantumEff] = useURLState("quantumEff", 0.8);
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 100e6); // Hz
  const [darkCurrent, setDarkCurrent] = useURLState("darkCurrent", 10e-9); // A (unmultiplied)
  const [wavelength, setWavelength] = useURLState("wavelength", 800); // nm
  const [incidentPower, setIncidentPower] = useURLState("incidentPower", 1e-9); // W

  const materialK = { si: 0.02, ingaas: 0.5, ge: 0.7 } as const;
  const effectiveK = material === "custom" ? ionizationRatio : materialK[material];
  const materialLabel = material === "custom" ? `k = ${effectiveK.toFixed(3)}` : `${material.toUpperCase()} (k ≈ ${effectiveK})`;

  // McIntyre excess noise factor: F(M) = kM + (1-k)(2 - 1/M)
  const mcIntyre = (M: number) => effectiveK * M + (1 - effectiveK) * (2 - 1 / M);
  const effectiveF = useCustomF ? customF : mcIntyre(gain);

  const results = useMemo(() => {
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    const resp = (quantumEff * q * wavelength * 1e-9) / (h * c); // A/W
    const iPhoto = incidentPower * resp;
    const iPhotoOut = iPhoto * gain;
    const iDarkOut = darkCurrent * gain;
    const F = useCustomF ? customF : mcIntyre(gain);
    const shotNoise = Math.sqrt(2 * q * iPhoto * gain * gain * F * bandwidth);
    const darkNoise = Math.sqrt(2 * q * darkCurrent * gain * gain * F * bandwidth);
    const totalNoise = Math.sqrt(shotNoise ** 2 + darkNoise ** 2);
    const snr = iPhotoOut / totalNoise;
    const nep = totalNoise / (resp * gain); // W (signal+dark, bandwidth-dependent)
    const nepDark = darkNoise / (resp * gain); // W (dark-limited, standard datasheet NEP)
    const nepSpectral = nep / Math.sqrt(bandwidth); // W/√Hz
    const nepDarkSpectral = nepDark / Math.sqrt(bandwidth); // W/√Hz
    return { resp, iPhoto, iPhotoOut, iDarkOut, shotNoise, darkNoise, totalNoise, snr, nep, nepDark, nepSpectral, nepDarkSpectral, F };
  }, [gain, useCustomF, customF, quantumEff, bandwidth, darkCurrent, wavelength, incidentPower, effectiveK]);

  const chartData = useMemo(() => {
    const gains = Array.from({ length: 200 }, (_, i) => 1 + i * 500 / 200);
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    const resp = (quantumEff * q * wavelength * 1e-9) / (h * c);
    const iPhoto = incidentPower * resp;
    const signal = gains.map(g => iPhoto * g);
    // When using custom F, back-calculate effective k from the operating point
    // F(M) = 1 for any k at M=1, so inversion is only valid for M > 1
    const kChart = useCustomF && gain > 1
      ? Math.max(0, (customF - 2 + 1 / gain) / (gain - 2 + 1 / gain))
      : effectiveK;
    // Use consistent F(M) in both noise and F-curve traces
    const fOfM = (g: number) => useCustomF ? kChart * g + (1 - kChart) * (2 - 1 / g) : mcIntyre(g);
    const noise = gains.map(g => {
      const F = fOfM(g);
      return Math.sqrt(2 * q * iPhoto * g * g * F * bandwidth + 2 * q * darkCurrent * g * g * F * bandwidth);
    });
    const snr = signal.map((s, i) => s / noise[i]);
    const fCurve = gains.map(g => fOfM(g));
    const fMax = Math.max(...fCurve);
    return [
      { x: gains, y: signal, type: "scatter", mode: "lines", name: "Signal (A)", line: { color: "#60a5fa" } },
      { x: gains, y: noise, type: "scatter", mode: "lines", name: "Noise (A)", line: { color: "#f87171" } },
      { x: gains, y: snr, type: "scatter", mode: "lines", name: "SNR", line: { color: "#34d399" }, yaxis: "y2" },
      { x: gains, y: fCurve, type: "scatter", mode: "lines", name: "F(M)", line: { color: "#a78bfa", dash: "dash" }, yaxis: "y3" },
    ];
  }, [useCustomF, customF, quantumEff, bandwidth, darkCurrent, wavelength, incidentPower, effectiveK, gain]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Gain (M)" value={gain} onChange={setGain} min={1} />
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <label className="block text-sm text-gray-300 mb-2">Material / Ionization Ratio (k)</label>
          <select value={material} onChange={e => setMaterial(e.target.value as any)} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="si">Si (k ≈ 0.02)</option>
            <option value="ingaas">InGaAs (k ≈ 0.5)</option>
            <option value="ge">Ge (k ≈ 0.7)</option>
            <option value="custom">Custom</option>
          </select>
          {material === "custom" && (
            <ValidatedNumberInput label="k (β/α)" value={ionizationRatio} onChange={setIonizationRatio} min={0.001} max={1} step="0.01" />
          )}
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <label className="block text-sm text-gray-300 mb-2">
            <input type="checkbox" checked={useCustomF} onChange={e => setUseCustomF(e.target.checked)} className="mr-2" />
            Override F (measured)
          </label>
          {useCustomF && (
            <ValidatedNumberInput label="F (measured)" value={customF} onChange={setCustomF} min={1} step="0.1" />
          )}
        </div>
        <ValidatedNumberInput label="Quantum Efficiency" value={quantumEff} onChange={setQuantumEff} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidth} onChange={setBandwidth} step="1e6" />
        <ValidatedNumberInput label="Dark Current - primary/bulk (A)" value={darkCurrent} onChange={setDarkCurrent} step="1e-9" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Incident Power (W)" value={incidentPower} onChange={setIncidentPower} step="1e-12" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Material: <span className="text-purple-400 font-mono">{materialLabel}</span></p>
        <p className="text-gray-300">Excess Noise Factor F(M={gain}) = <span className="text-purple-400 font-mono">{results.F.toFixed(3)}</span> {useCustomF ? "(measured)" : "(McIntyre)"}</p>
        <p className="text-gray-300">Responsivity = <span className="text-blue-400 font-mono">{(results.resp * 1e3).toFixed(2)} mA/W (unmultiplied)</span></p>
        <p className="text-gray-300">Output photocurrent = <span className="text-blue-400 font-mono">{results.iPhotoOut.toExponential(3)} A</span></p>
        <p className="text-gray-300">Output dark current = <span className="text-blue-400 font-mono">{results.iDarkOut.toExponential(3)} A</span></p>
        <p className="text-gray-300">Shot noise = <span className="text-blue-400 font-mono">{results.shotNoise.toExponential(3)} A</span></p>
        <p className="text-gray-300">Total noise = <span className="text-blue-400 font-mono">{results.totalNoise.toExponential(3)} A</span></p>
        <p className="text-gray-300">SNR = <span className="text-blue-400 font-mono">{results.snr.toFixed(1)}</span></p>
        <p className="text-gray-300">NEP = <span className="text-blue-400 font-mono">{results.nep.toExponential(3)} W</span> (total) | <span className="text-yellow-400 font-mono">{results.nepDark.toExponential(3)} W</span> (dark-limited)</p>
        <p className="text-gray-300">NEP = <span className="text-blue-400 font-mono">{results.nepSpectral.toExponential(3)} W/√Hz</span> (total) | <span className="text-yellow-400 font-mono">{results.nepDarkSpectral.toExponential(3)} W/√Hz</span> (dark-limited)</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>R = η·q·λ / (h·c)</p>
        <p>I<sub>out</sub> = M · I<sub>photo</sub></p>
        <p>F(M) = k·M + (1−k)·(2 − 1/M)  [McIntyre 1966]</p>
        <p>i<sub>shot</sub> = √(2·q·M²·I·F(M)·Δf)</p>
        <p>NEP = i<sub>total</sub> / (M·R)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Gain (M)", gridcolor: "#374151" },
        yaxis: { title: "Current (A)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        yaxis3: { title: "F(M)", gridcolor: "#374151", overlaying: "y", side: "left", anchor: "free", position: 0.02, range: [0, fMax * 1.1] },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
