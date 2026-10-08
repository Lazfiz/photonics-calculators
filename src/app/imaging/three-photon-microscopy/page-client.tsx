"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  ballisticFraction, focalPeakIntensity, gaussianPulsePeakPower, multiphotonFwhm, multiphotonVolume, pulseEnergy,
} from "../../../physics/imaging/multiphoton-focus";

const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");
/** The log axis can't show values below 1e-10; drop them (NaN points are skipped). */
const aboveFloor = (y: number) => (y >= 1e-10 ? y : NaN);

export default function ThreePhotonMicroscopyPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1300); // nm
  const [na, setNa] = useURLState("na", 0.8);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100); // fs
  const [repRate, setRepRate] = useURLState("repRate", 1); // MHz
  const [avgPower, setAvgPower] = useURLState("avgPower", 100); // mW
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.33);
  const [scatteringCoeff, setScatteringCoeff] = useURLState("scatteringCoeff", 60); // cm⁻¹
  const [depth, setDepth] = useURLState("depth", 500); // µm

  const lambda = wavelength * 1e-9;
  const fwhm3 = multiphotonFwhm(lambda, refractiveIndex, na, 3);
  const fwhm2 = multiphotonFwhm(lambda, refractiveIndex, na, 2);
  const volume = multiphotonVolume(lambda, refractiveIndex, na, 3);
  const energy = pulseEnergy(avgPower * 1e-3, repRate * 1e6);
  const peakPower = gaussianPulsePeakPower(avgPower * 1e-3, repRate * 1e6, pulseWidth * 1e-15);
  const peakIntensity = focalPeakIntensity(peakPower, lambda, na); // W/m², at the surface
  const fraction = ballisticFraction(depth * 1e-6, scatteringCoeff * 100);
  const valid = Number.isFinite(fwhm3.axial) && Number.isFinite(peakPower);

  const depthChart = useMemo(() => {
    const depths = Array.from({ length: 81 }, (_, i) => i * 25);
    const f = (d: number) => ballisticFraction(d * 1e-6, scatteringCoeff * 100);
    const k = (d: number, order: number) => aboveFloor(f(d) ** order);
    return [
      { x: depths, y: depths.map((d) => k(d, 1)), type: "scatter", mode: "lines", name: "Linear (1P)", line: { color: "#60a5fa" } },
      { x: depths, y: depths.map((d) => k(d, 2)), type: "scatter", mode: "lines", name: "Quadratic (2P)", line: { color: "#fbbf24" } },
      { x: depths, y: depths.map((d) => k(d, 3)), type: "scatter", mode: "lines", name: "Cubic (3P)", line: { color: "#34d399" } },
      { x: [depth], y: [f(depth) ** 3], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [scatteringCoeff, depth]);

  const resolutionChart = useMemo(() => {
    const lam = wavelength * 1e-9;
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.018).filter((a) => a < refractiveIndex);
    const um = (k: number, key: "lateral" | "axial") => nas.map((a) => multiphotonFwhm(lam, refractiveIndex, a, k)[key] * 1e6);
    const current = multiphotonFwhm(lam, refractiveIndex, na, 3);
    const marks = Number.isFinite(current.axial)
      ? [{ x: [na, na], y: [current.lateral * 1e6, current.axial * 1e6], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } }]
      : [];
    return [
      { x: nas, y: um(3, "lateral"), type: "scatter", mode: "lines", name: "3P lateral", line: { color: "#34d399" } },
      { x: nas, y: um(2, "lateral"), type: "scatter", mode: "lines", name: "2P lateral (same λ)", line: { color: "#60a5fa", dash: "dash" } },
      { x: nas, y: um(3, "axial"), type: "scatter", mode: "lines", name: "3P axial", line: { color: "#fbbf24" } },
      ...marks,
    ];
  }, [wavelength, na, refractiveIndex]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Excitation λ (nm)" value={wavelength} onChange={setWavelength} min={1000} max={1800} />
        <ValidatedNumberInput label="NA" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Pulse Width, FWHM (fs)" value={pulseWidth} onChange={setPulseWidth} min={10} max={1000} />
        <ValidatedNumberInput label="Avg Power (mW)" value={avgPower} onChange={setAvgPower} min={0.1} max={500} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Rep. Rate (MHz)" value={repRate} onChange={setRepRate} min={0.01} max={250} step="0.01" />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.01" />
        <ValidatedNumberInput label="Scattering Coeff (cm⁻¹)" value={scatteringCoeff} onChange={setScatteringCoeff} min={0} max={500} />
        <ValidatedNumberInput label="Depth (µm)" value={depth} onChange={setDepth} min={0} max={3000} />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the NA must be smaller than the refractive index, and the pulse width and repetition rate must be positive.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="3P lateral FWHM" value={fmt(fwhm3.lateral * 1e9, 0, "nm")} tone="green" subtext={`2P at the same λ: ${fmt(fwhm2.lateral * 1e9, 0, "nm")}`} />
        <ResultCard label="3P axial FWHM" value={fmt(fwhm3.axial * 1e6, 2, "µm")} tone="yellow" subtext={`2P at the same λ: ${fmt(fwhm2.axial * 1e6, 2, "µm")}`} />
        <ResultCard label="Excitation volume (I³)" value={fmt(volume * 1e18, 3, "fL")} tone="blue" subtext="(π/6)^(3/2) w² w_z (1 fL = 1 µm³)" />
        <ResultCard label="Peak intensity at focus" value={fmt(peakIntensity / 1e16, 1, "TW/cm²")} tone="green" subtext="At the surface, Gaussian pulse" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="1P / 2P equivalent λ" value={`${(wavelength / 3).toFixed(0)} / ${(wavelength / 2).toFixed(0)} nm`} tone="purple" />
        <ResultCard label="Pulse energy" value={fmt(energy * 1e9, 1, "nJ")} tone="cyan" subtext={`Peak power ${fmt(peakPower / 1e3, 1, "kW")}`} />
        <ResultCard label="Ballistic power at depth" value={fmt(avgPower * fraction, 2, "mW")} tone="blue" subtext={scatteringCoeff > 0 ? `Scattering length ${(1e4 / scatteringCoeff).toFixed(0)} µm` : "No scattering"} />
        <ResultCard label="Relative 3P signal at depth" value={Number.isFinite(fraction) ? (fraction ** 3).toExponential(2) : "—"} tone="yellow" subtext="exp(−3µz), constant surface power" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas (textbook approximation)</h3>
        <div className="space-y-2 text-gray-300 text-sm">
          <p className="font-mono">I ≈ exp(−2r²/w² − 2z²/w_z²), w = 2ω_xy, w_z = 2ω_z (Zipfel radii)</p>
          <p className="font-mono">FWHM of I^k = 2√(2 ln 2/k)·ω, so 3P = 2P × √(2/3)</p>
          <p className="font-mono">V_3P = ∫I³dV/I₀³ = (π/6)^(3/2) w² w_z</p>
          <p className="font-mono">I_peak = P_peak/(2π ω_xy²), P_peak = 2√(ln 2/π)·E/τ</p>
          <p className="font-mono">3P signal ∝ P(z)³ = P₀³ exp(−3µz)</p>
          <p>Gaussian fit to the squared focal intensity from Zipfel, Williams &amp; Webb, Nat. Biotechnol. 21, 1369 (2003), extended to I³; against the exact paraxial Airy pattern the 3P lateral FWHM is about 1.5 % wide. The depth model counts only ballistic excitation photons.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={resolutionChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Resolution vs NA", font: { size: 13 } }, xaxis: { title: "NA", gridcolor: "#374151" }, yaxis: { title: "FWHM (µm)", gridcolor: "#374151", type: "log" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={depthChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Signal vs depth (1P/2P/3P)", font: { size: 13 } }, xaxis: { title: "Depth (µm)", gridcolor: "#374151" }, yaxis: { title: "Relative signal", gridcolor: "#374151", type: "log" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
      </div>
    </>
  );
}
