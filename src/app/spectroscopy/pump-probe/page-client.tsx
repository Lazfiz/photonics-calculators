"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { hc_eV_nm } from "../../../physics/constants";
import { crossSectionFromEpsilon } from "../../../physics/spectroscopy/lambert-beer-law";
import {
  deltaA, deltaTOverT, excitationFraction, intermediatePeakTime, photonFluence, sequentialPopulations, type TransientBands,
} from "../../../physics/spectroscopy/pump-probe";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Number(x.toPrecision(6)) : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const FWHM_TO_SIGMA = 1 / (2 * Math.sqrt(2 * Math.LN2));
const ps = 1e-12;
const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#fb7185", "#38bdf8", "#4ade80"];

export default function PumpProbePage() {
  const [pumpRaw, setPump] = useURLState("pumpWavelength", 400);
  const [fluenceRaw, setFluence] = useURLState("fluence", 100);
  const [epsRaw, setEps] = useURLState("epsilonPump", 10000);
  const [pumpAbsRaw, setPumpAbs] = useURLState("pumpAbsorbance", 0.3);
  const [gsAbsRaw, setGsAbs] = useURLState("groundAbsorbance", 0.5);
  const [tau1Raw, setTau1] = useURLState("tau1", 0.5);
  const [tau2Raw, setTau2] = useURLState("tau2", 5);
  const [irfRaw, setIrf] = useURLState("irfFs", 100);
  const [tMaxRaw, setTMax] = useURLState("tMax", 20);
  const [gsRaw, setGs] = useURLState("gsAbsorption", 500, { min: 100, max: 5000 });
  const [gsWRaw, setGsW] = useURLState("gsWidth", 60, { min: 1, max: 2000 });
  const [seRaw, setSe] = useURLState("seCenter", 570, { min: 100, max: 5000 });
  const [seWRaw, setSeW] = useURLState("seWidth", 60, { min: 1, max: 2000 });
  const [seSRaw, setSeS] = useURLState("seStrength", 0.6, { min: 0, max: 100 });
  const [esaRaw, setEsa] = useURLState("esAbsorption", 680, { min: 100, max: 5000 });
  const [esaWRaw, setEsaW] = useURLState("esaWidth", 100, { min: 1, max: 2000 });
  const [esaSRaw, setEsaS] = useURLState("esaStrength", 0.8, { min: 0, max: 100 });
  const [esbRaw, setEsb] = useURLState("esaBCenter", 430, { min: 100, max: 5000 });
  const [esbWRaw, setEsbW] = useURLState("esaBWidth", 80, { min: 1, max: 2000 });
  const [esbSRaw, setEsbS] = useURLState("esaBStrength", 0.5, { min: 0, max: 100 });
  const [probeRaw, setProbe] = useURLState("probeWavelength", 500, { min: 100, max: 5000 });
  const [minRaw, setMin] = useURLState("probeRangeMin", 400, { min: 100, max: 5000 });
  const [maxRaw, setMax] = useURLState("probeRangeMax", 800, { min: 100, max: 5000 });
  const [delays, setDelays] = useURLState("delays", "0.1,0.5,1,2,5,10");

  const pumpNm = clamp(pumpRaw, 200, 3000, 400);
  const fluence = clamp(fluenceRaw, 0, 1e5, 100) * 1e-2; // µJ/cm² → J/m²
  const epsLab = clamp(epsRaw, 0, 1e6, 10000);
  const pumpAbs = clamp(pumpAbsRaw, 0, 5, 0.3);
  const gsAbs = clamp(gsAbsRaw, 0, 5, 0.5);
  const tau1 = clamp(tau1Raw, 1e-3, 1e6, 0.5) * ps;
  const tau2 = clamp(tau2Raw, 1e-3, 1e6, 5) * ps;
  const irf = clamp(irfRaw, 0, 1e6, 100) * 1e-15;
  const sigma = irf * FWHM_TO_SIGMA;
  const tMax = clamp(tMaxRaw, 0.01, 1e6, 20) * ps;
  const nm = (x: number, d: number) => clamp(x, 100, 5000, d) * 1e-9;
  const width = (x: number, d: number) => clamp(x, 1, 2000, d) * 1e-9;
  const strength = (x: number, d: number) => clamp(x, 0, 100, d);
  const bands: TransientBands = {
    groundState: { centre: nm(gsRaw, 500), fwhm: width(gsWRaw, 60), strength: 1 },
    se: { centre: nm(seRaw, 570), fwhm: width(seWRaw, 60), strength: strength(seSRaw, 0.6) },
    esaA: { centre: nm(esaRaw, 680), fwhm: width(esaWRaw, 100), strength: strength(esaSRaw, 0.8) },
    esaB: { centre: nm(esbRaw, 430), fwhm: width(esbWRaw, 80), strength: strength(esbSRaw, 0.5) },
  };
  const probe = nm(probeRaw, 500);
  const [lo, hi] = [nm(minRaw, 400), nm(maxRaw, 800)].sort((a, b) => a - b);
  const range = hi > lo ? [lo, hi] : [lo, lo + 100e-9];

  const epsilon = epsLab * 0.1; // L mol⁻¹ cm⁻¹ → m²/mol
  const sigmaPump = crossSectionFromEpsilon(epsilon);
  const photons = photonFluence(fluence, pumpNm * 1e-9);
  const frontFace = sigmaPump * photons;
  const f = excitationFraction(fluence, pumpNm * 1e-9, epsilon, pumpAbs);
  const tPeakB = intermediatePeakTime(tau1, tau2);

  const delayList = delays.split(",").map((s) => s.trim()).filter((s) => s !== "").map(Number).filter(Number.isFinite).slice(0, 8).map((d) => clamp(d, -1e6, 1e6, 0));

  const tStart = -Math.max(3 * irf, 0.05 * tMax);
  const times = Array.from({ length: 401 }, (_, i) => tStart + (i / 400) * (tMax - tStart));
  const trace = times.map((t) => deltaA(probe, sequentialPopulations(t, tau1, tau2, sigma), bands, f, gsAbs));
  const mOD = (x: number) => r6(x * 1e3);
  const tPs = times.map((t) => r6(t / ps));
  const kinetics = [
    { x: tPs, y: trace.map((p) => mOD(p.total)), type: "scatter", mode: "lines", name: "ΔA total", line: { color: "#f9fafb", width: 2 } },
    { x: tPs, y: trace.map((p) => mOD(p.bleach)), type: "scatter", mode: "lines", name: "GSB", line: { color: "#60a5fa", dash: "dash" } },
    { x: tPs, y: trace.map((p) => mOD(p.se)), type: "scatter", mode: "lines", name: "SE (A)", line: { color: "#34d399", dash: "dash" } },
    { x: tPs, y: trace.map((p) => mOD(p.esaA)), type: "scatter", mode: "lines", name: "ESA (A)", line: { color: "#f87171", dash: "dash" } },
    { x: tPs, y: trace.map((p) => mOD(p.esaB)), type: "scatter", mode: "lines", name: "ESA (B)", line: { color: "#fbbf24", dash: "dot" } },
  ];
  const pops = times.map((t) => sequentialPopulations(t, tau1, tau2, sigma));
  const populations = [
    { x: tPs, y: pops.map((p) => r6(p.a)), type: "scatter", mode: "lines", name: "n_A", line: { color: "#f87171", width: 2 } },
    { x: tPs, y: pops.map((p) => r6(p.b)), type: "scatter", mode: "lines", name: "n_B", line: { color: "#fbbf24", width: 2 } },
    { x: tPs, y: pops.map((p) => r6(p.bleach)), type: "scatter", mode: "lines", name: "ground-state depletion n_A + n_B", line: { color: "#60a5fa", width: 2, dash: "dash" } },
  ];
  const lambdas = Array.from({ length: 301 }, (_, i) => range[0] + (i / 300) * (range[1] - range[0]));
  const spectra = delayList.map((d, i) => {
    const p = sequentialPopulations(d * ps, tau1, tau2, sigma);
    return {
      x: lambdas.map((l) => r6(l * 1e9)), y: lambdas.map((l) => mOD(deltaA(l, p, bands, f, gsAbs).total)),
      type: "scatter", mode: "lines", name: `${d} ps`, line: { color: COLORS[i % COLORS.length], width: 2 },
    };
  });

  const peakIdx = trace.reduce((best, p, i) => (Math.abs(p.total) > Math.abs(trace[best].total) ? i : best), 0);
  const peak = trace[peakIdx].total;
  const saturated = Number.isFinite(f) && frontFace > 0.1;

  return (
    <>
      <h2 className="text-lg font-semibold text-white mb-3">Pump and sample</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Pump Wavelength (nm)" value={pumpRaw} onChange={setPump} min={200} max={3000} step="10" />
        <ValidatedNumberInput label="Pump Fluence (µJ/cm²)" value={fluenceRaw} onChange={setFluence} min={0} max={1e5} step="10" />
        <ValidatedNumberInput label="ε at Pump (L mol⁻¹ cm⁻¹)" value={epsRaw} onChange={setEps} min={0} max={1e6} step="1000" />
        <ValidatedNumberInput label="Sample Absorbance at Pump" value={pumpAbsRaw} onChange={setPumpAbs} min={0} max={5} step="0.05" />
        <ValidatedNumberInput label="Ground-State Absorbance at Bleach Peak" value={gsAbsRaw} onChange={setGsAbs} min={0} max={5} step="0.05" />
      </div>

      <h2 className="text-lg font-semibold text-white mb-3">Kinetics A → B → ground state</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="τ₁, A → B (ps)" value={tau1Raw} onChange={setTau1} min={0.001} max={1e6} step="0.1" />
        <ValidatedNumberInput label="τ₂, B → ground state (ps)" value={tau2Raw} onChange={setTau2} min={0.001} max={1e6} step="1" />
        <ValidatedNumberInput label="Cross-Correlation FWHM (fs)" value={irfRaw} onChange={setIrf} min={0} max={1e6} step="10" />
        <ValidatedNumberInput label="Max Delay (ps)" value={tMaxRaw} onChange={setTMax} min={0.01} max={1e6} step="5" />
      </div>

      <h2 className="text-lg font-semibold text-white mb-3">Bands (Gaussian; strength = peak ε relative to the ground-state peak)</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="Ground-State Band Centre (nm)" value={gsRaw} onChange={setGs} min={100} max={5000} step="5" />
        <ValidatedNumberInput label="Ground-State Band FWHM (nm)" value={gsWRaw} onChange={setGsW} min={1} max={2000} step="5" />
        <ValidatedNumberInput label="SE Centre (nm)" value={seRaw} onChange={setSe} min={100} max={5000} step="5" />
        <ValidatedNumberInput label="SE FWHM (nm)" value={seWRaw} onChange={setSeW} min={1} max={2000} step="5" />
        <ValidatedNumberInput label="SE Strength" value={seSRaw} onChange={setSeS} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="ESA of A Centre (nm)" value={esaRaw} onChange={setEsa} min={100} max={5000} step="5" />
        <ValidatedNumberInput label="ESA of A FWHM (nm)" value={esaWRaw} onChange={setEsaW} min={1} max={2000} step="5" />
        <ValidatedNumberInput label="ESA of A Strength" value={esaSRaw} onChange={setEsaS} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="ESA of B Centre (nm)" value={esbRaw} onChange={setEsb} min={100} max={5000} step="5" />
        <ValidatedNumberInput label="ESA of B FWHM (nm)" value={esbWRaw} onChange={setEsbW} min={1} max={2000} step="5" />
        <ValidatedNumberInput label="ESA of B Strength" value={esbSRaw} onChange={setEsbS} min={0} max={100} step="0.1" />
      </div>

      <h2 className="text-lg font-semibold text-white mb-3">Probe</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Kinetic-Trace Wavelength (nm)" value={probeRaw} onChange={setProbe} min={100} max={5000} step="5" />
        <ValidatedNumberInput label="Spectrum From (nm)" value={minRaw} onChange={setMin} min={100} max={5000} step="10" />
        <ValidatedNumberInput label="Spectrum To (nm)" value={maxRaw} onChange={setMax} min={100} max={5000} step="10" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Spectrum Delays (ps, comma-separated, up to 8)</span>
          <input type="text" value={delays} onChange={(e) => setDelays(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Mean Excited Fraction f̄" value={`${fmt(f * 100, 3)} %`} tone={saturated ? "orange" : "green"}
          subtext={saturated ? `front face σJ = ${fmt(frontFace, 3)}: saturation, the linear estimate is too high` : `σ = ${fmt(sigmaPump * 1e4, 4)} cm², ${fmt(photons * 1e-4, 4)} photons/cm², front face ${fmt(frontFace * 100, 3)} %`} />
        <ResultCard label={`Largest |ΔA| at ${fmt(probe * 1e9, 4)} nm`} value={`${fmt(peak * 1e3, 3)} mOD`} tone="blue"
          subtext={`at ${fmt(times[peakIdx] / ps, 3)} ps; ΔT/T = ${fmt(deltaTOverT(peak) * 100, 3)} %`} />
        <ResultCard label="B Population Maximum" value={`${fmt(tPeakB / ps, 4)} ps`} tone="yellow"
          subtext={`ln(k₁/k₂)/(k₁ − k₂) without IRF; n_B = ${fmt(sequentialPopulations(tPeakB, tau1, tau2).b, 4)}`} />
        <ResultCard label="Photon Energies" value={`${fmt(hc_eV_nm / pumpNm, 4)} eV pump`} tone="purple"
          subtext={`probe ${fmt(hc_eV_nm / (probe * 1e9), 4)} eV`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Sequential populations after the pump: n_A = e^(−t/τ₁), n_B = τ₂/(τ₂ − τ₁) · (e^(−t/τ₂) − e^(−t/τ₁)); the ground state stays depleted by n_A + n_B until B decays.</p>
        <p>ΔA(λ, t) = f̄ · A_GS · [−(n_A + n_B) g_GS(λ) + n_A (r_ESA g_ESA(λ) − r_SE g_SE(λ)) + n_B r_B g_B(λ)]: bleach and stimulated emission are negative, excited-state absorption positive.</p>
        <p>Excited fraction (linear regime, averaged over depth): f̄ = σJ (1 − 10^(−A_p))/(A_p ln 10), σ = ln 10 · ε/N_A, J = Fλ/(hc). Each exponential is convolved with the Gaussian pump-probe cross-correlation in closed form.</p>
        <p className="text-gray-400">A band with strength 0 drops out. ΔT/T = 10^(−ΔA) − 1. Coherent artefacts at time zero, anisotropy (magic-angle probing assumed) and pump saturation are not modelled.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={kinetics} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: `Kinetic Trace at ${fmt(probe * 1e9, 4)} nm`, font: { color: "white" } },
          xaxis: { title: "Pump-Probe Delay (ps)", gridcolor: "#374151" },
          yaxis: { title: "ΔA (mOD)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={spectra} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Transient Absorption Spectra", font: { color: "white" } },
          xaxis: { title: "Probe Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "ΔA (mOD)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={populations} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Populations (fraction of excited molecules)", font: { color: "white" } },
          xaxis: { title: "Pump-Probe Delay (ps)", gridcolor: "#374151" },
          yaxis: { title: "Population", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
      </div>
    </>
  );
}
