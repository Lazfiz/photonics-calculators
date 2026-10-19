"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c, eV } from "../../../physics/constants";
import {
  antiStokesStokesRatio, antiStokesWavelength, ramanShiftEnergy, ramanShiftOf, stokesWavelength,
} from "../../../physics/spectroscopy/raman";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const perCm = 100; // 1 cm⁻¹ in 1/m
const SHIFT_MAX = 5000;

// Shift standards (McCreery, Raman Spectroscopy for Chemical Analysis, 2000) and typical group frequencies (≈).
const BANDS = [
  { name: "Silicon, optical phonon", shift: 520.7, approx: false },
  { name: "Cyclohexane, ring breathing", shift: 801.3, approx: false },
  { name: "Diamond, optical phonon", shift: 1332, approx: false },
  { name: "Graphite, G band", shift: 1580, approx: true },
  { name: "C=O stretch", shift: 1700, approx: true },
  { name: "CH₂ symmetric stretch", shift: 2850, approx: true },
  { name: "O–H stretch, liquid water (broad)", shift: 3400, approx: true },
];

export default function RamanShiftPage() {
  const [laserRaw, setLaser] = useURLState("laserWavelength", 532);
  const [shiftRaw, setShift] = useURLState("ramanShiftCm", 1000);
  const [tempRaw, setTemp] = useURLState("temperature", 295);
  const [detection, setDetection] = useURLState("detection", "photon");
  const [lineRaw, setLine] = useURLState("lineWavelength", 561.89);
  const [minRaw, setMin] = useURLState("minShift", 100);
  const [maxRaw, setMax] = useURLState("maxShift", 4000);

  const laserNm = clamp(laserRaw, 200, 2000, 532);
  const shiftCm = clamp(shiftRaw, 0, SHIFT_MAX, 1000);
  const temperature = clamp(tempRaw, 1, 2000, 295);
  const power = detection === "power";
  const lineNm = clamp(lineRaw, 150, 3000, 561.89);
  const lo = clamp(minRaw, 0, SHIFT_MAX, 100);
  const hiIn = clamp(maxRaw, 0, SHIFT_MAX, 4000);
  const hi = hiIn > lo ? hiIn : Math.min(SHIFT_MAX, lo + 1000);

  const lambdaL = laserNm * 1e-9;
  const shift = shiftCm * perCm;
  const laserCm = 1e7 / laserNm;
  const stokesNm = stokesWavelength(lambdaL, shift) * 1e9;
  const antiStokesNm = antiStokesWavelength(lambdaL, shift) * 1e9;
  const energyMeV = (ramanShiftEnergy(shift) / eV) * 1e3;
  const freqTHz = (c * shift) / 1e12;
  const ratio = antiStokesStokesRatio(lambdaL, shift, temperature, power ? "power" : "photon");
  const lineShiftCm = ramanShiftOf(lambdaL, lineNm * 1e-9) / perCm;
  const noStokes = !Number.isFinite(stokesNm);

  const n = 200;
  const grid = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
  const curve = (f: (lambda: number, s: number) => number) =>
    grid.map((s) => ({ x: s, y: f(lambdaL, s * perCm) * 1e9 })).filter((p) => Number.isFinite(p.y)).map((p) => ({ x: p.x, y: Math.round(p.y * 1e3) / 1e3 }));
  const inRange = shiftCm >= lo && shiftCm <= hi;
  const series = [
    { name: "Stokes", color: "#34d399", points: curve(stokesWavelength) },
    { name: "Anti-Stokes", color: "#f87171", points: curve(antiStokesWavelength) },
    ...(inRange && !noStokes ? [{ name: "Current shift", color: "#fbbf24", showPoints: true, points: [{ x: shiftCm, y: stokesNm }, { x: shiftCm, y: antiStokesNm }] }] : []),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser wavelength λ_L (nm, vacuum)" value={laserRaw} onChange={setLaser} min={200} max={2000} />
        <ValidatedNumberInput label="Raman shift Δν̃ (cm⁻¹)" value={shiftRaw} onChange={setShift} min={0} max={SHIFT_MAX} />
        <ValidatedNumberInput label="Measured line wavelength (nm, vacuum)" value={lineRaw} onChange={setLine} min={150} max={3000} />
        <ValidatedNumberInput label="Sample temperature (K)" value={tempRaw} onChange={setTemp} min={1} max={2000} />
        <ValidatedNumberInput label="Chart from (cm⁻¹)" value={minRaw} onChange={setMin} min={0} max={SHIFT_MAX} />
        <ValidatedNumberInput label="Chart to (cm⁻¹)" value={maxRaw} onChange={setMax} min={0} max={SHIFT_MAX} />
        <div>
          <label className="block text-sm text-gray-400 mb-1" htmlFor="raman-detection">Detector</label>
          <select id="raman-detection" value={power ? "power" : "photon"} onChange={(e) => setDetection(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="photon">Photon counting (CCD, PMT): m = 3</option>
            <option value="power">Power (thermal detector): m = 4</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <ResultCard label="Stokes line λ_S" value={noStokes ? "—" : `${fmt(stokesNm, 3)} nm`} tone="green" subtext={noStokes ? "Shift ≥ laser wavenumber: no Stokes line" : `${fmt(laserCm - shiftCm, 2)} cm⁻¹`} />
        <ResultCard label="Anti-Stokes line λ_aS" value={`${fmt(antiStokesNm, 3)} nm`} tone="red" subtext={`${fmt(laserCm + shiftCm, 2)} cm⁻¹`} />
        <ResultCard label="Laser wavenumber ν̃_L" value={`${fmt(laserCm, 2)} cm⁻¹`} tone="blue" />
        <ResultCard label="Vibrational energy hcΔν̃" value={`${fmt(energyMeV, 3)} meV`} tone="yellow" subtext={`Frequency cΔν̃ = ${fmt(freqTHz, 3)} THz`} />
        <ResultCard label={`Anti-Stokes/Stokes ratio at ${fmt(temperature, 0)} K`} value={Number.isFinite(ratio) ? ratio.toPrecision(4) : "—"} tone="purple" subtext={power ? "Scattered power, m = 4" : "Photon counts, m = 3"} />
        <ResultCard label={`Shift of a line at ${fmt(lineNm, 2)} nm`} value={`${fmt(lineShiftCm, 1)} cm⁻¹`} tone="cyan" subtext={lineShiftCm > 0 ? "Stokes side" : lineShiftCm < 0 ? "Anti-Stokes side" : "Rayleigh line"} />
      </div>
      <p className="mb-8 text-sm text-gray-400">
        All wavelengths are vacuum values. Spectrometers calibrated in air read about 0.15 nm shorter at 532 nm
        (n_air ≈ 1.00028), which moves a shift by under 1 cm⁻¹ when the laser and the line are read the same way.
      </p>

      <SimpleLineChart title="Scattered wavelength vs Raman shift" xLabel="Raman shift (cm⁻¹)" yLabel="Wavelength (nm)" series={series} />

      <div className="bg-gray-900 rounded-lg p-4 mt-6 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">Common Raman bands at {fmt(laserNm, 1)} nm</h3>
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-4">Band</th>
              <th className="py-1 pr-4">Shift (cm⁻¹)</th>
              <th className="py-1 pr-4">Stokes λ (nm)</th>
              <th className="py-1">Anti-Stokes λ (nm)</th>
            </tr>
          </thead>
          <tbody>
            {BANDS.map((b) => (
              <tr key={b.name} className="border-t border-gray-800">
                <td className="py-1 pr-4">{b.name}</td>
                <td className="py-1 pr-4 font-mono">{b.approx ? "≈ " : ""}{b.shift}</td>
                <td className="py-1 pr-4 font-mono text-green-400">{fmt(stokesWavelength(lambdaL, b.shift * perCm) * 1e9, 2)}</td>
                <td className="py-1 font-mono text-red-400">{fmt(antiStokesWavelength(lambdaL, b.shift * perCm) * 1e9, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-500">
          Silicon, cyclohexane and diamond are shift-calibration standards; ≈ marks typical group frequencies, which move
          with the molecule and its surroundings. The graphite D band near 1350 cm⁻¹ moves with the laser wavelength.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">ν̃_L = 10⁷/λ_L (cm⁻¹, λ in nm)</p>
        <p className="font-mono text-green-400">Stokes: ν̃_S = ν̃_L − Δν̃, λ_S = 10⁷/ν̃_S</p>
        <p className="font-mono text-red-400">Anti-Stokes: ν̃_aS = ν̃_L + Δν̃, λ_aS = 10⁷/ν̃_aS</p>
        <p className="font-mono text-purple-400">I_aS/I_S = (ν̃_aS/ν̃_S)^m · exp(−hcΔν̃/k_BT), m = 3 (photons) or 4 (power)</p>
        <p>
          The shift is the vibrational wavenumber of the molecule, so it does not depend on the laser; the scattered
          wavelengths do. The anti-Stokes line starts from the thermally populated excited level, which makes it weaker
          and the ratio a thermometer. The ratio assumes a harmonic vibration and equal cross-sections on both sides,
          which fails under resonance excitation.
        </p>
      </div>
    </>
  );
}
