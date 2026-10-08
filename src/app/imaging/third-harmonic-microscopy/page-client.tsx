"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  ballisticFraction, focalIntensityRadius, focalPeakIntensity, gaussianPulsePeakPower, multiphotonFwhm, pulseEnergy,
} from "../../../physics/imaging/multiphoton-focus";

const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");
/** The log axis can't show values below 1e-10; drop them (NaN points are skipped). */
const aboveFloor = (y: number) => (y >= 1e-10 ? y : NaN);

export default function ThirdHarmonicMicroscopyPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1200); // nm
  const [na, setNa] = useURLState("na", 0.8);
  const [power, setPower] = useURLState("power", 100); // mW
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100); // fs
  const [repRate, setRepRate] = useURLState("repRate", 80); // MHz
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.33);
  const [scatteringCoeff, setScatteringCoeff] = useURLState("scatteringCoeff", 40); // cm⁻¹

  const lambda = wavelength * 1e-9;
  const energy = pulseEnergy(power * 1e-3, repRate * 1e6);
  const peakPower = gaussianPulsePeakPower(power * 1e-3, repRate * 1e6, pulseWidth * 1e-15);
  const peakIntensity = focalPeakIntensity(peakPower, lambda, na); // W/m²
  const w = focalIntensityRadius(lambda, na); // 1/e² radius of the fundamental
  const fundamental = multiphotonFwhm(lambda, refractiveIndex, na, 1);
  const thg = multiphotonFwhm(lambda, refractiveIndex, na, 3);
  const valid = Number.isFinite(thg.axial) && Number.isFinite(peakPower);

  const depthChart = useMemo(() => {
    const depths = Array.from({ length: 81 }, (_, i) => i * 25);
    const f = (d: number) => ballisticFraction(d * 1e-6, scatteringCoeff * 100);
    return [
      { x: depths, y: depths.map((d) => aboveFloor(f(d) ** 3)), type: "scatter", mode: "lines", name: "THG ∝ P³", line: { color: "#a78bfa" } },
      { x: depths, y: depths.map((d) => aboveFloor(f(d) ** 2)), type: "scatter", mode: "lines", name: "SHG ∝ P² (ref)", line: { color: "#34d399", dash: "dash" } },
      { x: depths, y: depths.map((d) => aboveFloor(f(d))), type: "scatter", mode: "lines", name: "Ballistic power", line: { color: "#60a5fa", dash: "dot" } },
    ];
  }, [scatteringCoeff]);

  const powerChart = useMemo(() => {
    const powers = Array.from({ length: 60 }, (_, i) => 5 + i * 5);
    return [
      { x: powers, y: powers.map((p) => (p / power) ** 3), type: "scatter", mode: "lines", name: "THG ∝ P³", line: { color: "#a78bfa" } },
      { x: powers, y: powers.map((p) => (p / power) ** 2), type: "scatter", mode: "lines", name: "SHG ∝ P²", line: { color: "#34d399", dash: "dash" } },
      { x: [power], y: [1], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [power]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Excitation λ (nm)" value={wavelength} onChange={setWavelength} min={1000} max={1800} />
        <ValidatedNumberInput label="NA" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Avg Power (mW)" value={power} onChange={setPower} min={1} max={500} />
        <ValidatedNumberInput label="Pulse Width, FWHM (fs)" value={pulseWidth} onChange={setPulseWidth} min={10} max={1000} />
        <ValidatedNumberInput label="Rep. Rate (MHz)" value={repRate} onChange={setRepRate} min={0.1} max={250} />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.01" />
        <ValidatedNumberInput label="Scattering Coeff (cm⁻¹)" value={scatteringCoeff} onChange={setScatteringCoeff} min={0} max={500} />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the NA must be smaller than the refractive index, and the pulse width and repetition rate must be positive.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="THG wavelength" value={`${(wavelength / 3).toFixed(0)} nm`} tone="purple" />
        <ResultCard label="Peak intensity at focus" value={fmt(peakIntensity / 1e16, 2, "TW/cm²")} tone="blue" subtext="Gaussian pulse and focus" />
        <ResultCard label="Pulse energy" value={fmt(energy * 1e9, 2, "nJ")} tone="yellow" subtext={`Peak power ${fmt(peakPower / 1e3, 1, "kW")}`} />
        <ResultCard label="Focal radius w (1/e²)" value={fmt(w * 1e6, 3, "µm")} tone="green" subtext="2ω_xy (Zipfel fit)" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="THG source, lateral FWHM" value={fmt(thg.lateral * 1e9, 0, "nm")} tone="purple" subtext="FWHM of I³" />
        <ResultCard label="THG source, axial FWHM" value={fmt(thg.axial * 1e6, 2, "µm")} tone="purple" subtext="Interfaces closer than this blur together" />
        <ResultCard label="Fundamental, lateral FWHM" value={fmt(fundamental.lateral * 1e9, 0, "nm")} tone="blue" subtext="FWHM of I = THG × √3" />
        <ResultCard label="Fundamental, axial FWHM" value={fmt(fundamental.axial * 1e6, 2, "µm")} tone="blue" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Physics</h3>
        <div className="space-y-2 text-gray-300 text-sm">
          <p className="font-mono">λ_THG = λ/3, I_THG ∝ |χ⁽³⁾|² I³; FWHM of I³ = FWHM of I / √3 (Gaussian focus)</p>
          <p className="font-mono">I_peak = P_peak/(2π ω_xy²), P_peak = 2√(ln 2/π)·E/τ</p>
          <p>
            In a homogeneous medium with normal dispersion (Δk = 3k_ω − k_3ω &lt; 0), the third-harmonic fields generated before and
            after a tight focus cancel because of the Gouy phase, so no THG leaves the focus. A signal appears only where χ⁽³⁾ or n
            changes within the focal volume: interfaces, membranes, lipid bodies (Boyd, Nonlinear Optics, §2.10; Barad et al.,
            Appl. Phys. Lett. 70, 922, 1997). The signal therefore can&apos;t be predicted from the intensity alone. The charts show
            only how it scales.
          </p>
          <p>Focal radii from the Gaussian fit of Zipfel, Williams &amp; Webb, Nat. Biotechnol. 21, 1369 (2003). The depth chart counts only ballistic excitation photons.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={powerChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Signal vs power (relative to current)", font: { size: 13 } }, xaxis: { title: "Avg Power (mW)", gridcolor: "#374151", type: "log" }, yaxis: { title: "Relative signal", gridcolor: "#374151", type: "log" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={depthChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Signal attenuation vs depth", font: { size: 13 } }, xaxis: { title: "Depth (µm)", gridcolor: "#374151" }, yaxis: { title: "Relative signal", gridcolor: "#374151", type: "log" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
      </div>
    </>
  );
}
