"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  SRS_POLARIZATION_FACTOR, alphaFromDbPerKm, effectiveLength, ramanGainAt, ramanOnOffGain, srsThreshold,
  stokesWavelength,
} from "../../../physics/fiber-optics/fiber-nonlinear";

const POL_CASES = [
  { key: "copolarized", label: "co-polarized / PM fibre (K = 1)", color: "#22c55e" },
  { key: "standard", label: "standard SMF (K = 2)", color: "#3b82f6" },
] as const;

const toDbm = (P: number) => 10 * Math.log10(P * 1e3);

export default function SRSThresholdPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10); // km
  const [effectiveArea, setEffectiveArea] = useURLState("effectiveArea", 80); // μm²
  const [loss, setLoss] = useURLState("loss", 0.2); // dB/km
  const [ramanGain, setRamanGain] = useURLState("ramanGain", 6.5e-14); // m/W
  const [ramanShift, setRamanShift] = useURLState("ramanShift", 13.2); // THz

  const results = useMemo(() => {
    const lambda = Math.max(wavelength, 1) * 1e-9;
    const L = Math.max(fiberLength, 1e-3) * 1e3;
    const Aeff = Math.max(effectiveArea, 1) * 1e-12;
    const alpha = alphaFromDbPerKm(Math.max(loss, 0));
    const gR = Math.max(ramanGain, 1e-17);

    const Leff = effectiveLength(alpha, L);
    const thresholds = POL_CASES.map(({ key }) => srsThreshold(Aeff, gR, Leff, SRS_POLARIZATION_FACTOR[key]));

    const lengths = Array.from({ length: 80 }, (_, i) => ((i + 1) / 80) * 2 * (L / 1e3)); // 0 … 2L, km
    const vsLength = POL_CASES.map(({ key, label, color }) => ({
      type: "scatter" as const, mode: "lines" as const, name: label, line: { color, width: 2 },
      x: lengths, y: lengths.map((l) => srsThreshold(Aeff, gR, effectiveLength(alpha, l * 1e3), SRS_POLARIZATION_FACTOR[key])),
    }));

    // Undepleted-pump on-off gain up to half the co-polarized threshold (where it reaches 8 Np ≈ 35 dB).
    const pumps = Array.from({ length: 81 }, (_, i) => (i / 80) * 0.5 * thresholds[0]); // W
    const vsPump = POL_CASES.map(({ key, label, color }) => ({
      type: "scatter" as const, mode: "lines" as const, name: label, line: { color, width: 2 },
      x: pumps.map((p) => p * 1e3),
      y: pumps.map((p) => 10 * Math.log10(ramanOnOffGain(gR, p, Leff, Aeff, SRS_POLARIZATION_FACTOR[key]))),
    }));

    return {
      Leff, thresholds, vsLength, vsPump,
      gRAtLambda: ramanGainAt(lambda),
      lambdaStokes: stokesWavelength(lambda, Math.max(ramanShift, 0) * 1e12),
    };
  }, [wavelength, fiberLength, effectiveArea, loss, ramanGain, ramanShift]);

  const chartLayout = (xTitle: string, yTitle: string) => ({
    xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151" },
    yaxis: { title: yTitle, color: "#9ca3af", gridcolor: "#374151", rangemode: "tozero" as const },
    margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
    legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
  });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Fiber Parameters</h2>
          {[
            { label: "Pump Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "Fiber Length (km)", val: fiberLength, set: setFiberLength },
            { label: "Effective Area (μm²)", val: effectiveArea, set: setEffectiveArea },
            { label: "Loss (dB/km)", val: loss, set: setLoss },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <ValidatedNumberInput label={label} value={val} onChange={set} min={0} step="any" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Raman Parameters</h2>
          {[
            { label: "Peak Raman Gain gR (m/W)", val: ramanGain, set: setRamanGain },
            { label: "Raman Shift (THz)", val: ramanShift, set: setRamanShift },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <ValidatedNumberInput label={label} value={val} onChange={set} min={0} step="any" />
            </div>
          ))}
          <div className="mt-4 p-3 bg-gray-800 rounded text-sm text-gray-400">
            <p className="font-semibold text-gray-300 mb-1">Typical Values (fused silica):</p>
            <p>• gR ≈ 1×10⁻¹³ m/W for a 1 µm pump, scaling as 1/λp: {results.gRAtLambda.toExponential(2)} m/W at {wavelength} nm</p>
            <p>• Peak Raman shift ≈ 13.2 THz (≈ 113 nm at 1550 nm)</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Effective Length" value={`${(results.Leff / 1000).toFixed(3)} km`} />
            {POL_CASES.map(({ key, label }, i) => (
              <ResultRow
                key={key}
                label={`Threshold, ${label}`}
                value={`${results.thresholds[i].toPrecision(4)} W (${toDbm(results.thresholds[i]).toFixed(2)} dBm)`}
              />
            ))}
            <ResultRow label="Stokes Wavelength" value={Number.isFinite(results.lambdaStokes) ? `${(results.lambdaStokes * 1e9).toFixed(1)} nm` : "—"} />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            P_th = 16·K·A_eff / (gR·L_eff): the CW pump power at which the forward Stokes wave grown from noise equals
            the transmitted pump (Smith 1972). In standard fibre pump and Stokes lose their relative polarization, so K = 2.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Threshold vs Fiber Length</h2>
          <ChartPanel data={results.vsLength} layout={chartLayout("Fiber Length (km)", "SRS Threshold (W)")} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Raman On-Off Gain vs Pump Power</h2>
          <ChartPanel data={results.vsPump} layout={chartLayout("Pump Power (mW)", "On-Off Gain at the Gain Peak (dB)")} />
        </div>
      </div>
    </>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-3 py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm text-right">{value}</span>
    </div>
  );
}
