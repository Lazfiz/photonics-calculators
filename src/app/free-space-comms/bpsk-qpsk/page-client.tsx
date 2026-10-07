"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";
import { bpskBer, qpskSer, requiredEbN0dB } from "../../../physics/free-space-comms/bpsk-qpsk";

export default function BpskQpskPage() {
  const [ebn0dB, setEbn0dB] = useURLState("ebn0dB", 10);
  const [modulation, setModulation] = useState<"BPSK" | "QPSK" | "OQPSK">("BPSK");
  const [dataRate, setDataRate] = useURLState("dataRate", 1); // Gbps
  const [rxPower, setRxPower] = useState(-30); // dBm

  const calc = useMemo(() => {
    const ebno = 10 ** (ebn0dB / 10);
    // Gray-coded QPSK/OQPSK have the same bit error rate as BPSK: Q(√(2E_b/N₀))
    const ber = bpskBer(ebno);
    const ser = modulation === "BPSK" ? ber : qpskSer(ebno);

    // Required Eb/N0 for target BER (same for all three formats)
    const targetBERs = [1e-3, 1e-5, 1e-6, 1e-9];
    const reqEbN0 = targetBERs.map(requiredEbN0dB);

    // Spectral efficiency
    const specEff = modulation === "BPSK" ? 1 : 2; // bits/s/Hz

    // Required bandwidth
    const bw = dataRate * 1e9 / specEff / 1e9; // GHz

    // Required RX power: Pr = Eb/N0 + kT + 10log10(R) + NF
    const kT = -174; // dBm/Hz at 290K
    const nf = 3; // dB noise figure (APD typical)
    const dataRateHz = dataRate * 1e9;
    const requiredPr = ebn0dB + kT + 10 * Math.log10(dataRateHz) + nf;

    // Margin
    const margin = rxPower - requiredPr;

    // Symbol rate
    const symbolRate = dataRate / specEff;

    return { ber, ser, reqEbN0, targetBERs, specEff, bw, requiredPr, margin, symbolRate };
  }, [ebn0dB, modulation, dataRate, rxPower]);

  const plotData = useMemo(() => {
    // log₁₀ of the error rates on a linear axis (SimpleChart's log axis floors at 1e-10); 0–15 dB
    // spans BER 0.08 down to ~1e-15.
    const ebnoRange = Array.from({ length: 151 }, (_, i) => i * 0.1);
    const lin = (dB: number) => 10 ** (dB / 10);
    return [
      { x: ebnoRange, y: ebnoRange.map((e) => Math.log10(bpskBer(lin(e)))), type: "scatter", mode: "lines", name: "BER: BPSK, QPSK, OQPSK", line: { color: "#06b6d4" } },
      { x: ebnoRange, y: ebnoRange.map((e) => Math.log10(qpskSer(lin(e)))), type: "scatter", mode: "lines", name: "SER: QPSK", line: { color: "#f59e0b", dash: "dash" } },
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
            
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Modulation</label>
            <select value={modulation} onChange={(e) => setModulation(e.target.value as "BPSK" | "QPSK" | "OQPSK")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
              <option>BPSK</option><option>QPSK</option><option>OQPSK</option>
            </select>
          </div>
          {[
            ["Eb/N0 (dB)", ebn0dB, setEbn0dB],
            ["Data Rate (Gbps)", dataRate, setDataRate],
            ["RX Power (dBm)", rxPower, setRxPower],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <ValidatedNumberInput label={label} value={val} onChange={set} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-400">BER</span><span className={calc.ber < 1e-9 ? "text-green-400" : calc.ber < 1e-6 ? "text-yellow-400" : "text-red-400"}>
                {calc.ber < 1e-15 ? "< 10⁻¹⁵" : calc.ber.toExponential(2)}</span></div>
              {modulation !== "BPSK" && (
                <div className="flex justify-between"><span className="text-gray-400">Symbol Error Rate</span><span>{calc.ser < 1e-15 ? "< 10⁻¹⁵" : calc.ser.toExponential(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-400">Spectral Efficiency</span><span>{calc.specEff} bit/s/Hz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Symbol Rate</span><span>{calc.symbolRate.toFixed(2)} Gbaud</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Required BW</span><span>{calc.bw.toFixed(2)} GHz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Required RX Power</span><span>{calc.requiredPr.toFixed(1)} dBm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Power Margin</span><span className={calc.margin > 0 ? "text-green-400" : "text-red-400"}>{calc.margin.toFixed(1)} dB</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 mb-2">Required Eb/N0 for Target BER</h2>
            <div className="space-y-1 text-xs font-mono">
              {calc.targetBERs.map((t, i) => (
                <div key={t} className="flex justify-between"><span className="text-gray-500">BER {t.toExponential(0)}</span><span>{calc.reqEbN0[i].toFixed(1)} dB</span></div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">BPSK BER:</strong> P<sub>e</sub> = ½ erfc(√(E<sub>b</sub>/N<sub>0</sub>))</p>
            <p><strong className="text-gray-400">QPSK / OQPSK (Gray-coded):</strong> same BER as BPSK; symbol error rate P<sub>s</sub> = 1 − (1 − P<sub>e</sub>)²</p>
            <p><strong className="text-gray-400">P<sub>req</sub>:</strong> E<sub>b</sub>/N<sub>0</sub> + kT + 10log₁₀(R) + NF</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Eb/N0 (dB)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "log₁₀ error rate", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
