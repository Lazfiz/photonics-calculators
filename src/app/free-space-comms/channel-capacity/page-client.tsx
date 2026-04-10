"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ChannelCapacityPage() {
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 1); // GHz
  const [snrDB, setSnrDB] = useURLState("snrDB", 20);
  const [modulation, setModulation] = useState<"OOK" | "BPSK" | "QPSK" | "8PSK" | "16QAM">("QPSK");
  const [fecOverhead, setFecOverhead] = useURLState("fecOverhead", 7); // % overhead

  const calc = useMemo(() => {
    const B = bandwidth * 1e9; // Hz
    const snr = 10 ** (snrDB / 10);

    // Shannon capacity
    const capacity = B * Math.log2(1 + snr);
    const capacityGbps = capacity / 1e9;

    // Spectral efficiency
    const shannonSE = Math.log2(1 + snr);

    // Modulation spectral efficiency
    const modSE: Record<string, number> = { OOK: 0.5, BPSK: 1, QPSK: 2, "8PSK": 3, "16QAM": 4 };
    const effSE = modSE[modulation];

    // Achievable data rate
    const achievableRate = B * effSE / (1 + fecOverhead / 100) / 1e9;

    // Gap to Shannon
    const gap = shannonSE - effSE;

    // Required SNR for this modulation
    const reqSnrLinear = 2 ** effSE - 1;
    const reqSnrDB = 10 * Math.log10(reqSnrLinear);

    // Shannon limit in Eb/N0
    const shannonEbN0 = (2 ** shannonSE - 1) / shannonSE;
    const shannonEbN0dB = 10 * Math.log10(shannonEbN0);

    return { capacityGbps, shannonSE, effSE, achievableRate, gap, reqSnrDB, shannonEbN0dB };
  }, [bandwidth, snrDB, modulation, fecOverhead]);

  const plotData = useMemo(() => {
    const B = bandwidth * 1e9;
    const snrs = Array.from({ length: 200 }, (_, i) => -5 + i * 0.2);
    const shannon = snrs.map((s) => B * Math.log2(1 + 10 ** (s / 10)) / 1e9);

    const modRates: Record<string, number> = { OOK: 0.5, BPSK: 1, QPSK: 2, "8PSK": 3, "16QAM": 4 };
    const colors: Record<string, string> = { OOK: "#ef4444", BPSK: "#f59e0b", QPSK: "#22c55e", "8PSK": "#8b5cf6", "16QAM": "#ec4899" };
    const traces: Record<string, unknown>[] = [
      { x: snrs, y: shannon, type: "scatter" as const, mode: "lines" as const, name: "Shannon", line: { color: "#06b6d4", width: 2, dash: "dash" } },
    ];

    for (const [mod, se] of Object.entries(modRates)) {
      traces.push({
        x: snrs, y: snrs.map((s) => {
          const rate = B * se / (1 + fecOverhead / 100) / 1e9;
          return s > 10 * Math.log10(2 ** se - 1) ? rate : 0;
        }),
        type: "scatter" as const, mode: "lines" as const, name: mod, line: { color: colors[mod] },
      });
    }
    return traces;
  }, [bandwidth, fecOverhead]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
            
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Modulation</label>
            <select value={modulation} onChange={(e) => setModulation(e.target.value as "OOK" | "BPSK" | "QPSK" | "8PSK" | "16QAM")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
              <option>OOK</option><option>BPSK</option><option>QPSK</option><option>8PSK</option><option>16QAM</option>
            </select>
          </div>
          {[
            ["Bandwidth (GHz)", bandwidth, setBandwidth],
            ["SNR (dB)", snrDB, setSnrDB],
            ["FEC Overhead (%)", fecOverhead, setFecOverhead],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-400">Shannon Capacity</span><span className="text-cyan-300">{calc.capacityGbps.toFixed(2)} Gbps</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Shannon SE</span><span>{calc.shannonSE.toFixed(2)} bit/s/Hz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Modulation SE</span><span>{calc.effSE} bit/s/Hz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Achievable Rate</span><span>{calc.achievableRate.toFixed(2)} Gbps</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Gap to Shannon</span><span className={calc.gap > 3 ? "text-yellow-400" : "text-green-400"}>{calc.gap.toFixed(2)} bit/s/Hz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Required SNR</span><span>{calc.reqSnrDB.toFixed(1)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Shannon Eb/N0</span><span>{calc.shannonEbN0dB.toFixed(2)} dB</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">Shannon:</strong> C = B log₂(1 + SNR)</p>
            <p><strong className="text-gray-400">Spectral Eff.:</strong> SE = log₂(1 + SNR) [bit/s/Hz]</p>
            <p><strong className="text-gray-400">Achievable:</strong> R = B × SE<sub>mod</sub> / (1 + FEC%)</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "SNR (dB)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Data Rate (Gbps)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 30, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 9 } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
