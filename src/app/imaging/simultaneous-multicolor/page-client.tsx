"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { FLUOROPHORES, fluorophoreByName, spectrumAt } from "../../../physics/imaging/fluorophores";
import { type Channel, multicolorSummary } from "../../../physics/imaging/simultaneous-multicolor";

const COLORS = ["#60a5fa", "#4ade80", "#f87171", "#a78bfa"];
const DEFAULT_CHANNELS: readonly Channel[] = [
  { dye: "EGFP", laser: 488, center: 525, width: 50 },
  { dye: "mCherry", laser: 561, center: 610, width: 40 },
  { dye: "miRFP670", laser: 640, center: 700, width: 75 },
  { dye: "mTagBFP2", laser: 405, center: 450, width: 50 },
];
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function SimultaneousMulticolorPage() {
  const [numRaw, setNum] = useURLState("numChannels", 3);
  const [dye1, setDye1] = useURLState("dye1", "EGFP");
  const [laser1, setLaser1] = useURLState("laser1", 488);
  const [center1, setCenter1] = useURLState("center1", 525);
  const [width1, setWidth1] = useURLState("width1", 50);
  const [dye2, setDye2] = useURLState("dye2", "mCherry");
  const [laser2, setLaser2] = useURLState("laser2", 561);
  const [center2, setCenter2] = useURLState("center2", 610);
  const [width2, setWidth2] = useURLState("width2", 40);
  const [dye3, setDye3] = useURLState("dye3", "miRFP670");
  const [laser3, setLaser3] = useURLState("laser3", 640);
  const [center3, setCenter3] = useURLState("center3", 700);
  const [width3, setWidth3] = useURLState("width3", 75);
  const [dye4, setDye4] = useURLState("dye4", "mTagBFP2");
  const [laser4, setLaser4] = useURLState("laser4", 405);
  const [center4, setCenter4] = useURLState("center4", 450);
  const [width4, setWidth4] = useURLState("width4", 50);
  const [acqRaw, setAcq] = useURLState("acquisition", "simultaneous"); // simultaneous | sequential
  const [fluxRaw, setFlux] = useURLState("photonFlux", 25000); // photons/pixel/s at the camera, own dye
  const [exposureRaw, setExposure] = useURLState("exposureMs", 20);
  const [readoutRaw, setReadout] = useURLState("readoutMs", 2);
  const [pixelRaw, setPixel] = useURLState("pixelSize", 6.5); // µm
  const [binningRaw, setBinning] = useURLState("binning", 1);
  const [binMode, setBinMode] = useURLState("binMode", "charge");
  const [readRaw, setRead] = useURLState("readNoise", 1.5); // e⁻ rms
  const [darkRaw, setDark] = useURLState("darkCurrent", 0.01); // e⁻/pixel/s
  const [qeRaw, setQe] = useURLState("quantumEff", 90); // %

  const num = Math.round(clamp(numRaw, 1, 4, 3));
  // One channel per slot: the dye (unknown names fall back to the first catalogue entry) and the clamped laser and filter.
  const slots = [
    { dye: dye1, laser: laser1, center: center1, width: width1, set: [setDye1, setLaser1, setCenter1, setWidth1] as const, fallback: DEFAULT_CHANNELS[0] },
    { dye: dye2, laser: laser2, center: center2, width: width2, set: [setDye2, setLaser2, setCenter2, setWidth2] as const, fallback: DEFAULT_CHANNELS[1] },
    { dye: dye3, laser: laser3, center: center3, width: width3, set: [setDye3, setLaser3, setCenter3, setWidth3] as const, fallback: DEFAULT_CHANNELS[2] },
    { dye: dye4, laser: laser4, center: center4, width: width4, set: [setDye4, setLaser4, setCenter4, setWidth4] as const, fallback: DEFAULT_CHANNELS[3] },
  ];
  const channels: Channel[] = slots.slice(0, num).map((c) => ({
    dye: fluorophoreByName(c.dye).name,
    laser: clamp(c.laser, 350, 800, c.fallback.laser),
    center: clamp(c.center, 350, 900, c.fallback.center),
    width: clamp(c.width, 1, 300, c.fallback.width),
  }));
  const mode: "simultaneous" | "sequential" = acqRaw === "sequential" ? "sequential" : "simultaneous";
  const flux = clamp(fluxRaw, 0, 1e9, 25000);
  const exposure = clamp(exposureRaw, 0.01, 10000, 20) * 1e-3;
  const readout = clamp(readoutRaw, 0, 1000, 2) * 1e-3;
  const pixel = clamp(pixelRaw, 0.5, 50, 6.5);
  const binning = [1, 2, 4].includes(binningRaw) ? binningRaw : 1;
  const readNoise = clamp(readRaw, 0, 100, 1.5);
  const dark = clamp(darkRaw, 0, 1e4, 0.01);
  const qe = clamp(qeRaw, 1, 100, 90) / 100;

  const { spill: L, snr, snrOwn, fpsSimultaneous, fpsSequential, warnings } = multicolorSummary({
    channels, mode, flux, exposure, readout, binning, binMode: binMode === "digital" ? "digital" : "charge", readNoise, dark, qe,
  });

  const wlMax = Math.ceil(Math.max(830, ...channels.map((c) => c.center + c.width / 2 + 20)));
  const wl = Array.from({ length: wlMax - 350 + 1 }, (_, i) => 350 + i);
  const spectra = channels.flatMap((c, i) => {
    const f = fluorophoreByName(c.dye);
    return [
      { x: wl, y: wl.map((l) => spectrumAt(f.em, l * 1e-9)), type: "scatter" as const, mode: "lines" as const, name: `${f.name} emission`, line: { color: COLORS[i], width: 2 } },
      { x: wl, y: wl.map((l) => (Math.abs(l - c.center) <= c.width / 2 ? 1 : 0)), type: "scatter" as const, mode: "lines" as const, name: `Filter ${i + 1}`, line: { color: COLORS[i], width: 1, dash: "dot" } },
    ];
  });
  const eMs = exposure * 1e3;
  const eLo = Math.min(1, eMs / 10), eHi = Math.max(100, eMs * 10);
  const exposures = Array.from({ length: 101 }, (_, i) => eLo * (eHi / eLo) ** (i / 100)); // ms, log-spaced
  const timing = [
    { x: exposures, y: exposures.map((e) => 1000 / (e + readout * 1e3)), type: "scatter" as const, mode: "lines" as const, name: "Simultaneous", line: { color: "#4ade80", width: 2 } },
    { x: exposures, y: exposures.map((e) => 1000 / (num * (e + readout * 1e3))), type: "scatter" as const, mode: "lines" as const, name: `Sequential (${num} channels)`, line: { color: "#f87171", width: 2 } },
    { x: [exposure * 1e3], y: [fpsSimultaneous], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } },
  ];

  const update = (i: number, patch: Partial<Channel>) => {
    const [setDye, setLaser, setCenter, setWidth] = slots[i].set;
    if (patch.dye !== undefined) setDye(patch.dye);
    if (patch.laser !== undefined) setLaser(patch.laser);
    if (patch.center !== undefined) setCenter(patch.center);
    if (patch.width !== undefined) setWidth(patch.width);
  };
  const field = "mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        {[
          ["Binned pixel", `${(pixel * binning).toFixed(1)} µm`, "text-blue-400"],
          ["Frame rate, simultaneous", fmt(fpsSimultaneous, 1, " fps"), "text-green-400"],
          ["Frame rate, sequential", fmt(fpsSequential, 1, " fps"), "text-red-400"],
          ["SNR, own dye only", fmt(snrOwn, 2), "text-yellow-400"],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Number of channels (1–4)" value={numRaw} onChange={setNum} min={1} max={4} step="1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Acquisition</span>
          <select value={mode} onChange={(e) => setAcq(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="simultaneous">Simultaneous: all lasers, one frame</option>
            <option value="sequential">Sequential: laser i only in frame i</option>
          </select>
        </label>
        <ValidatedNumberInput label="Own-dye photon flux (photons/pixel/s)" value={fluxRaw} onChange={setFlux} min={0} max={1e9} step="1000" />
        <ValidatedNumberInput label="Exposure (ms)" value={exposureRaw} onChange={setExposure} min={0.01} max={10000} step="1" />
        <ValidatedNumberInput label="Readout time (ms)" value={readoutRaw} onChange={setReadout} min={0} max={1000} step="0.5" />
        <ValidatedNumberInput label="Pixel size (µm)" value={pixelRaw} onChange={setPixel} min={0.5} max={50} step="0.1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Binning</span>
          <select value={binning} onChange={(e) => setBinning(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={1}>1×1</option><option value={2}>2×2</option><option value={4}>4×4</option>
          </select>
          <select value={binMode} onChange={(e) => setBinMode(e.target.value)} className="mt-2 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="charge">Charge binning (CCD): one read</option>
            <option value="digital">Digital sum (CMOS): B² reads</option>
          </select>
        </label>
        <ValidatedNumberInput label="Quantum efficiency (%)" value={qeRaw} onChange={setQe} min={1} max={100} step="1" />
        <ValidatedNumberInput label="Read noise (e⁻ rms)" value={readRaw} onChange={setRead} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="Dark current (e⁻/pixel/s)" value={darkRaw} onChange={setDark} min={0} max={1e4} step="0.001" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Channels</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {channels.map((c, i) => (
            <div key={i} className="bg-gray-800 rounded p-3" style={{ borderLeft: `3px solid ${COLORS[i]}` }}>
              <p className="text-sm font-medium mb-2">Channel {i + 1}</p>
              <label className="block text-xs text-gray-400">Fluorophore
                <select value={c.dye} onChange={(e) => update(i, { dye: e.target.value })} className={field}>
                  {FLUOROPHORES.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
                </select>
              </label>
              <ValidatedNumberInput label="Laser (nm)" value={c.laser} onChange={(v) => update(i, { laser: v })} min={350} max={800} step="1" />
              <ValidatedNumberInput label="Filter centre (nm)" value={c.center} onChange={(v) => update(i, { center: v })} min={350} max={900} step="1" />
              <ValidatedNumberInput label="Filter width (nm)" value={c.width} onChange={(v) => update(i, { width: v })} min={1} max={300} step="1" />
            </div>
          ))}
        </div>
        {warnings.length > 0 && (
          <ul className="mt-3 text-sm text-amber-400 list-disc pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-1">Spillover matrix (%)</h3>
        <p className="text-xs text-gray-500 mb-3">Signal of each dye in each channel, as a percentage of its signal in its own channel, {mode === "simultaneous" ? "with all lasers on in one frame, so it depends only on the emission spectra" : "with laser i alone in frame i, so it includes the excitation crosstalk"}.</p>
        <table className="text-sm font-mono">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left pr-4 font-normal">Channel ↓ / dye →</th>
              {channels.map((c, j) => <th key={j} className="px-3 font-normal" style={{ color: COLORS[j] }}>{c.dye}</th>)}
              <th className="px-3 font-normal text-yellow-400">SNR</th>
            </tr>
          </thead>
          <tbody>
            {L.map((rowI, i) => (
              <tr key={i}>
                <td className="pr-4" style={{ color: COLORS[i] }}>{`${i + 1}: ${channels[i].center}/${channels[i].width}`}</td>
                {rowI.map((v, j) => <td key={j} className={`px-3 text-right ${i === j ? "text-gray-500" : v > 0.05 ? "text-red-400" : ""}`}>{fmt(v * 100, 2)}</td>)}
                <td className="px-3 text-right text-yellow-400">{fmt(snr[i], 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Emission spectra and filters</h3>
          <ChartPanel data={spectra} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Normalised emission", gridcolor: "#374151", range: [0, 1.05] },
            margin: { t: 30, r: 20, b: 50, l: 50 }, showlegend: true,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Frame rate vs exposure</h3>
          <ChartPanel data={timing} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Exposure (ms)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Frame rate (fps)", gridcolor: "#374151", type: "log" },
            margin: { t: 30, r: 20, b: 50, l: 60 }, showlegend: true,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="space-y-1 text-sm text-gray-300 font-mono">
          <p>R_ij ∝ ε_j Σ_k∈lasers(i) f_ex,j(λ_k) Φ_j ∫_filter i F_j dλ / ∫F_j dλ, spillover L_ij = R_ij / R_jj</p>
          <p>Simultaneous: lasers(i) = all lasers, so the excitation cancels in L_ij. Sequential: lasers(i) = {"{laser i}"}.</p>
          <p>S = flux × t × QE × B², SNR_i = S / √(S + Σ_j≠i L_ij S + I_dark t B² + σ_read²)</p>
          <p>σ_read² = σ² (charge binning) or B²σ² (digital sum); f = 1/(t + t_read), sequential 1/(N(t + t_read))</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Spectra are the sampled FPbase spectra (CC BY-SA 4.0) of the fluorescence-spectra page. Every laser delivers the same photon
          flux. Simultaneously, spillover depends only on the emission ratio between filters; excitation crosstalk (a laser
          exciting another dye) enters only in sequential mode. Filters are ideal top hats and each dye gives the same own-channel signal S; bleed-through photons count as
          background shot noise, before any linear unmixing. Laser switching time and the camera&apos;s overlap readout
          mode are not modelled.
        </p>
      </div>
    </>
  );
}
