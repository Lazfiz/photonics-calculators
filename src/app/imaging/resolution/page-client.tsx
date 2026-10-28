"use client";

import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { airyFwhm } from "../../../physics/imaging/diffraction-psf";
import { abbeLateralFwhm, axialPsfFwhm, rayleighDistance } from "../../../physics/imaging/super-resolution";

const media = [
  { label: "Air", n: 1.0 },
  { label: "Water", n: 1.33 },
  { label: "Oil", n: 1.518 },
  { label: "Custom", n: NaN },
];

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtNm = (x: number) => (Number.isFinite(x) ? `${(x * 1e9).toFixed(1)} nm` : "—");

export default function ResolutionPage() {
  const [naRaw, setNa] = useURLState("na", 1.4);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550); // nm
  const [mediumIdxRaw, setMediumIdx] = useURLState("mediumIdx", 2);
  const [customNRaw, setCustomN] = useURLState("customN", 1.5);
  const na = clamp(naRaw, 0.01, 1.8, 1.4);
  const wavelength = clamp(wavelengthRaw, 200, 2000, 550);
  const mediumIdx = Math.round(clamp(mediumIdxRaw, 0, media.length - 1, 2));
  const customN = clamp(customNRaw, 1, 2, 1.5);

  const n = mediumIdx === 3 ? customN : media[mediumIdx].n;
  const naValid = na < n;
  const lambda = wavelength * 1e-9;
  const results = {
    abbe: naValid ? abbeLateralFwhm(lambda, na) : NaN,
    rayleigh: naValid ? rayleighDistance(lambda, na) : NaN,
    fwhm: naValid ? airyFwhm(lambda, na) : NaN,
    axial: axialPsfFwhm(lambda, n, na),
  };

  // Curves run up to just below min(n, 1.8): the formulas need NA < n.
  const wavelengths = [400, 500, 550, 600, 700];
  const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#c084fc"];
  const naLo = Math.min(0.1, na);
  const naHi = Math.min(n, 1.8) * 0.999;
  const nas = Array.from({ length: 141 }, (_, i) => naLo + ((naHi - naLo) * i) / 140);
  const plotData = [
    ...wavelengths.flatMap((wl, i) => [
      { x: nas, y: nas.map((x) => abbeLateralFwhm(wl * 1e-9, x) * 1e9), type: "scatter" as const, mode: "lines" as const, name: `Abbe ${wl} nm`, line: { color: colors[i], dash: "solid" } },
      { x: nas, y: nas.map((x) => rayleighDistance(wl * 1e-9, x) * 1e9), type: "scatter" as const, mode: "lines" as const, name: `Rayleigh ${wl} nm`, line: { color: colors[i], dash: "dash" } },
    ]),
    { x: nas, y: nas.map((x) => abbeLateralFwhm(lambda, x) * 1e9), type: "scatter" as const, mode: "lines" as const, name: `Abbe ${wavelength} nm (input)`, line: { color: "#ffffff", dash: "solid", width: 3 } },
    { x: nas, y: nas.map((x) => rayleighDistance(lambda, x) * 1e9), type: "scatter" as const, mode: "lines" as const, name: `Rayleigh ${wavelength} nm (input)`, line: { color: "#ffffff", dash: "dash", width: 3 } },
    ...(naValid
      ? [
          { x: [na], y: [results.abbe * 1e9], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 11 } },
          { x: [na], y: [results.rayleigh * 1e9], type: "scatter" as const, mode: "markers" as const, name: "Current (Rayleigh)", showlegend: false, marker: { color: "#fbbf24", size: 11 } },
        ]
      : []),
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <ValidatedNumberInput label="Numerical Aperture (NA)" value={naRaw} onChange={setNa} min={0.01} max={1.8} />
          </div>
          <div>
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Immersion Medium</label>
            <select value={mediumIdx} onChange={e => setMediumIdx(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              {media.map((m, i) => <option key={m.label} value={i}>{m.label} (n = {Number.isFinite(m.n) ? m.n : customN})</option>)}
            </select>
          </div>
          {mediumIdx === 3 && (
            <div>
              <ValidatedNumberInput label="Custom refractive index" value={customNRaw} onChange={setCustomN} min={1} max={2} />
            </div>
          )}
          <p className={`text-xs ${naValid ? "text-gray-500" : "text-red-400"}`}>
            {naValid ? "NA = n sin α, so NA must stay below the medium index n." : `NA ${na} is not possible in a medium of n = ${n}: NA = n sin α < n.`}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Refractive index (n)</span>
            <span className="font-mono text-white">{n.toFixed(3)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Abbe limit λ/(2NA)</span>
            <span className="font-mono text-blue-400">{fmtNm(results.abbe)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Rayleigh criterion 0.61λ/NA</span>
            <span className="font-mono text-green-400">{fmtNm(results.rayleigh)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Airy FWHM 0.514λ/NA</span>
            <span className="font-mono text-yellow-400">{fmtNm(results.fwhm)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Axial FWHM 0.88λ/(n − √(n² − NA²))</span>
            <span className="font-mono text-purple-400">{fmtNm(results.axial)}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Abbe: the finest grating period an objective passes with oblique illumination filling the aperture.</p>
            <p>Rayleigh: two incoherent points resolved when one sits on the other&apos;s first dark ring (26 % dip).</p>
            <p>Axial: the widefield on-axis PSF; n sets the cone angle, so it widens as NA nears n.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Lateral resolution vs NA (different wavelengths)</h2>
        <ChartPanel data={plotData}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#ccc" },
            xaxis: { title: "NA", gridcolor: "#333" },
            yaxis: { title: "Resolution (nm)", gridcolor: "#333" },
            legend: { font: { size: 10 }, orientation: "h", y: -0.25 },
            margin: { b: 120, l: 60, r: 20, t: 20 },
          }}
        />
      </div>
    </>
  );
}
