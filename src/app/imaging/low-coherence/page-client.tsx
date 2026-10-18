"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  coherenceLength, degreeOfCoherence, dopplerFrequency, fringeVisibility, octAxialResolution, tdOctSnr, tdSignalBandwidth,
} from "../../../physics/imaging/oct";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toPrecision(digits)}${unit}` : "—");

export default function LowCoherencePage() {
  const [lambdaRaw, setLambda] = useURLState("wavelengthNm", 1300);
  const [bwRaw, setBw] = useURLState("bandwidthNm", 80);
  const [nRaw, setN] = useURLState("refractiveIndex", 1.4);
  const [scanRaw, setScan] = useURLState("scanRangeMm", 2);
  const [speedRaw, setSpeed] = useURLState("mirrorSpeedMmPerS", 50);
  const [aScansRaw, setAScans] = useURLState("numAScans", 500);
  const [rrRaw, setRr] = useURLState("referenceReflectivity", 0.9);
  const [rsRaw, setRs] = useURLState("sampleReflectivity", 0.004);
  const [powerRaw, setPower] = useURLState("sourcePowerMw", 10);
  const [rhoRaw, setRho] = useURLState("detectorResponsivity", 0.8);
  const lambdaNm = clamp(lambdaRaw, 600, 1600, 1300);
  const bwNm = clamp(bwRaw, 5, 300, 80);
  const n = clamp(nRaw, 1, 1.8, 1.4);
  const scanMm = clamp(scanRaw, 0.1, 10, 2);
  const speedMm = clamp(speedRaw, 1, 200, 50);
  const aScans = Math.round(clamp(aScansRaw, 50, 2000, 500));
  const Rr = clamp(rrRaw, 0.01, 1, 0.9);
  const Rs = clamp(rsRaw, 1e-6, 1, 0.004);
  const powerMw = clamp(powerRaw, 0.01, 100, 10);
  const rho = clamp(rhoRaw, 0.05, 1.2, 0.8);

  const lambda0 = lambdaNm * 1e-9;
  const dLambda = bwNm * 1e-9;
  const v = speedMm * 1e-3;
  const dzAir = octAxialResolution(lambda0, dLambda);
  const dzSample = octAxialResolution(lambda0, dLambda, n);
  const lc = coherenceLength(lambda0, dLambda);
  const V = fringeVisibility(Rr, Rs);
  const carrier = dopplerFrequency(v, lambda0);
  const signalBw = tdSignalBandwidth(v, lambda0, dLambda);
  const detectionBw = 2 * signalBw; // Choma 2003: B = 2Δk_FWHM v/π
  const aScanTime = (scanMm * 1e-3) / v;
  const bScanTime = aScans * aScanTime;
  const pSample = (powerMw * 1e-3 * Rs) / 4; // 50/50 coupler, both passes
  const snr = tdOctSnr(rho, pSample, detectionBw);

  // OPD axis sampled at λ₀/16 so the fringes are resolved; ±120 λ₀ at most for narrow sources.
  const halfRange = Math.min(2.5 * lc, 120 * lambda0) * 1e6; // µm
  const step = lambdaNm * 1e-3 / 16;
  const nPts = 2 * Math.ceil(halfRange / step) + 1;
  const opd = Array.from({ length: nPts }, (_, i) => -halfRange + i * step);
  const env = opd.map((d) => V * degreeOfCoherence(d * 1e-6, lambda0, dLambda));
  const interferogram = [
    { x: opd, y: opd.map((d, i) => 1 + env[i] * Math.cos((2 * Math.PI * d) / (lambdaNm * 1e-3))), type: "scatter" as const, mode: "lines" as const, name: "I/(I_r + I_s)", line: { color: "#34d399", width: 1 } },
    { x: opd, y: env.map((e) => 1 + e), type: "scatter" as const, mode: "lines" as const, name: "1 + V|γ|", line: { color: "#60a5fa", dash: "dash" } },
    { x: opd, y: env.map((e) => 1 - e), type: "scatter" as const, mode: "lines" as const, name: "1 − V|γ|", line: { color: "#60a5fa", dash: "dash" } },
  ];

  const rsAxis = Array.from({ length: 61 }, (_, i) => 10 ** (-6 + i * 0.1));
  const visChart = [
    { x: rsAxis, y: rsAxis.map((r) => fringeVisibility(Rr, r)), type: "scatter" as const, mode: "lines" as const, name: "V", line: { color: "#a78bfa" } },
    { x: [Rs], y: [V], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 10 } },
  ];

  const layout = (x: string, y: string, xExtra: object = {}) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 20, t: 20, b: 60 },
    xaxis: { title: x, gridcolor: "#333", ...xExtra }, yaxis: { title: y, gridcolor: "#333" }, showlegend: true,
  });

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Centre wavelength λ₀ (nm)" value={lambdaRaw} onChange={setLambda} min={600} max={1600} step="10" />
          <ValidatedNumberInput label="Bandwidth Δλ, FWHM (nm)" value={bwRaw} onChange={setBw} min={5} max={300} step="5" />
          <ValidatedNumberInput label="Group index of the sample n" value={nRaw} onChange={setN} min={1} max={1.8} step="0.01" />
          <ValidatedNumberInput label="Reference mirror travel (mm)" value={scanRaw} onChange={setScan} min={0.1} max={10} step="0.1" />
          <ValidatedNumberInput label="Mirror speed v (mm/s)" value={speedRaw} onChange={setSpeed} min={1} max={200} step="1" />
          <ValidatedNumberInput label="A-scans per B-scan" value={aScansRaw} onChange={setAScans} min={50} max={2000} step="50" />
          <ValidatedNumberInput label="Reference reflectivity R_r" value={rrRaw} onChange={setRr} min={0.01} max={1} step="0.05" />
          <ValidatedNumberInput label="Sample reflectivity R_s" value={rsRaw} onChange={setRs} min={1e-6} max={1} step="0.001" />
          <ValidatedNumberInput label="Source power P₀ (mW)" value={powerRaw} onChange={setPower} min={0.01} max={100} step="0.5" />
          <ValidatedNumberInput label="Detector responsivity ρ (A/W)" value={rhoRaw} onChange={setRho} min={0.05} max={1.2} step="0.05" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Axial resolution in air", fmt(dzAir * 1e6, 4, " µm"), "text-green-400")}
          {row("Axial resolution in the sample", fmt(dzSample * 1e6, 4, " µm"), "text-green-400")}
          {row("Coherence length l_c (path difference)", fmt(lc * 1e6, 4, " µm"), "text-blue-400")}
          {row("Fringe visibility V", fmt(V, 4), "text-yellow-400")}
          {row("Carrier (Doppler) frequency 2v/λ₀", fmt(carrier * 1e-3, 4, " kHz"), "text-purple-400")}
          {row("Signal bandwidth, FWHM 2vΔλ/λ₀²", fmt(signalBw * 1e-3, 4, " kHz"))}
          {row("Depth range in the sample", fmt(scanMm / n, 4, " mm"))}
          {row("A-scan time (one way)", fmt(aScanTime * 1e3, 4, " ms"))}
          {row("B-scan time", fmt(bScanTime, 4, " s"))}
          {row("Shot-noise SNR", Number.isFinite(snr) && snr > 0 ? `${(10 * Math.log10(snr)).toFixed(1)} dB` : "—", "text-yellow-400")}
          <p className="text-xs text-gray-500">
            SNR = ρ P_s/(2e B) with P_s = P₀R_s/4 through a 50/50 coupler and B = 2 × the signal FWHM ={" "}
            {fmt(detectionBw * 1e-3, 3, " kHz")}; it assumes R_r ≫ R_s and a shot-noise-limited reference.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Interferogram of a single reflector</h2>
          <ChartPanel data={interferogram} layout={layout("Optical path difference (µm)", "I/(I_r + I_s)")} />
          {halfRange < 2.5 * lc * 1e6 && (
            <p className="text-xs text-gray-500 mt-2">Only the central ±{halfRange.toFixed(0)} µm is drawn, so the fringes stay resolved.</p>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Fringe visibility against sample reflectivity</h2>
          <ChartPanel data={visChart} layout={layout("Sample reflectivity R_s", "V", { type: "log" })} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>I(d) = I_r + I_s + 2√(I_r I_s) |γ(d)| cos(2πd/λ₀), |γ(d)| = exp(−(πΔλ d/λ₀²)²/(4 ln 2)), d = path difference</p>
          <p>V = 2√(R_r R_s)/(R_r + R_s), Δz = (2 ln 2/π) λ₀²/(n Δλ)</p>
          <p>f = 2v/λ₀, Δf = 2vΔλ/λ₀², SNR = ρ P_s/(2e B)</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Time-domain OCT: a reference mirror moving at constant speed v scans the coherence gate through the sample, so a
          reflector gives a burst of fringes at the Doppler frequency 2v/λ₀ under the coherence envelope. Gaussian source,
          Δλ ≪ λ₀, matched dispersion, no flyback time. The SNR is the shot-noise limit of Choma et al. (2003, eq. 9), with
          their detection bandwidth 2Δk v/π = 4vΔλ/λ₀².
        </p>
      </div>
    </>
  );
}
