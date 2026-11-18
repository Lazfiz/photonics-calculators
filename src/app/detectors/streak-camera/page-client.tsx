"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  STREAK_BLUR_MTF, STREAK_FASTEST_SWEEP_MM_NS, streakBlur, streakSummary, streakTermsAt,
} from "../../../physics/detectors/streak-camera";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

/** A time in s with the unit that keeps 1–999 in front of the point. */
function fmtTime(t: number): string {
  if (!Number.isFinite(t)) return "—";
  if (t === 0) return "0 ps";
  const units: [number, string][] = [[1e-3, "ms"], [1e-6, "µs"], [1e-9, "ns"], [1e-12, "ps"], [1e-15, "fs"]];
  const [scale, unit] = units.find(([s]) => t >= s) ?? units[units.length - 1];
  return `${(t / scale).toFixed(3)} ${unit}`;
}

// Defaults: a Hamamatsu C16910 (data sheet SHSS0026E06) at its fastest sweep, 60 ps over the 9.44 mm working height
// that an ORCA-Flash4.0 V3 reads through the 3:2 output optics (968 rows of 6.5 µm × 1.5 = 9.75 µm on the screen).
// Tube magnification: the 4.5 mm effective photocathode length fills the 12.48 mm working width, 12.48/4.5 = 2.77.
// Blur: the 35 lp/mm cathode resolution read as 5 % MTF, times M. The 10 µm slit is an entered value. The 0.5 ps tube
// spread fits under the sheet's < 800 fs total for any MTF reading from 2 % (0.59 ps allowed) to 10 % (0.68 ps), but
// only at the 60 ps best-case fastest range (factory set to 60–80 ps; 80 ps allows 0.48 ps). Jitter matters only when
// sweeps are summed; the sheet's values exclude light-source jitter.

export default function StreakCameraPage() {
  const [sweepRaw, setSweepSpeed] = useURLState("sweepSpeed", STREAK_FASTEST_SWEEP_MM_NS); // mm/ns on the screen
  const [slitRaw, setSlitWidth] = useURLState("slitWidth", 10); // µm
  const [magRaw, setMagnification] = useURLState("magnification", 2.77);
  const [pixelRaw, setCcdPixelSize] = useURLState("ccdPixelSize", 9.75); // µm on the screen
  const [pixelsRaw, setPixels] = useURLState("pixels", 968);
  const [tubeRaw, setTemporalResolution] = useURLState("temporalResolution", 0.5); // ps
  const [screenRaw, setScreenLength] = useURLState("screenLength", 18); // mm along the sweep
  const [jitterRaw, setJitter] = useURLState("jitter", 0); // ps
  const [lpmmRaw, setLpmm] = useURLState("lpmm", 35); // lp/mm at the photocathode
  const [specRaw, setSpec] = useURLState("spec", 0.8); // ps, data-sheet total resolution

  const sweep_mm_ns = clamp(sweepRaw, 1e-6, 1000, STREAK_FASTEST_SWEEP_MM_NS);
  const slit_um = clamp(slitRaw, 1, 5000, 10);
  const mag = clamp(magRaw, 0.1, 10, 2.77);
  const pixel_um = clamp(pixelRaw, 1, 100, 9.75);
  const pixels = Math.round(clamp(pixelsRaw, 64, 8192, 968));
  const tube = clamp(tubeRaw, 0, 1e9, 0.5) * 1e-12;
  const screen_mm = clamp(screenRaw, 1, 100, 18);
  const jitter = clamp(jitterRaw, 0, 1e9, 0) * 1e-12;
  const lpmm = clamp(lpmmRaw, 1, 1000, 35);
  const spec = clamp(specRaw, 0, 1e9, 0.8) * 1e-12;
  const camera = {
    slitWidth: slit_um * 1e-6, magnification: mag, pixelSize: pixel_um * 1e-6, pixels, tube, screenLength: screen_mm * 1e-3,
    jitter, limitingResolution: lpmm * 1e3, spec,
  };
  const blur = streakBlur(camera); // m FWHM on the screen
  const resolutionAt = (mmPerNs: number) => streakTermsAt(camera, mmPerNs * 1e6);
  const {
    slit, pixel, total, quad, blurTime, allowance, window, screenLimited, undersampled, overSpec, dominant,
  } = streakSummary(camera, sweep_mm_ns * 1e6);

  const speeds = Array.from({ length: 101 }, (_, i) => 10 ** (-2 + i / 20)); // 0.01 to 1000 mm/ns
  const rows = speeds.map(resolutionAt);
  const ps = (t: number) => t * 1e12;
  const chartData = [
    { x: speeds, y: rows.map((r) => ps(r.total)), type: "scatter" as const, mode: "lines" as const, name: "Total (convolution FWHM)", line: { color: "#f87171", width: 3 } },
    { x: speeds, y: rows.map((r) => ps(r.slit)), type: "scatter" as const, mode: "lines" as const, name: "Slit image", line: { color: "#60a5fa" } },
    { x: speeds, y: rows.map((r) => ps(r.pixel)), type: "scatter" as const, mode: "lines" as const, name: "One pixel", line: { color: "#34d399" } },
    { x: speeds, y: rows.map((r) => ps(r.gauss)), type: "scatter" as const, mode: "lines" as const, name: "Tube, blur and jitter", line: { color: "#fbbf24", dash: "dash" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Sweep Speed on Screen (mm/ns)" value={sweepRaw} onChange={setSweepSpeed} min={1e-6} max={1000} step="0.5" />
        <ValidatedNumberInput label="Slit Width (µm, imaged 1:1 on the cathode)" value={slitRaw} onChange={setSlitWidth} min={1} max={5000} />
        <ValidatedNumberInput label="Tube Magnification (cathode → screen)" value={magRaw} onChange={setMagnification} min={0.1} max={10} step="0.1" />
        <ValidatedNumberInput label="Pixel Size on Screen (µm)" value={pixelRaw} onChange={setCcdPixelSize} min={1} max={100} />
        <ValidatedNumberInput label="Pixels along the Sweep" value={pixelsRaw} onChange={setPixels} min={64} max={8192} step="1" />
        <ValidatedNumberInput label="Tube Spread FWHM (ps, transit time + deflection)" value={tubeRaw} onChange={setTemporalResolution} min={0} max={1e9} step="0.05" />
        <ValidatedNumberInput label="Screen Length along the Sweep (mm)" value={screenRaw} onChange={setScreenLength} min={1} max={100} />
        <ValidatedNumberInput label="Trigger Jitter, Summed Sweeps (ps FWHM; rms × 2.355)" value={jitterRaw} onChange={setJitter} min={0} max={1e9} />
        <ValidatedNumberInput label="Limiting Resolution at the Cathode (lp/mm)" value={lpmmRaw} onChange={setLpmm} min={1} max={1000} />
        <ValidatedNumberInput label="Data-Sheet Temporal Resolution (ps)" value={specRaw} onChange={setSpec} min={0} max={1e9} step="0.05" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Slit-Image Term" value={fmtTime(slit)} tone="blue" subtext="w·M / v" />
        <ResultCard label="Pixel Term" value={fmtTime(pixel)} tone="green" subtext="p / v (time per pixel)" />
        <ResultCard label="Temporal Resolution (FWHM)" value={fmtTime(total)} tone="purple" subtext={`Rectangles ⊗ Gaussian; the ${dominant} term dominates. Quadrature would give ${fmtTime(quad)}${undersampled ? `. Under 2 pixels (${fmtTime(2 * pixel)}) per FWHM the shape is not resolved; sampling sets the reading` : ""}`} />
        <ResultCard label="Screen Blur Term" value={fmtTime(blurTime)} tone="orange" subtext={`${(blur * 1e6).toFixed(1)} µm FWHM on the screen: ${lpmm} lp/mm read as ${STREAK_BLUR_MTF * 100} % MTF, times M`} />
        <ResultCard label="Tube Spread the Data Sheet Allows" value={fmtTime(allowance)} tone="cyan" subtext={Number.isFinite(allowance) ? `Largest Gaussian tube term that keeps the total at ${fmtTime(spec)} with these slit, pixel, blur and jitter terms; valid at the sweep the spec was measured at (C16910: fastest), and it also holds the test pulse width${overSpec ? "; the entered tube spread exceeds it" : ""}` : `The slit, pixel, blur and jitter terms alone exceed ${fmtTime(spec)}`} />
        <ResultCard label="Time Window" value={fmtTime(window)} tone="yellow" subtext={screenLimited ? `screen length ${screen_mm} mm / v; the readout (${pixels} × p) overfills the screen` : `${pixels} pixels × p / v (inside the ${screen_mm} mm screen)`} />
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>Δt<sub>slit</sub> = w<sub>slit</sub>·M / v<sub>sweep</sub>; Δt<sub>pixel</sub> = p / v<sub>sweep</sub></p>
        <p>Gaussian terms: Δt<sub>G</sub> = √(Δt<sub>tube</sub>² + Δt<sub>jitter</sub>² + (b/v)²) (Gaussians add in quadrature)</p>
        <p>Δt = FWHM of rect(Δt<sub>slit</sub>) ⊗ rect(Δt<sub>pixel</sub>) ⊗ Gauss(Δt<sub>G</sub>); no Gaussian: max(Δt<sub>slit</sub>, Δt<sub>pixel</sub>)</p>
        <p>T<sub>window</sub> = min(N<sub>pixels</sub>·p, L<sub>screen</sub>) / v<sub>sweep</sub>; a FWHM below 2p/v is undersampled</p>
        <p>Blur: Gaussian MTF exp(−2π²σ²f²) = 5 % at the limiting resolution f, FWHM = 2.3548·√(ln 20 / 2)/(π f) at the cathode (26.2 µm at 35 lp/mm), times M on the screen</p>
        <p>Tube spread: the tube&apos;s own Gaussian term, chiefly transit-time dispersion from the photoelectron energy spread, ≈ 2.63·√Δε / E ps (Δε FWHM of the photoelectron energy distribution in eV, extraction field E in kV/mm; Shakya &amp; Chang 2005 after Chang et al. 1996), plus deflection dispersion. The delay between electrons leaving the cathode with 0 and with Δε, √(2m_eΔε)/(eE) = 3.37·√Δε / E ps, bounds it from above. A data-sheet resolution includes the slit and readout, so it bounds the tube term from above.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        xaxis: { title: "Sweep Speed (mm/ns)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Time Resolution (ps)", type: "log", gridcolor: "#374151" },
      }} title="Resolution vs Sweep Speed" />
    </>
  );
}
