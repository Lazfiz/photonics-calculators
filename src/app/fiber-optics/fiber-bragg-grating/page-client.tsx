"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  chirpedBandwidth, chirpedGratingDispersion, couplingCoefficient, firstZeroBandwidth, gratingSections,
  maxChirp, peakReflectance, spectrumFwhm, transferMatrixReflectance, uniformFwhm, uniformGratingReflectance,
} from "../../../physics/fiber-optics/fiber-bragg-grating";

type GratingType = "uniform" | "apodized" | "chirped";
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

export default function FiberBraggGratingCalculator() {
  const [braggWavelength, setBraggWavelength] = useURLState("braggWavelength", 1550, { min: 200, max: 3000 }); // nm
  const [effectiveIndex, setEffectiveIndex] = useURLState("effectiveIndex", 1.447);
  const [gratingLength, setGratingLength] = useURLState("gratingLength", 10); // mm
  const [indexModulation, setIndexModulation] = useURLState("indexModulation", 1e-4); // Δn
  const [gratingType, setGratingType] = useURLState("gratingType", "uniform");
  const [chirpRate, setChirpRate] = useURLState("chirpRate", 0.1, { min: -50, max: 50 }); // nm/mm
  const type: GratingType = gratingType === "apodized" || gratingType === "chirped" ? gratingType : "uniform";

  const r = useMemo(() => {
    const lambdaB = clamp(braggWavelength, 200, 3000) * 1e-9;
    const nEff = clamp(effectiveIndex, 1, 3);
    const length = clamp(gratingLength, 0.1, 1000) * 1e-3;
    const deltaN = clamp(indexModulation, 1e-8, 1e-2);
    // nm/mm → m/m, limited so that λ_B(z) stays within ±5 % of λ_B.
    const chirpLimit = maxChirp(lambdaB, length);
    const chirp = type === "chirped" ? clamp(chirpRate * 1e-6, -chirpLimit, chirpLimit) : 0;
    const g = { lambdaB, nEff, length, deltaN };
    const period = lambdaB / (2 * nEff);
    const kappaL = couplingCoefficient(deltaN, lambdaB) * length;
    const zeroWidth = firstZeroBandwidth(g);

    // Piecewise-uniform model for apodized and chirped gratings (200–5000 sections, each ≥ 20 periods).
    const sections = gratingSections({ ...g, apodization: type === "apodized" ? "gaussian" : "uniform", chirp });
    const reflect = (lam: number) =>
      type === "uniform" ? uniformGratingReflectance(g, lam) : transferMatrixReflectance(sections, nEff, lam);

    const halfSpan = 1.5 * zeroWidth + chirpedBandwidth(chirp, length) / 2;
    const n = 600;
    const x: number[] = [], y: (number | null)[] = [];
    for (let i = 0; i <= n; i++) {
      const lam = lambdaB - halfSpan + (2 * halfSpan * i) / n;
      const R = reflect(lam);
      x.push(lam * 1e9);
      y.push(Number.isFinite(R) ? R : null);
    }
    const sampledPeak = Math.max(...y.map((v) => v ?? 0));

    return {
      period, numPeriods: length / period, kappaL, zeroWidth,
      peak: type === "uniform" ? peakReflectance(kappaL) : sampledPeak,
      fwhm: type === "uniform" ? uniformFwhm(g) : spectrumFwhm(reflect, lambdaB - halfSpan, lambdaB + halfSpan, n),
      chirpWidth: chirpedBandwidth(chirp, length),
      chirpClamped: type === "chirped" && Math.abs(chirpRate * 1e-6) > chirpLimit, chirpLimit,
      dispersion: chirpedGratingDispersion(nEff, chirp) * 1e3, // s/m → ps/nm
      spectrum: { x, y },
    };
  }, [braggWavelength, effectiveIndex, gratingLength, indexModulation, type, chirpRate]);

  const nm = (v: number, digits = 4) => (Number.isFinite(v) ? `${(v * 1e9).toFixed(digits)} nm` : "—");

  const layout = {
    title: "Fiber Bragg Grating Reflection Spectrum",
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: false, height: 400,
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="grating-type" className="block text-sm font-medium mb-2">Grating Type</label>
            <select id="grating-type" value={type} onChange={(e) => setGratingType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
              <option value="uniform">Uniform</option>
              <option value="apodized">Apodized (Gaussian, FWHM = L/2)</option>
              <option value="chirped">Linearly chirped</option>
            </select>
          </div>
          <ValidatedNumberInput label="Bragg Wavelength λ_B (nm)" value={braggWavelength} onChange={setBraggWavelength} min={200} max={3000} step="1" />
          <ValidatedNumberInput label="Effective Index n_eff (phase)" value={effectiveIndex} onChange={setEffectiveIndex} min={1} max={3} step="0.001" />
          <ValidatedNumberInput label="Grating Length (mm)" value={gratingLength} onChange={setGratingLength} min={0.1} max={1000} step="0.5" />
          <ValidatedNumberInput label="Index Modulation Amplitude Δn" value={indexModulation} onChange={setIndexModulation} min={1e-8} max={1e-2} step="1e-5" />
          {type === "chirped" && (
            <ValidatedNumberInput label="Chirp dλ_B/dz (nm/mm)" value={chirpRate} onChange={setChirpRate} min={-50} max={50} step="0.01" />
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Results</h2>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-400">Grating period Λ:</span><span className="font-mono">{(r.period * 1e9).toFixed(2)} nm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Number of periods:</span><span className="font-mono">{r.numPeriods.toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Coupling strength κL:</span><span className="font-mono">{r.kappaL.toFixed(3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Peak reflectance:</span><span className="font-mono text-lg text-blue-400">{(r.peak * 100).toFixed(2)} %</span></div>
              <div className="flex justify-between"><span className="text-gray-400">FWHM bandwidth:</span><span className="font-mono">{nm(r.fwhm)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Uniform first-zero width:</span><span className="font-mono">{nm(r.zeroWidth)}</span></div>
              {type === "chirped" && (
                <>
                  {r.chirpClamped && (
                    <p className="text-sm text-yellow-300">Chirp limited to ±{(r.chirpLimit * 1e6).toFixed(3)} nm/mm so that |dλ_B/dz|·L ≤ 0.1·λ_B.</p>
                  )}
                  <div className="flex justify-between"><span className="text-gray-400">Chirp bandwidth |dλ_B/dz|·L:</span><span className="font-mono text-yellow-400">{nm(r.chirpWidth, 3)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Dispersion |D|:</span><span className="font-mono">{Number.isFinite(r.dispersion) ? `${r.dispersion.toFixed(1)} ps/nm` : "—"}</span></div>
                </>
              )}
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-sm space-y-1">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas (Erdogan 1997)</h3>
            <p className="font-mono">λ_B = 2·n_eff·Λ, κ = π·Δn/λ</p>
            <p className="font-mono">σ̂ = 2π·n_eff·(1/λ − 1/λ_B), γ² = κ² − σ̂²</p>
            <p className="font-mono">R = sinh²(γL) / (cosh²(γL) − σ̂²/κ²), R_max = tanh²(κL)</p>
            <p className="font-mono">Δλ₀ = (λ·Δn/n_eff)·√(1 + (λ/(Δn·L))²)</p>
            {type === "chirped" && <p className="font-mono">|D| = 2·n_eff / (c·|dλ_B/dz|) (Ouellette 1987)</p>}
            <p className="text-gray-400">
              {type === "uniform"
                ? "Uniform: closed form. FWHM found numerically."
                : "Apodized and chirped spectra: transfer matrices over uniform sections. Apodization varies the ac modulation only. The dispersion sign depends on which end is lit."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
        <ChartPanel
          data={[{ ...r.spectrum, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#3b82f6", width: 2 } }]}
          layout={layout}
        />
        <p className="sr-only">
          Reflection spectrum: peak {(r.peak * 100).toFixed(1)} % at {braggWavelength} nm, FWHM {nm(r.fwhm)}.
        </p>
      </div>
    </>
  );
}
