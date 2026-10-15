"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  BACKGROUND_SCENES, type BackgroundScene, backgroundPower, equalNoiseHalfAngle, parseScene,
  receiverNoise, responsivity, sceneRadiance, sceneSolidAngle,
} from "../../../physics/free-space-comms/background-radiance";
import { excessNoiseFactor } from "../../../physics/detectors/apd";

const COLORS = ["#06b6d4", "#3b82f6", "#a78bfa", "#22c55e", "#9ca3af", "#f59e0b"];
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const dB = (x: number) => (x > 0 ? 10 * Math.log10(x) : NaN);
const chartLayout = (xTitle: string, yTitle: string, logX: boolean) => ({
  xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151", ...(logX ? { type: "log" } : {}) },
  yaxis: { title: yTitle, color: "#9ca3af", gridcolor: "#374151" },
  margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
  legend: { x: 0.02, y: 0.02, bgcolor: "rgba(0,0,0,0)" },
});

interface Receiver {
  lambda: number; diameter: number; eta: number; passband: number; qe: number;
  bandwidth: number; ampNoise: number; dark: number; gain: number; k: number;
}

/** Background power at the detector, W, for a FOV half-angle in rad. */
const bgPower = (s: BackgroundScene, halfAngle: number, rx: Receiver) =>
  backgroundPower({
    radiance: sceneRadiance(s, rx.lambda), area: (Math.PI / 4) * rx.diameter ** 2, fovHalfAngle: halfAngle,
    sourceSolidAngle: sceneSolidAngle(s), bandwidth: rx.passband, filterTransmission: 1, opticalEfficiency: rx.eta,
  }).power;

/** Noise terms and SNR for a received power at the aperture (W) and a background power at the detector (W). */
const noiseFor = (signalAtAperture: number, background: number, rx: Receiver) => {
  const R = responsivity(rx.qe, rx.lambda);
  return receiverNoise({
    signalCurrent: R * rx.eta * signalAtAperture, backgroundCurrent: R * background, darkCurrent: rx.dark,
    bandwidth: rx.bandwidth, amplifierNoise: rx.ampNoise, gain: rx.gain, ionisationRatio: rx.k,
  });
};

export default function ReceiverFovPage() {
  const [sceneRaw, setScene] = useURLState("scene", "horizon");
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [diameterRaw, setDiameter] = useURLState("rxAperture", 0.2); // m
  const [fovRaw, setFov] = useURLState("fovHalfAngle", 5); // mrad
  const [etaRaw, setEta] = useURLState("opticalEfficiency", 0.7);
  const [passbandRaw, setPassband] = useURLState("filterBandwidth", 1); // nm
  const [qeRaw, setQe] = useURLState("qe", 0.8);
  const [signalRaw, setSignal] = useURLState("signalDbm", -30); // dBm at the aperture
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1); // GHz
  const [ampRaw, setAmp] = useURLState("ampNoise", 10); // pA/√Hz
  const [darkRaw, setDark] = useURLState("dark", 1); // nA
  const [gainRaw, setGain] = useURLState("gain", 10);
  const [kRaw, setK] = useURLState("k", 0.4);

  const scene = parseScene(sceneRaw);
  const fov = clamp(fovRaw, 1e-3, 1000, 5);
  const signalDbm = clamp(signalRaw, -120, 30, -30);
  const rx: Receiver = useMemo(() => ({
    lambda: clamp(wavelengthRaw, 850, 1550, 1550) * 1e-9,
    diameter: clamp(diameterRaw, 1e-3, 10, 0.2),
    eta: clamp(etaRaw, 0, 1, 0.7),
    passband: clamp(passbandRaw, 1e-3, 100, 1) * 1e-9,
    qe: clamp(qeRaw, 0, 1, 0.8),
    bandwidth: clamp(bandwidthRaw, 1e-6, 1e3, 1) * 1e9,
    ampNoise: clamp(ampRaw, 0, 1e4, 10) * 1e-12,
    dark: clamp(darkRaw, 0, 1e6, 1) * 1e-9,
    gain: clamp(gainRaw, 1, 1000, 10),
    k: clamp(kRaw, 0, 1, 0.4),
  }), [wavelengthRaw, diameterRaw, etaRaw, passbandRaw, qeRaw, bandwidthRaw, ampRaw, darkRaw, gainRaw, kRaw]);

  const results = useMemo(() => {
    const Pb = bgPower(scene, fov * 1e-3, rx);
    const Ps = 10 ** (signalDbm / 10) * 1e-3;
    const noise = noiseFor(Ps, Pb, rx);
    const total = noise.signalShot + noise.backgroundShot + noise.darkShot + noise.amplifier;
    const fovEqual = equalNoiseHalfAngle({
      radiance: sceneRadiance(scene, rx.lambda), area: (Math.PI / 4) * rx.diameter ** 2, sourceSolidAngle: sceneSolidAngle(scene),
      bandwidth: rx.passband, filterTransmission: 1, opticalEfficiency: rx.eta, responsivity: responsivity(rx.qe, rx.lambda),
      amplifierNoise: rx.ampNoise, gain: rx.gain, ionisationRatio: rx.k,
    });
    return {
      Pb, Ps, noise, bgShare: noise.backgroundShot / total, ampShare: noise.amplifier / total, fovEqual,
      diffraction: (1.22 * rx.lambda) / rx.diameter, F: excessNoiseFactor(rx.gain, rx.k),
    };
  }, [scene, fov, signalDbm, rx]);

  const fovData = useMemo(() => {
    const Ps = 10 ** (signalDbm / 10) * 1e-3;
    const fovs = Array.from({ length: 121 }, (_, i) => 10 ** (-2 + (4 * i) / 120)); // 0.01–100 mrad
    return BACKGROUND_SCENES.map((s, i) => ({
      type: "scatter", mode: "lines", x: fovs, y: fovs.map((f) => dB(noiseFor(Ps, bgPower(s.id, f * 1e-3, rx), rx).snr)),
      name: s.label, line: { color: COLORS[i], width: s.id === scene ? 3 : 1.5 },
    }));
  }, [scene, signalDbm, rx]);

  const signalData = useMemo(() => {
    const Pb = bgPower(scene, fov * 1e-3, rx);
    const dbms = Array.from({ length: 81 }, (_, i) => -70 + i);
    const snr = (bg: number) => dbms.map((d) => dB(noiseFor(10 ** (d / 10) * 1e-3, bg, rx).snr));
    return [
      { type: "scatter", mode: "lines", x: dbms, y: snr(Pb), name: "with background", line: { color: "#f59e0b", width: 2 } },
      { type: "scatter", mode: "lines", x: dbms, y: snr(0), name: "no background", line: { color: "#3b82f6", dash: "dash" } },
    ];
  }, [scene, fov, rx]);

  const underfilled = fov * 1e-3 < results.diffraction;

  return (
    <>
      <div className="mb-6 max-w-sm">
        <label className="block text-sm text-gray-400 mb-1" htmlFor="scene">Background in the field of view</label>
        <select id="scene" value={scene} onChange={(e) => setScene(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
          {BACKGROUND_SCENES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm, 850–1550)" value={wavelengthRaw} onChange={setWavelength} min={850} max={1550} step="any" />
        <ValidatedNumberInput label="Aperture Diameter (m)" value={diameterRaw} onChange={setDiameter} min={0.001} max={10} step="any" />
        <ValidatedNumberInput label="FOV Half-Angle (mrad)" value={fov} onChange={setFov} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Optics + Filter Efficiency η_opt" value={etaRaw} onChange={setEta} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Filter Passband (nm)" value={passbandRaw} onChange={setPassband} min={0.001} max={100} step="any" />
        <ValidatedNumberInput label="Detector Quantum Efficiency" value={qeRaw} onChange={setQe} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Signal at Aperture (dBm)" value={signalDbm} onChange={setSignal} min={-120} max={30} step="any" />
        <ValidatedNumberInput label="Electrical Bandwidth (GHz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-6} max={1000} step="any" />
        <ValidatedNumberInput label="Amplifier Noise (pA/√Hz)" value={ampRaw} onChange={setAmp} min={0} max={10000} step="any" />
        <ValidatedNumberInput label="Dark Current (nA, multiplied)" value={darkRaw} onChange={setDark} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="APD Gain M (1 = PIN)" value={gainRaw} onChange={setGain} min={1} max={1000} step="any" />
        <ValidatedNumberInput label="Ionisation Ratio k" value={kRaw} onChange={setK} min={0} max={1} step="any" />
      </div>

      {underfilled && (
        <div role="alert" className="mb-6 rounded-lg border border-yellow-600 bg-yellow-900/30 p-4 text-sm text-yellow-200">
          The FOV half-angle is below the diffraction spot&apos;s first zero 1.22λ/D = {fmt(results.diffraction * 1e3)} mrad,
          so the field stop clips the signal. That loss is not modelled here.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Electrical SNR" value={`${fmt(dB(results.noise.snr))} dB`} tone="green" subtext="(M I_s)² / σ²" />
        <ResultCard label="Background power at the detector" value={`${fmt(10 * Math.log10(results.Pb * 1e3))} dBm`} tone="orange" subtext={`${fmt(results.Pb)} W`} />
        <ResultCard label="Signal power at the detector" value={`${fmt(10 * Math.log10(results.Ps * rx.eta * 1e3))} dBm`} tone="blue" subtext="η_opt × signal at the aperture" />
        <ResultCard label="Noise variance from background" value={`${fmt(results.bgShare * 100)} %`} tone="purple"
          subtext={`amplifier ${fmt(results.ampShare * 100)} %, excess noise F = ${fmt(results.F)}`} />
        <ResultCard label="FOV where background = amplifier noise" value={`${fmt(results.fovEqual * 1e3)} mrad`} tone="cyan"
          subtext={Number.isFinite(results.fovEqual) ? "half-angle; wider, background noise exceeds amplifier noise" : "never: this background is too faint"} />
        <ResultCard label="Diffraction half-angle 1.22λ/D" value={`${fmt(results.diffraction * 1e3)} mrad`} tone="gray" subtext="smallest FOV that passes the Airy core" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">SNR vs FOV half-angle</h2>
          <ChartPanel data={fovData} layout={chartLayout("FOV half-angle (mrad)", "SNR (dB)", true)} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">SNR vs signal power</h2>
          <ChartPanel data={signalData} layout={chartLayout("Signal at aperture (dBm)", "SNR (dB)", false)} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">P_bg = L_λ · (πD²/4) · π sin²θ · Δλ · η_opt,   SNR = (M R η_opt P_s)² / [2qM²F (I_s + I_bg + I_d) B + i_n² B]</p>
        <p>
          R = QE·qλ/(hc), F = kM + (1 − k)(2 − 1/M) (McIntyre 1966). The signal is assumed to pass the field stop
          entirely; background radiances are typical clear-sky and cloud values (Giggenbach 2022) or a 5772 K solar
          disc above the atmosphere. Spot growth from turbulence (λ/r₀ ≫ λ/D) is not modelled. A wider FOV eases pointing and turbulence-induced spot motion, but once the
          background shot noise passes the amplifier noise every doubling of the half-angle quadruples it.
        </p>
      </div>
    </>
  );
}
