"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { airyFringe, etalonOrder, fsrFrequency, fsrWavelength, fwhmFrequency, gapAngle } from "../../../physics/spectroscopy/etalon";
import { airyPeakNear, coefficientOfFinesse, reflectingFinesse } from "../../../physics/thin-film/interference";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const DEG = Math.PI / 180;

/** Frequency in Hz with a readable unit. */
const fmtHz = (x: number) =>
  !Number.isFinite(x) ? "—" : x >= 1e12 ? `${fmt(x / 1e12)} THz` : x >= 1e9 ? `${fmt(x / 1e9)} GHz` : `${fmt(x / 1e6)} MHz`;
/** Wavelength interval in m as nm or pm. */
const fmtLen = (x: number) => (!Number.isFinite(x) ? "—" : x >= 1e-10 ? `${fmt(x * 1e9)} nm` : `${fmt(x * 1e12)} pm`);

export default function EtalonFSRPage() {
  const [nRaw, setN] = useURLState("n", 1.0); // gap index
  const [dRaw, setD] = useURLState("d", 10); // gap, µm
  const [thRaw, setTheta] = useURLState("theta", 0); // incidence angle in air, deg
  const [rRaw, setR] = useURLState("R", 0.8); // mirror reflectance
  const [wlRaw, setWavelength] = useURLState("wavelength", 1550); // design wavelength, nm

  const n = clamp(nRaw, 1, 5, 1);
  const d = clamp(dRaw, 0.1, 1e5, 10) * 1e-6;
  const theta0 = clamp(thRaw, 0, 80, 0) * DEG;
  const R = clamp(rRaw, 0, 0.9999, 0.8);
  const lambda = clamp(wlRaw, 100, 20000, 1550) * 1e-9;

  const cosT = Math.cos(gapAngle(theta0, n));
  const ndCos = n * d * cosT;
  const F = coefficientOfFinesse(R);
  const finesse = reflectingFinesse(F);
  const order = etalonOrder(n, d, cosT, lambda);
  const fsrL = fsrWavelength(lambda, n, d, cosT);
  const fsrNu = fsrFrequency(n, d, cosT);
  const fwhmNu = fwhmFrequency(fsrNu, F);
  const peak = airyPeakNear(ndCos, lambda, F);

  const chart = (() => {
    const { lambda: ls, T } = airyFringe(ndCos, lambda, F, 1, 240);
    const pm = fsrL < 1e-10; // plot pm detuning for thick etalons
    const scale = pm ? 1e12 : 1e9;
    return {
      unit: pm ? "pm" : "nm",
      data: [{ x: ls.map((l) => Math.round((l - lambda) * scale * 1e6) / 1e6), y: T, type: "scatter", mode: "lines", name: "Transmission", line: { color: "#60a5fa", width: 2 } }],
    };
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <ValidatedNumberInput label="Gap Index n" value={nRaw} onChange={setN} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Gap d (µm)" value={dRaw} onChange={setD} min={0.1} max={100000} step="0.1" />
        <ValidatedNumberInput label="Incidence Angle in Air θ₀ (°)" value={thRaw} onChange={setTheta} min={0} max={80} />
        <ValidatedNumberInput label="Mirror Reflectance R" value={rRaw} onChange={setR} min={0} max={0.9999} step="0.01" />
        <ValidatedNumberInput label="Design Wavelength (nm)" value={wlRaw} onChange={setWavelength} min={100} max={20000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="FSR at λ: λ²/(2nd cos θ)" value={fmtLen(fsrL)} tone="blue" subtext={`order m = ${fmt(order)} at λ`} />
        <ResultCard label="FSR in Frequency c/(2nd cos θ)" value={fmtHz(fsrNu)} tone="cyan" subtext="exact for a non-dispersive gap" />
        <ResultCard label="Reflecting Finesse ℱ = π√R/(1 − R)" value={fmt(finesse)} tone="green" subtext={`coefficient F = 4R/(1 − R)² = ${fmt(F)}`} />
        <ResultCard label="Fringe FWHM" value={fmtHz(fwhmNu)} tone="purple"
          subtext={F >= 1 ? `exact 4 asin(1/√F); FSR/ℱ = ${fmtHz(fsrNu / finesse)}` : "F < 1: T never falls to ½"} />
        <ResultCard label="Nearest Transmission Peak" value={`${fmt(peak.wavelength * 1e9, 7)} nm`} tone="yellow" subtext={`order ${peak.order}`} />
        <ResultCard label="Peak FWHM (wavelength)" value={fmtLen(peak.fwhm)} tone="orange"
          subtext={Number.isFinite(peak.fwhm) ? `resolving power λ/δλ = ${fmt(peak.wavelength / peak.fwhm)}` : undefined} />
        <ResultCard label="Contrast T_max/T_min" value={fmt(1 + F)} tone="red" subtext="1 + F (lossless mirrors)" />
        <ResultCard label="Gap Angle θ" value={`${fmt(Math.acos(cosT) / DEG, 3)}°`} tone="gray" subtext="sin θ = sin θ₀/n" />
      </div>

      <ChartPanel data={chart.data} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: `λ − ${fmt(lambda * 1e9, 6)} nm (${chart.unit})`, gridcolor: "#374151" },
        yaxis: { title: "Transmission", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 50, l: 60, r: 20 }, legend: { bgcolor: "transparent" },
      }} />
      <p className="text-sm text-gray-400 mt-3">
        Three orders around the design wavelength, sampled densely at each peak so high-finesse fringes are not
        aliased. Lossless mirrors without reflection phase; absorption, flatness and beam divergence lower the real finesse.
      </p>
    </>
  );
}
