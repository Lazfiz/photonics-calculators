"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  bpskBer, qpskSer, requiredEbN0dB, requiredRxPower, shotNoiseN0, type CoherentReceiver,
} from "../../../physics/free-space-comms/bpsk-qpsk";

const clamp = (x: number, lo: number, hi: number, fallback: number) =>
  Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback;
type Modulation = "BPSK" | "QPSK" | "OQPSK";
const MODULATIONS: Modulation[] = ["BPSK", "QPSK", "OQPSK"];
const isModulation = (s: string): s is Modulation => (MODULATIONS as string[]).includes(s);
const isReceiver = (s: string): s is CoherentReceiver => s === "heterodyne" || s === "homodyne";
const dBm = (watts: number) => 10 * Math.log10(watts / 1e-3);

export default function BpskQpskPage() {
  const [ebn0dB, setEbn0dB] = useURLState("ebn0dB", 10, { min: -10, max: 30 });
  const [modulationRaw, setModulation] = useURLState("modulation", "BPSK");
  const [dataRateRaw, setDataRate] = useURLState("dataRate", 1); // Gbps
  const [rxPower, setRxPower] = useURLState("rxPower", -50, { min: -100, max: 30 }); // dBm
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [etaRaw, setEta] = useURLState("eta", 1);
  const [receiverRaw, setReceiver] = useURLState("receiver", "heterodyne");

  const modulation: Modulation = isModulation(modulationRaw) ? modulationRaw : "BPSK";
  const receiver: CoherentReceiver = isReceiver(receiverRaw) ? receiverRaw : "heterodyne";
  const dataRate = clamp(dataRateRaw, 1e-6, 1e4, 1);
  const wavelength = clamp(wavelengthRaw, 200, 20000, 1550);
  const eta = clamp(etaRaw, 0.01, 1, 1);
  // Single-quadrature homodyne only helps a one-quadrature signal (BPSK).
  const rx: CoherentReceiver = modulation === "BPSK" ? receiver : "heterodyne";

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
    const bw = dataRate / specEff; // GHz

    // Required RX power: LO-shot-noise-limited coherent receiver, P = (Eb/N0)·N0·R
    const lambda = wavelength * 1e-9;
    const n0 = shotNoiseN0(lambda, eta, rx);
    const requiredPr = dBm(requiredRxPower(ebn0dB, dataRate * 1e9, lambda, eta, rx));
    const photonsPerBit = (ebno * n0) / shotNoiseN0(lambda, 1); // received at P_req: P/(hν R)

    // Margin
    const margin = rxPower - requiredPr;

    // Symbol rate
    const symbolRate = dataRate / specEff;

    // Eb/N0 the RX power input actually delivers: P/(N0·R), in dB (the margin above is the same quantity).
    const ebn0AtRxDb = rxPower - dBm(n0) - 10 * Math.log10(dataRate * 1e9);
    const berAtRx = bpskBer(10 ** (ebn0AtRxDb / 10));

    return { ber, ser, ebn0AtRxDb, berAtRx, reqEbN0, targetBERs, specEff, bw, n0dBmHz: dBm(n0), requiredPr, photonsPerBit, margin, symbolRate };
  }, [ebn0dB, modulation, dataRate, rxPower, wavelength, eta, rx]);

  const plotData = useMemo(() => {
    // At least 0–15 dB (BER 0.08 down to ~1e-15), widened to include the Eb/N0 input.
    const lo = Math.min(0, Math.floor(ebn0dB)), hi = Math.max(15, Math.ceil(ebn0dB));
    const ebnoRange = Array.from({ length: 301 }, (_, i) => lo + ((hi - lo) * i) / 300);
    const positive = (y: number) => (y > 0 ? y : null);
    const lin = (dB: number) => 10 ** (dB / 10);
    return [
      { x: ebnoRange, y: ebnoRange.map((e) => positive(bpskBer(lin(e)))), type: "scatter", mode: "lines", name: "BER: BPSK, QPSK, OQPSK", line: { color: "#06b6d4" } },
      { x: ebnoRange, y: ebnoRange.map((e) => positive(qpskSer(lin(e)))), type: "scatter", mode: "lines", name: "SER: QPSK", line: { color: "#f59e0b", dash: "dash" } },
      { x: [ebn0dB], y: [positive(bpskBer(lin(ebn0dB)))], type: "scatter", mode: "markers", name: "Current", marker: { color: "#22c55e", size: 10 } },
    ];
  }, [ebn0dB]);

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="modulation">Modulation</label>
            <select id="modulation" value={modulation} onChange={(e) => setModulation(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
              <option>BPSK</option><option>QPSK</option><option>OQPSK</option>
            </select>
          </div>
          <ValidatedNumberInput label="Eb/N0 (dB)" value={ebn0dB} onChange={setEbn0dB} min={-10} max={30} />
          <ValidatedNumberInput label="Data Rate (Gbps)" value={dataRateRaw} onChange={setDataRate} min={1e-6} max={1e4} step="any" />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="any" />
          <ValidatedNumberInput label="Photodiode Quantum Efficiency η" value={etaRaw} onChange={setEta} min={0.01} max={1} step="any" />
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="receiver">Coherent Receiver</label>
            <select id="receiver" value={receiver} onChange={(e) => setReceiver(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
              <option value="heterodyne">Heterodyne / intradyne (two quadratures)</option>
              <option value="homodyne">Single-quadrature homodyne (BPSK only)</option>
            </select>
            {receiver === "homodyne" && modulation !== "BPSK" && (
              <p className="mt-1 text-xs text-yellow-300">QPSK and OQPSK need both quadratures: N₀ is the two-quadrature value.</p>
            )}
          </div>
          <ValidatedNumberInput label="RX Power (dBm)" value={rxPower} onChange={setRxPower} min={-100} max={30} />
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
              <div className="flex justify-between"><span className="text-gray-400">Symbol Rate</span><span>{calc.symbolRate.toPrecision(3)} Gbaud</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Required BW (Nyquist)</span><span>{calc.bw.toPrecision(3)} GHz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Shot-noise N₀</span><span>{calc.n0dBmHz.toFixed(1)} dBm/Hz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Photons per Bit at P<sub>req</sub></span><span>{calc.photonsPerBit.toPrecision(3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Required RX Power</span><span>{calc.requiredPr.toFixed(1)} dBm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Eb/N0 at RX power</span><span>{Number.isFinite(calc.ebn0AtRxDb) ? `${calc.ebn0AtRxDb.toFixed(1)} dB` : "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 text-xs">BER at that Eb/N0</span><span className="text-xs">{!Number.isFinite(calc.berAtRx) ? "—" : calc.berAtRx < 1e-15 ? "< 10⁻¹⁵" : calc.berAtRx.toExponential(2)}</span></div>
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
            <p><strong className="text-gray-400">P<sub>req</sub>:</strong> (E<sub>b</sub>/N<sub>0</sub>)·N<sub>0</sub>·R at the local-oscillator shot-noise limit, N<sub>0</sub> = hν/η (heterodyne or intradyne) or hν/2η (single-quadrature homodyne, BPSK only). At η = 1 a BER of 10⁻⁹ needs 18 photons per bit (heterodyne) or 9 (homodyne). Thermal noise, LO intensity noise and amplifier ASE come on top: enter a lower η or a higher E<sub>b</sub>/N<sub>0</sub> for them.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Eb/N0 (dB)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Error rate", type: "log", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </>
  );
}
