"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  detectedPhotoelectrons, excitationBandwidth, ramanShiftFrequency, srsFocusFactor, srsModulationDepth, srsShotNoiseSnr, stokesWavelength,
} from "../../../physics/imaging/coherent-raman";
import { gaussianPulsePeakPower, mixedFocusFwhm } from "../../../physics/imaging/multiphoton-focus";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");

const FRAME_PIXELS = 512;

export default function StimulatedRamanMicroscopyPage() {
  const [pumpRaw, setPump] = useURLState("pumpWavelength", 800); // nm
  const [shiftRaw, setShift] = useURLState("ramanShift", 2850); // cm⁻¹ (CH₂ stretch)
  const [naRaw, setNa] = useURLState("na", 1.0);
  const [nRaw, setN] = useURLState("n", 1.33);
  const [pumpPowerRaw, setPumpPower] = useURLState("pumpPower", 100); // mW at the sample
  const [stokesPowerRaw, setStokesPower] = useURLState("stokesPower", 80); // mW at the sample
  const [detectedBeam, setDetectedBeam] = useURLState("detectedBeam", "stokes"); // stokes = SRG, pump = SRL
  const [deltaSource, setDeltaSource] = useURLState("deltaSource", "measured"); // measured | gain
  const [deltaRaw, setDelta] = useURLState("modulationDepth", 10); // ppm
  const [gainRaw, setGain] = useURLState("ramanGain", 1); // cm/GW
  const [pulseRaw, setPulse] = useURLState("pulseWidth", 6); // ps FWHM
  const [repRaw, setRep] = useURLState("repRate", 80); // MHz
  const [etaRaw, setEta] = useURLState("quantumEfficiency", 0.8);
  const [dwellRaw, setDwell] = useURLState("pixelDwell", 1); // µs

  const pumpNm = clamp(pumpRaw, 600, 1100, 800);
  const shift = clamp(shiftRaw, 200, 4000, 2850);
  const na = clamp(naRaw, 0.1, 1.5, 1.0);
  const n = clamp(nRaw, 1, 1.6, 1.33);
  const pumpMw = clamp(pumpPowerRaw, 1, 500, 100);
  const stokesMw = clamp(stokesPowerRaw, 1, 500, 80);
  const srl = detectedBeam === "pump";
  const fromGain = deltaSource === "gain";
  const measuredPpm = clamp(deltaRaw, 0.001, 1000, 10);
  const gainCmPerGW = clamp(gainRaw, 0, 100, 1);
  const pulsePs = clamp(pulseRaw, 0.1, 100, 6);
  const repMHz = clamp(repRaw, 1, 1000, 80);
  const eta = clamp(etaRaw, 0.01, 1, 0.8);
  const dwellUs = clamp(dwellRaw, 0.1, 100, 1);

  // δ on the detected beam, ppm: the input, or g_R·F·P̂/√2 of the modulated beam (pulses identical and overlapped).
  const deltaFor = (pumpDetected: boolean) => {
    if (!fromGain) return measuredPpm;
    if (!(na < n)) return NaN; // no such focus, so no F
    const lambdaP = pumpNm * 1e-9;
    const peak = gaussianPulsePeakPower((pumpDetected ? stokesMw : pumpMw) * 1e-3, repMHz * 1e6, pulsePs * 1e-12);
    const delta = srsModulationDepth(gainCmPerGW * 1e-11, peak, lambdaP, stokesWavelength(lambdaP, shift * 100), n, pumpDetected ? "pump" : "stokes", "gaussian");
    return delta * 1e6;
  };
  const srgPpm = deltaFor(false);
  const srlPpm = deltaFor(true);
  const deltaPpm = srl ? srlPpm : srgPpm;
  const deltaDepleted = fromGain && na < n && !Number.isFinite(deltaPpm); // δ ≥ 1: the small-signal model fails
  const deltaLarge = fromGain && deltaPpm > 1e5; // δ > 10 %
  const bandwidthCm = excitationBandwidth(pulsePs * 1e-12) / 100; // cm⁻¹
  const bandwidthWide = fromGain && bandwidthCm > 10;
  const focusOk = na < n;

  const results = useMemo(() => {
    const lambdaP = pumpNm * 1e-9;
    const lambdaS = stokesWavelength(lambdaP, shift * 100);
    const lambdaDet = srl ? lambdaP : lambdaS;
    const powerDet = (srl ? pumpMw : stokesMw) * 1e-3;
    const tau = dwellUs * 1e-6;
    const N = detectedPhotoelectrons(powerDet, lambdaDet, tau, eta);
    const fwhm = mixedFocusFwhm([{ lambda: lambdaP, order: 1 }, { lambda: lambdaS, order: 1 }], n, na);
    return {
      stokesNm: lambdaS * 1e9,
      beatTHz: ramanShiftFrequency(shift * 100) / 1e12,
      photoelectrons: N,
      snr: Number.isFinite(deltaPpm) ? srsShotNoiseSnr(deltaPpm * 1e-6, powerDet, lambdaDet, tau, eta) : NaN,
      minDeltaPpm: 1e6 / Math.sqrt(N),
      lateralNm: focusOk ? fwhm.lateral * 1e9 : NaN,
      axialUm: focusOk ? fwhm.axial * 1e6 : NaN,
      frameS: FRAME_PIXELS * FRAME_PIXELS * tau,
      focusFactor: focusOk ? srsFocusFactor(lambdaP, lambdaS, n) : NaN,
    };
  }, [pumpNm, shift, na, n, focusOk, pumpMw, stokesMw, srl, deltaPpm, eta, dwellUs]);

  const snrPlot = useMemo(() => {
    const lambdaP = pumpNm * 1e-9;
    const lambdaS = stokesWavelength(lambdaP, shift * 100);
    const dwells = Array.from({ length: 61 }, (_, i) => 10 ** (-1 + i / 20)); // 0.1–100 µs
    const snr = (P: number, lambda: number, ppm: number) => dwells.map((t) => srsShotNoiseSnr(ppm * 1e-6, P * 1e-3, lambda, t * 1e-6, eta));
    return [
      { x: dwells, y: snr(stokesMw, lambdaS, srgPpm), name: `SRG (Stokes detected)${!fromGain && srl ? " (same δ assumed)" : ""}`, line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: dwells, y: snr(pumpMw, lambdaP, srlPpm), name: `SRL (pump detected)${!fromGain && !srl ? " (same δ assumed)" : ""}`, line: { color: "#f87171" }, type: "scatter", mode: "lines" },
      { x: [dwellUs], y: [results.snr], name: "Current", marker: { color: "#fbbf24", size: 11 }, type: "scatter", mode: "markers" },
    ];
  }, [pumpNm, shift, stokesMw, pumpMw, srgPpm, srlPpm, eta, dwellUs, fromGain, srl, results.snr]);

  const limitPlot = useMemo(() => {
    const lambdaDet = srl ? pumpNm * 1e-9 : stokesWavelength(pumpNm * 1e-9, shift * 100);
    const powers = Array.from({ length: 61 }, (_, i) => 10 ** ((2.7 * i) / 60)); // 1–500 mW
    const minDelta = (P: number) => 1e6 / Math.sqrt(detectedPhotoelectrons(P * 1e-3, lambdaDet, dwellUs * 1e-6, eta));
    return [
      { x: powers, y: powers.map(minDelta), name: "Shot-noise limit (SNR = 1)", line: { color: "#34d399" }, type: "scatter", mode: "lines" },
      { x: [srl ? pumpMw : stokesMw], y: [results.minDeltaPpm], name: "Current", marker: { color: "#fbbf24", size: 11 }, type: "scatter", mode: "markers" },
    ];
  }, [srl, pumpNm, shift, dwellUs, eta, pumpMw, stokesMw, results.minDeltaPpm]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Pump wavelength (nm)" value={pumpRaw} onChange={setPump} min={600} max={1100} />
          <ValidatedNumberInput label="Raman shift (cm⁻¹)" value={shiftRaw} onChange={setShift} min={200} max={4000} />
          <ValidatedNumberInput label="Numerical aperture" value={naRaw} onChange={setNa} min={0.1} max={1.5} step="0.01" />
          <ValidatedNumberInput label="Immersion / sample index n" value={nRaw} onChange={setN} min={1} max={1.6} step="0.01" />
          <ValidatedNumberInput label="Pump power at the sample (mW)" value={pumpPowerRaw} onChange={setPumpPower} min={1} max={500} />
          <ValidatedNumberInput label="Stokes power at the sample (mW)" value={stokesPowerRaw} onChange={setStokesPower} min={1} max={500} />
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="srs-detected">Detected beam</label>
            <select id="srs-detected" value={srl ? "pump" : "stokes"} onChange={(e) => setDetectedBeam(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="stokes">Stokes: stimulated Raman gain (SRG), pump modulated</option>
              <option value="pump">Pump: stimulated Raman loss (SRL), Stokes modulated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="srs-delta-source">Modulation depth δ = ΔP/P</label>
            <select id="srs-delta-source" value={fromGain ? "gain" : "measured"} onChange={(e) => setDeltaSource(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="measured">Enter a measured or published δ</option>
              <option value="gain">Estimate from the Raman gain g_R of the sample</option>
            </select>
          </div>
          {fromGain ? (
            <>
              <ValidatedNumberInput label="Raman gain coefficient g_R (cm/GW)" value={gainRaw} onChange={setGain} min={0} max={100} step="any" />
              <ValidatedNumberInput label="Pulse width, both beams (ps FWHM)" value={pulseRaw} onChange={setPulse} min={0.1} max={100} step="0.1" />
              <ValidatedNumberInput label="Repetition rate (MHz)" value={repRaw} onChange={setRep} min={1} max={1000} />
            </>
          ) : (
            <ValidatedNumberInput label="SRS modulation depth ΔP/P (ppm)" value={deltaRaw} onChange={setDelta} min={0.001} max={1000} />
          )}
          <ValidatedNumberInput label="Detector quantum efficiency η" value={etaRaw} onChange={setEta} min={0.01} max={1} step="0.01" />
          <ValidatedNumberInput label="Pixel dwell = integration time (µs)" value={dwellRaw} onChange={setDwell} min={0.1} max={100} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {!focusOk && (
            <p className="text-sm text-yellow-300" role="status">The NA must be below the index n for the focus size (lateral and axial FWHM, F).</p>
          )}
          {deltaDepleted && (
            <p className="text-sm text-yellow-300" role="status">δ ≥ 1: the beams deplete and the small-signal estimate fails.</p>
          )}
          {deltaLarge && (
            <p className="text-sm text-yellow-300" role="status">δ above 10 %: depletion is no longer negligible.</p>
          )}
          {bandwidthWide && (
            <p className="text-sm text-yellow-300" role="status">The pulse bandwidth {bandwidthCm.toFixed(1)} cm⁻¹ is wider than a typical condensed-phase Raman line (≈ 10 cm⁻¹): steady-state g_R overestimates δ.</p>
          )}
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Stokes wavelength</span><span className="font-mono text-blue-400">{fmt(results.stokesNm, 1, "nm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Beat frequency</span><span className="font-mono">{fmt(results.beatTHz, 2, "THz")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Photoelectrons per pixel ({srl ? "pump" : "Stokes"})</span><span className="font-mono">{Number.isFinite(results.photoelectrons) ? results.photoelectrons.toExponential(3) : "—"}</span></div>
          {fromGain && (
            <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Estimated δ ({srl ? "SRL" : "SRG"}), F = {fmt(results.focusFactor * 1e-6, 2, "µm⁻¹")}</span><span className="font-mono text-purple-400">{fmt(deltaPpm, 2, "ppm")}</span></div>
          )}
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Shot-noise-limited SNR</span><span className="font-mono text-orange-400">{fmt(results.snr, 3, "")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Smallest detectable ΔP/P (SNR = 1)</span><span className="font-mono text-green-400">{fmt(results.minDeltaPpm, 3, "ppm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral FWHM of I_p·I_S</span><span className="font-mono text-cyan-400">{fmt(results.lateralNm, 0, "nm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial FWHM of I_p·I_S</span><span className="font-mono text-cyan-400">{fmt(results.axialUm, 2, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Frame time ({FRAME_PIXELS}×{FRAME_PIXELS})</span><span className="font-mono text-yellow-400">{fmt(results.frameS, 3, "s")}</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>ν̃_S = ν̃_p − Ω̃; SRS ∝ Im χ⁽³⁾ · I_p · I_S, with no non-resonant background.</p>
            <p>SRG: the Stokes beam gains (pump modulated, Stokes detected). SRL: the pump loses (Stokes modulated, pump detected).</p>
            <p>SNR = δ·√N, N = ηPτλ/(hc), shot noise of the detected beam only (Ozeki et al., Opt. Express 17, 3651, 2009). Laser excess noise, detector noise and lock-in demodulation losses make real systems worse.</p>
            <p>The modulation depth δ depends on the Raman cross-section, the concentration and both intensities: enter a measured or published value, or estimate it from g_R.</p>
            <p>Estimate: SRG δ = g_R·F·P̂_p/√2, SRL δ = (λ_S/λ_p)·g_R·F·P̂_S/√2 with F = √2πn/√(λ_p² + λ_S²) for paraxial Gaussian beams of the same far-field angle, a sample thicker than the focus (a liquid) and identical, overlapped Gaussian pulses of peak power P̂. g_R is the plane-wave Stokes gain dI_S/dz = g_R·I_p·I_S (Boyd, Nonlinear Optics, ch. 10); a dilute species scales it by its concentration. Steady-state gain (pulses longer than the Raman dephasing time) and δ ≪ 1.</p>
            <p>Focus: Gaussian fit to each beam (Zipfel et al. 2003), signal FWHM of the product I_p·I_S.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Shot-noise SNR vs Pixel Dwell</h2>
          <ChartPanel data={snrPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Pixel dwell (µs)", type: "log", gridcolor: "#333" }, yaxis: { title: "SNR", type: "log", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Detection Limit vs Detected Power</h2>
          <ChartPanel data={limitPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Detected beam power (mW)", type: "log", gridcolor: "#333" }, yaxis: { title: "Smallest ΔP/P (ppm)", type: "log", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
      </div>
    </>
  );
}
