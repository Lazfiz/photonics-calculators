"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  apertureGain, kleinDegnanEfficiency, optimumTruncation, toDb, truncatedGaussianWidth,
} from "../../../physics/free-space-comms/link-budget";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (!Number.isFinite(x) ? "—" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(3));

export default function OpticalAntennaPage() {
  const [apertureRaw, setAperture] = useURLState("aperture", 10); // cm
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [obscurationRaw, setObscuration] = useURLState("obscuration", 0.15); // diameter ratio
  const [efficiencyRaw, setEfficiency] = useURLState("efficiency", 0.75); // optics transmission, wavefront error
  const [beamQualityRaw, setBeamQuality] = useURLState("beamQuality", 1.1); // M²
  const [fillRaw, setFill] = useURLState("fill", 1); // α = a/W₀
  const aperture = clamp(apertureRaw, 0.1, 1000, 10);
  const wavelength = clamp(wavelengthRaw, 200, 20000, 1550);
  const obscuration = clamp(obscurationRaw, 0, 0.5, 0.15);
  const efficiency = clamp(efficiencyRaw, 0.01, 1, 0.75);
  const beamQuality = clamp(beamQualityRaw, 1, 2, 1.1);
  const fill = clamp(fillRaw, 0.3, 3, 1);

  // u = k a sin θ at the 1/e² edge of the far-field lobe; the half-angle then scales as λ/D.
  const width = useMemo(() => truncatedGaussianWidth(fill, obscuration), [fill, obscuration]);
  const optimum = useMemo(() => optimumTruncation(obscuration), [obscuration]);

  const calc = useMemo(() => {
    const D = aperture * 1e-2, a = D / 2, lambda = wavelength * 1e-9;
    const directivity = apertureGain(D, lambda);
    const g = kleinDegnanEfficiency(fill, obscuration);
    const w0 = a / fill;
    return {
      directivity: toDb(directivity),
      rxGain: toDb(apertureGain(D, lambda, obscuration, efficiency)),
      // Klein–Degnan on-axis gain; M² > 1 spreads the far field over M⁴ the solid angle (Gaussian-like profile).
      txGain: toDb((directivity * g * efficiency) / beamQuality ** 4),
      g, w0,
      theta: (beamQuality * width * lambda) / (2 * Math.PI * a),
      thetaGauss: (beamQuality * lambda) / (Math.PI * w0),
      zR: (Math.PI * w0 * w0) / (beamQuality * lambda),
    };
  }, [aperture, wavelength, obscuration, efficiency, beamQuality, fill, width]);

  const plotData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const g = kleinDegnanEfficiency(fill, obscuration);
    const apertures = Array.from({ length: 200 }, (_, i) => 1 + i * 0.5);
    return [
      { x: apertures, y: apertures.map((cm) => toDb((apertureGain(cm * 1e-2, lambda) * g * efficiency) / beamQuality ** 4)), type: "scatter", mode: "lines", name: "TX gain (dBi)", line: { color: "#06b6d4" }, yaxis: "y" },
      { x: apertures, y: apertures.map((cm) => toDb(apertureGain(cm * 1e-2, lambda, obscuration, efficiency))), type: "scatter", mode: "lines", name: "RX gain (dBi)", line: { color: "#a78bfa", dash: "dot" }, yaxis: "y" },
      { x: apertures, y: apertures.map((cm) => ((beamQuality * width * lambda) / (Math.PI * cm * 1e-2)) * 1e6), type: "scatter", mode: "lines", name: "Divergence (µrad)", line: { color: "#f59e0b" }, yaxis: "y2" },
    ];
  }, [wavelength, obscuration, efficiency, beamQuality, fill, width]);

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          <ValidatedNumberInput label="Aperture diameter D (cm)" value={aperture} onChange={setAperture} min={0.1} max={1000} />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
          <ValidatedNumberInput label="Central obscuration ratio γ (diameter)" value={obscuration} onChange={setObscuration} min={0} max={0.5} />
          <ValidatedNumberInput label="Optics efficiency η (transmission, wavefront error)" value={efficiency} onChange={setEfficiency} min={0.01} max={1} />
          <ValidatedNumberInput label="Beam quality M² (≤ 2)" value={beamQuality} onChange={setBeamQuality} min={1} max={2} />
          <ValidatedNumberInput label="Fill ratio α = a/W₀ (aperture radius / beam radius)" value={fill} onChange={setFill} min={0.3} max={3} />
          <p className="text-xs text-gray-500">
            The transmit gain peaks at α = {optimum.alpha.toFixed(3)} for γ = {obscuration} (g = {optimum.efficiency.toFixed(4)},{" "}
            {toDb(optimum.efficiency).toFixed(2)} dB).
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultCard label="Transmit gain (on axis)" value={`${calc.txGain.toFixed(2)} dBi`} tone="cyan"
              subtext={`g(α, γ) = ${calc.g.toFixed(4)} (${toDb(calc.g).toFixed(2)} dB)`} />
            <ResultCard label="Receive gain" value={`${calc.rxGain.toFixed(2)} dBi`} tone="purple" subtext="(πD/λ)² (1 − γ²) η" />
            <ResultCard label="Directivity limit (πD/λ)²" value={`${calc.directivity.toFixed(2)} dBi`} tone="gray" subtext="uniform, unobscured" />
            <ResultCard label="Beam waist W₀ = a/α" value={`${fmt(calc.w0 * 1e3)} mm`} tone="blue" />
            <ResultCard label="Far-field half-angle (1/e²)" value={`${fmt(calc.theta * 1e6)} µrad`} tone="orange"
              subtext={`unclipped Gaussian M²λ/(πW₀): ${fmt(calc.thetaGauss * 1e6)} µrad`} />
            <ResultCard label="Rayleigh range πW₀²/(M²λ)" value={`${fmt(calc.zR)} m`} tone="green" />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Aperture (cm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Gain (dBi)", color: "#06b6d4", gridcolor: "#374151" },
              yaxis2: { title: "Divergence (µrad)", color: "#f59e0b", gridcolor: "#374151", overlaying: "y", side: "right" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 30, r: 60, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">G_tx = (πD/λ)² · g(α, γ) · η / M⁴,   g = (2/α²)[e^(−α²) − e^(−γ²α²)]²   (Klein &amp; Degnan 1974)</p>
        <p>
          A Gaussian beam of 1/e² radius W₀ = a/α fills the telescope. Filling it more (small α) spills power past the rim;
          filling it less puts more of it on the secondary mirror and leaves the outer aperture dark, which widens the beam. The best compromise
          without obscuration is α = 1.12, g = 0.8145 (−0.89 dB). As a receiver the same telescope collects a plane wave
          over its clear area, so the obscuration costs only 1 − γ².
        </p>
        <p>
          The far-field half-angle is where the Fraunhofer pattern of the clipped beam falls to 1/e² of its peak. At α = 1
          the clipping makes it 1.44× the untruncated Gaussian λ/(πW₀); the two agree from α ≈ 2. The Rayleigh range is that
          of the Gaussian beam W₀.
        </p>
        <p className="text-gray-500">
          M² &gt; 1 is handled approximately: the divergence scales by M² and the on-axis gain by 1/M⁴, as for a beam that keeps
          a Gaussian-like profile. That holds for nearly single-mode beams, so M² is limited to 2; a strongly multimode beam
          spreads by its coherence, not by the clipping. Spider vanes and wavefront errors go in η.
        </p>
      </div>
    </>
  );
}
