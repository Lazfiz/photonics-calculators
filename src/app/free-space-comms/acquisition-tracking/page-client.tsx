"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quadCellNea, rasterScan, squareCoverage, stareProbability } from "../../../physics/free-space-comms/acquisition";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const DEG = Math.PI / 180;

export default function AcquisitionTrackingPage() {
  const [fovRaw, setFov] = useURLState("fov", 1); // mrad, full angle
  const [uncertaintyRaw, setUncertainty] = useURLState("uncertainty", 5); // mrad, 3σ radius
  const [scanRateRaw, setScanRate] = useURLState("scanRate", 10); // °/s
  const [beaconRaw, setBeacon] = useURLState("beaconPower", -30); // dBm at the receiver
  const [sensitivityRaw, setSensitivity] = useURLState("rxSensitivity", -40); // dBm
  const [noiseRaw, setNoise] = useURLState("detectorNoise", 100); // nW, NEP·√B
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [apertureRaw, setAperture] = useURLState("aperture", 10); // cm

  const fov = clamp(fovRaw, 1e-3, 100, 1) * 1e-3;
  const U = clamp(uncertaintyRaw, 1e-3, 100, 5) * 1e-3;
  const scanRate = clamp(scanRateRaw, 1e-3, 1000, 10) * DEG;
  const beacon_dBm = clamp(beaconRaw, -150, 50, -30);
  const sensitivity_dBm = clamp(sensitivityRaw, -150, 50, -40);
  const noise = clamp(noiseRaw, 1e-6, 1e9, 100) * 1e-9;
  const lambda = clamp(wavelengthRaw, 100, 20000, 1550) * 1e-9;
  const D = clamp(apertureRaw, 0.01, 1000, 10) * 1e-2;

  const r = useMemo(() => {
    const sigma = U / 3;
    const scan = rasterScan(U, fov, scanRate);
    const snr = (1e-3 * 10 ** (beacon_dBm / 10)) / noise;
    return {
      stare: stareProbability(fov, sigma),
      coverage: squareCoverage(U, sigma),
      scan,
      snr,
      margin: beacon_dBm - sensitivity_dBm,
      nea: quadCellNea(lambda, D, snr),
      diffraction: lambda / D,
    };
  }, [U, fov, scanRate, beacon_dBm, sensitivity_dBm, noise, lambda, D]);

  const plotData = useMemo(() => {
    const sigma = U / 3;
    const fovs = Array.from({ length: 200 }, (_, i) => (2 * U * 1e3 * (i + 1)) / 200); // mrad, up to the full 2U
    return [
      { x: fovs, y: fovs.map((f) => stareProbability(f * 1e-3, sigma) * 100), type: "scatter", mode: "lines", name: "Stare probability (%)", line: { color: "#06b6d4" } },
      { x: fovs, y: fovs.map((f) => rasterScan(U, f * 1e-3, scanRate).time), type: "scatter", mode: "lines", name: "Raster scan time (s)", line: { color: "#f59e0b" }, yaxis: "y2" },
    ];
  }, [U, scanRate]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Receiver FOV, full angle (mrad)" value={fovRaw} onChange={setFov} min={0.001} max={100} step="any" />
        <ValidatedNumberInput label="Pointing Uncertainty, 3σ radius (mrad)" value={uncertaintyRaw} onChange={setUncertainty} min={0.001} max={100} step="any" />
        <ValidatedNumberInput label="Scan Rate (°/s)" value={scanRateRaw} onChange={setScanRate} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={20000} step="any" />
        <ValidatedNumberInput label="Tracking Aperture Diameter (cm)" value={apertureRaw} onChange={setAperture} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Beacon Power at Receiver (dBm)" value={beaconRaw} onChange={setBeacon} min={-150} max={50} step="any" />
        <ValidatedNumberInput label="Receiver Sensitivity (dBm)" value={sensitivityRaw} onChange={setSensitivity} min={-150} max={50} step="any" />
        <ValidatedNumberInput label="Tracking Noise NEP·√B (nW)" value={noiseRaw} onChange={setNoise} min={0.000001} max={1e9} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Stare acquisition probability" value={`${fmt(r.stare * 100)} %`} tone={r.stare > 0.9 ? "green" : "yellow"}
          subtext="target inside the FOV without scanning" />
        <ResultCard label="Raster scan" value={`${Number.isFinite(r.scan.lines) ? r.scan.lines : "—"} lines, ${fmt(r.scan.time)} s`} tone="orange"
          subtext={`the 2U square holds ${fmt(r.coverage * 100, 4)} % of targets`} />
        <ResultCard label="Beacon margin" value={`${fmt(r.margin)} dB`} tone={r.margin > 0 ? "green" : "red"} subtext={r.margin > 0 ? "above sensitivity" : "below sensitivity"} />
        <ResultCard label="Tracking SNR (voltage)" value={`${fmt(r.snr)} (${fmt(20 * Math.log10(r.snr))} dB)`} tone="blue" subtext="P_beacon / (NEP·√B)" />
        <ResultCard label="Quadrant-detector NEA (rms per axis)" value={`${fmt(r.nea * 1e6)} µrad`} tone="cyan" subtext="(3π/16)(λ/D)/SNR, point source" />
        <ResultCard label="Diffraction angle λ/D" value={`${fmt(r.diffraction * 1e6)} µrad`} tone="gray" subtext="spot size on the quadrant cell" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Stare probability and raster scan time vs FOV</h2>
        <ChartPanel data={plotData} layout={{
          xaxis: { title: "FOV, full angle (mrad)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Stare probability (%)", color: "#06b6d4", gridcolor: "#374151", range: [0, 105] },
          yaxis2: { title: "Scan time (s)", color: "#f59e0b", gridcolor: "#374151", overlaying: "y", side: "right" },
          margin: { l: 60, r: 60, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
          legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-sm text-gray-400 space-y-2">
        <p>
          Stare: with a circular Gaussian pointing error (σ = U/3 per axis), the target falls inside a FOV of full angle Θ
          with probability 1 − exp(−(Θ/2)²/2σ²). Raster: lines spaced by Θ sweep a square of side 2U, so
          N = ⌈2U/Θ⌉ lines take N·2U/ω, with no turnaround, overlap or dwell time.
        </p>
        <p>
          Tracking: a quadrant detector locates a diffraction-limited spot to (3π/16)(λ/D)/SNR rms, SNR being the voltage
          SNR of the four quadrants summed (Tyler and Fried, 1982). These are first estimates for sizing a terminal, not a
          simulation of an acquisition sequence.
        </p>
      </div>
    </>
  );
}
