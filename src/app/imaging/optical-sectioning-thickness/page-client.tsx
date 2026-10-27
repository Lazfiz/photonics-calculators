"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  airyUnit, confocalSectionFwhm, confocalSectionFwhmPointPinhole, twoPhotonAxialFwhm, widefieldAxialFirstZero,
} from "../../../physics/imaging/optical-sectioning-thickness";
import { confocalOpticalSectionFwhm } from "../../../physics/imaging/confocal";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtUm = (x: number) => (Number.isFinite(x) ? `${(x * 1e6).toFixed(2)} µm` : "—");

/** Keep the finite (x, y) pairs, with y converted to µm. */
function finiteUm(xs: number[], ys: number[]) {
  const keep = ys.map(Number.isFinite);
  return { x: xs.filter((_, i) => keep[i]), y: ys.filter((_, i) => keep[i]).map((y) => y * 1e6) };
}

export default function OpticalSectioningPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550); // nm
  const [naRaw, setNa] = useURLState("na", 1.4);
  const [indexRaw, setRefractiveIndex] = useURLState("refractiveIndex", 1.518);
  const [pinholeRaw, setPinholeAU] = useURLState("pinholeAU", 1.0);
  // useURLState doesn't clamp: keep URL values inside the input ranges (the wave-optical table stops at 5 AU).
  const wavelength = clamp(wavelengthRaw, 300, 2000, 550);
  const na = clamp(naRaw, 0.1, 1.7, 1.4);
  const refractiveIndex = clamp(indexRaw, 1, 1.8, 1.518);
  const pinholeAU = clamp(pinholeRaw, 0.1, 5, 1);

  const lambda = wavelength * 1e-9;
  const n = refractiveIndex;
  const results = {
    widefield: widefieldAxialFirstZero(lambda, n, na),
    confocal: confocalSectionFwhm(lambda, n, na, pinholeAU),
    waveOptical: confocalOpticalSectionFwhm(lambda, n, na, pinholeAU),
    pointPinhole: confocalSectionFwhmPointPinhole(lambda, n, na),
    twoPhoton: twoPhotonAxialFwhm(2 * lambda, n, na),
    pinholeDiameter: pinholeAU * airyUnit(lambda, na),
  };
  const valid = Number.isFinite(results.confocal);

  const chartData = (() => {
    const naMax = Math.min(1.7, 0.99 * refractiveIndex);
    const nas = Array.from({ length: 80 }, (_, i) => 0.1 + (i * (naMax - 0.1)) / 79);
    const lam = wavelength * 1e-9;
    const n = refractiveIndex;
    return [
      { ...finiteUm(nas, nas.map((a) => widefieldAxialFirstZero(lam, n, a))), type: "scatter", mode: "lines", name: "Widefield (first axial zero)", line: { color: "#60a5fa" } },
      { ...finiteUm(nas, nas.map((a) => confocalSectionFwhm(lam, n, a, pinholeAU))), type: "scatter", mode: "lines", name: `Confocal, Wilhelm (${pinholeAU} AU)`, line: { color: "#34d399" } },
      { ...finiteUm(nas, nas.map((a) => confocalOpticalSectionFwhm(lam, n, a, pinholeAU))), type: "scatter", mode: "lines", name: `Confocal, wave-optical (${pinholeAU} AU)`, line: { color: "#a78bfa", dash: "dot" } },
      { ...finiteUm(nas, nas.map((a) => twoPhotonAxialFwhm(2 * lam, n, a))), type: "scatter", mode: "lines", name: "Two-photon axial FWHM (2λ)", line: { color: "#fbbf24", dash: "dash" } },
      { ...finiteUm([na], [confocalSectionFwhm(lam, n, na, pinholeAU)]), type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={2000} />
        <ValidatedNumberInput label="Numerical Aperture" value={naRaw} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Refractive Index" value={indexRaw} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.001" />
        <ValidatedNumberInput label="Pinhole (Airy units)" value={pinholeRaw} onChange={setPinholeAU} min={0.1} max={5} step="0.1" />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the NA must be smaller than the refractive index of the immersion medium.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Widefield (focus to first axial zero, λ/(n − √(n² − NA²)))" value={fmtUm(results.widefield)} tone="blue" subtext="No true sectioning: out-of-focus light is blurred, not rejected" />
        <ResultCard
          label={`Confocal section, Wilhelm (${pinholeAU} AU)`}
          value={fmtUm(results.confocal)}
          tone="green"
          subtext={pinholeAU < 1 ? `Below 1 AU this overestimates; point-pinhole limit ${fmtUm(results.pointPinhole)}` : `Point-pinhole limit ${fmtUm(results.pointPinhole)}`}
        />
        <ResultCard
          label={`Confocal section, wave-optical (${pinholeAU} AU)`}
          value={fmtUm(results.waveOptical)}
          tone="purple"
          subtext={Number.isFinite(results.waveOptical) ? `Scalar paraxial theory; Wilhelm is ${((results.confocal / results.waveOptical - 1) * 100).toFixed(0)} % above it` : "—"}
        />
        <ResultCard label="Two-photon axial FWHM (point object, at 2λ)" value={fmtUm(results.twoPhoton)} tone="yellow" subtext={`λ_exc = ${(2 * wavelength).toFixed(0)} nm${na < 0.7 ? "; fit is for NA > 0.7" : ""}; a thin-plane section is ≈ 8 % larger (0.677 vs 0.638 in scalar theory)`} />
        <ResultCard label="Pinhole diameter (object side)" value={fmtUm(results.pinholeDiameter)} tone="purple" subtext="× magnification at the pinhole plane" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas (FWHM, textbook approximations)</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">Confocal: √[(0.88λ / (n − √(n² − NA²)))² + (√2·n·PH / NA)²], PH = AU × 1.22λ/NA</p>
          <p className="font-mono">Point pinhole: 0.64λ / (n − √(n² − NA²))</p>
          <p className="font-mono">Wave-optical: FWHM of S(u) = ∫d²r |h(u, r)|² ∫<sub>pinhole</sub> |h(u, r − w)|² d²w, a thin fluorescent plane at defocus u</p>
          <p className="font-mono">Two-photon: 2√(ln 2) · 0.532λ / (√2 (n − √(n² − NA²)))</p>
          <p>Confocal formulas from Zeiss, &quot;Confocal Laser Scanning Microscopy: Principles&quot; (Wilhelm et al.); the pinhole formula is the geometric-optical one, valid from 1 AU up. The wave-optical section is the scalar paraxial theory of Wilson &amp; Sheppard (equal excitation and emission wavelengths, uniformly filled pupil), with Wilhelm&apos;s high-NA axial scale; Wilhelm&apos;s geometric sum lies 23 % (low NA) to about 140 % above it, most as the NA approaches the immersion index. Two-photon from Zipfel, Williams &amp; Webb, Nat. Biotechnol. 21, 1369 (2003), excitation at twice the entered wavelength. Widefield: distance from focus to the first axial zero of the sinc² axial PSF (Born &amp; Wolf §8.8); out-of-focus light is blurred, not rejected.</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "NA", gridcolor: "#374151" },
          yaxis: { title: "Section thickness (µm)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </>
  );
}
