"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  SPECKLE_FIRST_ZERO, averagedContrast, objectiveSpeckleSize, speckleContrast, subjectiveSpeckleSize, surfacePhaseRms,
} from "../../../physics/imaging/speckle";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const nm = 1e-9;
const um = 1e-6;
const mm = 1e-3;

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const card = (label: string, value: string, sub: string, color: string) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{sub}</p>
  </div>
);

export default function SpeckleImagingPage() {
  const [wavelengthRaw, setWavelengthNm] = useURLState("wavelengthNm", 532);
  const [spotRaw, setSpotMm] = useURLState("beamDiameterMm", 5);
  const [distanceRaw, setDistanceMm] = useURLState("propagationDistMm", 200);
  const [fNumberRaw, setFNumber] = useURLState("fNumber", 8);
  const [magnificationRaw, setMagnification] = useURLState("magnification", 0.5);
  const [roughnessRaw, setRoughnessUm] = useURLState("surfaceRoughnessUm", 0.08);
  const [cellsRaw, setCells] = useURLState("correlationCells", 100);
  const [averagesRaw, setAverages] = useURLState("numAverages", 10);
  const wavelengthNm = clamp(wavelengthRaw, 200, 20000, 532);
  const spotMm = clamp(spotRaw, 0.01, 1000, 5);
  const distanceMm = clamp(distanceRaw, 1, 1e6, 200);
  const fNumber = clamp(fNumberRaw, 0.5, 64, 8);
  const magnification = clamp(magnificationRaw, 0, 100, 0.5);
  const roughnessUm = clamp(roughnessRaw, 0, 100, 0.08);
  const cells = clamp(cellsRaw, 1, 1e8, 100);
  const averages = clamp(averagesRaw, 1, 10000, 10);

  const lambda = wavelengthNm * nm;
  const objective = objectiveSpeckleSize(lambda, distanceMm * mm, spotMm * mm);
  const subjective = subjectiveSpeckleSize(lambda, fNumber, magnification);
  const phaseRms = surfacePhaseRms(roughnessUm * um, lambda);
  const contrast = speckleContrast(phaseRms, cells);
  const wideAngle = spotMm / distanceMm > 0.3; // λz/D is paraxial
  const averaged = averagedContrast(contrast, averages);

  const curves = (() => {
    const hs = Array.from({ length: 121 }, (_, k) => 10 ** (k / 30)); // σ_h from 1 nm to 10 µm
    const cs = hs.map((h) => speckleContrast(surfacePhaseRms(h * nm, lambda), cells));
    return [
      { x: hs, y: cs, type: "scatter" as const, mode: "lines" as const, name: "One pattern C", line: { color: "#60a5fa" } },
      { x: hs, y: cs.map((c) => averagedContrast(c, averages)), type: "scatter" as const, mode: "lines" as const, name: `${averages} patterns averaged`, line: { color: "#34d399" } },
    ];
  })();
  const roughnessNm = roughnessUm * 1000;
  const chart = [
    ...curves,
    ...(roughnessNm >= 1 && roughnessNm <= 1e4
      ? [{ x: [roughnessNm], y: [contrast], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } }]
      : []),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {card("Objective speckle λz/D", fmt(objective / um, 2, " µm"), `first zero ${fmt((SPECKLE_FIRST_ZERO * objective) / um, 2, " µm")}`, "text-blue-400")}
        {card("Subjective speckle λ(1 + M)N", fmt(subjective / um, 2, " µm"), `first zero ${fmt((SPECKLE_FIRST_ZERO * subjective) / um, 2, " µm")}`, "text-purple-400")}
        {card("Contrast, one pattern", fmt(contrast, 3), `σ_φ = 4πσ_h/λ = ${fmt(phaseRms, 2, " rad")}, N_c = ${fmt(cells, 0)}`, "text-green-400")}
        {card(`Contrast, ${averages} patterns`, fmt(averaged, 3), "C/√N, uncorrelated patterns", "text-yellow-400")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelengthNm} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Illuminated spot diameter D (mm)" value={spotRaw} onChange={setSpotMm} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Observation distance z (mm)" value={distanceRaw} onChange={setDistanceMm} min={1} max={1e6} step="any" />
        <ValidatedNumberInput label="Surface roughness σ_h, rms (µm)" value={roughnessRaw} onChange={setRoughnessUm} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Surface correlation cells per resolution cell N_c" value={cellsRaw} onChange={setCells} min={1} max={1e8} step="any" />
        <ValidatedNumberInput label="Imaging lens f-number N" value={fNumberRaw} onChange={setFNumber} min={0.5} max={64} step="any" />
        <ValidatedNumberInput label="Magnification M (image/object)" value={magnificationRaw} onChange={setMagnification} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Uncorrelated patterns averaged N" value={averagesRaw} onChange={setAverages} min={1} max={10000} step="1" />
      </div>

      {(wideAngle || phaseRms < 1) && (
        <div className="space-y-1 mb-6 text-sm text-yellow-300" role="status">
          {wideAngle && <p>D/z = {fmt(spotMm / distanceMm, 2)} is above 0.3: λz/D is a paraxial estimate and loses accuracy at this angle.</p>}
          {phaseRms < 1 && phaseRms > 0 && <p>σ_φ is below 1 rad: the diffuse part isn&apos;t circular Gaussian yet, and the Rician form overestimates the contrast.</p>}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="space-y-2 text-gray-300 text-sm">
          <p>
            Objective speckle forms in free space at distance z from a uniformly lit spot of diameter D. Its intensity
            correlation is |2J₁(v)/v|² with v = πDr/(λz): λz/D sets the scale and the first zero is at 1.22λz/D.
            Subjective speckle is the same in an image, with the lens pupil in place of the spot: λ(1 + M)N.
            Quoted &ldquo;speckle sizes&rdquo; differ by these factors (and a diameter is twice the first-zero radius).
          </p>
          <p>
            A Gaussian surface of rms height σ_h seen in reflection at normal incidence adds a phase of rms σ_φ =
            4πσ_h/λ. A resolution cell holding N_c surface correlation cells sums N_c phasors: their mean adds
            coherently (intensity ∝ N_c² e^(−σ_φ²)) and the rest as a random walk (∝ N_c(1 − e^(−σ_φ²))). With
            r = N_c e^(−σ_φ²)/(1 − e^(−σ_φ²)) the Rician contrast is C = √(1 + 2r)/(1 + r) (Fujii &amp; Asakura 1974).
            More cells keep a specular part up to a larger σ_φ: at N_c = 100, C = 0.76 at σ_φ = 2 rad. The form needs
            σ_φ ≳ 1 rad and overestimates C below. Away from the specular direction the specular part is absent and
            the speckle is fully developed (C = 1).
          </p>
          <p>
            Averaging N uncorrelated patterns of equal mean (wavelength, angle or polarization diversity, or a moving
            diffuser) lowers the contrast to C/√N; partly correlated patterns lower it less.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Speckle contrast vs surface roughness</h3>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Rms surface roughness σ_h (nm)", gridcolor: "#333", type: "log" },
          yaxis: { title: "Speckle contrast", gridcolor: "#333", range: [0, 1.05] },
          margin: { l: 60, r: 20, t: 20, b: 50 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
