"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  tirfCriticalAngle, tirfInterfaceIntensity, tirfMaxAngle, tirfPenetrationDepth,
} from "../../../physics/imaging/tirf";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const DEG = Math.PI / 180;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

export default function TIRFPage() {
  const [naRaw, setNa] = useURLState("na", 1.49);
  const [n1Raw, setN1] = useURLState("n1", 1.518); // coverslip / immersion
  const [n2Raw, setN2] = useURLState("n2", 1.33); // sample medium
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 488); // nm
  const [thetaRaw, setTheta] = useURLState("theta", 65); // incidence angle in the glass, degrees
  const na = clamp(naRaw, 0.1, 1.8, 1.49);
  const n1 = clamp(n1Raw, 1, 2, 1.518);
  const n2 = clamp(n2Raw, 1, 2, 1.33);
  const wavelength = clamp(wavelengthRaw, 300, 1500, 488);
  const thetaDeg = clamp(thetaRaw, 0, 89.9, 65);
  const lambda = wavelength * 1e-9;

  const thetaC = tirfCriticalAngle(n1, n2);
  const thetaMax = tirfMaxAngle(na, n1);
  const theta = thetaDeg * DEG;
  const tir = n2 < n1 && theta > thetaC;
  const reachable = !(theta > thetaMax);
  const dI = tirfPenetrationDepth(lambda, n1, n2, theta);
  const { s: Is, p: Ip } = tirfInterfaceIntensity(n1, n2, theta);

  let problem = "";
  if (!(n2 < n1)) problem = `No total internal reflection: n₂ (${n2}) must be below n₁ (${n1}).`;
  else if (na > n1) problem = `An objective NA of ${na} is not possible with immersion of n₁ = ${n1}.`;
  else if (!tir) problem = `${thetaDeg}° is at or below the critical angle ${(thetaC / DEG).toFixed(2)}°: the beam is transmitted into the sample (epi or HILO illumination), with no evanescent field.`;
  const warning = problem
    ? ""
    : !(na > n2)
      ? `With NA ${na} ≤ n₂ = ${n2}, this objective cannot reach the critical angle; the values are for prism-type TIRF.`
      : !reachable
        ? `${thetaDeg}° lies beyond the objective's largest angle, ${(thetaMax / DEG).toFixed(2)}° (NA ${na}); the values are for prism-type TIRF.`
        : "";

  const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

  // Depth vs angle from just above θ_c to 89°, log scale (it diverges at θ_c).
  const angles = Number.isFinite(thetaC)
    ? Array.from({ length: 200 }, (_, i) => thetaC / DEG + 0.05 + (i * (89 - thetaC / DEG - 0.05)) / 199)
    : [];
  const depths = angles.map((a) => tirfPenetrationDepth(lambda, n1, n2, a * DEG) * 1e9);
  const depthRange = depths.length ? [Math.min(...depths), Math.max(...depths)] : [0, 1];
  const depthChart = [
    { x: angles, y: depths, type: "scatter" as const, mode: "lines" as const, name: "Penetration depth d (nm)", line: { color: "#60a5fa" } },
    ...(Number.isFinite(thetaMax) && thetaMax > thetaC
      ? [{ x: [thetaMax / DEG, thetaMax / DEG], y: depthRange, type: "scatter" as const, mode: "lines" as const, name: "Objective limit", line: { color: "#f87171", dash: "dash" } }]
      : []),
    ...(tir ? [{ x: [thetaDeg], y: [dI * 1e9], type: "scatter" as const, mode: "markers" as const, name: "Current angle", marker: { color: "#facc15", size: 8 } }] : []),
  ];

  const zs = Array.from({ length: 101 }, (_, i) => i * 5);
  const decayChart = [
    { x: zs, y: zs.map((z) => Math.exp(-z / (dI * 1e9))), type: "scatter" as const, mode: "lines" as const, name: "I(z)/I(0)", line: { color: "#f87171" } },
    { x: [dI * 1e9, dI * 1e9], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "z = d (1/e)", line: { color: "#4ade80", dash: "dash" } },
  ];

  const layout = { paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 20, t: 20, b: 60 } };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Objective NA" value={naRaw} onChange={setNa} min={0.1} max={1.8} step="0.01" />
          <ValidatedNumberInput label="n₁ (coverslip / immersion)" value={n1Raw} onChange={setN1} min={1} max={2} step="0.001" />
          <ValidatedNumberInput label="n₂ (sample medium)" value={n2Raw} onChange={setN2} min={1} max={2} step="0.01" />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={1500} />
          <ValidatedNumberInput label="Incidence angle in the glass θ (°)" value={thetaRaw} onChange={setTheta} min={0} max={89.9} step="0.5" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Critical angle θ_c", fmt(thetaC / DEG, 2, "°"), "text-yellow-400")}
          {row("Objective's largest angle", fmt(thetaMax / DEG, 2, "°"))}
          {problem ? (
            <p className="text-red-400">{problem}</p>
          ) : (
            <>
              {row("Intensity penetration depth d", fmt(dI * 1e9, 1, " nm"), "text-green-400")}
              {row("Field decay length 2d", fmt(2 * dI * 1e9, 1, " nm"))}
              {row("Intensity at 100 nm", fmt(100 * Math.exp(-100e-9 / dI), 1, " %"), "text-purple-400")}
              {row("Interface intensity, s-pol.", fmt(Is, 2, " × incident"), "text-blue-400")}
              {row("Interface intensity, p-pol.", fmt(Ip, 2, " × incident"), "text-blue-400")}
            </>
          )}
          {warning && <p className="text-yellow-400 text-sm">{warning}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Penetration depth vs angle</h2>
          <ChartPanel data={depthChart} layout={{ ...layout, xaxis: { title: "Incidence angle (°)", gridcolor: "#333" }, yaxis: { title: "d (nm)", type: "log", gridcolor: "#333" }, showlegend: true }} />
        </div>
        {!problem && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Evanescent intensity decay</h2>
            <ChartPanel data={decayChart} layout={{ ...layout, xaxis: { title: "Distance from the interface z (nm)", gridcolor: "#333" }, yaxis: { title: "I(z)/I(0)", gridcolor: "#333", range: [0, 1] }, showlegend: true }} />
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>θ_c = arcsin(n₂/n₁); objective limit arcsin(NA/n₁)</p>
          <p>I(z) = I(0) exp(−z/d), d = λ/(4π √(n₁² sin²θ − n₂²))</p>
          <p>I_s(0) = 4cos²θ/(1 − n²), I_p(0) = 4cos²θ(2sin²θ − n²)/(n⁴cos²θ + sin²θ − n²), n = n₂/n₁</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Plane-wave Fresnel optics at one planar interface (Axelrod 2001). d is the 1/e depth of the intensity, which
          excites the fluorophores; the field decays over 2d. The interface intensity is relative to the incident
          intensity in the glass and peaks near θ_c (4 for s, 4/n² for p). Real objective-type TIRF also carries some
          scattered, non-evanescent light, so the measured decay is often longer.
        </p>
      </div>
    </>
  );
}
