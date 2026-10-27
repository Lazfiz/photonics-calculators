"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { johnsonNoise, responsivity as responsivityOf } from "../../../physics/detectors/noise";
import { combinedBandwidth, depletionWidth, rcBandwidth, transitBandwidth } from "../../../physics/detectors/photodiode-rc";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtHz = (f: number) => (!Number.isFinite(f) ? "—" : f >= 1e9 ? `${(f / 1e9).toFixed(2)} GHz` : `${(f / 1e6).toFixed(2)} MHz`);

// Photodiode: C_j = C''·A, W = ε₀ε_r/C''. Bandwidth from the RC limit 1/(2π·R·C_j) and the transit limit 0.443·v/W,
// combined as 1/f² = 1/f_RC² + 1/f_tr² (Bowers & Burrus 1987).
export default function PhotodiodeSpeedPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 850);
  const [qeRaw, setQe] = useURLState("qe", 0.8);
  const [capacitanceDensityRaw, setCapacitanceDensity] = useURLState("capacitanceDensity", 10); // pF/mm²
  const [epsRRaw, setEpsR] = useURLState("epsR", 11.9);
  const [velocityRaw, setVelocity] = useURLState("velocity", 8.4e4); // m/s: Si hole saturation velocity ≈ 8.4×10⁴ m/s at 300 K (Jacoboni et al. 1977, v = 1.62e8·T^−0.52 cm/s)
  const [loadResistanceRaw, setLoadResistance] = useURLState("loadResistance", 50); // Ω
  const [areaMinRaw, setAreaMin] = useURLState("areaMin", 0.001); // mm²
  const [areaMaxRaw, setAreaMax] = useURLState("areaMax", 10); // mm²
  const wavelength_nm = clamp(wavelengthRaw, 200, 20000, 850);
  const qe = clamp(qeRaw, 0.01, 1, 0.8);
  const capacitanceDensity = clamp(capacitanceDensityRaw, 0.01, 1e4, 10) * 1e-12 / 1e-6; // pF/mm² → F/m²
  const epsR = clamp(epsRRaw, 1, 100, 11.9);
  const velocity = clamp(velocityRaw, 1e3, 1e6, 8.4e4);
  const loadResistance = clamp(loadResistanceRaw, 1, 1e9, 50);
  const areaMin = clamp(areaMinRaw, 1e-6, 1e4, 0.001);
  const areaMax = Math.max(clamp(areaMaxRaw, 1e-6, 1e4, 10), areaMin * 1.01);

  const responsivity = responsivityOf(qe, wavelength_nm * 1e-9);
  const W = depletionWidth(capacitanceDensity, epsR); // m
  const fTransit = transitBandwidth(velocity, W);
  const capAt = (a_mm2: number) => capacitanceDensity * a_mm2 * 1e-6; // F
  const fRC1 = rcBandwidth(loadResistance, capAt(1));
  const f1 = combinedBandwidth(fRC1, fTransit);

  const areas = Array.from({ length: 300 }, (_, i) => areaMin * Math.pow(areaMax / areaMin, i / 299));
  const fRC = areas.map(a => rcBandwidth(loadResistance, capAt(a)));
  const chartData = [
    { x: areas, y: fRC, type: "scatter" as const, mode: "lines" as const, name: "RC limit", line: { color: "#60a5fa", dash: "dash" }, yaxis: "y" },
    { x: areas, y: areas.map(() => fTransit), type: "scatter" as const, mode: "lines" as const, name: "Transit limit", line: { color: "#fbbf24", dash: "dash" }, yaxis: "y" },
    { x: areas, y: fRC.map(f => combinedBandwidth(f, fTransit)), type: "scatter" as const, mode: "lines" as const, name: "Combined 3dB BW", line: { color: "#34d399", width: 2 }, yaxis: "y" },
    { x: areas, y: areas.map(a => capAt(a) * 1e12), type: "scatter" as const, mode: "lines" as const, name: "Capacitance (pF)", line: { color: "#f87171", dash: "dot" }, yaxis: "y2" },
  ];
  // Johnson noise of R_L across C_j in its noise bandwidth (π/2)·f_RC at 300 K: i² = 4kT/R_L·(π/2)·f_RC.
  const nep = fRC.map(f => (johnsonNoise(loadResistance, 300, (Math.PI / 2) * f).i / responsivity) * 1e12); // pW

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="10" />
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQe} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="Capacitance Density (pF/mm²)" value={capacitanceDensityRaw} onChange={setCapacitanceDensity} min={0.01} max={1e4} step="1" />
        <ValidatedNumberInput label="Relative Permittivity ε_r (Si 11.9)" value={epsRRaw} onChange={setEpsR} min={1} max={100} step="0.1" />
        <ValidatedNumberInput label="Slower-Carrier Velocity (m/s)" value={velocityRaw} onChange={setVelocity} min={1e3} max={1e6} step="1e4" />
        <ValidatedNumberInput label="Load Resistance (Ω)" value={loadResistanceRaw} onChange={setLoadResistance} min={1} max={1e9} step="10" />
        <ValidatedNumberInput label="Area Min (mm²)" value={areaMinRaw} onChange={setAreaMin} min={1e-6} max={1e4} step="0.001" />
        <ValidatedNumberInput label="Area Max (mm²)" value={areaMaxRaw} onChange={setAreaMax} min={1e-6} max={1e4} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Responsivity" value={`${(responsivity * 1e3).toFixed(2)} mA/W`} tone="blue" />
        <ResultCard label="Depletion Width W" value={`${(W * 1e6).toFixed(2)} µm`} tone="cyan" subtext="ε₀·ε_r / C''" />
        <ResultCard label="Transit Limit" value={fmtHz(fTransit)} tone="orange" subtext="0.443·v/W, any area" />
        <ResultCard label="RC BW @ 1 mm²" value={fmtHz(fRC1)} tone="green" subtext={`C = ${(capAt(1) * 1e12).toPrecision(3)} pF, RC = ${(loadResistance * capAt(1) * 1e12).toFixed(2)} ps`} />
        <ResultCard label="Combined BW @ 1 mm²" value={fmtHz(f1)} tone="purple" subtext={fRC1 < fTransit ? "RC-limited" : "Transit-limited"} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>C<sub>j</sub> = C&apos;&apos; · A, depletion width W = ε₀ε<sub>r</sub> / C&apos;&apos;</p>
        <p>f<sub>RC</sub> = 1 / (2π · R · C<sub>j</sub>), f<sub>tr</sub> = 0.443 · v / W (carrier crossing the full width)</p>
        <p>1/f<sub>3dB</sub>² = 1/f<sub>RC</sub>² + 1/f<sub>tr</sub>²</p>
        <p>ℛ = η · qλ / (hc) (responsivity)</p>
        <p>NEP<sub>thermal</sub> = √(4k<sub>B</sub>T/R<sub>L</sub> · (π/2)·f<sub>RC</sub>) / ℛ at 300 K (Johnson noise of R<sub>L</sub> in the RC noise bandwidth)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Bandwidth vs Area", font: { size: 12 } },
          xaxis: { title: "Area (mm²)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "3dB Bandwidth (Hz)", gridcolor: "#374151", type: "log" },
          yaxis2: { title: "Capacitance (pF)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" },
          margin: { t: 40, r: 60, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />

        <ChartPanel data={[{ x: areas, y: nep, type: "scatter" as const, mode: "lines" as const,
          name: "NEP", line: { color: "#fbbf24" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Thermal NEP vs Area", font: { size: 12 } },
          xaxis: { title: "Area (mm²)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "NEP in RC noise bandwidth (pW)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 70 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />
      </div>
    </>
  );
}
