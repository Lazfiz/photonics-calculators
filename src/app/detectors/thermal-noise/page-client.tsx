"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { h, k_B } from "../../../physics/constants";
import { johnsonNoise } from "../../../physics/detectors/noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function ThermalNoisePage() {
  const [resistanceRaw, setResistance] = useURLState("resistance", 1000); // Ω
  const [temperatureRaw, setTemperature] = useURLState("temperature", 300); // K
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1e6); // Hz
  const resistance = clamp(resistanceRaw, 1e-3, 1e15, 1000);
  const temperature = clamp(temperatureRaw, 0, 1e4, 300);
  const bandwidth = clamp(bandwidthRaw, 1e-3, 1e12, 1e6);

  const chartData = useMemo(() => {
    const resistances = Array.from({ length: 200 }, (_, i) => (resistance / 10 ** 2.5) * Math.pow(10 ** 5, i / 199)); // R/10^2.5 to R·10^2.5
    return [{ x: resistances, y: resistances.map(R => johnsonNoise(R, temperature, bandwidth).v), type: "scatter" as const, mode: "lines" as const, name: "RMS noise voltage", line: { color: "#60a5fa" } },
      { x: [resistance], y: [johnsonNoise(resistance, temperature, bandwidth).v], type: "scatter" as const, mode: "markers" as const, name: "Operating point", marker: { color: "#fbbf24", size: 9 } }];
  }, [resistance, temperature, bandwidth]);

  const { v: vNoise, i: iNoise, p: pNoise } = johnsonNoise(resistance, temperature, bandwidth);
  const fQuantum = (k_B * temperature) / h; // Hz: where hf = k_B·T
  const quantumRegime = bandwidth > 0.1 * fQuantum;
  const pNoise_dBm = 10 * Math.log10(pNoise / 1e-3);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Resistance (Ω)" value={resistanceRaw} onChange={setResistance} min={1e-3} max={1e15} />
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={0} max={1e4} />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-3} max={1e12} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">RMS noise voltage √(4k<sub>B</sub>TRB) = <span className="text-blue-400 font-mono">{vNoise.toExponential(4)} V</span></p>
        <p className="text-gray-300">RMS noise current √(4k<sub>B</sub>TB/R) = <span className="text-blue-400 font-mono">{iNoise.toExponential(4)} A</span></p>
        <p className="text-gray-300">Available noise power k<sub>B</sub>TB (matched load) = <span className="text-blue-400 font-mono">{pNoise.toExponential(4)} W</span>
          {" "}(<span className="font-mono">{Number.isFinite(pNoise_dBm) ? pNoise_dBm.toFixed(2) : "—"} dBm</span>)</p>
        <p className="text-sm text-gray-500 mt-2">Classical limit hf ≪ k<sub>B</sub>T (k<sub>B</sub>T/h = {temperature > 0 ? `${(fQuantum / 1e12).toPrecision(3)} THz` : "0 Hz"} at {temperature} K).</p>
        {quantumRegime && (
          <p className="text-sm text-yellow-400 mt-1">
            B = {bandwidth.toExponential(2)} Hz exceeds 0.1·k<sub>B</sub>T/h{temperature > 0 ? ` = ${fQuantum.toExponential(2)} Hz` : " (zero at T = 0)"}: the classical k<sub>B</sub>TB overstates the noise (Planck regime).
            The Planck-integrated available power saturates at (π²/6)(k<sub>B</sub>T)²/h = {((Math.PI ** 2 / 6) * (k_B * temperature) ** 2 / h).toExponential(2)} W, however large B is.
          </p>
        )}
      </div>

      {temperature > 0 ? (
      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Resistance (Ω)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Noise Voltage (V)", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true }} />
      ) : (
        <p className="text-sm text-gray-400">Chart not drawn: at T = 0 the thermal noise is zero (— on a log axis).</p>
      )}
    </>
  );
}
