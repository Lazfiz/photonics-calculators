"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { abs as cabs } from "../../../physics/complex";
import { useURLState } from "../../../hooks/use-url-state";
import { johnsonNoise, responsivity as responsivityOf } from "../../../physics/detectors/noise";
import {
  combinedBandwidth, depletionWidth, diffusionBandwidth, diffusionResponse, driftFraction, photodiodeBandwidth, photodiodeResponse,
  rcBandwidth, transitBandwidth,
} from "../../../physics/detectors/photodiode-rc";
import { siliconAbsorption } from "../../../physics/materials/silicon-absorption";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtHz = (f: number) => (!Number.isFinite(f) ? "—" : f >= 1e9 ? `${(f / 1e9).toFixed(2)} GHz` : `${(f / 1e6).toFixed(2)} MHz`);

// Photodiode: C_j = C''·A, W = ε₀ε_r/C''. Bandwidth from the RC limit 1/(2π·R·C_j) and the transit limit 0.443·v/W,
// combined as 1/f² = 1/f_RC² + 1/f_tr² (Bowers & Burrus 1987). Light absorbed below W adds a slow diffusion current:
// Gärtner's split with L → L/√(1 + iωτ), τ = L²/D (photodiode-rc.ts).
export default function PhotodiodeSpeedPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 850);
  const [qeRaw, setQe] = useURLState("qe", 0.8);
  const [capacitanceDensityRaw, setCapacitanceDensity] = useURLState("capacitanceDensity", 10); // pF/mm²
  const [epsRRaw, setEpsR] = useURLState("epsR", 11.9);
  const [velocityRaw, setVelocity] = useURLState("velocity", 8.4e4); // m/s: Si hole saturation velocity ≈ 8.4×10⁴ m/s at 300 K (Jacoboni et al. 1977, v = 1.62e8·T^−0.52 cm/s)
  const [loadResistanceRaw, setLoadResistance] = useURLState("loadResistance", 50); // Ω
  const [absorptionDepthRaw, setAbsorptionDepth] = useURLState("absorptionDepth", 0); // µm; 0 = silicon at λ (Green 2008)
  const [diffusionLengthRaw, setDiffusionLength] = useURLState("diffusionLength", 35); // µm
  const [diffusivityRaw, setDiffusivity] = useURLState("diffusivity", 36); // cm²/s: electrons in p-Si, μ_n 1400 cm²/V·s × kT/q (Sze & Ng app. G)
  const [areaMinRaw, setAreaMin] = useURLState("areaMin", 0.001); // mm²
  const [areaMaxRaw, setAreaMax] = useURLState("areaMax", 10); // mm²
  const wavelength_nm = clamp(wavelengthRaw, 200, 20000, 850);
  const qe = clamp(qeRaw, 0.01, 1, 0.8);
  const capacitanceDensity = clamp(capacitanceDensityRaw, 0.01, 1e4, 10) * 1e-12 / 1e-6; // pF/mm² → F/m²
  const epsR = clamp(epsRRaw, 1, 100, 11.9);
  const velocity = clamp(velocityRaw, 1e3, 1e6, 8.4e4);
  const loadResistance = clamp(loadResistanceRaw, 1, 1e9, 50);
  const absorptionDepth_um = clamp(absorptionDepthRaw, 0, 1e5, 0);
  const diffusionLength = clamp(diffusionLengthRaw, 0, 1e4, 35) * 1e-6; // m
  const diffusivity = clamp(diffusivityRaw, 0.01, 1e4, 36) * 1e-4; // m²/s
  const areaMin = clamp(areaMinRaw, 1e-6, 1e4, 0.001);
  const areaMax = Math.max(clamp(areaMaxRaw, 1e-6, 1e4, 10), areaMin * 1.01);

  const responsivity = responsivityOf(qe, wavelength_nm * 1e-9);
  const W = depletionWidth(capacitanceDensity, epsR); // m
  const fTransit = transitBandwidth(velocity, W);
  const capAt = (a_mm2: number) => capacitanceDensity * a_mm2 * 1e-6; // F
  const fRC1 = rcBandwidth(loadResistance, capAt(1));
  const f1 = combinedBandwidth(fRC1, fTransit);
  const alpha = absorptionDepth_um > 0 ? 1e6 / absorptionDepth_um : siliconAbsorption(wavelength_nm * 1e-9); // 1/m
  const driftShare = driftFraction(alpha, W, diffusionLength);
  const fDiffusion = diffusionBandwidth(alpha, W, diffusionLength, diffusivity);
  const diffusionLimited = driftShare < Math.SQRT1_2;

  // Response at 1 mm²: intrinsic drift + diffusion, times the RC pole and the transit sinc of the drift model.
  const response1 = { alpha, width: W, diffusionLength, diffusivity, fTransit, fRC: fRC1 };
  const fTotal = photodiodeBandwidth(response1);
  const fCorner = (diffusivity * (alpha ** 2 + diffusionLength ** -2)) / (2 * Math.PI);
  const fRef = Number.isFinite(fCorner) ? Math.min(f1, fCorner) : f1;
  const freqs = Array.from({ length: 300 }, (_, i) => (fRef / 1e3) * Math.pow((3 * f1) / (fRef / 1e3), i / 299));
  const intrinsic = freqs.map(f => cabs(diffusionResponse(f, alpha, W, diffusionLength, diffusivity)));
  const circuit = freqs.map(f => photodiodeResponse(f, { ...response1, alpha: 1, diffusionLength: 0 })); // L = 0: drift only, any α
  // Without 1/α (λ outside the Si table) only the circuit curve is drawn.
  const responseData = [
    { x: freqs, y: intrinsic, type: "scatter" as const, mode: "lines" as const, name: "Drift + diffusion", line: { color: "#f87171" } },
    { x: freqs, y: circuit, type: "scatter" as const, mode: "lines" as const, name: "RC × transit @ 1 mm²", line: { color: "#60a5fa", dash: "dash" } },
    { x: freqs, y: freqs.map(f => photodiodeResponse(f, response1)), type: "scatter" as const, mode: "lines" as const, name: "Total @ 1 mm²", line: { color: "#34d399", width: 2 } },
    { x: freqs, y: freqs.map(() => Math.SQRT1_2), type: "scatter" as const, mode: "lines" as const, name: "−3 dB", line: { color: "#6b7280", dash: "dot" } },
  ].filter(t => t.y.every(Number.isFinite));

  const areas = Array.from({ length: 300 }, (_, i) => areaMin * Math.pow(areaMax / areaMin, i / 299));
  const fRC = areas.map(a => rcBandwidth(loadResistance, capAt(a)));
  const chartData = [
    { x: areas, y: fRC, type: "scatter" as const, mode: "lines" as const, name: "RC limit", line: { color: "#60a5fa", dash: "dash" }, yaxis: "y" },
    { x: areas, y: areas.map(() => fTransit), type: "scatter" as const, mode: "lines" as const, name: "Transit limit", line: { color: "#fbbf24", dash: "dash" }, yaxis: "y" },
    ...(Number.isFinite(fDiffusion) ? [{ x: areas, y: areas.map(() => fDiffusion), type: "scatter" as const, mode: "lines" as const, name: "Diffusion −3 dB", line: { color: "#f472b6", dash: "dashdot" }, yaxis: "y" }] : []),
    { x: areas, y: fRC.map(f => combinedBandwidth(f, fTransit)), type: "scatter" as const, mode: "lines" as const, name: "Combined 3dB BW", line: { color: "#34d399", width: 2 }, yaxis: "y" },
    { x: areas, y: areas.map(a => capAt(a) * 1e12), type: "scatter" as const, mode: "lines" as const, name: "Capacitance (pF)", line: { color: "#f87171", dash: "dot" }, yaxis: "y2" },
  ];
  // Johnson noise of R_L across C_j in its noise bandwidth (π/2)·f_RC at 300 K: i² = 4kT/R_L·(π/2)·f_RC.
  const nep = fRC.map(f => (johnsonNoise(loadResistance, 300, (Math.PI / 2) * f).i / responsivity) * 1e12); // pW

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="10" />
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQe} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="Capacitance Density (pF/mm²)" value={capacitanceDensityRaw} onChange={setCapacitanceDensity} min={0.01} max={1e4} step="1" />
        <ValidatedNumberInput label="Relative Permittivity ε_r (Si 11.9)" value={epsRRaw} onChange={setEpsR} min={1} max={100} step="0.1" />
        <ValidatedNumberInput label="Slower-Carrier Velocity (m/s)" value={velocityRaw} onChange={setVelocity} min={1e3} max={1e6} step="1e4" />
        <ValidatedNumberInput label="Load Resistance (Ω)" value={loadResistanceRaw} onChange={setLoadResistance} min={1} max={1e9} step="10" />
        <ValidatedNumberInput label="Absorption Depth 1/α (µm, 0 = Si at λ)" value={absorptionDepthRaw} onChange={setAbsorptionDepth} min={0} max={1e5} step="1" />
        <ValidatedNumberInput label="Substrate Diffusion Length L (µm)" value={diffusionLengthRaw} onChange={setDiffusionLength} min={0} max={1e4} step="1" />
        <ValidatedNumberInput label="Minority-Carrier Diffusivity D (cm²/s)" value={diffusivityRaw} onChange={setDiffusivity} min={0.01} max={1e4} step="1" />
        <ValidatedNumberInput label="Area Min (mm²)" value={areaMinRaw} onChange={setAreaMin} min={1e-6} max={1e4} step="0.001" />
        <ValidatedNumberInput label="Area Max (mm²)" value={areaMaxRaw} onChange={setAreaMax} min={1e-6} max={1e4} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Responsivity" value={`${(responsivity * 1e3).toFixed(2)} mA/W`} tone="blue" />
        <ResultCard label="Depletion Width W" value={`${(W * 1e6).toFixed(2)} µm`} tone="cyan" subtext="ε₀·ε_r / C''" />
        <ResultCard label="Transit Limit" value={fmtHz(fTransit)} tone="orange" subtext="0.443·v/W, any area" />
        <ResultCard label="RC BW @ 1 mm²" value={fmtHz(fRC1)} tone="green" subtext={`C = ${(capAt(1) * 1e12).toPrecision(3)} pF, RC = ${(loadResistance * capAt(1) * 1e12).toFixed(2)} ps`} />
        <ResultCard label="Combined BW @ 1 mm²" value={fmtHz(f1)} tone="purple" subtext={`${fRC1 < fTransit ? "RC-limited" : "Transit-limited"}${diffusionLimited ? ", drift carriers only" : ""}`} />
        <ResultCard label="Drift Share" value={Number.isFinite(driftShare) ? `${(driftShare * 100).toFixed(1)} %` : "—"}
          tone="cyan" subtext={alpha > 0 ? `of DC photocurrent; 1/α = ${(1e6 / alpha).toPrecision(3)} µm` : "no Si absorption data at this λ (250–1450 nm): enter 1/α"} />
        <ResultCard label="Diffusion −3 dB" value={fDiffusion === Infinity ? "none" : Number.isFinite(fDiffusion) ? fmtHz(fDiffusion) : "—"}
          tone="red" subtext={fDiffusion === Infinity ? "drift share ≥ 70.7 %: plateau above −3 dB" : `intrinsic; τ = L²/D = ${((diffusionLength ** 2 / diffusivity) * 1e9).toPrecision(3)} ns`} />
        <ResultCard label="Total −3 dB @ 1 mm²" value={fmtHz(fTotal)} tone="purple" subtext="drift + diffusion × transit × RC" />
      </div>

      {diffusionLimited && (
        <p role="alert" className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          Only {(driftShare * 100).toFixed(1)} % of the photocurrent is generated inside W, so the response drops to that plateau
          ({(20 * Math.log10(driftShare)).toFixed(1).replace("-", "−")} dB) above the diffusion corner: the intrinsic −3 dB point is {fmtHz(fDiffusion)},
          and with the RC and transit limits the total at 1 mm² is {fmtHz(fTotal)}, not the {fmtHz(f1)} of the drift carriers alone. A thicker depletion region, a shorter wavelength or a thin epitaxial layer on a short-L substrate removes the tail.
        </p>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>C<sub>j</sub> = C&apos;&apos; · A, depletion width W = ε₀ε<sub>r</sub> / C&apos;&apos;</p>
        <p>f<sub>RC</sub> = 1 / (2π · R · C<sub>j</sub>), f<sub>tr</sub> = 0.443 · v / W (carrier crossing the full width)</p>
        <p>1/f<sub>3dB</sub>² = 1/f<sub>RC</sub>² + 1/f<sub>tr</sub>²</p>
        <p>Drift share (1 − e<sup>−αW</sup>) / (1 − e<sup>−αW</sup>/(1 + αL)); diffusion current e<sup>−αW</sup>·αL<sub>ω</sub>/(1 + αL<sub>ω</sub>), L<sub>ω</sub> = L/√(1 + iωτ), τ = L²/D</p>
        <p>ℛ = η · qλ / (hc) (responsivity)</p>
        <p>NEP<sub>thermal</sub> = √(4k<sub>B</sub>T/R<sub>L</sub> · (π/2)·f<sub>RC</sub>) / ℛ at 300 K (Johnson noise of R<sub>L</sub> in the RC noise bandwidth)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Bandwidth vs Area", font: { size: 12 } },
          xaxis: { title: "Area (mm²)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "3dB Bandwidth (Hz)", gridcolor: "#374151", type: "log" },
          yaxis2: { title: "Capacitance (pF)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" },
          margin: { t: 40, r: 60, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />

        <ChartPanel data={responseData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Frequency Response (normalised to DC)", font: { size: 12 } },
          xaxis: { title: "Frequency (Hz)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "|H(f)|", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 40, r: 20, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />

        <ChartPanel data={[{ x: areas, y: nep, type: "scatter" as const, mode: "lines" as const,
          name: "NEP", line: { color: "#fbbf24" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Thermal NEP vs Area", font: { size: 12 } },
          xaxis: { title: "Area (mm²)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "NEP in RC noise bandwidth (pW)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />
      </div>
    </>
  );
}
