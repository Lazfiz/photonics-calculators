"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { toDb, topHatGeometricLoss } from "../../../physics/free-space-comms/link-budget";
import { pointingCapture } from "../../../physics/free-space-comms/pointing-loss";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 3) => (!Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2));

/** Both models at one range: top-hat d_t + θR and a Gaussian beam of far-field half-angle θ/2. */
function geometry(divergence: number, range: number, txAperture: number, rxAperture: number, wavelength: number) {
  const theta = divergence * 1e-3, R = range * 1e3, dTx = txAperture * 1e-3, dRx = rxAperture * 1e-2, lambda = wavelength * 1e-9;
  const waist = lambda / (Math.PI * (theta / 2));
  const gauss = pointingCapture(lambda, waist, R, dRx, 0, 0);
  const topHat = topHatGeometricLoss(dTx, theta, R, dRx);
  return {
    beamDiameter: dTx + theta * R, topHat, topHatFraction: 10 ** (-topHat / 10),
    waist, gaussRadius: gauss.beamRadius, gaussFraction: gauss.alignedFraction, gauss: -toDb(gauss.alignedFraction),
  };
}

export default function GeometricLossPage() {
  const [divergenceRaw, setDivergence] = useURLState("txBeamDivergence", 1); // mrad, full angle
  const [rangeRaw, setRange] = useURLState("range", 1); // km
  const [txApertureRaw, setTxAperture] = useURLState("txAperture", 5); // mm
  const [rxApertureRaw, setRxAperture] = useURLState("rxAperture", 10); // cm
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const divergence = clamp(divergenceRaw, 0.001, 100, 1);
  const range = clamp(rangeRaw, 0.001, 100, 1);
  const txAperture = clamp(txApertureRaw, 0.1, 1000, 5);
  const rxAperture = clamp(rxApertureRaw, 0.1, 500, 10);
  const wavelength = clamp(wavelengthRaw, 200, 20000, 1550);

  const calc = useMemo(
    () => geometry(divergence, range, txAperture, rxAperture, wavelength),
    [divergence, range, txAperture, rxAperture, wavelength],
  );
  // A beam can't leave an exit aperture of diameter d_t with a waist larger than d_t/2.
  const belowDiffraction = calc.waist > (txAperture * 1e-3) / 2;

  const plotData = useMemo(() => {
    const rMax = Math.max(10, 2 * range);
    const ranges = Array.from({ length: 200 }, (_, i) => (rMax * (i + 1)) / 200);
    const rows = ranges.map((r) => geometry(divergence, r, txAperture, rxAperture, wavelength));
    return [
      { x: ranges, y: rows.map((g) => g.topHat), type: "scatter", mode: "lines", name: "Top-hat (dB)", yaxis: "y", line: { color: "#f43f5e" } },
      { x: ranges, y: rows.map((g) => g.gauss), type: "scatter", mode: "lines", name: "Gaussian (dB)", yaxis: "y", line: { color: "#a78bfa" } },
      { x: ranges, y: rows.map((g) => g.beamDiameter), type: "scatter", mode: "lines", name: "Beam dia. (m)", yaxis: "y2", line: { color: "#06b6d4", dash: "dot" } },
    ];
  }, [divergence, range, txAperture, rxAperture, wavelength]);

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          <ValidatedNumberInput label="TX beam divergence, full angle (mrad)" value={divergence} onChange={setDivergence} min={0.001} max={100} />
          <ValidatedNumberInput label="Range (km)" value={range} onChange={setRange} min={0.001} max={100} />
          <ValidatedNumberInput label="TX exit aperture (mm)" value={txAperture} onChange={setTxAperture} min={0.1} max={1000} />
          <ValidatedNumberInput label="RX aperture (cm)" value={rxAperture} onChange={setRxAperture} min={0.1} max={500} />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultCard label="Top-hat loss" value={`${calc.topHat.toFixed(2)} dB`} tone="red"
              subtext={`beam ${fmt(calc.beamDiameter)} m wide, ${fmt(calc.topHatFraction * 100)} % caught`} />
            <ResultCard label="Gaussian loss" value={`${calc.gauss.toFixed(2)} dB`} tone="purple"
              subtext={`w = ${fmt(calc.gaussRadius)} m, ${fmt(calc.gaussFraction * 100)} % caught`} />
            <ResultCard label="Gaussian waist w₀ = λ/(πθ/2)" value={`${fmt(calc.waist * 1e3)} mm`} tone="cyan" />
            <ResultCard label="Top-hat − Gaussian" value={`${(calc.topHat - calc.gauss).toFixed(2)} dB`} tone="gray"
              subtext="→ 3.01 dB for a small receiver far away" />
          </div>
          {belowDiffraction && (
            <p className="rounded-lg border border-yellow-700 bg-yellow-900/20 p-3 text-sm text-yellow-200">
              This divergence is below the diffraction limit of the {txAperture} mm exit aperture: a Gaussian beam that
              diverges this little needs a waist of {fmt(calc.waist * 1e3)} mm, wider than the aperture.
            </p>
          )}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Range (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Loss (dB)", color: "#f43f5e", gridcolor: "#374151" },
              yaxis2: { title: "Beam dia. (m)", color: "#06b6d4", gridcolor: "#374151", overlaying: "y", side: "right" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 60, b: 40, l: 55 }, font: { color: "#9ca3af" }, legend: { x: 0.02, y: 0.98 },
            }} />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">Top-hat: L = 20 log₁₀((d_t + θR)/d_r) ≥ 0     Gaussian: η = 1 − exp(−2a²/w(R)²)</p>
        <p>
          The top-hat form (Kim &amp; Korevaar 2001) spreads the power evenly over a disc that starts at the exit
          aperture d_t and grows with the full divergence θ; once that disc is no wider than the receiver, nothing is
          lost. A real laser beam is closer to Gaussian: with its 1/e² radius w(R) = w₀√(1 + (R/z_R)²) and far-field
          half-angle θ/2, the receiver of radius a catches 1 − exp(−2a²/w²). The Gaussian peak is twice the level of a top-hat
          that spreads all the power over the 1/e² disc, so a small receiver on axis catches 3.01 dB more than the top-hat estimate.
        </p>
        <p className="text-gray-500">Perfect pointing, no turbulence. Pointing errors are in the pointing-loss calculator.</p>
      </div>
    </>
  );
}
