"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { enobFromSinad, idealSqnrDb, sinadWithQuantizationDb } from "../../../physics/detectors/noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtDb = (x: number) => (x === Infinity ? "∞" : x === -Infinity ? "−∞" : Number.isFinite(x) ? x.toFixed(2) : "—");

export default function SNDRPage() {
  const [signalPowerRaw, setSignalPower] = useURLState("signalPower", 1); // W (normalised)
  const [noisePowerRaw, setNoisePower] = useURLState("noisePower", 1e-7);
  const [distortionPowerRaw, setDistortionPower] = useURLState("distortionPower", 1e-8);
  const [bitsRaw, setBits] = useURLState("bits", 12);
  const signalPower = clamp(signalPowerRaw, 1e-30, 1e30, 1);
  const noisePower = clamp(noisePowerRaw, 0, 1e30, 1e-7);
  const distortionPower = clamp(distortionPowerRaw, 0, 1e30, 1e-8);
  const bits = Math.round(clamp(bitsRaw, 1, 24, 12));

  const chartData = useMemo(() => {
    const bitRange = Array.from({ length: 21 }, (_, i) => i + 4); // 4 to 24 bits
    // Quantisation noise adds to the entered noise and distortion: 1/SINAD = 1/SQNR + (N + D)/S.
    const sndrForBits = bitRange.map(b => sinadWithQuantizationDb(signalPower, noisePower, distortionPower, b));
    return [
      { x: bitRange, y: bitRange.map(idealSqnrDb), type: "scatter" as const, mode: "lines+markers" as const, name: "SQNR (ideal)", line: { color: "#60a5fa" } },
      { x: bitRange, y: sndrForBits, type: "scatter" as const, mode: "lines+markers" as const, name: "SINAD (with your noise + distortion)", line: { color: "#f87171" } },
      { x: [bits], y: [sinadWithQuantizationDb(signalPower, noisePower, distortionPower, bits)], type: "scatter" as const, mode: "markers" as const, name: "Chosen ADC bits", marker: { color: "#fbbf24", size: 10 } },
    ];
  }, [signalPower, noisePower, distortionPower, bits]);

  const snr = 10 * Math.log10(signalPower / noisePower);
  const sinad = 10 * Math.log10(signalPower / (noisePower + distortionPower));
  const sdr = 10 * Math.log10(signalPower / distortionPower); // signal to total distortion; SFDR would need the largest spur
  const thd = 10 * Math.log10(distortionPower / signalPower);
  const sinadQ = sinadWithQuantizationDb(signalPower, noisePower, distortionPower, bits);
  const enob = enobFromSinad(sinadQ);
  const sqnr = idealSqnrDb(bits);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Signal Power (W)" value={signalPowerRaw} onChange={setSignalPower} step="0.01" min={1e-30} max={1e30} />
        <ValidatedNumberInput label="Noise Power (W)" value={noisePowerRaw} onChange={setNoisePower} step="0.001" min={0} max={1e30} />
        <ValidatedNumberInput label="Distortion Power (W)" value={distortionPowerRaw} onChange={setDistortionPower} step="0.0001" min={0} max={1e30} />
        <ValidatedNumberInput label="ADC Bits" value={bitsRaw} onChange={setBits} step="1" min={1} max={24} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">SNR = <span className="text-blue-400 font-mono">{fmtDb(snr)} dB</span></p>
        <p className="text-gray-300">SINAD, analog only = <span className="text-blue-400 font-mono">{fmtDb(sinad)} dB</span> (no quantisation)</p>
        <p className="text-gray-300">SINAD incl. quantisation ({bits}-bit) = <span className="text-blue-400 font-mono">{fmtDb(sinadQ)} dB</span></p>
        <p className="text-gray-300">SDR (signal / distortion) = <span className="text-blue-400 font-mono">{fmtDb(sdr)} dB</span></p>
        <p className="text-gray-300">THD = <span className="text-blue-400 font-mono">{fmtDb(thd)} dBc</span></p>
        <p className="text-gray-300">ENOB = (SINAD incl. quantisation − 1.76)/6.02 = <span className="text-blue-400 font-mono">{Number.isFinite(enob) ? enob.toFixed(3) : "—"} bits</span></p>
        <p className="text-gray-300">Ideal {bits}-bit SQNR = 6.02·N + 1.76 = <span className="text-blue-400 font-mono">{sqnr.toFixed(2)} dB</span></p>
        <p className="text-sm text-gray-500 mt-2">Powers are referred to the ADC input; SQNR assumes a full-scale sine and uniform quantisation error.</p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "ADC Bits", gridcolor: "#374151", dtick: 2 }, yaxis: { title: "dB", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true, showlegend: true }} />
    </>
  );
}
