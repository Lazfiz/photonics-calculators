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

export default function TwoPhotonMicroscopyPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 800); // nm
  const [na, setNa] = useURLState("na", 0.8);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100); // fs
  const [repRate, setRepRate] = useURLState("repRate", 80); // MHz
  const [avgPower, setAvgPower] = useURLState("avgPower", 30); // mW
  const [exposureDepth, setExposureDepth] = useURLState("exposureDepth", 200); // µm
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.33);
  const [scatteringCoeff, setScatteringCoeff] = useURLState("scatteringCoeff", 100); // cm⁻¹

  const lambda = wavelength * 1e-9;
  const mu = scatteringCoeff * 100; // 1/m
  const fwhm = multiphotonFwhm(lambda, refractiveIndex, na, 2);
  const volume = multiphotonVolume(lambda, refractiveIndex, na, 2);
  const energy = pulseEnergy(avgPower * 1e-3, repRate * 1e6);
  const peakPower = gaussianPulsePeakPower(avgPower * 1e-3, repRate * 1e6, pulseWidth * 1e-15);
  const peakIntensity = focalPeakIntensity(peakPower, lambda, na); // W/m², at the surface
  const fractionAtDepth = ballisticFraction(exposureDepth * 1e-6, mu);
  const valid = Number.isFinite(fwhm.axial) && Number.isFinite(peakPower);

  const depthChart = useMemo(() => {
    const depths = Array.from({ length: 81 }, (_, i) => i * 25);
    const m = scatteringCoeff * 100;
    return [
      { x: depths, y: depths.map((d) => aboveFloor(ballisticFraction(d * 1e-6, m))), type: "scatter", mode: "lines", name: "Ballistic power", line: { color: "#60a5fa" } },
      { x: depths, y: depths.map((d) => aboveFloor(ballisticFraction(d * 1e-6, m) ** 2)), type: "scatter", mode: "lines", name: "2P signal", line: { color: "#34d399" } },
      { x: [exposureDepth], y: [ballisticFraction(exposureDepth * 1e-6, m) ** 2], type: "scatter", mode: "markers", name: "Current depth", marker: { color: "#f87171", size: 12 } },
    ];
  }, [scatteringCoeff, exposureDepth]);

  const resolutionChart = useMemo(() => {
    const lam = wavelength * 1e-9;
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.018).filter((a) => a < refractiveIndex);
    const lateral = nas.map((a) => multiphotonFwhm(lam, refractiveIndex, a, 2).lateral * 1e6);
    const axial = nas.map((a) => multiphotonFwhm(lam, refractiveIndex, a, 2).axial * 1e6);
    const current = multiphotonFwhm(lam, refractiveIndex, na, 2);
    const marks = Number.isFinite(current.axial) ? [
      { x: [na], y: [current.lateral * 1e6], type: "scatter", mode: "markers", name: "Current lateral", marker: { color: "#34d399", size: 12 } },
      { x: [na], y: [current.axial * 1e6], type: "scatter", mode: "markers", name: "Current axial", marker: { color: "#f87171", size: 12 } },
    ] : [];
    return [
      { x: nas, y: lateral, type: "scatter", mode: "lines", name: "Lateral FWHM", line: { color: "#60a5fa" } },
      { x: nas, y: axial, type: "scatter", mode: "lines", name: "Axial FWHM", line: { color: "#fbbf24" } },
      ...marks,
    ];
  }, [wavelength, na, refractiveIndex]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Excitation λ (nm)" value={wavelength} onChange={setWavelength} min={680} max={1300} />
        <ValidatedNumberInput label="NA" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Pulse Width, FWHM (fs)" value={pulseWidth} onChange={setPulseWidth} min={10} max={1000} />
        <ValidatedNumberInput label="Avg Power (mW)" value={avgPower} onChange={setAvgPower} min={0.1} max={500} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Rep. Rate (MHz)" value={repRate} onChange={setRepRate} min={0.1} max={250} />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.01" />
        <ValidatedNumberInput label="Scattering Coeff (cm⁻¹)" value={scatteringCoeff} onChange={setScatteringCoeff} min={0} max={500} />
        <ValidatedNumberInput label="Depth (µm)" value={exposureDepth} onChange={setExposureDepth} min={0} max={2000} />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the NA must be smaller than the refractive index, and the pulse width and repetition rate must be positive.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Lateral FWHM (2P)" value={fmt(fwhm.lateral * 1e9, 0, "nm")} tone="blue" subtext={`1P equivalent λ ${(wavelength / 2).toFixed(0)} nm`} />
        <ResultCard label="Axial FWHM (2P)" value={fmt(fwhm.axial * 1e6, 2, "µm")} tone="yellow" subtext={na <= 0.7 ? "Zipfel fit; NA ≤ 0.7 branch" : "Zipfel fit; NA > 0.7 branch"} />
        <ResultCard label="Excitation volume" value={fmt(volume * 1e18, 3, "fL")} tone="purple" subtext="π^(3/2) ω_xy² ω_z (1 fL = 1 µm³)" />
        <ResultCard label="Peak intensity at focus" value={fmt(peakIntensity / 1e16, 2, "TW/cm²")} tone="green" subtext="At the surface, Gaussian pulse" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Pulse energy" value={fmt(energy * 1e9, 3, "nJ")} tone="cyan" />
        <ResultCard label="Peak power" value={fmt(peakPower / 1e3, 2, "kW")} tone="orange" subtext="0.94 E/τ (Gaussian pulse)" />
        <ResultCard label="Ballistic power at depth" value={fmt(avgPower * fractionAtDepth, 2, "mW")} tone="yellow" subtext={`2P signal × ${Number.isFinite(fractionAtDepth) ? (fractionAtDepth ** 2).toExponential(2) : "—"}`} />
        <ResultCard label="Scattering length 1/µ" value={scatteringCoeff > 0 ? fmt(1e4 / scatteringCoeff, 0, "µm") : "∞"} tone="red" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas (textbook approximation)</h3>
        <div className="space-y-2 text-gray-300 text-sm">
          <p className="font-mono">I²(r, z) ≈ exp(−r²/ω_xy² − z²/ω_z²), FWHM = 2√(ln 2)·ω</p>
          <p className="font-mono">ω_xy = 0.320λ/(√2 NA) (NA ≤ 0.7), 0.325λ/(√2 NA^0.91) (NA &gt; 0.7)</p>
          <p className="font-mono">ω_z = 0.532λ/(√2 (n − √(n² − NA²))), V = π^(3/2) ω_xy² ω_z</p>
          <p className="font-mono">I_peak = P_peak/(2π ω_xy²), P_peak = 2√(ln 2/π)·E/τ</p>
          <p className="font-mono">P(z) = P₀ exp(−µz), 2P signal ∝ P(z)²</p>
          <p>Gaussian fit to the squared focal intensity of a filled objective pupil: Zipfel, Williams &amp; Webb, Nat. Biotechnol. 21, 1369 (2003). The peak intensity is within about 1 % of the Airy peak πNA²P/λ². The depth model counts only ballistic excitation photons; aberrations and out-of-focus background are not included.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={resolutionChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "2P resolution vs NA", font: { size: 13 } }, xaxis: { title: "NA", gridcolor: "#374151" }, yaxis: { title: "FWHM (µm)", gridcolor: "#374151", type: "log" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={depthChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Power & signal vs depth (relative)", font: { size: 13 } }, xaxis: { title: "Depth (µm)", gridcolor: "#374151" }, yaxis: { title: "Relative to surface", gridcolor: "#374151", type: "log" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
      </div>
    </>
  );
}
