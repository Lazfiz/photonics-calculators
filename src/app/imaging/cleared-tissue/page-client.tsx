"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  ballisticDepth, ballisticFraction, marginalFocalShift, paraxialFocalShift,
} from "../../../physics/imaging/cleared-tissue";
import { axialPsfFwhm } from "../../../physics/imaging/optical-sectioning-thickness";
import { abbeLateralFwhm } from "../../../physics/imaging/super-resolution";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

export default function ClearedTissuePage() {
  const [naRaw, setNa] = useURLState("na", 1.2);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 680); // nm
  const [nSampleRaw, setNSample] = useURLState("nMedium", 1.52); // cleared sample / clearing medium
  const [nImmRaw, setNImm] = useURLState("nImm", 1.52); // objective's design immersion index
  const [depthRaw, setDepth] = useURLState("tissueThickness", 1000); // µm
  const [muARaw, setMuA] = useURLState("muA", 0.01); // mm⁻¹
  const [muSRaw, setMuS] = useURLState("muS", 0.5); // mm⁻¹
  const na = clamp(naRaw, 0.05, 1.7, 1.2);
  const wavelength = clamp(wavelengthRaw, 300, 2000, 680);
  const nSample = clamp(nSampleRaw, 1, 1.8, 1.52);
  const nImm = clamp(nImmRaw, 1, 1.8, 1.52);
  const depthUm = clamp(depthRaw, 0, 20000, 1000);
  const muA = clamp(muARaw, 0, 100, 0.01);
  const muS = clamp(muSRaw, 0, 100, 0.5);
  const lambda = wavelength * 1e-9;
  const muA_m = muA * 1e3;
  const muS_m = muS * 1e3;
  const depth = depthUm * 1e-6;

  let problem = "";
  if (!(na < nImm)) problem = `An NA of ${na} is not possible with an immersion index of ${nImm}.`;
  else if (!(na < nSample)) problem = `NA ${na} is not possible inside a sample of n = ${nSample}: the marginal rays are totally reflected.`;

  const lateral = abbeLateralFwhm(lambda, na);
  const axial = axialPsfFwhm(lambda, nSample, na);
  const ballistic = ballisticFraction(muA_m, muS_m, depth);
  const depth1e = ballisticDepth(muA_m, muS_m, Math.exp(-1));
  const depth1pc = ballisticDepth(muA_m, muS_m, 0.01);
  const fPar = paraxialFocalShift(nImm, nSample);
  const fMarg = marginalFocalShift(na, nImm, nSample);

  const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
  const fmtMm = (x: number) => (Number.isFinite(x) ? `${(x * 1e3).toFixed(2)} mm` : "∞");

  // Ballistic fraction vs depth, to twice the chosen depth or the 0.1 % depth (at most 20 mm).
  const zMax = Math.min(20e-3, Math.max(2 * depth, ballisticDepth(muA_m, muS_m, 1e-3) || 0, 1e-3));
  const zs = Array.from({ length: 201 }, (_, i) => (i * zMax) / 200);
  const chart = [
    { x: zs.map((z) => z * 1e3), y: zs.map((z) => 100 * ballisticFraction(muA_m, muS_m, z)), type: "scatter" as const, mode: "lines" as const, name: "Ballistic fraction (%)", line: { color: "#34d399" } },
    { x: [depthUm / 1e3], y: [100 * ballistic], type: "scatter" as const, mode: "markers" as const, name: "Chosen depth", marker: { color: "#facc15", size: 8 } },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Objective NA" value={naRaw} onChange={setNa} min={0.05} max={1.7} step="0.05" />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={2000} />
          <ValidatedNumberInput label="Sample (clearing medium) index n_s" value={nSampleRaw} onChange={setNSample} min={1} max={1.8} step="0.01" />
          <ValidatedNumberInput label="Objective immersion index n_imm" value={nImmRaw} onChange={setNImm} min={1} max={1.8} step="0.01" />
          <ValidatedNumberInput label="Depth in the tissue (µm)" value={depthRaw} onChange={setDepth} min={0} max={20000} />
          <ValidatedNumberInput label="Absorption µ_a (mm⁻¹)" value={muARaw} onChange={setMuA} min={0} max={100} step="0.01" />
          <ValidatedNumberInput label="Scattering µ_s (mm⁻¹)" value={muSRaw} onChange={setMuS} min={0} max={100} step="0.1" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {problem ? (
            <p className="text-red-400">{problem}</p>
          ) : (
            <>
              {row("Lateral resolution λ/(2NA)", fmt(lateral * 1e9, 0, " nm"), "text-blue-400")}
              {row("Axial FWHM (index-matched)", fmt(axial * 1e6, 3, " µm"), "text-green-400")}
            </>
          )}
          {row("Ballistic fraction at depth", ballistic < 1e-4 ? `${(100 * ballistic).toExponential(2)} %` : fmt(100 * ballistic, ballistic < 0.01 ? 4 : 1, " %"), "text-yellow-400")}
          {row("Ballistic loss", fmt(-10 * Math.log10(ballistic), 1, " dB"), "text-orange-400")}
          {row("Scattering length 1/µ_s", fmtMm(1 / muS_m))}
          {row("Depth to 1/e (1/µ_t)", fmtMm(depth1e), "text-purple-400")}
          {row("Depth to 1 %", fmtMm(depth1pc), "text-purple-400")}
          {!problem && row("Focal shift factor, paraxial n_s/n_imm", fmt(fPar, 3, "×"), "text-cyan-400")}
          {!problem && row("Focal shift factor, marginal ray", fmt(fMarg, 3, "×"), "text-cyan-400")}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Ballistic fraction vs depth</h2>
        <ChartPanel data={chart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Depth (mm)", gridcolor: "#333" }, yaxis: { title: "Ballistic fraction (%)", type: "log", gridcolor: "#333" }, margin: { l: 60, r: 20, t: 20, b: 60 }, showlegend: true }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>Ballistic fraction = exp(−(µ_a + µ_s) z)</p>
          <p>Axial FWHM = 0.88 λ/(n_s − √(n_s² − NA²)); lateral = λ/(2NA)</p>
          <p>Focal shift: n_s/n_imm (paraxial) to tan α_imm/tan α_s (marginal ray), sin α = NA/n</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Clearing lowers µ_s by matching the refractive indices inside the tissue; the default µ_a and µ_s are example
          values for a well-cleared sample, not measured data. The ballistic fraction is the unscattered light that still
          forms a sharp focus, one way at this wavelength; scattered light adds a diffuse background and is not counted.
          The resolution figures hold for an objective matched to the sample. When n_imm ≠ n_s, the focus moves by a
          factor between the two shift factors per unit of stage travel (scale z-stacks by it), and spherical aberration
          broadens the PSF with depth, which this page does not model.
        </p>
      </div>
    </>
  );
}
