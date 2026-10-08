"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  fittingErrorVariance, friedParameter, greenwoodFrequency, isoplanaticAngle, servoLagVariance, strehlRatio,
  uncorrectedPhaseVariance,
} from "../../../physics/free-space-comms/turbulence";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);

export default function AdaptiveOpticsPage() {
  const [c2n, setC2n] = useURLState("c2n", 1e-14); // m^(−2/3)
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [range, setRange] = useURLState("range", 1); // km
  const [diameter, setDiameter] = useURLState("diameter", 10); // cm
  const [aoActuators, setAoActuators] = useURLState("aoActuators", 127);
  const [aoBandwidth, setAoBandwidth] = useURLState("aoBandwidth", 500); // Hz, closed-loop −3 dB
  const [windSpeed, setWindSpeed] = useURLState("windSpeed", 10); // m/s

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const L = range * 1e3;
    const D = diameter * 1e-2;
    const r0 = friedParameter(c2n, lambda, L);
    const fG = greenwoodFrequency(windSpeed, r0);
    const sigma2Open = uncorrectedPhaseVariance(D, r0);
    const sigma2Fit = fittingErrorVariance(aoActuators, D, r0);
    const sigma2Servo = servoLagVariance(fG, aoBandwidth);
    const sigma2AO = sigma2Fit + sigma2Servo;
    const strehlNoAO = strehlRatio(sigma2Open, D, r0);
    const strehlAO = strehlRatio(sigma2AO, D, r0);
    return {
      r0, DoverR0: D / r0, fG, theta0: isoplanaticAngle(c2n, lambda, L),
      sigma2Open, sigma2Fit, sigma2Servo, sigma2AO, strehlNoAO, strehlAO, improvement: strehlAO / strehlNoAO,
    };
  }, [c2n, wavelength, range, diameter, aoActuators, aoBandwidth, windSpeed]);

  const plotData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const L = range * 1e3;
    // Log-spaced C_n² from 1e-17 (very weak) to 1e-12 m^(−2/3) (strong, near the ground on a hot day).
    const cn2s = Array.from({ length: 101 }, (_, i) => 10 ** (-17 + (5 * i) / 100));
    const r0s = cn2s.map((cn2) => friedParameter(cn2, lambda, L) * 100);
    return [
      { x: cn2s, y: r0s, type: "scatter", mode: "lines", name: "r₀", line: { color: "#06b6d4", width: 2 } },
      { x: [cn2s[0], cn2s[cn2s.length - 1]], y: [diameter, diameter], type: "scatter", mode: "lines", name: "Aperture D",
        line: { color: "#f43f5e", dash: "dash" } },
    ];
  }, [wavelength, range, diameter]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Cn² (m⁻²ᐟ³)" value={c2n} onChange={setC2n} min={1e-18} max={1e-11} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
        <ValidatedNumberInput label="Range (km)" value={range} onChange={setRange} min={0.001} max={1000} step="0.1" />
        <ValidatedNumberInput label="Aperture Diameter (cm)" value={diameter} onChange={setDiameter} min={0.1} max={1000} />
        <ValidatedNumberInput label="AO Actuators (≈ modes corrected)" value={aoActuators} onChange={setAoActuators} min={1} max={100000} step="1" />
        <ValidatedNumberInput label="AO Bandwidth f₃dB (Hz)" value={aoBandwidth} onChange={setAoBandwidth} min={1} max={100000} />
        <ValidatedNumberInput label="Wind Speed (m/s)" value={windSpeed} onChange={setWindSpeed} min={0.1} max={100} step="0.5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Fried parameter r₀" value={`${fmt(calc.r0 * 100)} cm`} tone="cyan" subtext={`D/r₀ = ${fmt(calc.DoverR0)}`} />
        <ResultCard label="Greenwood frequency f_G" value={`${fmt(calc.fG)} Hz`} tone="blue" subtext="0.427 v/r₀" />
        <ResultCard label="Isoplanatic angle θ₀" value={`${fmt(calc.theta0 * 1e6)} µrad`} tone="purple" />
        <ResultCard label="Strehl (no AO)" value={fmt(calc.strehlNoAO)} tone="red" subtext={`σ² = 1.03 (D/r₀)^5/3 = ${fmt(calc.sigma2Open)} rad²`} />
        <ResultCard label="Strehl (with AO)" value={fmt(calc.strehlAO)} tone="green"
          subtext={`σ²_fit = ${fmt(calc.sigma2Fit)}, σ²_servo = ${fmt(calc.sigma2Servo)} rad²`} />
        <ResultCard label="AO improvement" value={`${fmt(calc.improvement)}×`} tone="yellow" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Fried parameter vs Cn²</h3>
        <ChartPanel data={plotData} layout={{
          xaxis: { title: "Cn² (m⁻²ᐟ³)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          yaxis: { title: "Length (cm)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          margin: { t: 20, r: 20, b: 50, l: 60 }, font: { color: "#9ca3af" }, legend: { x: 0.7, y: 0.98 },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">r₀ = (0.423 k² Cn² L)^(−3/5),   θ₀ = (2.91 · 3/8 · k² Cn² L^(8/3))^(−3/5),   f_G = 0.427 v/r₀</p>
        <p className="font-mono">σ²_fit ≈ 0.2944 J^(−√3/2) (D/r₀)^(5/3),   σ²_servo = (f_G/f₃dB)^(5/3)</p>
        <p className="font-mono">S ≈ e^(−σ²) + (1 − e^(−σ²)) / (1 + (D/r₀)²)</p>
        <p>
          Plane-wave r₀ and θ₀ for a horizontal path with constant Cn² (Andrews &amp; Phillips, <em>Laser Beam
          Propagation through Random Media</em>, 2nd ed., 2005). The uncorrected variance 1.03 (D/r₀)^(5/3) and the
          residual after J corrected Zernike modes are Noll&apos;s (JOSA 66, 207, 1976); here J ≈ the actuator count,
          a rough equivalence. The servo-lag variance of a first-order loop depends only on f_G/f₃dB (Greenwood,
          JOSA 67, 390, 1977). The Strehl ratio adds the seeing halo to the Maréchal core (Parenti &amp; Sasiela,
          JOSA A 11, 288, 1994), so it tends to (r₀/D)² without correction instead of underflowing.
        </p>
        <p className="text-gray-500">
          Not modelled: wavefront-sensor noise, anisoplanatism, scintillation (which degrades wavefront sensing once
          σ_R² ≳ 0.5) and a turbulence profile other than a uniform path with one wind speed.
        </p>
      </div>
    </>
  );
}
