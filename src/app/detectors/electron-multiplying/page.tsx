"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// EMCCD vs sCMOS comparison
// EMCCD: EM gain G, ENF² = 2/G + excess noise
// sCMOS: low read noise, no gain, high frame rate
export default function ElectronMultiplyingPage() {
  const [signalElectrons, setSignalElectrons] = useState(10);
  const [darkCurrent, setDarkCurrent] = useState(0.001); // e-/pix/frame
  const [emccdReadNoise, setEmccdReadNoise] = useState(60); // e- (before EM)
  const [scmosReadNoise, setScmosReadNoise] = useState(1.5); // e-
  const [emGain, setEmGain] = useState(1000);
  const [emExcessNoise, setEmExcessNoise] = useState(1.4); // typical ENF sqrt(2)
  const [exposureTime, setExposureTime] = useState(0.1); // s

  const enf2 = 2 - 1 / emGain; // stochastic multiplication noise
  const emccdTotalNoise = Math.sqrt(
    signalElectrons * enf2 + darkCurrent * enf2 + (emccdReadNoise / emGain) ** 2
  );
  const emccdSNR = signalElectrons / emccdTotalNoise;

  const scmosTotalNoise = Math.sqrt(
    signalElectrons + darkCurrent + scmosReadNoise ** 2
  );
  const scmosSNR = signalElectrons / scmosTotalNoise;

  // SNR vs signal for both
  const snrVsSignal = useMemo(() => {
    const signals = Array.from({ length: 200 }, (_, i) => 0.1 + i * 0.5);
    const emccd = signals.map(s => {
      const n = Math.sqrt(s * enf2 + darkCurrent * enf2 + (emccdReadNoise / emGain) ** 2);
      return s / n;
    });
    const scmos = signals.map(s => {
      const n = Math.sqrt(s + darkCurrent + scmosReadNoise ** 2);
      return s / n;
    });
    return { signals, emccd, scmos };
  }, [emGain, enf2, darkCurrent, emccdReadNoise, scmosReadNoise]);

  // SNR vs EM gain
  const snrVsGain = useMemo(() => {
    const gains = Array.from({ length: 200 }, (_, i) => 1 + i * 25);
    const vals = gains.map(g => {
      const ef2 = 2 - 1 / g;
      const n = Math.sqrt(signalElectrons * ef2 + darkCurrent * ef2 + (emccdReadNoise / g) ** 2);
      return signalElectrons / n;
    });
    return { gains, vals };
  }, [signalElectrons, darkCurrent, emccdReadNoise]);

  // Detection limit (SNR=3) vs exposure time
  const detectionLimit = useMemo(() => {
    const exposures = Array.from({ length: 200 }, (_, i) => 0.001 + i * 0.05);
    const emccdLim = exposures.map(t => {
      const dark = darkCurrent * t / exposureTime;
      const ef2 = enf2;
      // Solve: S/sqrt(S*ef2 + dark*ef2 + (RN/G)^2) = 3
      // S = 3*sqrt(dark*ef2 + (RN/G)^2) / sqrt(1 - 9*ef2)
      // Simplified: find min S for SNR=3
      const rn2 = (emccdReadNoise / emGain) ** 2;
      for (let s = 0.01; s < 10000; s += 0.01) {
        if (s / Math.sqrt(s * ef2 + dark * ef2 + rn2) >= 3) return s;
      }
      return 10000;
    });
    const scmosLim = exposures.map(t => {
      const dark = darkCurrent * t / exposureTime;
      const rn2 = scmosReadNoise ** 2;
      for (let s = 0.01; s < 10000; s += 0.01) {
        if (s / Math.sqrt(s + dark + rn2) >= 3) return s;
      }
      return 10000;
    });
    return { exposures, emccdLim, scmosLim };
  }, [signalElectrons, darkCurrent, exposureTime, enf2, emccdReadNoise, emGain, scmosReadNoise]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">EMCCD vs sCMOS</h1>
      <p className="text-gray-400 mb-8">Compare electron-multiplying CCD with sCMOS for low-light imaging applications.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Signal (e⁻/pix/frame)</span>
          <input type="number" value={signalElectrons} onChange={e => setSignalElectrons(+e.target.value)} min="0.1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current (e⁻/pix/frame)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min="0" step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">EMCCD Read Noise (e⁻)</span>
          <input type="number" value={emccdReadNoise} onChange={e => setEmccdReadNoise(+e.target.value)} min="1" step="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">sCMOS Read Noise (e⁻)</span>
          <input type="number" value={scmosReadNoise} onChange={e => setScmosReadNoise(+e.target.value)} min="0.1" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">EM Gain</span>
          <input type="number" value={emGain} onChange={e => setEmGain(+e.target.value)} min="1" step="50"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min="0.001" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">EMCCD SNR</p>
          <p className="text-xl font-bold text-blue-400">{emccdSNR.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">sCMOS SNR</p>
          <p className="text-xl font-bold text-green-400">{scmosSNR.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Winner</p>
          <p className={`text-xl font-bold ${emccdSNR > scmosSNR ? "text-blue-400" : "text-green-400"}`}>
            {emccdSNR > scmosSNR ? "EMCCD" : "sCMOS"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ENF²</p>
          <p className="text-xl font-bold text-yellow-400">{enf2.toFixed(3)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><strong className="text-blue-400">EMCCD:</strong> σ = √(S·ENF² + D·ENF² + (σ<sub>read</sub>/G)²), ENF² = 2 − 1/G</p>
        <p><strong className="text-green-400">sCMOS:</strong> σ = √(S + D + σ<sub>read</sub>²)</p>
        <p>EMCCD wins at very low signal; sCMOS wins above ~10-50 e⁻ depending on settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Plot data={[
          { x: snrVsSignal.signals, y: snrVsSignal.emccd, type: "scatter" as const, mode: "lines" as const,
            name: "EMCCD", line: { color: "#60a5fa" } },
          { x: snrVsSignal.signals, y: snrVsSignal.scmos, type: "scatter" as const, mode: "lines" as const,
            name: "sCMOS", line: { color: "#34d399" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "SNR vs Signal Level", font: { size: 12 } },
          xaxis: { title: "Signal (e⁻/pix)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 50 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />

        <Plot data={[{ x: snrVsGain.gains, y: snrVsGain.vals, type: "scatter" as const, mode: "lines" as const,
          name: "EMCCD SNR", line: { color: "#60a5fa" },
        }, { x: [1, 5000], y: [scmosSNR, scmosSNR], type: "scatter" as const, mode: "lines" as const,
          name: "sCMOS SNR", line: { color: "#34d399", dash: "dash" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "EMCCD SNR vs EM Gain", font: { size: 12 } },
          xaxis: { title: "EM Gain", gridcolor: "#374151", type: "log" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 50 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
