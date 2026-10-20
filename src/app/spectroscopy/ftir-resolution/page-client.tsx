"use client";

import { useMemo } from "react";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  apodization, FTIR_APODIZATIONS, FTIR_APODIZATION_NAMES, ilsFwhm, ilsHighestSidelobe, instrumentLineShape, modulationFrequency,
  nominalResolution, scanTime, singleSidedPoints, type FtirApodization,
} from "../../../physics/spectroscopy/ftir";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (v: number, d = 4) => (Number.isFinite(v) ? Number(v.toPrecision(d)).toString() : "—");
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

export default function FtirResolutionPage() {
  const [opdRaw, setMaxOPD] = useURLState("maxOPD", 1.0);
  const [rangeRaw, setSpectralRange] = useURLState("spectralRange", 4000);
  const [speedRaw, setMirrorVelocity] = useURLState("mirrorVelocity", 1.0);
  const [apodRaw, setApodization] = useURLState("apodization", "boxcar");

  const L = clamp(opdRaw, 0.001, 500, 1);
  const sigmaMax = clamp(rangeRaw, 100, 20000, 4000);
  const v = clamp(speedRaw, 0.001, 10, 1);
  const apod: FtirApodization = FTIR_APODIZATION_NAMES.includes(apodRaw as FtirApodization) ? (apodRaw as FtirApodization) : "boxcar";

  // Width and sidelobe of every window, in units of 1/L (independent of the inputs).
  const table = useMemo(
    () => FTIR_APODIZATION_NAMES.map((name) => ({ name, fwhm: ilsFwhm(name), sidelobe: ilsHighestSidelobe(name) })),
    [],
  );
  const boxFwhm = table[0].fwhm;
  const row = table.find((t) => t.name === apod) ?? table[0];

  const resolution = nominalResolution(L);
  const points = singleSidedPoints(L, sigmaMax);
  const time = scanTime(L, v);
  const fMax = modulationFrequency(v, sigmaMax);
  const dx_um = 1e4 / (2 * sigmaMax);

  const shapeSeries = useMemo(() => {
    // ±1.2 so the cut-off at |x| = L shows; the boxcar edges are drawn at ±1 exactly.
    const u = [...Array.from({ length: 241 }, (_, i) => round6(-1.2 + i / 100)), -1 - 1e-9, 1 + 1e-9].sort((a, b) => a - b);
    const series = [{ name: "Boxcar", color: "#60a5fa", dashed: true, points: u.map((x) => ({ x, y: apodization("boxcar", x) })) }];
    if (apod !== "boxcar") series.push({ name: FTIR_APODIZATIONS[apod].label, color: "#fbbf24", dashed: false, points: u.map((x) => ({ x, y: round6(apodization(apod, x)) })) });
    return series;
  }, [apod]);

  const sGrid = Array.from({ length: 321 }, (_, i) => -4 + i / 40);
  const trace = (name: FtirApodization, color: string, dashed: boolean) => ({
    name: FTIR_APODIZATIONS[name].label, color, dashed,
    points: sGrid.map((x) => ({ x: round6(x / L), y: round6(instrumentLineShape(name, x)) })),
  });
  const ilsSeries = apod === "boxcar" ? [trace("boxcar", "#60a5fa", false)] : [trace("boxcar", "#60a5fa", true), trace(apod, "#fbbf24", false)];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Maximum OPD L (cm)" value={opdRaw} onChange={setMaxOPD} min={0.001} max={500} />
        <ValidatedNumberInput label="Highest Wavenumber σ_max (Nyquist, cm⁻¹)" value={rangeRaw} onChange={setSpectralRange} min={100} max={20000} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Apodization</span>
          <select value={apod} onChange={(e) => setApodization(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {FTIR_APODIZATION_NAMES.map((name) => <option key={name} value={name}>{FTIR_APODIZATIONS[name].label}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Moving-Mirror Speed v (cm/s)" value={speedRaw} onChange={setMirrorVelocity} min={0.001} max={10} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Nominal Resolution 1/L" value={`${fmt(resolution)} cm⁻¹`} tone="blue" subtext={`boxcar ILS FWHM ${fmt(boxFwhm / L)} cm⁻¹`} />
        <ResultCard label="ILS FWHM (apodized)" value={`${fmt(row.fwhm / L)} cm⁻¹`} tone="green" subtext={`${fmt(row.fwhm / boxFwhm, 3)} × boxcar`} />
        <ResultCard label="Points, Single-Sided Scan" value={Math.round(points).toLocaleString("en-US")} tone="yellow" subtext={`step Δx = 1/(2σ_max) = ${fmt(dx_um)} µm`} />
        <ResultCard label="Scan Time L/(2v)" value={`${fmt(time)} s`} tone="purple" subtext={`modulation at σ_max: ${fmt(fMax / 1000)} kHz`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Apodization Functions</h3>
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-4">Window</th><th className="py-1 pr-4">ILS FWHM (× 1/L)</th><th className="py-1 pr-4">× boxcar</th>
              <th className="py-1 pr-4">FWHM at this L (cm⁻¹)</th><th className="py-1">Largest sidelobe</th>
            </tr>
          </thead>
          <tbody>
            {table.map((t) => (
              <tr key={t.name} className={`border-t border-gray-800 ${t.name === apod ? "text-yellow-300" : ""}`}>
                <td className="py-1 pr-4">{FTIR_APODIZATIONS[t.name].label}</td>
                <td className="py-1 pr-4">{t.fwhm.toFixed(4)}</td>
                <td className="py-1 pr-4">{(t.fwhm / boxFwhm).toFixed(3)}</td>
                <td className="py-1 pr-4">{fmt(t.fwhm / L)}</td>
                <td className="py-1">{`${(100 * t.sidelobe).toPrecision(2)} % (${(20 * Math.log10(Math.abs(t.sidelobe))).toFixed(0)} dB)`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <SimpleLineChart title="Apodization A(x/L)" xLabel="x / L" yLabel="A" series={shapeSeries} />
        <SimpleLineChart title="Instrument line shape" xLabel="σ − σ₀ (cm⁻¹)" yLabel="ILS (normalized)" series={ilsSeries} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">B(σ) = ∫ I(x)·A(x/L)·cos(2πσx) dx over −L … L,   ILS(s) ∝ ∫₀¹ A(u) cos(2πsu) du,   s = (σ − σ₀)·L</p>
        <p className="font-mono">δσ = 1/L,   N = 2Lσ_max,   t = L/(2v),   f = 2vσ</p>
        <p>
          Cutting the interferogram off at the maximum optical path difference L convolves every line with the instrument
          line shape. Without apodization that is a sinc of FWHM 0.603/L with −22 % sidelobes; an apodization function tapers
          the interferogram to suppress the sidelobes at the cost of a wider line. The widths and sidelobes in the table are
          computed from each window, not quoted. Norton–Beer weak, medium and strong were designed for 1.2, 1.4 and 1.6 times
          the boxcar width.
        </p>
        <p>
          Sampling at Δx = 1/(2σ_max) puts the Nyquist wavenumber at σ_max; lines above it alias. The optical path changes at
          twice the mirror speed, so a single-sided scan to L takes L/(2v) and modulates wavenumber σ at 2vσ. Beam divergence,
          which adds its own line broadening and limits the usable aperture, is not included.
        </p>
      </div>
    </>
  );
}
