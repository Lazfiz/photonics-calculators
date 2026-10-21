"use client";

import ChartPanel from "../../../components/chart-panel";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { aliasedFrequency } from "../../../physics/spectroscopy/fourier-transform";
import {
  apodization, cosineTransform, FTIR_APODIZATIONS, FTIR_APODIZATION_NAMES, halfVisibilityOpd, ilsFwhm, lineInterferogram,
  nominalResolution, type FtirApodization, type SpectralLine,
} from "../../../physics/spectroscopy/ftir";
import {
  gaussianLineCoherence, machZehnderBeams, michelsonBeams, twoBeamIntensity, twoBeamOpd, twoBeamVisibility, type BeamPair, type TwoBeamType,
} from "../../../physics/spectroscopy/two-beam";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (v: number, d = 4) => (Number.isFinite(v) ? Number(v.toPrecision(d)).toString() : "—");
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

/** Fringes over ±2 fringe periods of arm-length difference around ΔL (µm), with the current point. */
function fringeChart(type: TwoBeamType, outputs: { name: string; beams: BeamPair; sign: number; color: string }[],
  dL_um: number, lambda_um: number, fwhm_cm: number) {
  const period = type === "michelson" ? lambda_um / 2 : lambda_um; // ΔL for one fringe
  const xs = Array.from({ length: 401 }, (_, i) => dL_um + (i / 100 - 2) * period);
  const at = (beams: BeamPair, sign: number, x_um: number) => {
    const opd_um = twoBeamOpd(type, x_um);
    return twoBeamIntensity(beams, (2 * Math.PI * opd_um) / lambda_um + (sign < 0 ? Math.PI : 0), gaussianLineCoherence(fwhm_cm, opd_um * 1e-4));
  };
  return outputs.flatMap((o) => [
    { x: xs.map(round6), y: xs.map((x) => round6(at(o.beams, o.sign, x))), type: "scatter", mode: "lines", name: o.name, line: { color: o.color }, marker: { color: o.color } },
    { x: [round6(dL_um)], y: [round6(at(o.beams, o.sign, dL_um))], type: "scatter", mode: "markers", name: `${o.name} at ΔL`, line: { color: "#facc15" }, marker: { color: "#facc15", size: 10 } },
  ]);
}

export default function MichelsonInterferometerPage() {
  const [lambdaRaw, setWavelength] = useURLState("wavelength", 1.0); // µm
  const [opdRaw, setMaxOPD] = useURLState("maxOPD", 100); // µm
  const [pointsRaw, setNPoints] = useURLState("nPoints", 512);
  const [linesRaw, setNLines] = useURLState("nLines", 3);
  const [spacingRaw, setSpacing] = useURLState("lineSpacing", 300); // cm⁻¹
  const [widthRaw, setLinewidth] = useURLState("linewidth", 20); // cm⁻¹
  const [apodRaw, setApodization] = useURLState("apodization", "boxcar");
  const [typeRaw, setType] = useURLState("type", "michelson");
  const [dLRaw, setArmDiff] = useURLState("armDiff", 10); // µm
  const [r1Raw, setR1] = useURLState("reflectivity", 0.9);
  const [r2Raw, setR2] = useURLState("reflectivity2", 0.9);
  const [raRaw, setRa] = useURLState("splitR", 0.5);
  const [rbRaw, setRb] = useURLState("splitR2", 0.5);

  const lambda_um = clamp(lambdaRaw, 0.2, 50, 1);
  const L_um = clamp(opdRaw, 1, 100000, 100);
  const N = Math.round(clamp(pointsRaw, 16, 4096, 512));
  const nLines = Math.round(clamp(linesRaw, 1, 10, 3));
  const spacing = clamp(spacingRaw, 0.01, 10000, 300);
  const linewidth = clamp(widthRaw, 0, 5000, 20);
  const type: TwoBeamType = typeRaw === "mz" ? "mz" : "michelson";
  const dL_um = clamp(dLRaw, -100000, 100000, 10);
  const R1 = clamp(r1Raw, 0, 1, 0.9);
  const R2 = clamp(r2Raw, 0, 1, 0.9);
  const Ra = clamp(raRaw, 0, 1, 0.5);
  const Rb = clamp(rbRaw, 0, 1, 0.5);
  const apod: FtirApodization = FTIR_APODIZATION_NAMES.includes(apodRaw as FtirApodization) ? (apodRaw as FtirApodization) : "boxcar";

  const L = L_um * 1e-4; // cm
  const sigma0 = 1e4 / lambda_um; // cm⁻¹
  const dx = L / N; // cm
  const sigmaNyquist = 1 / (2 * dx);
  const allLines = Array.from({ length: nLines }, (_, i) => sigma0 + (i - (nLines - 1) / 2) * spacing);
  const lines: SpectralLine[] = allLines.filter((s) => s > 0).map((s) => ({ sigma: s, amplitude: 1, fwhm: linewidth }));
  const dropped = nLines - lines.length;
  const aliased = lines.filter((l) => l.sigma > sigmaNyquist);
  const ilsWidth = ilsFwhm(apod) / L;

  // N ≤ 4096 samples and one FFT: cheap enough to recompute on every render.
  const I = Array.from({ length: N }, (_, n) => lineInterferogram(lines, n * dx) * apodization(apod, n / N));
  const ct = cosineTransform(I, dx, Math.max(1, Math.floor(2048 / N)));
  const peak = Math.max(...ct.B.map(Math.abs)) || 1;
  const sMin = Math.min(...lines.map((l) => l.sigma));
  const sMax = Math.max(...lines.map((l) => l.sigma));
  const pad = Math.max(3 * spacing, 10 / L, 5 * linewidth);
  const lo = aliased.length > 0 || lines.length === 0 ? 0 : Math.max(0, sMin - pad);
  const hi = aliased.length > 0 || lines.length === 0 ? sigmaNyquist : Math.min(sigmaNyquist, sMax + pad);
  const pts = ct.sigma.map((s, k) => ({ x: round6(s), y: round6(ct.B[k] / peak) })).filter((p) => p.x >= lo && p.x <= hi);
  const interferogram = [{ name: "I(x)", color: "#60a5fa", points: I.map((y, n) => ({ x: round6(n * dx * 1e4), y: round6(y) })) }];
  const spectrum = [{ name: "Recovered B(σ)", color: "#f87171", points: pts }];

  // Two-beam fringes at the central wavelength: one output (Michelson) or both (Mach-Zehnder).
  const mz = machZehnderBeams(Ra, Rb);
  const outputs = type === "michelson"
    ? [{ name: "Detector", beams: michelsonBeams(Ra, R1, R2), sign: 1, color: "#60a5fa" }]
    : [{ name: "Output A", beams: mz.A, sign: 1, color: "#60a5fa" }, { name: "Output B", beams: mz.B, sign: -1, color: "#f87171" }];
  const opd_um = twoBeamOpd(type, dL_um);
  const order = opd_um / lambda_um;
  const phaseDeg = (((order % 1) + 1) % 1) * 360;
  const gamma = gaussianLineCoherence(linewidth, opd_um * 1e-4);
  const fringes = outputs.map((o) => ({
    ...o,
    V: twoBeamVisibility(o.beams) * gamma,
    I: twoBeamIntensity(o.beams, 2 * Math.PI * order + (o.sign < 0 ? Math.PI : 0), gamma),
  }));
  const fringeData = fringeChart(type, outputs, dL_um, lambda_um, linewidth);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Central Wavelength (µm)" value={lambdaRaw} onChange={setWavelength} min={0.2} max={50} />
        <ValidatedNumberInput label="Number of Lines" value={linesRaw} onChange={setNLines} min={1} max={10} step="1" />
        <ValidatedNumberInput label="Line Spacing (cm⁻¹)" value={spacingRaw} onChange={setSpacing} min={0.01} max={10000} />
        <ValidatedNumberInput label="Linewidth, Gaussian FWHM (cm⁻¹)" value={widthRaw} onChange={setLinewidth} min={0} max={5000} />
        <ValidatedNumberInput label="Maximum OPD L (µm)" value={opdRaw} onChange={setMaxOPD} min={1} max={100000} />
        <ValidatedNumberInput label="Samples over 0 … L" value={pointsRaw} onChange={setNPoints} min={16} max={4096} step="1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Apodization</span>
          <select value={apod} onChange={(e) => setApodization(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {FTIR_APODIZATION_NAMES.map((name) => <option key={name} value={name}>{FTIR_APODIZATIONS[name].label}</option>)}
          </select>
        </label>
      </div>

      {(dropped > 0 || aliased.length > 0) && (
        <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-950/40 p-4 text-sm text-yellow-100 space-y-1">
          {dropped > 0 && <p>{dropped} line{dropped === 1 ? " falls" : "s fall"} at or below zero wavenumber and {dropped === 1 ? "is" : "are"} left out: reduce the spacing.</p>}
          {aliased.length > 0 && (
            <p>
              Undersampled: the sample step {fmt(dx * 1e4)} µm puts the Nyquist wavenumber at {fmt(sigmaNyquist)} cm⁻¹, so
              {" "}{aliased.map((l) => `${fmt(l.sigma, 5)} → ${fmt(aliasedFrequency(l.sigma, 2 * sigmaNyquist), 5)}`).join(", ")} cm⁻¹ alias.
              Use at least {Math.ceil(2 * L * Math.max(...aliased.map((l) => l.sigma + 2 * l.fwhm)))} samples.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Resolution δσ = 1/L" value={`${fmt(nominalResolution(L))} cm⁻¹`} tone="blue" subtext={`${fmt(1 / L_um)} µm⁻¹; Δλ = λ²/L = ${fmt((lambda_um ** 2 / L_um) * 1e3)} nm`} />
        <ResultCard label="Resolving Power L/λ" value={fmt(L_um / lambda_um)} tone="green" subtext={`ILS FWHM ${fmt(ilsWidth)} cm⁻¹ (${FTIR_APODIZATIONS[apod].label})`} />
        <ResultCard label="Nyquist Wavenumber" value={`${fmt(sigmaNyquist)} cm⁻¹`} tone="yellow" subtext={`step ${fmt(dx * 1e4)} µm; λ_min = ${fmt(2 * dx * 1e4)} µm`} />
        <ResultCard label="Fringe Visibility ½ at" value={linewidth > 0 ? `${fmt(halfVisibilityOpd(linewidth) * 1e4)} µm` : "∞"} tone="purple" subtext="OPD where a line's fringes fade to half" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <SimpleLineChart title="Interferogram" xLabel="OPD x (µm)" yLabel="I(x)" series={interferogram} />
        <SimpleLineChart title="Recovered spectrum" xLabel="Wavenumber σ (cm⁻¹)" yLabel="B(σ) (normalized)" series={spectrum} />
      </div>

      <h2 className="text-xl font-semibold mb-4">Two-beam fringes at the central wavelength</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Interferometer</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="michelson">Michelson</option>
            <option value="mz">Mach-Zehnder</option>
          </select>
        </label>
        <ValidatedNumberInput label="Arm-Length Difference ΔL (µm)" value={dLRaw} onChange={setArmDiff} min={-100000} max={100000} step="any" />
        <ValidatedNumberInput label={type === "michelson" ? "Splitter Reflectance R" : "Splitter 1 Reflectance Rₐ"} value={raRaw} onChange={setRa} min={0} max={1} step="0.01" />
        {type === "michelson" ? (
          <>
            <ValidatedNumberInput label="Mirror R₁" value={r1Raw} onChange={setR1} min={0} max={1} step="0.01" />
            <ValidatedNumberInput label="Mirror R₂" value={r2Raw} onChange={setR2} min={0} max={1} step="0.01" />
          </>
        ) : (
          <ValidatedNumberInput label="Splitter 2 Reflectance R_b" value={rbRaw} onChange={setRb} min={0} max={1} step="0.01" />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ResultCard label="Optical Path Difference" value={`${fmt(opd_um)} µm`} tone="blue" subtext={type === "michelson" ? "2ΔL (light crosses each arm twice)" : "ΔL (single pass)"} />
        <ResultCard label="Fringe Order OPD/λ" value={fmt(order, 6)} tone="cyan" subtext={`phase ${fmt(phaseDeg)}° past a bright fringe`} />
        {fringes.map((o) => (
          <ResultCard key={o.name} label={`${o.name}: Visibility V`} value={fmt(o.V)} tone="green"
            subtext={`I = ${fmt(o.I)} of the input; beams ${fmt(o.beams.I1)} and ${fmt(o.beams.I2)}`} />
        ))}
        <ResultCard label="Coherence Factor |γ|" value={fmt(gamma)} tone="purple" subtext="Gaussian line of the FWHM above, at this OPD" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={fringeData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Arm-length difference ΔL (µm)", gridcolor: "#374151" },
          yaxis: { title: "Output (fraction of input)", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 20, r: 20, b: 50, l: 70 },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">I(x) = Σ cos(2πσᵢx)·exp(−(πΓx)²/(4 ln 2))·A(x/L),   B(σ) = Δx[I₀ + 2Σ Iₙ cos(2πσnΔx)]</p>
        <p className="font-mono">δσ = 1/L,   σ_Nyquist = 1/(2Δx),   Δx = L/N</p>
        <p>
          Each Gaussian line of FWHM Γ (cm⁻¹) contributes a cosine fringe whose envelope is the Fourier transform of its
          profile, so broad lines lose fringe contrast within a short OPD. The single-sided interferogram, sampled at N points
          from zero path difference to L, is cosine-transformed (FFT of the mirrored record, zero-padded for a smooth curve) to
          recover the spectrum, convolved with the instrument line shape of the chosen apodization. Lines closer than about
          1/L merge; lines above the Nyquist wavenumber fold back. The interferometer is ideal: no beam divergence, phase error
          or detector response. The Fellgett (multiplex) advantage comes from measuring all wavenumbers in every sample.
        </p>
        <p className="font-mono">I = I₁ + I₂ + 2√(I₁I₂)|γ| cos(2π·OPD/λ),   V = 2√(I₁I₂)|γ|/(I₁ + I₂)</p>
        <p>
          Two-beam fringes use lossless splitters. In the Michelson both beams meet the splitter once in reflection and once
          in transmission (I₁ = R T R₁, I₂ = T R R₂), so the splitter ratio sets the throughput but not the visibility. In the
          Mach-Zehnder output A receives Rₐ T_b and Tₐ R_b and output B receives Rₐ R_b and Tₐ T_b, with complementary
          fringes that sum to the input. |γ| is the coherence of one Gaussian line of the FWHM set above.
        </p>
      </div>
    </>
  );
}
