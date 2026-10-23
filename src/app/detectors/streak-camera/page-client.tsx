"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quadratureFwhm, rectGaussFwhm, streakTime, streakWindow } from "../../../physics/detectors/photoemission";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

/** A time in s with the unit that keeps 1–999 in front of the point. */
function fmtTime(t: number): string {
  if (!Number.isFinite(t)) return "—";
  if (t === 0) return "0 ps";
  const units: [number, string][] = [[1e-3, "ms"], [1e-6, "µs"], [1e-9, "ns"], [1e-12, "ps"], [1e-15, "fs"]];
  const [scale, unit] = units.find(([s]) => t >= s) ?? units[units.length - 1];
  return `${(t / scale).toFixed(3)} ${unit}`;
}

// Defaults: a 10 mm/ns fast sweep, 50 µm slit imaged at 1.5× onto the screen (unsourced tube magnification), 13 µm
// pixels, the Ø18 mm P-43 screen of a Hamamatsu C16910 and a 0.8 ps intrinsic tube spread. A data-sheet resolution
// (C16910: < 800 fs at the fastest sweep) is a whole-system FWHM that includes the slit and readout, so it bounds the
// tube's own spread from above. Jitter matters only when sweeps are summed.
export default function StreakCameraPage() {
  const [sweepRaw, setSweepSpeed] = useURLState("sweepSpeed", 10); // mm/ns on the screen
  const [slitRaw, setSlitWidth] = useURLState("slitWidth", 50); // µm
  const [magRaw, setMagnification] = useURLState("magnification", 1.5);
  const [pixelRaw, setCcdPixelSize] = useURLState("ccdPixelSize", 13); // µm on the screen
  const [pixelsRaw, setPixels] = useURLState("pixels", 1024);
  const [tubeRaw, setTemporalResolution] = useURLState("temporalResolution", 0.8); // ps
  const [screenRaw, setScreenLength] = useURLState("screenLength", 18); // mm along the sweep
  const [jitterRaw, setJitter] = useURLState("jitter", 0); // ps
  const [blurRaw, setScreenBlur] = useURLState("screenBlur", 0); // µm FWHM on the screen

  const sweep_mm_ns = clamp(sweepRaw, 1e-6, 1000, 10);
  const slit_um = clamp(slitRaw, 1, 5000, 50);
  const mag = clamp(magRaw, 0.1, 10, 1.5);
  const pixel_um = clamp(pixelRaw, 1, 100, 13);
  const pixels = Math.round(clamp(pixelsRaw, 64, 8192, 1024));
  const tube = clamp(tubeRaw, 0, 1e9, 0.8) * 1e-12;
  const screen_mm = clamp(screenRaw, 1, 100, 18);
  const jitter = clamp(jitterRaw, 0, 1e9, 0) * 1e-12;
  const blur_um = clamp(blurRaw, 0, 500, 0);

  const resolutionAt = (mmPerNs: number) => {
    const v = mmPerNs * 1e6; // m/s
    const slit = streakTime(slit_um * 1e-6 * mag, v);
    const pixel = streakTime(pixel_um * 1e-6, v);
    const gauss = quadratureFwhm([tube, jitter, streakTime(blur_um * 1e-6, v)]);
    return { slit, pixel, gauss, total: rectGaussFwhm([slit, pixel], gauss), quad: quadratureFwhm([slit, pixel, gauss]) };
  };
  const { slit, pixel, gauss, total, quad } = resolutionAt(sweep_mm_ns);
  const window = streakWindow(pixels * pixel_um * 1e-6, screen_mm * 1e-3, sweep_mm_ns * 1e6);
  const screenLimited = screen_mm * 1e3 < pixels * pixel_um;
  // Sampling: under two pixels per FWHM (Nyquist) the pulse shape isn't resolved; the pixel rect above is only its aperture.
  const undersampled = total < 2 * pixel;
  const terms: [string, number][] = [["slit image", slit], ["pixel", pixel], ["tube, blur and jitter", gauss]];
  const dominant = terms.reduce((a, b) => (b[1] > a[1] ? b : a))[0];

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
        <ValidatedNumberInput label="Intrinsic Tube Spread FWHM (ps)" value={tubeRaw} onChange={setTemporalResolution} min={0} max={1e9} />
        <ValidatedNumberInput label="Screen Length along the Sweep (mm)" value={screenRaw} onChange={setScreenLength} min={1} max={100} />
        <ValidatedNumberInput label="Trigger Jitter, Summed Sweeps (ps)" value={jitterRaw} onChange={setJitter} min={0} max={1e9} />
        <ValidatedNumberInput label="Screen Blur FWHM (µm on screen)" value={blurRaw} onChange={setScreenBlur} min={0} max={500} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Slit-Image Term" value={fmtTime(slit)} tone="blue" subtext="w·M / v" />
        <ResultCard label="Pixel Term" value={fmtTime(pixel)} tone="green" subtext="p / v (time per pixel)" />
        <ResultCard label="Temporal Resolution (FWHM)" value={fmtTime(total)} tone="purple" subtext={`Rectangles ⊗ Gaussian; the ${dominant} term dominates. Quadrature would give ${fmtTime(quad)}${undersampled ? `. Under 2 pixels (${fmtTime(2 * pixel)}) per FWHM the shape is not resolved; sampling sets the reading` : ""}`} />
        <ResultCard label="Time Window" value={fmtTime(window)} tone="yellow" subtext={screenLimited ? `screen length ${screen_mm} mm / v; the readout (${pixels} × p) overfills the screen` : `${pixels} pixels × p / v (inside the ${screen_mm} mm screen)`} />
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>Δt<sub>slit</sub> = w<sub>slit</sub>·M / v<sub>sweep</sub>; Δt<sub>pixel</sub> = p / v<sub>sweep</sub></p>
        <p>Gaussian terms: Δt<sub>G</sub> = √(Δt<sub>tube</sub>² + Δt<sub>jitter</sub>² + (b/v)²) (Gaussians add in quadrature)</p>
        <p>Δt = FWHM of rect(Δt<sub>slit</sub>) ⊗ rect(Δt<sub>pixel</sub>) ⊗ Gauss(Δt<sub>G</sub>); no Gaussian: max(Δt<sub>slit</sub>, Δt<sub>pixel</sub>)</p>
        <p>T<sub>window</sub> = min(N<sub>pixels</sub>·p, L<sub>screen</sub>) / v<sub>sweep</sub>; a FWHM below 2p/v is undersampled</p>
        <p>The tube spread is the tube&apos;s own (Gaussian) term; a data-sheet resolution already includes the slit and readout. C16910: Ø18 mm P-43 screen, 35 lp/mm at the cathode centre, roughly a blur of M × 29 µm (one line pair) on the screen.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        xaxis: { title: "Sweep Speed (mm/ns)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Time Resolution (ps)", type: "log", gridcolor: "#374151" },
      }} title="Resolution vs Sweep Speed" />
    </>
  );
}
