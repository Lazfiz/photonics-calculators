"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  cutoffFrequency, diffractionMtf, wienerGain, wienerHalfFrequency, wienerTransfer,
} from "../../../physics/imaging/diffraction-mtf";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const um = 1e-6;
const nm = 1e-9;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function DeconvolutionPage() {
  const [naRaw, setNa] = useURLState("na", 1.4);
  const [wavelengthRaw, setWavelength] = useURLState("wavelengthNm", 550);
  const [snrRaw, setSnr] = useURLState("snrInput", 30);
  const na = clamp(naRaw, 0.1, 1.7, 1.4);
  const wavelengthNm = clamp(wavelengthRaw, 200, 2000, 550);
  const snrDb = clamp(snrRaw, 0, 80, 30);
  const nsr = 10 ** (-snrDb / 10);

  const fc = cutoffFrequency(na, wavelengthNm * nm);
  const nuHalf = wienerHalfFrequency(nsr);
  const passbandPeriodNm = 1 / fc / nm;
  const restoredPeriodNm = passbandPeriodNm / nuHalf;
  const rayleighNm = (0.61 * wavelengthNm) / na;
  const peakGain = 1 / (2 * Math.sqrt(nsr));

  const chart = useMemo(() => {
    const nus = Array.from({ length: 201 }, (_, k) => k / 200);
    const x = nus.map((v) => v * fc * um);
    const h = nus.map(diffractionMtf);
    return [
      { x, y: h, type: "scatter" as const, mode: "lines" as const, name: "Diffraction-limited MTF H", line: { color: "#60a5fa" } },
      { x, y: h.map((v) => wienerTransfer(v, nsr)), type: "scatter" as const, mode: "lines" as const, name: "Wiener-restored H²/(H² + NSR)", line: { color: "#34d399" } },
      { x, y: h.map((v) => wienerGain(v, nsr) * Math.sqrt(nsr)), type: "scatter" as const, mode: "lines" as const, name: "Filter gain × √NSR", line: { color: "#f87171", dash: "dash" } },
      { x: [nuHalf * fc * um], y: [0.5], type: "scatter" as const, mode: "markers" as const, name: "Restored transfer ½", marker: { color: "#facc15", size: 10 } },
    ];
  }, [fc, nsr, nuHalf]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Numerical aperture NA" value={naRaw} onChange={setNa} min={0.1} max={1.7} step="any" />
          <ValidatedNumberInput label="Emission wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step="any" />
          <ValidatedNumberInput label="Signal-to-noise power ratio per frequency (dB)" value={snrRaw} onChange={setSnr} min={0} max={80} step="any" />
          <p className="text-xs text-gray-500">
            The Wiener filter G = H/(H² + NSR) assumes white noise and a flat object spectrum with a noise-to-signal
            power ratio NSR = 10^(−dB/10). Tikhonov regularisation with the identity is the same filter with NSR as its
            parameter. Richardson–Lucy and blind deconvolution are iterative and nonlinear: they have no transfer
            function to plot, and they cannot restore frequencies above f_c either.
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("OTF cutoff f_c = 2NA/λ", fmt(fc * um, 3, " lp/µm"))}
          {row("Finest period passed, λ/(2NA)", fmt(passbandPeriodNm, 1, " nm"), "text-blue-400")}
          {row("Rayleigh distance 0.61λ/NA", fmt(rayleighNm, 1, " nm"))}
          {row("NSR", nsr.toExponential(2))}
          {row("ν where H = √NSR (restored ½)", fmt(nuHalf, 4))}
          {row("Finest period restored to ½", fmt(restoredPeriodNm, 1, " nm"), "text-green-400")}
          {row("Largest filter gain 1/(2√NSR)", fmt(peakGain, 1, "×"))}
          <p className="text-xs text-gray-500">
            Deconvolution raises the contrast of frequencies the optics passed weakly; it does not pass anything above
            f_c, so no method resolves a period below λ/(2NA). The filter gain peaks at H = √NSR and rolls off above it,
            so the noise in the restored image is bounded.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Transfer before and after Wiener restoration</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Spatial frequency (lp/µm)", gridcolor: "#333" },
          yaxis: { title: "Transfer", gridcolor: "#333", range: [0, 1.05] },
          margin: { l: 60, r: 20, t: 20, b: 50 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
