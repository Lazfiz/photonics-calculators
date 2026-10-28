"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { FLUOROPHORES, bandAtWavelength, fluorophoreByName, integrateSpectrum } from "../../../physics/imaging/fluorophores";
import { conditionNumber, fcls, nnls, ols, olsCovariance, reconstruct, shareStdDev, simulateMixture } from "../../../physics/imaging/linear-unmixing";
import { createRng } from "../../../physics/random";

const COLORS = ["#34d399", "#fbbf24", "#f87171", "#a78bfa"];
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

export default function SpectralUnmixingPage() {
  const [d1, setD1] = useURLState("dye1", "EGFP");
  const [d2, setD2] = useURLState("dye2", "mVenus");
  const [d3, setD3] = useURLState("dye3", "mCherry");
  const [d4, setD4] = useURLState("dye4", "none");
  const [a1Raw, setA1] = useURLState("abundance1", 0.5);
  const [a2Raw, setA2] = useURLState("abundance2", 0.3);
  const [a3Raw, setA3] = useURLState("abundance3", 0.2);
  const [a4Raw, setA4] = useURLState("abundance4", 0.2);
  const [bandsRaw, setBands] = useURLState("numBands", 32);
  const [startRaw, setStart] = useURLState("startNm", 480);
  const [endRaw, setEnd] = useURLState("endNm", 720);
  const [photonsRaw, setPhotons] = useURLState("photons", 2000);
  const [readRaw, setRead] = useURLState("readNoise", 1);
  const [methodRaw, setMethod] = useURLState("method", "nnls");
  const [seedRaw, setSeed] = useURLState("seed", 1);

  const method = methodRaw === "ols" || methodRaw === "fcls" ? methodRaw : "nnls";
  const slots = [
    { name: d1, set: setD1, aRaw: a1Raw, setA: setA1 },
    { name: d2, set: setD2, aRaw: a2Raw, setA: setA2 },
    { name: d3, set: setD3, aRaw: a3Raw, setA: setA3 },
    { name: d4, set: setD4, aRaw: a4Raw, setA: setA4 },
  ];
  const active = slots.filter((s, i) => i < 2 || s.name !== "none");
  const dyes = active.map((s) => fluorophoreByName(s.name));
  const aIn = active.map((s) => clamp(s.aRaw, 0, 1, 0));
  const aSum = aIn.reduce((s, v) => s + v, 0);
  const aTrue = aSum > 0 ? aIn.map((v) => v / aSum) : aIn.map(() => 1 / aIn.length);
  const bands = Math.round(clamp(bandsRaw, 4, 128, 32));
  const start = Math.min(clamp(startRaw, 350, 950, 480), 1000 - bands);
  const end = Math.max(start + bands, clamp(endRaw, 360, 1000, 720));
  const photons = clamp(photonsRaw, 1, 1e8, 2000);
  const readNoise = clamp(readRaw, 0, 100, 1);
  const seed = Math.round(clamp(seedRaw, 0, 1e6, 1));

  // E[b][j]: fraction of dye j's detected photons that fall in band b (columns sum to 1).
  const step = (end - start) / bands;
  const centres = Array.from({ length: bands }, (_, b) => start + (b + 0.5) * step);
  const shapes = dyes.map((f) => (l: number) => bandAtWavelength(f.em, l));
  const inRange = shapes.map((s) => integrateSpectrum(s, start * 1e-9, end * 1e-9));
  const E = centres.map((c) => shapes.map((s, j) => integrateSpectrum(s, (c - step / 2) * 1e-9, (c + step / 2) * 1e-9) / inRange[j]));

  const xTrue = aTrue.map((a) => a * photons);
  const { variance, y } = simulateMixture(E, xTrue, readNoise, createRng(seed));
  const xHat = method === "ols" ? ols(E, y) : method === "fcls" ? fcls(E, y, y.reduce((s, v) => s + v, 0)) : nnls(E, y);
  const xSum = xHat.reduce((s, v) => s + v, 0);
  const fit = reconstruct(E, xHat);
  const cov = olsCovariance(E, variance);
  const shareSigma = shareStdDev(xTrue, cov);
  const kappa = conditionNumber(E);
  const resid = y.map((v, b) => v - fit[b]);
  const rms = Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / bands);
  const chi2 = resid.reduce((s, r, b) => s + (r * r) / variance[b], 0) / Math.max(1, bands - dyes.length);
  const solved = xHat.every(Number.isFinite);

  const spectrum = [
    { x: centres, y, type: "scatter" as const, mode: "markers" as const, name: "Measured", marker: { color: "#e5e7eb", size: 5 } },
    { x: centres, y: fit, type: "scatter" as const, mode: "lines" as const, name: "Fit E·x̂", line: { color: "#ffffff", width: 2, dash: "dash" } },
    ...dyes.map((f, j) => ({
      x: centres, y: E.map((r) => r[j] * (solved ? xHat[j] : 0)), type: "scatter" as const, mode: "lines" as const, name: f.name, line: { color: COLORS[j], width: 2 },
    })),
  ];
  // Relative error σ_j/x_j against the photon budget: band variance (E·x)_b + σ_r² with x ∝ N.
  const relError = (j: number, N: number) => {
    if (!(aTrue[j] > 0)) return NaN;
    const m = reconstruct(E, aTrue.map((a) => a * N));
    const c = olsCovariance(E, m.map((v) => v + readNoise * readNoise));
    return (100 * Math.sqrt(c[j][j])) / (aTrue[j] * N);
  };
  // 1 to 1e8 photons: the whole input range, so the current point is always on the axis.
  const budgets = Array.from({ length: 41 }, (_, i) => 10 ** ((8 * i) / 40));
  const errorCurves = dyes.map((f, j) => ({
    x: budgets,
    y: budgets.map((N) => relError(j, N)),
    type: "scatter" as const, mode: "lines" as const, name: f.name, line: { color: COLORS[j], width: 2 },
  }));
  const errorNow = {
    x: dyes.map(() => photons), y: dyes.map((_, j) => relError(j, photons)), type: "scatter" as const, mode: "markers" as const, name: "Current",
    marker: { color: dyes.map((_, j) => COLORS[j]), size: 10, line: { color: "#ffffff", width: 1.5 } },
  };
  const rewritten = start !== clamp(startRaw, 350, 950, 480) || end !== clamp(endRaw, 360, 1000, 720);
  const lowPhotons = photons / bands < 20;

  const missing = dyes.filter((_, j) => !(inRange[j] > 0)).map((f) => f.name);
  const duplicate = new Set(dyes.map((f) => f.name)).size < dyes.length;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          {slots.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 items-end">
              <label className="block text-sm text-gray-400">
                Endmember {i + 1}
                <select value={i >= 2 && s.name === "none" ? "none" : fluorophoreByName(s.name).name} onChange={(e) => s.set(e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                  {i >= 2 && <option value="none">none</option>}
                  {FLUOROPHORES.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
                </select>
              </label>
              <ValidatedNumberInput label="Share of photons" value={s.aRaw} onChange={s.setA} min={0} max={1} step="0.05" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <ValidatedNumberInput label="Detected photons per pixel" value={photonsRaw} onChange={setPhotons} min={1} max={1e8} step="100" />
            <ValidatedNumberInput label="Read noise per band (e⁻)" value={readRaw} onChange={setRead} min={0} max={100} step="0.1" />
            <ValidatedNumberInput label="Spectral bands" value={bandsRaw} onChange={setBands} min={4} max={128} step="1" />
            <ValidatedNumberInput label="Noise seed" value={seedRaw} onChange={setSeed} min={0} max={1e6} step="1" />
            <ValidatedNumberInput label="Range start (nm)" value={startRaw} onChange={setStart} min={350} max={950} step="1" />
            <ValidatedNumberInput label="Range end (nm)" value={endRaw} onChange={setEnd} min={360} max={1000} step="1" />
          </div>
          <label className="block text-sm text-gray-400">
            Method
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="ols">OLS: unconstrained least squares</option>
              <option value="nnls">NNLS: non-negative (Lawson–Hanson)</option>
              <option value="fcls">FCLS: non-negative, sum = measured total</option>
            </select>
          </label>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {missing.length > 0 && <p className="text-sm text-amber-400">{`No emission of ${missing.join(", ")} falls in the detected range: widen the range or drop the dye.`}</p>}
          {duplicate && <p className="text-sm text-amber-400">Two endmembers are the same dye: E is rank deficient and the abundances are not identifiable.</p>}
          {rewritten && <p className="text-sm text-yellow-300" role="status">{`The range was adjusted to ${fmt(start, 0)}–${fmt(end, 0)} nm (the end must be at least one nm per band above the start); this range is used.`}</p>}
          {lowPhotons && <p className="text-sm text-yellow-300" role="status">{`Only ${fmt(photons / bands, 1)} photons per band: below about 20 the Gaussian shot-noise approximation is crude (Poisson counts are skewed), so the ±σ and the simulated noise are unreliable.`}</p>}
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-gray-400"><th className="text-left font-normal">Dye</th><th className="text-right font-normal">True</th><th className="text-right font-normal">Estimate</th><th className="text-right font-normal">±σ</th></tr>
            </thead>
            <tbody>
              {dyes.map((f, j) => (
                <tr key={j}>
                  <td style={{ color: COLORS[j] }}>{f.name}</td>
                  <td className="text-right">{fmt(aTrue[j] * 100, 1, " %")}</td>
                  <td className="text-right text-green-400">{fmt((xHat[j] / xSum) * 100, 1, " %")}</td>
                  <td className="text-right text-yellow-400">{fmt(shareSigma[j] * 100, 1, " %")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {row("Condition number κ(E)", kappa === Infinity ? "∞" : fmt(kappa, 2), "text-purple-400")}
          {row("Residual rms", fmt(rms, 2, " e⁻/band"))}
          {row("χ²/(B − K)", fmt(chi2, 2))}
          {row("Band width", fmt(step, 2, " nm"))}
          <p className="text-xs text-gray-500">The ±σ column is the OLS standard error of each share, from (EᵀE)⁻¹EᵀVE(EᵀE)⁻¹ by the delta method (FCLS errors are smaller); χ²/(B − K) ≈ 1 when the model fits within the noise.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Measured spectrum and unmixed components</h3>
          <ChartPanel data={spectrum} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Photoelectrons per band", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 60 }, showlegend: true,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Relative error σ/x vs photon budget</h3>
          <ChartPanel data={[...errorCurves, errorNow]} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Detected photons per pixel", gridcolor: "#374151", type: "log" }, yaxis: { title: "σ/x (%)", gridcolor: "#374151", type: "log" },
            margin: { t: 30, r: 20, b: 50, l: 60 }, showlegend: true,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="space-y-1 text-sm text-gray-300 font-mono">
          <p>y = E·x + n, E_bj = ∫_band b F_j dλ / ∫_range F_j dλ, var(n_b) = (E·x)_b + σ_read²</p>
          <p>OLS x̂ = (EᵀE)⁻¹Eᵀy; NNLS min‖y − Ex‖² with x ≥ 0; FCLS adds Σx = Σy</p>
          <p>Cov(x̂) = (EᵀE)⁻¹ Eᵀ diag(var) E (EᵀE)⁻¹, κ(E) = √(λ_max/λ_min of EᵀE)</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Endmembers are the FPbase-fitted emission bands of the fluorescence-spectra page, binned into equal bands between
          the range limits; x is the number of detected photons from each dye. One noisy pixel is simulated from a seeded
          generator, with shot noise in its Gaussian limit and read noise in every band; change the seed for another noise
          draw. Background, autofluorescence and errors in the reference spectra are not included: in practice those, not
          shot noise, often limit unmixing.
        </p>
      </div>
    </>
  );
}
