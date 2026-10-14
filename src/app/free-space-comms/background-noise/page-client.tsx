"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  BACKGROUND_SCENES, type BackgroundScene, backgroundPower, parseScene, photonEnergy, sceneRadiance, sceneSolidAngle,
} from "../../../physics/free-space-comms/background-radiance";

const COLORS = ["#06b6d4", "#3b82f6", "#a78bfa", "#22c55e", "#9ca3af", "#f59e0b"];
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const dBm = (w: number) => (w > 0 ? 10 * Math.log10(w * 1e3) : NaN);
const chartLayout = (xTitle: string, yTitle: string, logX: boolean, logY: boolean) => ({
  xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151", ...(logX ? { type: "log" } : {}) },
  yaxis: { title: yTitle, color: "#9ca3af", gridcolor: "#374151", ...(logY ? { type: "log" } : {}) },
  margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
  legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
});

interface Receiver { area: number; passband: number; filterT: number; optics: number }

/** Background power for a full FOV in mrad, wavelength in m, area in cm² and passband in nm. */
const collected = (s: BackgroundScene, fovMrad: number, lambda: number, rx: Receiver) =>
  backgroundPower({
    radiance: sceneRadiance(s, lambda), area: rx.area * 1e-4, fovHalfAngle: (fovMrad * 1e-3) / 2,
    sourceSolidAngle: sceneSolidAngle(s), bandwidth: rx.passband * 1e-9, filterTransmission: rx.filterT, opticalEfficiency: rx.optics,
  });

export default function BackgroundNoisePage() {
  const [sceneRaw, setScene] = useURLState("scene", "horizon");
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [fovRaw, setFov] = useURLState("rxFOV", 1); // full FOV, mrad
  const [passbandRaw, setPassband] = useURLState("rxBandwidth", 1); // filter passband, nm
  const [areaRaw, setArea] = useURLState("rxArea", 78.5); // cm²
  const [filterTRaw, setFilterT] = useURLState("filterT", 0.9);
  const [opticsRaw, setOptics] = useURLState("opticsEff", 0.8);
  const [qeRaw, setQe] = useURLState("qe", 0.8);
  const [bitRateRaw, setBitRate] = useURLState("bitRate", 1); // Gb/s

  const scene = parseScene(sceneRaw);
  const wavelength = clamp(wavelengthRaw, 850, 1550, 1550);
  const fov = clamp(fovRaw, 1e-3, 1000, 1);
  const passband = clamp(passbandRaw, 1e-3, 100, 1);
  const area = clamp(areaRaw, 1e-3, 1e5, 78.5);
  const filterT = clamp(filterTRaw, 0, 1, 0.9);
  const optics = clamp(opticsRaw, 0, 1, 0.8);
  const qe = clamp(qeRaw, 0, 1, 0.8);
  const bitRate = clamp(bitRateRaw, 1e-6, 1e3, 1);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const { power: P, solidAngle } = collected(scene, fov, lambda, { area, passband, filterT, optics });
    const photonRate = P / photonEnergy(lambda);
    const electronRate = qe * photonRate;
    return {
      radiance: sceneRadiance(scene, lambda) * 1e-9, // W m⁻² sr⁻¹ nm⁻¹
      solidAngle, capped: solidAngle < Infinity && solidAngle === sceneSolidAngle(scene), P, photonRate, electronRate,
      perBit: electronRate / (bitRate * 1e9),
    };
  }, [scene, wavelength, fov, passband, area, filterT, optics, qe, bitRate]);

  const fovData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const rx = { area, passband, filterT, optics };
    const fovs = Array.from({ length: 121 }, (_, i) => 10 ** (-2 + (5 * i) / 120)); // 0.01–1000 mrad
    return BACKGROUND_SCENES.map((s, i) => ({
      type: "scatter", mode: "lines", x: fovs, y: fovs.map((f) => dBm(collected(s.id, f, lambda, rx).power)), name: s.label,
      line: { color: COLORS[i], width: s.id === scene ? 3 : 1.5 },
    }));
  }, [scene, wavelength, passband, area, filterT, optics]);

  const spectrumData = useMemo(() => {
    const nms = Array.from({ length: 71 }, (_, i) => 850 + 10 * i);
    return BACKGROUND_SCENES.map((s, i) => ({
      type: "scatter", mode: "lines", x: nms, y: nms.map((nm) => sceneRadiance(s.id, nm * 1e-9) * 1e-9), name: s.label,
      line: { color: COLORS[i], width: s.id === scene ? 3 : 1.5 },
    }));
  }, [scene]);

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
        <ValidatedNumberInput label="Wavelength (nm, 850–1550)" value={wavelength} onChange={setWavelength} min={850} max={1550} step="any" />
        <ValidatedNumberInput label="Full FOV (mrad)" value={fov} onChange={setFov} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Filter Passband Δλ (nm)" value={passband} onChange={setPassband} min={0.001} max={100} step="any" />
        <ValidatedNumberInput label="Aperture Area (cm²)" value={area} onChange={setArea} min={0.001} max={100000} step="any" />
        <ValidatedNumberInput label="Filter In-Band Transmission" value={filterT} onChange={setFilterT} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Other Optics Efficiency η_opt" value={optics} onChange={setOptics} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Detector Quantum Efficiency" value={qe} onChange={setQe} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Bit Rate (Gb/s)" value={bitRate} onChange={setBitRate} min={1e-6} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Spectral radiance L_λ" value={`${fmt(calc.radiance)} W m⁻² sr⁻¹ nm⁻¹`} tone="gray"
          subtext={scene === "sun" ? "5772 K blackbody, above the atmosphere" : "Giggenbach (2022), Table 1"} />
        <ResultCard label="Solid angle used Ω" value={`${fmt(calc.solidAngle)} sr`} tone="gray"
          subtext={calc.capped ? "the Sun's disc, smaller than the FOV" : "π sin²(FOV/2)"} />
        <ResultCard label="Background power at the detector" value={`${fmt(dBm(calc.P))} dBm`} tone="orange" subtext={`${fmt(calc.P)} W`} />
        <ResultCard label="Photon rate at the detector" value={`${fmt(calc.photonRate)} s⁻¹`} tone="blue" />
        <ResultCard label="Photoelectron rate" value={`${fmt(calc.electronRate)} s⁻¹`} tone="cyan" />
        <ResultCard label="Background photoelectrons per bit" value={fmt(calc.perBit)} tone="purple" subtext="photoelectron rate / bit rate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Background power vs full FOV</h2>
          <ChartPanel data={fovData} layout={chartLayout("Full FOV (mrad)", "Background power (dBm)", true, false)} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Spectral radiance vs wavelength</h2>
          <ChartPanel data={spectrumData} layout={chartLayout("Wavelength (nm)", "L_λ (W m⁻² sr⁻¹ nm⁻¹)", false, true)} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">P_bg = L_λ · A · Ω · Δλ · T_f · η_opt,   Ω = π sin²(FOV/2)</p>
        <p>
          The filter passband Δλ sets the collected band and T_f is its in-band transmission; out-of-band light is
          assumed fully blocked. Sky and cloud radiances are typical values with the Sun high in the sky (Giggenbach,
          <em> Sensors</em> 22, 6773, 2022, Table 1, at 850, 1064 and 1550 nm, interpolated log-log). Real skies vary
          by about ×10 with haze, sun angle and pointing, and between the table wavelengths the interpolation ignores the
          1.13 and 1.38 µm water-vapour bands, where the sky is much darker. The Sun is a 5772 K blackbody disc of
          6.79×10⁻⁵ sr above the atmosphere (the real disc is within about ±20 %; the atmosphere lowers it at the
          ground); it fills only its own disc once the FOV is wider. A clear night sky is several orders of magnitude
          darker.
        </p>
      </div>
    </>
  );
}
