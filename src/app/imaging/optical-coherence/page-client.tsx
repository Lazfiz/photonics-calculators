"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  coherenceLength, coherenceTime, degreeOfCoherence, fdOctSnr, octAxialResolution, spectralWidthHz,
} from "../../../physics/imaging/oct";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toPrecision(digits)}${unit}` : "—");
const dB = (x: number) => (x > 0 && Number.isFinite(x) ? `${(10 * Math.log10(x)).toFixed(1)} dB` : "—");

export default function OpticalCoherencePage() {
  const [lambdaRaw, setLambda] = useURLState("wavelengthNm", 1310);
  const [bwRaw, setBw] = useURLState("bandwidthNm", 100);
  const [nRaw, setN] = useURLState("refractiveIndex", 1.33);
  const [powerRaw, setPower] = useURLState("sourcePowerMw", 10); // mW on the sample
  const [rsRaw, setRs] = useURLState("sampleReflectivity", 0.01);
  const [kappaRaw, setKappa] = useURLState("couplingEfficiency", 0.6);
  const [rhoRaw, setRho] = useURLState("detectorResponsivity", 0.8); // A/W
  const [rateRaw, setRate] = useURLState("aScanRateKhz", 20);
  const lambdaNm = clamp(lambdaRaw, 600, 1600, 1310);
  const bwNm = clamp(bwRaw, 5, 300, 100);
  const n = clamp(nRaw, 1, 1.8, 1.33);
  const powerMw = clamp(powerRaw, 0.01, 100, 10);
  const Rs = clamp(rsRaw, 1e-6, 1, 0.01);
  const kappa = clamp(kappaRaw, 0.01, 1, 0.6);
  const rho = clamp(rhoRaw, 0.05, 1.2, 0.8);
  const rateKhz = clamp(rateRaw, 0.1, 1000, 20);

  const lambda0 = lambdaNm * 1e-9;
  const dLambda = bwNm * 1e-9;
  const dzAir = octAxialResolution(lambda0, dLambda);
  const dzSample = octAxialResolution(lambda0, dLambda, n);
  const lc = coherenceLength(lambda0, dLambda);
  const tauC = coherenceTime(lambda0, dLambda);
  const dNu = spectralWidthHz(lambda0, dLambda);
  const aScanTime = 1 / (rateKhz * 1e3);
  const pDetector = powerMw * 1e-3 * kappa * Rs; // W from the sample on the detector
  const snr = fdOctSnr(rho, pDetector, aScanTime);
  const sensitivity = fdOctSnr(rho, powerMw * 1e-3 * kappa, aScanTime); // SNR of a perfect mirror = 1/R_s,min

  const lambdas = Array.from({ length: 201 }, (_, i) => lambdaNm - 2 * bwNm + (i * 4 * bwNm) / 200);
  const spectrumChart = [
    { x: lambdas, y: lambdas.map((l) => Math.exp(-4 * Math.LN2 * ((l - lambdaNm) / bwNm) ** 2)), type: "scatter" as const, mode: "lines" as const, name: "S(λ)", line: { color: "#a78bfa" } },
  ];

  const zMax = 3 * dzSample * 1e6; // µm
  const depths = Array.from({ length: 241 }, (_, i) => -zMax + (i * 2 * zMax) / 240);
  const gateChart = [
    { x: depths, y: depths.map((z) => degreeOfCoherence(2 * n * z * 1e-6, lambda0, dLambda)), type: "scatter" as const, mode: "lines" as const, name: "|γ(2n z)|", line: { color: "#34d399" } },
    { x: [-dzSample * 5e5, dzSample * 5e5], y: [0.5, 0.5], type: "scatter" as const, mode: "lines" as const, name: "FWHM Δz", line: { color: "#facc15", dash: "dash" } },
  ];

  const bws = Array.from({ length: 60 }, (_, i) => 5 + i * 5);
  const resChart = [
    { x: bws, y: bws.map((b) => octAxialResolution(lambda0, b * 1e-9, n) * 1e6), type: "scatter" as const, mode: "lines" as const, name: "Δz in the sample", line: { color: "#60a5fa" } },
    { x: [bwNm], y: [dzSample * 1e6], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 10 } },
  ];

  const layout = (x: string, y: string, extra: object = {}) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 20, t: 20, b: 60 },
    xaxis: { title: x, gridcolor: "#333" }, yaxis: { title: y, gridcolor: "#333", ...extra }, showlegend: true,
  });

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Centre wavelength λ₀ (nm)" value={lambdaRaw} onChange={setLambda} min={600} max={1600} step="10" />
          <ValidatedNumberInput label="Bandwidth Δλ, FWHM (nm)" value={bwRaw} onChange={setBw} min={5} max={300} step="5" />
          <ValidatedNumberInput label="Group index of the sample n" value={nRaw} onChange={setN} min={1} max={1.8} step="0.01" />
          <ValidatedNumberInput label="Power on the sample (mW)" value={powerRaw} onChange={setPower} min={0.01} max={100} step="0.1" />
          <ValidatedNumberInput label="Sample reflectivity R_s" value={rsRaw} onChange={setRs} min={1e-6} max={1} step="0.001" />
          <ValidatedNumberInput label="Return efficiency to the detector κ" value={kappaRaw} onChange={setKappa} min={0.01} max={1} step="0.05" />
          <ValidatedNumberInput label="Detector responsivity ρ (A/W)" value={rhoRaw} onChange={setRho} min={0.05} max={1.2} step="0.05" />
          <ValidatedNumberInput label="A-scan rate (kHz)" value={rateRaw} onChange={setRate} min={0.1} max={1000} step="1" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Axial resolution in air", fmt(dzAir * 1e6, 4, " µm"), "text-green-400")}
          {row("Axial resolution in the sample", fmt(dzSample * 1e6, 4, " µm"), "text-green-400")}
          {row("Coherence length l_c (path difference)", fmt(lc * 1e6, 4, " µm"), "text-blue-400")}
          {row("Coherence time τ_c", fmt(tauC * 1e15, 4, " fs"), "text-blue-400")}
          {row("Spectral width Δν", fmt(dNu * 1e-12, 4, " THz"))}
          {row("Sample power on the detector", fmt(pDetector * 1e9, 4, " nW"))}
          {row("Shot-noise SNR (Fourier domain)", dB(snr), "text-yellow-400")}
          {row("Sensitivity (1/R_s at SNR = 1)", dB(sensitivity), "text-yellow-400")}
          <p className="text-xs text-gray-500">
            SNR = ρ P_s Δt/(2e) with Δt = 1/(A-scan rate) and the reference arm strong enough for shot-noise-limited
            detection. Spectral width Δλ/λ₀ = {(bwNm / lambdaNm).toFixed(3)}; the Gaussian formulas assume it is small.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Coherence gate in the sample</h2>
          <ChartPanel data={gateChart} layout={layout("Depth from the matched position (µm)", "|γ|", { range: [0, 1.05] })} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Source spectrum</h2>
          <ChartPanel data={spectrumChart} layout={layout("Wavelength (nm)", "Relative power", { range: [0, 1.05] })} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Axial resolution against bandwidth</h2>
          <ChartPanel data={resChart} layout={layout("Bandwidth Δλ (nm)", "Δz (µm)", { type: "log" })} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>|γ(τ)| = exp(−(πΔν τ)²/(4 ln 2)), Δν = cΔλ/λ₀², τ_c = (4 ln 2/π)/Δν, l_c = cτ_c</p>
          <p>Δz = l_c/(2n) = (2 ln 2/π) λ₀²/(n Δλ) = 0.4413 λ₀²/(n Δλ)</p>
          <p>P_s = P · κ · R_s, SNR = ρ P_s Δt/(2e), sensitivity = ρ P κ Δt/(2e)</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          A Gaussian source spectrum with Δλ ≪ λ₀ and matched dispersion in the two arms. The coherence length is the FWHM
          of |γ| against the optical path difference; the path difference is twice the depth, so the axial resolution is
          half of it, divided by the group index (Fercher et al. 2003). The SNR is the shot-noise limit of a spectrometer
          or swept-source system (Choma et al. 2003, eq. 10) as a power ratio; excess intensity noise, read noise, the
          sensitivity roll-off with depth and losses in the spectrometer are not included.
        </p>
      </div>
    </>
  );
}
