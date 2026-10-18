"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  acousticLossDb, effectiveAttenuation, fluenceAtDepth, initialPressure, paAxialResolution, paLateralResolution,
  skinLongExposureIrradianceLimit, skinPulseLimit, stressConfinementTime, transportMeanFreePath,
} from "../../../physics/imaging/photoacoustic";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");

export default function PhotoacousticPage() {
  const [lambdaRaw, setLambda] = useURLState("laserWavelength", 750); // nm
  const [pulseRaw, setPulse] = useURLState("pulseWidth", 5); // ns
  const [fluenceRaw, setFluence] = useURLState("fluence", 20); // mJ/cm² on the skin
  const [frepRaw, setFrep] = useURLState("repetitionRate", 10); // Hz
  const [muaRaw, setMua] = useURLState("absorptionCoeff", 5); // target μ_a, cm⁻¹
  const [muaBgRaw, setMuaBg] = useURLState("backgroundAbsorption", 0.1); // cm⁻¹
  const [muspRaw, setMusp] = useURLState("reducedScattering", 10); // μ_s′, cm⁻¹
  const [gammaRaw, setGamma] = useURLState("gruneisen", 0.2);
  const [depthRaw, setDepth] = useURLState("targetDepth", 2); // mm
  const [vRaw, setV] = useURLState("soundSpeed", 1540); // m/s
  const [f0Raw, setF0] = useURLState("detectorFreq", 5); // MHz
  const [bwRaw, setBw] = useURLState("bandwidthPct", 100); // % of f₀
  const [naRaw, setNa] = useURLState("acousticNa", 0.5);
  const [alphaRaw, setAlpha] = useURLState("acousticAttenuation", 0.5); // dB cm⁻¹ MHz⁻¹

  const lambdaNm = clamp(lambdaRaw, 400, 1400, 750);
  const pulseNs = clamp(pulseRaw, 1, 1000, 5);
  const fluence = clamp(fluenceRaw, 0, 200, 20);
  const frep = clamp(frepRaw, 0.1, 1e4, 10);
  const mua = clamp(muaRaw, 0, 1000, 5);
  const muaBg = clamp(muaBgRaw, 0, 100, 0.1);
  const musp = clamp(muspRaw, 0, 200, 10);
  const gamma = clamp(gammaRaw, 0, 2, 0.2);
  const depthMm = clamp(depthRaw, 0, 100, 2);
  const v = clamp(vRaw, 1000, 2000, 1540);
  const f0 = clamp(f0Raw, 0.1, 200, 5);
  const bwPct = clamp(bwRaw, 10, 200, 100);
  const na = clamp(naRaw, 0.05, 1, 0.5);
  const alpha = clamp(alphaRaw, 0, 5, 0.5);

  const results = useMemo(() => {
    const F0 = fluence * 10; // mJ/cm² → J/m²
    const muEff = effectiveAttenuation(muaBg * 100, musp * 100); // 1/m
    const Fz = fluenceAtDepth(F0, muEff, depthMm * 1e-3);
    const axial = paAxialResolution(v, (bwPct / 100) * f0 * 1e6);
    const tauS = stressConfinementTime(axial, v);
    const pulseLimit = skinPulseLimit(lambdaNm * 1e-9, pulseNs * 1e-9) / 10; // mJ/cm²
    const irradianceLimit = skinLongExposureIrradianceLimit(lambdaNm * 1e-9) / 10; // mW/cm²
    return {
      muEff: muEff / 100, // cm⁻¹
      penetrationMm: 1e3 / muEff,
      transportMfpMm: transportMeanFreePath(muaBg * 100, musp * 100) * 1e3,
      p0Surface: initialPressure(gamma, mua * 100, F0) / 1e3, // kPa
      fluenceAtTarget: Fz / 10, // mJ/cm²
      p0Target: initialPressure(gamma, mua * 100, Fz) / 1e3,
      lossDb: acousticLossDb(alpha / (1e-2 * 1e6), f0 * 1e6, depthMm * 1e-3),
      axialUm: axial * 1e6,
      lateralUm: paLateralResolution(v, na, f0 * 1e6) * 1e6,
      tauSns: tauS * 1e9,
      pulseLimit,
      pulseRatio: fluence / pulseLimit,
      averageIrradiance: fluence * frep, // mW/cm²
      irradianceLimit,
      averageRatio: (fluence * frep) / irradianceLimit,
    };
  }, [lambdaNm, pulseNs, fluence, frep, mua, muaBg, musp, gamma, depthMm, v, f0, bwPct, na, alpha]);

  const depthPlot = useMemo(() => {
    const maxMm = results.muEff > 0 ? Math.min(100, Math.max(5 * results.penetrationMm, depthMm)) : Math.max(20, depthMm);
    const depths = Array.from({ length: 101 }, (_, i) => (maxMm * i) / 100);
    const p = (z: number) => initialPressure(gamma, mua * 100, fluenceAtDepth(fluence * 10, results.muEff * 100, z * 1e-3)) / 1e3;
    return [
      { x: depths, y: depths.map(p), name: "p₀ = Γ μ_a F(z)", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
      { x: [depthMm], y: [results.p0Target], name: "Target", marker: { color: "#fbbf24", size: 11 }, type: "scatter", mode: "markers" },
    ];
  }, [gamma, mua, fluence, depthMm, results.muEff, results.penetrationMm, results.p0Target]);

  const resPlot = useMemo(() => {
    const freqs = Array.from({ length: 61 }, (_, i) => 10 ** (-1 + (i * 3) / 60)); // 0.1–100 MHz
    return [
      { x: freqs, y: freqs.map((f) => paAxialResolution(v, (bwPct / 100) * f * 1e6) * 1e6), name: "Axial 0.88 v/Δf", line: { color: "#4ade80" }, type: "scatter", mode: "lines" },
      { x: freqs, y: freqs.map((f) => paLateralResolution(v, na, f * 1e6) * 1e6), name: "Lateral 0.71 v/(NA f₀)", line: { color: "#c084fc" }, type: "scatter", mode: "lines" },
      { x: [f0, f0], y: [results.axialUm, results.lateralUm], name: "Current", marker: { color: "#fbbf24", size: 10 }, type: "scatter", mode: "markers" },
    ];
  }, [v, bwPct, na, f0, results.axialUm, results.lateralUm]);

  const flag = (ratio: number) => (ratio > 1 ? "text-red-400" : "text-green-400");

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Laser</h2>
          <ValidatedNumberInput label="Wavelength (nm)" value={lambdaRaw} onChange={setLambda} min={400} max={1400} />
          <ValidatedNumberInput label="Pulse width (ns)" value={pulseRaw} onChange={setPulse} min={1} max={1000} />
          <ValidatedNumberInput label="Fluence on the skin (mJ/cm²)" value={fluenceRaw} onChange={setFluence} min={0} max={200} />
          <ValidatedNumberInput label="Repetition rate (Hz)" value={frepRaw} onChange={setFrep} min={0.1} max={10000} />
          <h2 className="text-lg font-semibold pt-2">Tissue</h2>
          <ValidatedNumberInput label="Target absorption μ_a (cm⁻¹)" value={muaRaw} onChange={setMua} min={0} max={1000} />
          <ValidatedNumberInput label="Background absorption μ_a (cm⁻¹)" value={muaBgRaw} onChange={setMuaBg} min={0} max={100} step="0.01" />
          <ValidatedNumberInput label="Background reduced scattering μ_s′ (cm⁻¹)" value={muspRaw} onChange={setMusp} min={0} max={200} />
          <ValidatedNumberInput label="Grüneisen parameter Γ" value={gammaRaw} onChange={setGamma} min={0} max={2} step="0.01" />
          <ValidatedNumberInput label="Target depth (mm)" value={depthRaw} onChange={setDepth} min={0} max={100} step="0.1" />
          <h2 className="text-lg font-semibold pt-2">Ultrasound detection</h2>
          <ValidatedNumberInput label="Speed of sound (m/s)" value={vRaw} onChange={setV} min={1000} max={2000} />
          <ValidatedNumberInput label="Centre frequency f₀ (MHz)" value={f0Raw} onChange={setF0} min={0.1} max={200} />
          <ValidatedNumberInput label="Bandwidth Δf (% of f₀)" value={bwRaw} onChange={setBw} min={10} max={200} />
          <ValidatedNumberInput label="Acoustic NA" value={naRaw} onChange={setNa} min={0.05} max={1} step="0.01" />
          <ValidatedNumberInput label="Acoustic attenuation (dB cm⁻¹ MHz⁻¹)" value={alphaRaw} onChange={setAlpha} min={0} max={5} step="0.05" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Initial pressure at the surface p₀</span><span className="font-mono text-red-400">{fmt(results.p0Surface, 1, "kPa")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Background μ_eff</span><span className="font-mono text-blue-400">{fmt(results.muEff, 3, "cm⁻¹")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Optical penetration depth 1/μ_eff</span><span className="font-mono">{fmt(results.penetrationMm, 2, "mm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Transport mean free path</span><span className="font-mono">{fmt(results.transportMfpMm, 3, "mm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Fluence at the target</span><span className="font-mono">{fmt(results.fluenceAtTarget, 2, "mJ/cm²")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Initial pressure at the target</span><span className="font-mono text-red-400">{fmt(results.p0Target, 2, "kPa")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Acoustic loss to the surface at f₀</span><span className="font-mono">{fmt(results.lossDb, 2, "dB")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial resolution</span><span className="font-mono text-green-400">{fmt(results.axialUm, 1, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-purple-400">{fmt(results.lateralUm, 1, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Stress confinement time (axial resolution)</span><span className={`font-mono ${pulseNs < results.tauSns ? "text-green-400" : "text-red-400"}`}>{fmt(results.tauSns, 0, "ns")} vs {pulseNs} ns pulse</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Skin limit, one pulse (ICNIRP)</span><span className={`font-mono ${flag(results.pulseRatio)}`}>{fmt(results.pulseLimit, 2, "mJ/cm²")} ({fmt(100 * results.pulseRatio, 0, "%")})</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Average irradiance vs ≥ 10 s limit</span><span className={`font-mono ${flag(results.averageRatio)}`}>{fmt(results.averageIrradiance, 0, "")}/ {fmt(results.irradianceLimit, 0, "mW/cm²")}</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>p₀ = Γ μ_a F, valid when the pulse is shorter than the stress relaxation time d_c/v_s (Xu &amp; Wang, Rev. Sci. Instrum. 77, 041101, 2006). Wang &amp; Hu (2012) give about 800 Pa per mK of heating; over ρC ≈ 4.2 MJ m⁻³ K⁻¹ that is Γ ≈ 0.19.</p>
            <p>F(z) = F₀ exp(−μ_eff z), μ_eff = √(3μ_a(μ_a + μ_s′)) in the background (diffusion theory; the build-up just below the surface is ignored).</p>
            <p>R_A = 0.88 v/Δf and R_L = 0.71 v/(NA f₀) for acoustic-resolution PAM and partial-view tomography; detection is one-way, so there is no pulse-echo factor 2 (Wang &amp; Hu, Science 335, 1458, 2012).</p>
            <p>Skin limits: ICNIRP 2013 Table 7 at the pulse width, and 2.0 C_A kW/m² for 10 s or more, for a beam wider than the 3.5 mm averaging aperture. The repetitive-pulse rules are not applied.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Initial Pressure vs Target Depth</h2>
          <ChartPanel data={depthPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Depth (mm)", gridcolor: "#333" }, yaxis: { title: "p₀ (kPa)", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Resolution vs Centre Frequency</h2>
          <ChartPanel data={resPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Centre frequency (MHz)", type: "log", gridcolor: "#333" }, yaxis: { title: "Resolution (µm)", type: "log", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
      </div>
    </>
  );
}
