"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  airyUnit, confocalSectionFwhm, confocalSectionFwhmPointPinhole, twoPhotonAxialFwhm, widefieldDepthOfField,
} from "../../../physics/imaging/optical-sectioning-thickness";

const fmtUm = (x: number) => (Number.isFinite(x) ? `${(x * 1e6).toFixed(2)} µm` : "—");

/** Keep the finite (x, y) pairs, with y converted to µm. */
function finiteUm(xs: number[], ys: number[]) {
  const keep = ys.map(Number.isFinite);
  return { x: xs.filter((_, i) => keep[i]), y: ys.filter((_, i) => keep[i]).map((y) => y * 1e6) };
}

export default function OpticalSectioningPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 550); // nm
  const [na, setNa] = useURLState("na", 0.75);
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.518);
  const [pinholeAU, setPinholeAU] = useURLState("pinholeAU", 1.0);

  const lambda = wavelength * 1e-9;
  const n = refractiveIndex;
  const results = {
    widefield: widefieldDepthOfField(lambda, n, na),
    confocal: confocalSectionFwhm(lambda, n, na, pinholeAU),
    pointPinhole: confocalSectionFwhmPointPinhole(lambda, n, na),
    twoPhoton: twoPhotonAxialFwhm(2 * lambda, n, na),
    pinholeDiameter: pinholeAU * airyUnit(lambda, na),
  };
  const valid = Number.isFinite(results.confocal);

  const chartData = useMemo(() => {
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.016);
    const lam = wavelength * 1e-9;
    const n = refractiveIndex;
    return [
      { ...finiteUm(nas, nas.map((a) => widefieldDepthOfField(lam, n, a))), type: "scatter", mode: "lines", name: "Widefield DOF", line: { color: "#60a5fa" } },
      { ...finiteUm(nas, nas.map((a) => confocalSectionFwhm(lam, n, a, pinholeAU))), type: "scatter", mode: "lines", name: `Confocal (${pinholeAU} AU)`, line: { color: "#34d399" } },
      { ...finiteUm(nas, nas.map((a) => twoPhotonAxialFwhm(2 * lam, n, a))), type: "scatter", mode: "lines", name: "Two-photon (2λ)", line: { color: "#fbbf24", dash: "dash" } },
      { ...finiteUm([na], [confocalSectionFwhm(lam, n, na, pinholeAU)]), type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, na, refractiveIndex, pinholeAU]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={2000} />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.001" />
        <ValidatedNumberInput label="Pinhole (Airy units)" value={pinholeAU} onChange={setPinholeAU} min={0.1} max={5} step="0.1" />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the NA must be smaller than the refractive index of the immersion medium.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Widefield depth of field" value={fmtUm(results.widefield)} tone="blue" subtext="2nλ/NA²; no true sectioning" />
        <ResultCard
          label={`Confocal section (${pinholeAU} AU)`}
          value={fmtUm(results.confocal)}
          tone="green"
          subtext={pinholeAU < 1 ? `Below 1 AU this overestimates; point-pinhole limit ${fmtUm(results.pointPinhole)}` : `Point-pinhole limit ${fmtUm(results.pointPinhole)}`}
        />
        <ResultCard label="Two-photon section (at 2λ)" value={fmtUm(results.twoPhoton)} tone="yellow" subtext={`λ_exc = ${(2 * wavelength).toFixed(0)} nm${na < 0.7 ? "; fit is for NA > 0.7" : ""}`} />
        <ResultCard label="Pinhole diameter (object side)" value={fmtUm(results.pinholeDiameter)} tone="purple" subtext="× magnification at the pinhole plane" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas (FWHM, textbook approximations)</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">Confocal: √[(0.88λ / (n − √(n² − NA²)))² + (√2·n·PH / NA)²], PH = AU × 1.22λ/NA</p>
          <p className="font-mono">Point pinhole: 0.64λ / (n − √(n² − NA²))</p>
          <p className="font-mono">Two-photon: 2√(ln 2) · 0.532λ / (√2 (n − √(n² − NA²)))</p>
          <p>Confocal formulas from Zeiss, &quot;Confocal Laser Scanning Microscopy: Principles&quot; (Wilhelm et al.); the pinhole formula is the geometric-optical one, valid from 1 AU up. Two-photon from Zipfel, Williams &amp; Webb, Nat. Biotechnol. 21, 1369 (2003), excitation at twice the entered wavelength. Widefield: distance from focus to the first axial zero of the paraxial PSF (Born &amp; Wolf §8.8); out-of-focus light is blurred, not rejected.</p>
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
