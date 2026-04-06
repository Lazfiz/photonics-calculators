"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function WDMCouplerCalculator() {
  const [channelCount, setChannelCount] = useState<number>(8);
  const [channelSpacing, setChannelSpacing] = useState<number>(0.8); // nm
  const [centerWavelength, setCenterWavelength] = useState<number>(1550); // nm
  const [passbandWidth, setPassbandWidth] = useState<number>(0.4); // nm
  const [insertionLoss, setInsertionLoss] = useState<number>(0.5); // dB
  const [isolation, setIsolation] = useState<number>(25); // dB
  const [couplerType, setCouplerType] = useState<"thinFilm" | "fbg" | "awg" | "mzi">("thinFilm");

  // Channel wavelengths
  const channels = useMemo(() => {
    const chs: number[] = [];
    const startLambda = centerWavelength - ((channelCount - 1) / 2) * channelSpacing;
    for (let i = 0; i < channelCount; i++) {
      chs.push(startLambda + i * channelSpacing);
    }
    return chs;
  }, [channelCount, channelSpacing, centerWavelength]);

  // Frequency spacing in GHz
  const freqSpacing = useMemo(() => {
    const c = 3e5; // km/s
    const lambda = centerWavelength * 1e-9; // m
    const f = c / lambda; // Hz -> need GHz
    // Δf = c·Δλ/λ²
    return (3e8 * channelSpacing * 1e-9) / (centerWavelength * 1e-9) ** 2 / 1e9;
  }, [channelSpacing, centerWavelength]);

  // ITU-T grid type estimation
  const gridType = useMemo(() => {
    const gs = freqSpacing;
    if (Math.abs(gs - 12.5) < 2) return "ITU-T 12.5 GHz";
    if (Math.abs(gs - 25) < 2) return "ITU-T 25 GHz";
    if (Math.abs(gs - 50) < 2) return "ITU-T 50 GHz";
    if (Math.abs(gs - 100) < 2) return "ITU-T 100 GHz";
    if (Math.abs(gs - 200) < 5) return "ITU-T 200 GHz";
    return "Custom";
  }, [freqSpacing]);

  // Total bandwidth
  const totalBandwidth = (channelCount - 1) * channelSpacing;

  // Composite spectral response
  const spectrum = useMemo(() => {
    const wavelengths: number[] = [];
    const composite: number[] = [];

    const start = centerWavelength - totalBandwidth / 2 - channelSpacing * 2;
    const end = centerWavelength + totalBandwidth / 2 + channelSpacing * 2;

    for (let w = start; w <= end; w += 0.05) {
      wavelengths.push(w);
      let maxResp = 0;
      for (const ch of channels) {
        // Gaussian passband
        const sigma = passbandWidth / 2.355;
        const resp = Math.exp(-0.5 * ((w - ch) / sigma) ** 2);
        maxResp = Math.max(maxResp, resp);
      }
      composite.push(maxResp * 10 ** (-insertionLoss / 10));
    }

    // Individual channels
    const channelTraces = channels.map((ch, i) => {
      const chWl: number[] = [];
      const chResp: number[] = [];
      for (let w = ch - channelSpacing; w <= ch + channelSpacing; w += 0.05) {
        chWl.push(w);
        const sigma = passbandWidth / 2.355;
        chResp.push(Math.exp(-0.5 * ((w - ch) / sigma) ** 2) * 10 ** (-insertionLoss / 10));
      }
      return { x: chWl, y: chResp, type: "scatter" as const, mode: "lines" as const, name: `Ch ${i + 1} (${ch.toFixed(2)} nm)`, line: { color: "#60a5fa", width: 1, dash: "dot" }, showlegend: i < 4 };
    });

    return [
      { x: wavelengths, y: composite, type: "scatter" as const, mode: "lines" as const, name: "Composite", line: { color: "#f59e0b", width: 2.5 } },
      ...channelTraces,
    ];
  }, [channels, passbandWidth, insertionLoss, totalBandwidth, centerWavelength, channelSpacing]);

  const layout = {
    title: `WDM ${channelCount}-Channel Spectral Response`,
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Transmission (norm.)", gridcolor: "#374151", range: [0, 1.1] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98, font: { size: 10 } }, height: 420,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Coupler Technology</label>
              <select value={couplerType} onChange={(e) => setCouplerType(e.target.value as "thinFilm" | "fbg" | "awg" | "mzi")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                <option value="thinFilm">Thin-Film Filter</option>
                <option value="fbg">FBG-Based</option>
                <option value="awg">Arrayed Waveguide Grating</option>
                <option value="mzi">Mach-Zehnder Interferometer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Number of Channels</label>
              <input type="number" value={channelCount} onChange={(e) => setChannelCount(Math.max(2, Math.min(96, Number(e.target.value))))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Channel Spacing (nm)</label>
              <input type="number" value={channelSpacing} onChange={(e) => setChannelSpacing(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Center Wavelength (nm)</label>
              <input type="number" value={centerWavelength} onChange={(e) => setCenterWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Passband Width (nm)</label>
              <input type="number" value={passbandWidth} onChange={(e) => setPassbandWidth(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.05" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Insertion Loss (dB)</label>
              <input type="number" value={insertionLoss} onChange={(e) => setInsertionLoss(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Isolation (dB)</label>
              <input type="number" value={isolation} onChange={(e) => setIsolation(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Channel Plan</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {channels.map((ch, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-400">Ch {i + 1}:</span>
                    <span className="font-mono">{ch.toFixed(2)} nm</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Grid type:</span><span className="font-mono text-yellow-400">{gridType}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Frequency spacing:</span><span className="font-mono">{freqSpacing.toFixed(1)} GHz</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total bandwidth:</span><span className="font-mono">{totalBandwidth.toFixed(1)} nm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Insertion loss:</span><span className="font-mono">{insertionLoss.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Channel isolation:</span><span className="font-mono">{isolation.toFixed(0)} dB</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">Δf = c·Δλ / λ²</p>
              <p className="font-mono text-sm mt-1">BW_total = (N-1) · Δλ</p>
              <p className="font-mono text-sm mt-1">IL_total = IL_per_ch + 10·log₁₀(N)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <ChartPanel data={spectrum} layout={layout} />
        </div>
      </div>
    </div>
  );
}
