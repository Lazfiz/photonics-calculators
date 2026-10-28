"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  SBS_POLARIZATION_FACTOR, SILICA_BRILLOUIN_GAIN, alphaFromDbPerKm, brillouinShift, effectiveLength, sbsLinewidthFactor, sbsThreshold,
} from "../../../physics/fiber-optics/fiber-nonlinear";

const POL_CASES = [
  { key: "copolarized", label: "co-polarized / PM fibre (K = 1)", color: "#22c55e" },
  { key: "randomBirefringence", label: "standard SMF (K = 1.5)", color: "#3b82f6" },
  { key: "scrambled", label: "scrambled pump (K = 2)", color: "#f59e0b" },
] as const;

const toDbm = (P: number) => 10 * Math.log10(P * 1e3);

export default function SBSThresholdPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 400, max: 2200 }); // nm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10); // km
  const [effectiveArea, setEffectiveArea] = useURLState("effectiveArea", 80); // μm²
  const [loss, setLoss] = useURLState("loss", 0.2); // dB/km
  const [brillouinGain, setBrillouinGain] = useURLState("brillouinGain", SILICA_BRILLOUIN_GAIN); // m/W
  const [brillouinBandwidth, setBrillouinBandwidth] = useURLState("brillouinBandwidth", 35); // MHz
  const [laserLinewidth, setLaserLinewidth] = useURLState("laserLinewidth", 1); // MHz

  const results = useMemo(() => {
    const lambda = Math.min(Math.max(wavelength, 400), 2200) * 1e-9;
    const L = Math.max(fiberLength, 1e-3) * 1e3;
    const Aeff = Math.max(effectiveArea, 1) * 1e-12;
    const alpha = alphaFromDbPerKm(Math.max(loss, 0));
    const gB = Math.max(brillouinGain, 1e-15);
    const dnuB = Math.max(brillouinBandwidth, 0.1) * 1e6;
    const dnuS = Math.max(laserLinewidth, 0) * 1e6;

    const Leff = effectiveLength(alpha, L);
    const threshold = (K: number, leff = Leff, dnu = dnuS) =>
      sbsThreshold({ Aeff, gB, Leff: leff, K, sourceLinewidth: dnu, brillouinLinewidth: dnuB });
    const thresholds = POL_CASES.map(({ key }) => threshold(SBS_POLARIZATION_FACTOR[key]));

    const lwMax = Math.max(5 * dnuB, 2 * dnuS) / 1e6; // MHz
    const linewidths = Array.from({ length: 81 }, (_, i) => (i * lwMax) / 80); // 0 … max(5Δν_B, 2Δν_s), MHz
    const lengths = Array.from({ length: 80 }, (_, i) => ((i + 1) / 80) * 2 * (L / 1e3)); // 0 … 2L, km
    const curves = (xs: number[], f: (K: number, x: number) => number) =>
      POL_CASES.map(({ key, label, color }) => ({
        type: "scatter" as const, mode: "lines" as const, name: label, line: { color, width: 2 },
        x: xs, y: xs.map((x) => f(SBS_POLARIZATION_FACTOR[key], x) * 1e3),
      }));

    return {
      Leff,
      nuB: brillouinShift(lambda),
      linewidthFactor: sbsLinewidthFactor(dnuS, dnuB),
      thresholds,
      vsLinewidth: [
        ...curves(linewidths, (K, lw) => threshold(K, Leff, lw * 1e6)),
        // The input linewidth on each curve.
        {
          type: "scatter" as const, mode: "markers" as const, name: "Your Δνs", showlegend: false,
          x: thresholds.map(() => dnuS / 1e6), y: thresholds.map((t) => t * 1e3), marker: { color: "#ffffff", size: 8 },
        },
      ],
      vsLength: curves(lengths, (K, l) => threshold(K, effectiveLength(alpha, l * 1e3))),
    };
  }, [wavelength, fiberLength, effectiveArea, loss, brillouinGain, brillouinBandwidth, laserLinewidth]);

  const chartLayout = (xTitle: string) => ({
    xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151" },
    yaxis: { title: "SBS Threshold (mW)", color: "#9ca3af", gridcolor: "#374151", rangemode: "tozero" as const },
    margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
    legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
  });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Fiber Parameters</h2>
          <div className="mb-3">
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2200} step="any" />
          </div>
          {[
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
          <h2 className="text-lg font-semibold mb-4">Brillouin Parameters</h2>
          {[
            { label: "Brillouin Gain gB (m/W)", val: brillouinGain, set: setBrillouinGain },
            { label: "Brillouin Gain Bandwidth ΔνB (MHz)", val: brillouinBandwidth, set: setBrillouinBandwidth },
            { label: "Source Linewidth Δνs (MHz)", val: laserLinewidth, set: setLaserLinewidth },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <ValidatedNumberInput label={label} value={val} onChange={set} min={0} step="any" />
            </div>
          ))}
          <p className="text-xs text-gray-500">
            The Brillouin gain bandwidth Δν_B is your value at this wavelength (it scales ≈ 1/λ²); the wavelength itself only sets the Brillouin shift.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Effective Length" value={`${(results.Leff / 1000).toFixed(3)} km`} />
            <ResultRow label="Brillouin Shift νB" value={`${(results.nuB / 1e9).toFixed(2)} GHz`} />
            <ResultRow label="Linewidth Factor 1 + Δνs/ΔνB" value={results.linewidthFactor.toFixed(4)} />
            {POL_CASES.map(({ key, label }, i) => (
              <ResultRow
                key={key}
                label={`Threshold, ${label}`}
                value={`${(results.thresholds[i] * 1e3).toPrecision(4)} mW (${toDbm(results.thresholds[i]).toFixed(2)} dBm)`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            P_th = 21·K·A_eff·(1 + Δνs/ΔνB) / (gB·L_eff). The linewidth factor assumes a Lorentzian source; phase
            modulation or dithering of the source that spreads the spectrum over GHz raises the threshold much further, whereas
            on–off keying keeps about half the power in the carrier and so only roughly doubles it.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Threshold vs Source Linewidth</h2>
          <ChartPanel data={results.vsLinewidth} layout={chartLayout("Source Linewidth (MHz)")} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Threshold vs Fiber Length</h2>
          <ChartPanel data={results.vsLength} layout={chartLayout("Fiber Length (km)")} />
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
