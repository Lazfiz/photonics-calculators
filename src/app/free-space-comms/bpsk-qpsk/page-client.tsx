"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


export default function BpskQpskPage() {
  const [ebn0dB, setEbn0dB] = useURLState("ebn0dB", 10);
  const [modulation, setModulation] = useState<"BPSK" | "QPSK" | "OQPSK">("BPSK");
  const [dataRate, setDataRate] = useURLState("dataRate", 1); // Gbps
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [rxPower, setRxPower] = useState(-30); // dBm

  const calc = useMemo(() => {
    const ebno = 10 ** (ebn0dB / 10);
    // BER for BPSK/QPSK: Q(sqrt(2*Eb/N0)) ≈ 0.5*erfc(sqrt(Eb/N0))
    const sqrtEbn0 = Math.sqrt(ebno);
    // Approximate erfc
    const ber = 0.5 * erfc(sqrtEbn0);

    // Required Eb/N0 for target BER
    const targetBERs = [1e-3, 1e-5, 1e-6, 1e-9];
    const reqEbN0 = targetBERs.map((t) => {
      const x = Math.sqrt(-Math.log(t) * 0.5);
      return (2 * x * x); // approximate inverse erfc
    });

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

    return { ber, reqEbN0, targetBERs, specEff, bw, requiredPr, margin, symbolRate };
  }, [ebn0dB, modulation, dataRate, wavelength, rxPower]);

  function erfc(x: number): number {
    const t = 1 / (1 + 0.3275911 * x);
    const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    return poly * Math.exp(-x * x);
  }

  const plotData = useMemo(() => {
    const ebnoRange = Array.from({ length: 200 }, (_, i) => 0 + i * 0.15);
    const bpskBer = ebnoRange.map((e) => {
      const x = Math.sqrt(10 ** (e / 10));
      return 0.5 * erfc(x);
    });
    const qpskBer = ebnoRange.map((e) => {
      const x = Math.sqrt(10 ** (e / 10));
      const b = 0.5 * erfc(x);
      return 1 - (1 - b) ** 2;
    });

    return [
      { x: ebnoRange, y: bpskBer, type: "scatter", mode: "lines", name: "BPSK", line: { color: "#06b6d4" } },
      { x: ebnoRange, y: qpskBer, type: "scatter", mode: "lines", name: "QPSK", line: { color: "#f59e0b" } },
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
            ["Wavelength (nm)", wavelength, setWavelength],
            ["RX Power (dBm)", rxPower, setRxPower],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} step={val < 2 ? 0.1 : 1}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-400">BER</span><span className={calc.ber < 1e-9 ? "text-green-400" : calc.ber < 1e-6 ? "text-yellow-400" : "text-red-400"}>
                {calc.ber < 1e-15 ? "< 10⁻¹⁵" : calc.ber.toExponential(2)}</span></div>
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
            <p><strong className="text-gray-400">QPSK BER:</strong> P<sub>e</sub> = 1 − (1 − P<sub>BPSK</sub>)²</p>
            <p><strong className="text-gray-400">P<sub>req</sub>:</strong> E<sub>b</sub>/N<sub>0</sub> + kT + 10log₁₀(R) + NF</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Eb/N0 (dB)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "BER", color: "#9ca3af", gridcolor: "#374151", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
