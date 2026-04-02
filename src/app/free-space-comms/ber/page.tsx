"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function qfunc(x: number): number {
  // Approximation of Q(x)
  return 0.5 * erfc(x / Math.sqrt(2));
}

function erfc(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

export default function BERPage() {
  const [photons, setPhotons] = useState(100);
  const [darkCount, setDarkCount] = useState(100);
  const [modulation, setModulation] = useState<"OOK" | "DPSK">("OOK");

  const snr = photons / (1 + darkCount / photons);

  const calc = useMemo(() => {
    const snrVal = photons / (1 + darkCount / photons);
    let ber: number;
    if (modulation === "OOK") {
      ber = qfunc(Math.sqrt(2 * snrVal));
    } else {
      ber = 0.5 * Math.exp(-snrVal);
    }

    // Find required photons for target BERs
    const targets = [1e-3, 1e-6, 1e-9];
    const required: Record<string, number> = {};
    for (const t of targets) {
      let lo = 1, hi = 1e6, found = 0;
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        const s = mid / (1 + darkCount / mid);
        const b = modulation === "OOK" ? qfunc(Math.sqrt(2 * s)) : 0.5 * Math.exp(-s);
        if (b > t) lo = mid; else hi = mid;
      }
      required[t.toExponential(0)] = hi;
    }

    return { ber, snr: snrVal, required };
  }, [photons, darkCount, modulation]);

  const plotData = useMemo(() => {
    const ppb = Array.from({ length: 300 }, (_, i) => Math.pow(10, 0.5 + i * 0.02));
    const ook = ppb.map((p) => qfunc(Math.sqrt(2 * p / (1 + darkCount / p))));
    const dpsk = ppb.map((p) => 0.5 * Math.exp(-p / (1 + darkCount / p)));
    return [
      { x: ppb, y: ook, type: "scatter", mode: "lines", name: "OOK", line: { color: "#06b6d4" } },
      { x: ppb, y: dpsk, type: "scatter", mode: "lines", name: "DPSK", line: { color: "#f59e0b" } },
    ];
  }, [darkCount]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      <Link href="/free-space-comms" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">← Back to Free-Space Comms</Link>
      <h1 className="text-3xl font-bold mb-6">OOK vs DPSK BER Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Photons per Bit</label>
            <input type="number" value={photons} min={1} onChange={(e) => setPhotons(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dark Count Rate (counts/bit)</label>
            <input type="number" value={darkCount} min={0} onChange={(e) => setDarkCount(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Modulation</label>
            <div className="flex gap-2">
              {(["OOK", "DPSK"] as const).map((m) => (
                <button key={m} onClick={() => setModulation(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${modulation === m ? "bg-cyan-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">SNR</span><span>{calc.snr.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">BER ({modulation})</span><span>{calc.ber.toExponential(2)}</span></div>
              {Object.entries(calc.required).map(([target, photons]) => (
                <div key={target} className="flex justify-between">
                  <span className="text-gray-400">Required for BER {target}</span>
                  <span>{photons.toFixed(0)} photons/bit</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <Plot data={plotData} layout={{
              xaxis: { title: "Photons per Bit", type: "log", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "BER", type: "log", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
