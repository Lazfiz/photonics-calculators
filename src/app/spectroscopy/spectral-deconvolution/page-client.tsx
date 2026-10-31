"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { hc_eV_nm } from "../../../physics/constants";
import {
  PROFILES,
  bandStats,
  bandSum,
  dipDepth,
  fitHeights,
  franckCondonWeights,
  gaussianNoise,
  peakArea,
  peakShape,
  vibronicSpectrum,
  vibronicSpectrumNm,
  type Peak,
  type Profile,
} from "../../../physics/spectroscopy/peak-model";

// Band mode: positions and widths in one unit of the user's choice; vibronic mode: λ in nm, wavenumbers in cm⁻¹.
const MODES = ["bands", "vibronic"] as const;
type Mode = (typeof MODES)[number];
const modeLabel: Record<Mode, string> = { bands: "Overlapping bands", vibronic: "Vibronic emission band" };
const profileLabel: Record<Profile, string> = { gaussian: "Gaussian", lorentzian: "Lorentzian", "pseudo-voigt": "Pseudo-Voigt" };
const DEFAULT_PEAKS = "480:25:0.7,520:35:1,570:30:0.5";
const MAX_PEAKS = 5, X_LIM = 1e6, W_MIN = 1e-6, N_SAMPLES = 600, LINE_MIN = 100;
const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];
const vibronicColors = ["#34d399", "#fbbf24", "#a78bfa", "#22d3ee"]; // 0–0 … 0–3, none blue or red like the two bands

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 1e-3 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(3);
const round6 = (y: number) => Math.round(y * 1e6) / 1e6;
const fmtCm = (x: number) => (Number.isFinite(x) ? x.toFixed(0) : "—");

function parsePeaks(s: string): Peak[] {
  const peaks = s
    .split(",")
    .map((t) => t.split(":").map(Number))
    .filter((v) => v.length === 3 && v.every(Number.isFinite))
    .slice(0, MAX_PEAKS)
    .map(([c, w, h]) => ({ center: clamp(c, -X_LIM, X_LIM, 0), fwhm: clamp(w, W_MIN, X_LIM, 1), height: clamp(h, 0, X_LIM, 1) }));
  return peaks.length > 0 ? peaks : parsePeaks(DEFAULT_PEAKS);
}
const serialise = (peaks: Peak[]) => peaks.map((p) => `${p.center}:${p.fwhm}:${p.height}`).join(",");

export default function SpectralDeconvolutionPage() {
  const [modeRaw, setMode] = useURLState("mode", "bands");
  const [profileRaw, setProfile] = useURLState("profile", "gaussian");
  const [etaRaw, setEta] = useURLState("eta", 0.5);
  const [peaksRaw, setPeaksRaw] = useURLState("peaks", DEFAULT_PEAKS);
  const [noiseRaw, setNoise] = useURLState("noise", 0.02);
  const [seedRaw, setSeed] = useURLState("seed", 1);
  const [xMinRaw, setXMin] = useURLState("xMin", 400);
  const [xMaxRaw, setXMax] = useURLState("xMax", 700);
  const [lambda00Raw, setLambda00] = useURLState("lambda00", 500); // nm
  const [nuVibRaw, setNuVib] = useURLState("nuVib", 1400); // cm⁻¹
  const [hrRaw, setHr] = useURLState("S", 1);
  const [lineFwhmRaw, setLineFwhm] = useURLState("lineFwhm", 1000); // cm⁻¹

  const mode: Mode = (MODES as readonly string[]).includes(modeRaw) ? (modeRaw as Mode) : "bands";

  return (
    <>
      <div role="group" aria-label="Model" className="flex gap-2 mb-5 flex-wrap">
        {MODES.map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 rounded text-sm ${mode === m ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {modeLabel[m]}
          </button>
        ))}
      </div>
      {mode === "bands" ? (
        <BandModel
          {...{ profileRaw, setProfile, etaRaw, setEta, peaksRaw, setPeaksRaw, noiseRaw, setNoise, seedRaw, setSeed, xMinRaw, setXMin, xMaxRaw, setXMax }}
        />
      ) : (
        <VibronicModel {...{ lambda00Raw, setLambda00, nuVibRaw, setNuVib, hrRaw, setHr, lineFwhmRaw, setLineFwhm }} />
      )}
    </>
  );
}

type Setter<T> = (v: T) => void;

function BandModel(props: {
  profileRaw: string; setProfile: Setter<string>; etaRaw: number; setEta: Setter<number>;
  peaksRaw: string; setPeaksRaw: Setter<string>; noiseRaw: number; setNoise: Setter<number>;
  seedRaw: number; setSeed: Setter<number>; xMinRaw: number; setXMin: Setter<number>; xMaxRaw: number; setXMax: Setter<number>;
}) {
  const { profileRaw, setProfile, etaRaw, setEta, peaksRaw, setPeaksRaw, noiseRaw, setNoise, seedRaw, setSeed, xMinRaw, setXMin, xMaxRaw, setXMax } = props;
  const profile: Profile = (PROFILES as readonly string[]).includes(profileRaw) ? (profileRaw as Profile) : "gaussian";
  const eta = clamp(etaRaw, 0, 1, 0.5);
  const peaks = parsePeaks(peaksRaw);
  const noise = clamp(noiseRaw, 0, 1, 0.02);
  const seed = Math.round(clamp(seedRaw, 1, 1e6, 1));
  const xMin = clamp(xMinRaw, -X_LIM, X_LIM, 400);
  const xMax = clamp(xMaxRaw, -X_LIM, X_LIM, 700);
  const setPeaks = (p: Peak[]) => setPeaksRaw(serialise(p));
  const updatePeak = (i: number, key: keyof Peak, v: number) => setPeaks(peaks.map((p, j) => (j === i ? { ...p, [key]: v } : p)));

  const validWindow = xMax > xMin;
  const step = (xMax - xMin) / N_SAMPLES;
  const xs = validWindow ? Array.from({ length: N_SAMPLES + 1 }, (_, i) => xMin + i * step) : [];
  const total = (x: number) => bandSum(x, peaks, profile, eta);
  const sigma = noise * Math.max(...peaks.map((p) => p.height));
  const draw = gaussianNoise(xs.length, seed);
  const data = xs.map((x, i) => total(x) + sigma * draw[i]);
  const fit = validWindow ? fitHeights(xs, data, peaks, profile, eta) : null;
  const areas = peaks.map((p) => peakArea(p.height, p.fwhm, profile, eta));
  const sumArea = areas.reduce((s, a) => s + a, 0);
  const stats = validWindow ? bandStats(total, xMin, xMax) : null;
  const narrow = peaks.some((p) => p.fwhm < 3 * step);
  const outside = peaks.some((p) => p.center < xMin || p.center > xMax);
  const order = peaks.map((_, i) => i).sort((a, b) => peaks[a].center - peaks[b].center);
  const pairs = order.slice(1).map((j, k) => {
    const i = order[k];
    const sep = peaks[j].center - peaks[i].center;
    return { i, j, ratio: sep / ((peaks[i].fwhm + peaks[j].fwhm) / 2), dip: sep > 0 ? dipDepth(total, peaks[i].center, peaks[j].center) : 0, corr: fit ? fit.correlation[i][j] : NaN };
  });

  const series = validWindow
    ? [
        { name: "Simulated data (sum + noise)", color: "#6b7280", points: xs.map((x, i) => ({ x, y: round6(data[i]) })) },
        ...peaks.map((p, i) => ({
          name: `Peak ${i + 1}`,
          color: colors[i],
          dashed: true,
          points: xs.map((x) => ({ x, y: round6(p.height * peakShape(x - p.center, p.fwhm, profile, eta)) })),
        })),
        ...(fit ? [{ name: "Fitted sum", color: "#e5e7eb", points: xs.map((x) => ({ x, y: round6(bandSum(x, peaks.map((p, i) => ({ ...p, height: fit.heights[i] })), profile, eta)) })) }] : []),
      ]
    : [];

  return (
    <>
      <div role="group" aria-label="Peak profile" className="flex gap-2 mb-5 flex-wrap">
        {PROFILES.map((p) => (
          <button key={p} onClick={() => setProfile(p)} className={`px-3 py-1 rounded text-sm ${profile === p ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {profileLabel[p]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="Window start (x unit)" value={xMinRaw} onChange={setXMin} min={-X_LIM} max={X_LIM} />
        <ValidatedNumberInput label="Window end (x unit)" value={xMaxRaw} onChange={setXMax} min={-X_LIM} max={X_LIM} />
        <ValidatedNumberInput label="Noise σ (fraction of the tallest peak)" value={noiseRaw} onChange={setNoise} min={0} max={1} />
        {profile === "pseudo-voigt" && <ValidatedNumberInput label="Lorentzian fraction η" value={etaRaw} onChange={setEta} min={0} max={1} />}
      </div>

      <div className="space-y-3 mb-4">
        {peaks.map((p, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-3">
            <ValidatedNumberInput label={`Peak ${i + 1} centre`} value={p.center} onChange={(v) => updatePeak(i, "center", v)} min={-X_LIM} max={X_LIM} />
            <ValidatedNumberInput label={`Peak ${i + 1} FWHM`} value={p.fwhm} onChange={(v) => updatePeak(i, "fwhm", v)} min={W_MIN} max={X_LIM} />
            <ValidatedNumberInput label={`Peak ${i + 1} height`} value={p.height} onChange={(v) => updatePeak(i, "height", v)} min={0} max={X_LIM} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-8 flex-wrap">
        {peaks.length < MAX_PEAKS && (
          <button
            onClick={() => setPeaks([...peaks, { center: round6((xMin + xMax) / 2), fwhm: round6(Math.max(W_MIN, Math.abs(xMax - xMin) / 10)), height: 0.5 }])}
            className="px-3 py-1 rounded text-sm bg-gray-800 text-gray-300"
          >
            Add a peak
          </button>
        )}
        {peaks.length > 1 && (
          <button onClick={() => setPeaks(peaks.slice(0, -1))} className="px-3 py-1 rounded text-sm bg-gray-800 text-gray-300">
            Remove the last peak
          </button>
        )}
        <button onClick={() => setSeed((seed % 1e6) + 1)} className="px-3 py-1 rounded text-sm bg-gray-800 text-gray-300">
          New noise draw (seed {seed})
        </button>
      </div>

      {!validWindow && <p className="mb-4 text-sm text-amber-300">The window end must be above its start.</p>}
      {validWindow && narrow && <p className="mb-4 text-sm text-amber-300">A peak is narrower than three sample steps ({fmt(step)}): widen it or narrow the window.</p>}
      {validWindow && outside && <p className="mb-4 text-sm text-amber-300">A peak centre lies outside the window, so only its wing is sampled and its height is poorly determined.</p>}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <ResultCard label="Band maximum" value={fmt(stats.peak)} tone="blue" subtext={`height ${fmt(stats.max)}`} />
          <ResultCard label="Band FWHM" value={fmt(stats.fwhm)} tone="green" subtext={Number.isFinite(stats.fwhm) ? "around the main maximum" : "the band doesn't fall to half within the window"} />
          <ResultCard label="Band centroid" value={fmt(stats.centroid)} tone="yellow" subtext="first moment over the window" />
          <ResultCard label="Total area" value={fmt(sumArea)} tone="purple" subtext="Σ height × FWHM × shape factor, whole lines" />
        </div>
      )}

      {validWindow && (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm text-gray-300">
            <caption className="text-left text-gray-400 mb-2">Peaks: true values and the least-squares heights fitted to the simulated data (± 1 standard error)</caption>
            <thead>
              <tr className="text-left text-gray-400">
                <th className="py-1 pr-3">Peak</th><th className="pr-3">Centre</th><th className="pr-3">FWHM</th><th className="pr-3">Height</th>
                <th className="pr-3">Area</th><th className="pr-3">Area share</th><th className="pr-3">Fitted height</th><th>Fitted area</th>
              </tr>
            </thead>
            <tbody>
              {peaks.map((p, i) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className="py-1 pr-3" style={{ color: colors[i] }}>{i + 1}</td>
                  <td className="pr-3">{fmt(p.center)}</td>
                  <td className="pr-3">{fmt(p.fwhm)}</td>
                  <td className="pr-3">{fmt(p.height)}</td>
                  <td className="pr-3">{fmt(areas[i])}</td>
                  <td className="pr-3">{sumArea > 0 ? `${fmt((100 * areas[i]) / sumArea, 3)} %` : "—"}</td>
                  <td className="pr-3">{fit ? `${fmt(fit.heights[i])} ± ${fmt(fit.stdErrors[i], 2)}` : "—"}</td>
                  <td>{fit ? `${fmt(peakArea(fit.heights[i], p.fwhm, profile, eta))} ± ${fmt(peakArea(fit.stdErrors[i], p.fwhm, profile, eta), 2)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!fit && <p className="mt-2 text-sm text-amber-300">The heights can&apos;t be separated: two peaks share a centre and width, or a peak has no samples under it.</p>}
        </div>
      )}

      {validWindow && pairs.length > 0 && (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm text-gray-300">
            <caption className="text-left text-gray-400 mb-2">Neighbouring peaks</caption>
            <thead>
              <tr className="text-left text-gray-400">
                <th className="py-1 pr-3">Pair</th><th className="pr-3">Separation / mean FWHM</th><th className="pr-3">Dip between them</th><th>Height correlation</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map(({ i, j, ratio, dip, corr }) => (
                <tr key={`${i}-${j}`} className="border-t border-gray-800">
                  <td className="py-1 pr-3">{i + 1} – {j + 1}</td>
                  <td className="pr-3">{fmt(ratio, 3)}</td>
                  <td className="pr-3">{dip > 0 ? `${fmt(100 * dip, 3)} % (resolved)` : "none (one merged band)"}</td>
                  <td>{fmt(corr, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {series.length > 0 && <SimpleLineChart title="Band model and simulated spectrum" xLabel="x (the unit of the centres and widths)" yLabel="Intensity (a.u.)" series={series} />}

      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">I(x) = Σᵢ hᵢ · shape((x − xᵢ)/wᵢ)</p>
        <p className="font-mono text-green-400">Gaussian exp(−4 ln2 u²), area √(π/(4 ln2)) h w; Lorentzian 1/(1 + 4u²), area (π/2) h w</p>
        <p className="font-mono text-yellow-400">pseudo-Voigt η·L + (1 − η)·G with one FWHM; heights: (BᵀB) h = Bᵀy, cov = s²(BᵀB)⁻¹</p>
        <p>
          The spectrum is the sum of the peaks you enter, sampled at {N_SAMPLES + 1} points, plus seeded Gaussian noise. The
          heights are then fitted to that simulated spectrum by linear least squares with every centre and width held at its
          true value, which is the best case: the standard errors and the negative correlation between neighbours show how
          overlap alone trades area from one peak to the next. A real deconvolution also fits the centres and widths (nonlinear
          least squares from starting guesses); then the errors grow, and peaks closer than about one FWHM are often not
          unique. Gaussian bands describe inhomogeneous broadening (a distribution of environments), Lorentzian bands
          homogeneous broadening (lifetime, collisions). Two equal Gaussians show a dip only when they are more than
          2σ ≈ 0.849 FWHM apart, two equal Lorentzians more than FWHM/√3 ≈ 0.577 FWHM.
        </p>
      </div>
    </>
  );
}

function VibronicModel(props: {
  lambda00Raw: number; setLambda00: Setter<number>; nuVibRaw: number; setNuVib: Setter<number>;
  hrRaw: number; setHr: Setter<number>; lineFwhmRaw: number; setLineFwhm: Setter<number>;
}) {
  const { lambda00Raw, setLambda00, nuVibRaw, setNuVib, hrRaw, setHr, lineFwhmRaw, setLineFwhm } = props;
  const lambda00 = clamp(lambda00Raw, 150, 3000, 500);
  const nuVib = clamp(nuVibRaw, 10, 5000, 1400);
  const S = clamp(hrRaw, 0, 10, 1);
  const lineFwhm = clamp(lineFwhmRaw, LINE_MIN, 10000, 1000);
  const nu00 = 1e7 / lambda00;
  const band = { nu00, nuVib, S, fwhm: lineFwhm };
  const weights = franckCondonWeights(S);

  // Window: the progression out to S + 4√S + 2 quanta on either side, plus two line widths; red end kept above ν̃₀₀/10.
  // Sample counts give ≥ 10 samples per line width (fewer only past the 40000 cap). In wavelength a line is
  // λ²·Δν̃/10⁷ wide, narrowest at the blue end; the emission lies to the red of 1e7/(ν̃₀₀ + 3Δν̃).
  const span = (S + 4 * Math.sqrt(S) + 2) * nuVib + 2 * lineFwhm;
  const nuLo = Math.max(nu00 - span, nu00 / 10), nuHi = nu00 + span;
  const lamLo = 1e7 / nuHi, lamHi = 1e7 / nuLo, lamEmLo = 1e7 / (nu00 + 3 * lineFwhm);
  const samplesFor = (range: number, width: number) => Math.min(40000, Math.max(2000, Math.ceil((10 * range) / width)));
  const nuSamples = samplesFor(nuHi - nuLo, lineFwhm);
  const abs = bandStats((n) => vibronicSpectrum(n, band, "absorption", weights), nuLo, nuHi, nuSamples);
  const emNu = bandStats((n) => vibronicSpectrum(n, band, "emission", weights), nuLo, nuHi, nuSamples);
  const emNm = bandStats((l) => vibronicSpectrumNm(l, band, "emission", weights), lamEmLo, lamHi, samplesFor(lamHi - lamEmLo, (lamEmLo ** 2 * lineFwhm) / 1e7));
  const reorg = S * nuVib;

  const n = Math.min(3000, Math.max(500, Math.ceil((4 * (lamHi - lamLo)) / ((lamLo ** 2 * lineFwhm) / 1e7))));
  // Plot only where either band is above 0.1 % of its peak.
  const grid = Array.from({ length: n + 1 }, (_, i) => lamLo + ((lamHi - lamLo) * i) / n);
  const absAll = grid.map((l) => vibronicSpectrumNm(l, band, "absorption", weights) / abs.max);
  const emAll = grid.map((l) => vibronicSpectrumNm(l, band, "emission", weights) / emNm.max);
  const seen = grid.map((_, i) => absAll[i] > 1e-3 || emAll[i] > 1e-3);
  const i0 = Math.max(0, seen.indexOf(true) - 1), i1 = Math.min(n, seen.lastIndexOf(true) + 1);
  const lams = i1 > i0 ? grid.slice(i0, i1 + 1) : grid;
  const absY = i1 > i0 ? absAll.slice(i0, i1 + 1) : absAll;
  const emY = i1 > i0 ? emAll.slice(i0, i1 + 1) : emAll;
  const components = weights
    .map((w, k) => ({ w, k }))
    .filter(({ w, k }) => k < 4 && w > 1e-3 && S > 0)
    .map(({ k }) => ({
      name: `Emission 0–${k}`,
      color: vibronicColors[k],
      dashed: true,
      points: lams.map((l) => ({ x: l, y: round6(vibronicSpectrumNm(l, band, "emission", weights.map((w, m) => (m === k ? w : 0))) / emNm.max) })),
    }));
  const series = [
    { name: "Absorption ε(λ)", color: "#60a5fa", points: lams.map((x, i) => ({ x, y: round6(absY[i]) })) },
    { name: "Emission (photons per nm)", color: "#f87171", points: lams.map((x, i) => ({ x, y: round6(emY[i]) })) },
    ...components,
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="0–0 transition λ₀₀ (nm)" value={lambda00Raw} onChange={setLambda00} min={150} max={3000} />
        <ValidatedNumberInput label="Vibrational wavenumber ν̃_v (cm⁻¹)" value={nuVibRaw} onChange={setNuVib} min={10} max={5000} />
        <ValidatedNumberInput label="Huang–Rhys factor S" value={hrRaw} onChange={setHr} min={0} max={10} />
        <ValidatedNumberInput label="Width of each vibronic line (FWHM, cm⁻¹)" value={lineFwhmRaw} onChange={setLineFwhm} min={LINE_MIN} max={10000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ResultCard label="Emission maximum" value={`${fmt(emNm.peak)} nm`} tone="red" subtext={`per nm; per cm⁻¹ it is at ${fmtCm(emNu.peak)} cm⁻¹ = ${fmt(1e7 / emNu.peak)} nm`} />
        <ResultCard label="Absorption maximum" value={`${fmt(1e7 / abs.peak)} nm`} tone="blue" subtext={`${fmtCm(abs.peak)} cm⁻¹; 0–0 at ${fmtCm(nu00)} cm⁻¹`} />
        <ResultCard
          label="Stokes shift of the maxima"
          value={`${fmtCm(abs.peak - emNu.peak)} cm⁻¹`}
          tone="yellow"
          subtext={`line-shape centroids: 2Sν̃_v = ${fmtCm(2 * reorg)} cm⁻¹; reorganisation energy Sν̃_v = ${fmtCm(reorg)} cm⁻¹ = ${fmt((hc_eV_nm * reorg) / 1e7)} eV`}
        />
        <ResultCard
          label="Emission band FWHM"
          value={`${fmt(emNm.fwhm)} nm`}
          tone="green"
          subtext={`0–0 line carries e^(−S) = ${fmt(100 * Math.exp(-S), 3)} % of the line strength`}
        />
      </div>

      <SimpleLineChart title="Absorption and emission bands (each scaled to peak 1)" xLabel="Wavelength (nm)" yLabel="Normalised intensity" series={series} />

      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">P_n = e^(−S) Sⁿ / n!, lines at ν̃₀₀ ± n ν̃_v (absorption +, emission −)</p>
        <p className="font-mono text-red-400">ε(ν̃) ∝ ν̃ Σ P_n g(ν̃ − ν̃₀₀ − nν̃_v); F(ν̃) ∝ ν̃³ Σ P_n g(ν̃ − ν̃₀₀ + nν̃_v)</p>
        <p className="font-mono text-green-400">F(λ) = F(ν̃) · 10⁷/λ² (photons per nm)</p>
        <p>
          One vibrational mode, the same frequency in both electronic states, displaced harmonic potentials, emission from
          the relaxed v′ = 0 level, and T ≈ 0, so absorption and emission line shapes are mirror images about the 0–0 line.
          The emission is red-tailed in wavelength because its progression runs to the red and the λ = 10⁷/ν̃ axis map
          stretches that side; the 10⁷/λ² Jacobian of a spectral density keeps the area (it lowers the red wing); absorption is a property at each wavelength and takes no Jacobian. Real
          dyes have several modes, thermal hot bands, solvent relaxation and a different excited-state frequency, so fit
          S and ν̃_v to a measured spectrum rather than reading them from this one.
        </p>
      </div>
    </>
  );
}
