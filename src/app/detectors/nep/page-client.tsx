"use client";

import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { johnsonNoise, noiseEquivalentPower, shotNoiseCurrent, specificDetectivity } from "../../../physics/detectors/noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function NEPPage() {
  const [darkCurrentRaw, setDarkCurrent] = useURLState("darkCurrent", 10); // nA
  const [responsivityRaw, setResponsivity] = useURLState("responsivity", 0.8); // A/W
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1); // Hz
  const [temperatureRaw, setTemperature] = useURLState("temperature", 300); // K
  const [loadResistorRaw, setLoadResistor] = useURLState("loadResistor", 50); // Ω
  const [detectorAreaRaw, setDetectorArea] = useURLState("detectorArea", 1); // mm²
  const darkCurrent_nA = clamp(darkCurrentRaw, 0, 1e9, 10);
  const responsivity = clamp(responsivityRaw, 1e-6, 100, 0.8);
  const bandwidth = clamp(bandwidthRaw, 1e-3, 1e12, 1);
  const temperature = clamp(temperatureRaw, 0, 1000, 300);
  const loadResistor = clamp(loadResistorRaw, 1e-3, 1e15, 50);
  const detectorArea_mm2 = clamp(detectorAreaRaw, 1e-6, 1e6, 1);

  const iShot = shotNoiseCurrent(darkCurrent_nA * 1e-9, bandwidth);
  const iThermal = johnsonNoise(loadResistor, temperature, bandwidth).i;
  const totalNoiseCurrent = Math.hypot(iShot, iThermal);
  const nep = noiseEquivalentPower(totalNoiseCurrent, responsivity); // W in the bandwidth B
  const nepSpectral = nep / Math.sqrt(bandwidth); // W/√Hz
  const detectivity = specificDetectivity(detectorArea_mm2 * 1e-2, bandwidth, nep); // mm² → cm², Jones

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Dark Current (nA)" value={darkCurrentRaw} onChange={setDarkCurrent} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Responsivity (A/W)" value={responsivityRaw} onChange={setResponsivity} min={1e-6} max={100} step="any" />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-3} max={1e12} step="any" />
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={0} max={1000} />
        <ValidatedNumberInput label="Load Resistor (Ω)" value={loadResistorRaw} onChange={setLoadResistor} min={1e-3} max={1e15} />
        <ValidatedNumberInput label="Detector Area (mm²)" value={detectorAreaRaw} onChange={setDetectorArea} min={1e-6} max={1e6} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="NEP" value={`${nep.toExponential(2)} W`} tone="blue" subtext="Total for bandwidth B" />
        <ResultCard label="NEP (spectral)" value={`${nepSpectral.toExponential(2)} W/√Hz`} tone="cyan" subtext="Per root Hz" />
        <ResultCard label="D*" value={Number.isFinite(detectivity) ? `${detectivity.toExponential(2)} Jones` : "—"} tone="green" subtext="√(A·B)/NEP" />
        <ResultCard label="Noise current (rms)" value={`${totalNoiseCurrent.toExponential(3)} A`} tone="orange" subtext={`shot ${iShot.toExponential(2)} A, Johnson ${iThermal.toExponential(2)} A`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-sm text-gray-400 leading-6">
        <p className="font-semibold text-white mb-2">Formulas</p>
        <p>i<sub>shot</sub> = √(2qI<sub>d</sub>B)</p>
        <p>i<sub>thermal</sub> = √(4kTB/R<sub>L</sub>)</p>
        <p>NEP = √(i<sub>shot</sub>² + i<sub>thermal</sub>²) / ℛ (total power equivalent in B)</p>
        <p>D* = √(A · B) / NEP (Jones — cm·√Hz/W)</p>
        <p className="mt-2 text-gray-500">Dark-current shot noise and load-resistor Johnson noise only: no signal shot noise, no amplifier noise.</p>
      </div>
    </>
  );
}
