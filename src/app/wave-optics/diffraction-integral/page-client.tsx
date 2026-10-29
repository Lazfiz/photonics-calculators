"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  MAX_CIRCULAR_FRESNEL_NUMBER, airyFirstZeroRadius, circularFraunhoferIntensity, circularFresnelIntensity,
  circularOnAxisIntensity, circularOnAxisIntensityExact, fresnelEdgePhaseError, fresnelNumber, slitFirstZero, slitFraunhoferIntensity, slitFresnelIntensity,
} from "../../../physics/wave-optics/diffraction-integral";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const keep = (y: number) => (Number.isFinite(y) ? round6(y) : null);

export default function DiffractionIntegralPage() {
  const [apertureRaw, setAperture] = useURLState("aperture", "circular");
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 632.8); // nm
  const [sizeRaw, setSize] = useURLState("apertureSize", 100); // µm, radius or slit half-width
  const [zRaw, setZ] = useURLState("propDist", 50); // mm
  const [obsRaw, setObs] = useURLState("observationSize", 500); // µm

  const slit = apertureRaw === "slit";
  const wavelength = clamp(wavelengthRaw, 200, 11000, 632.8);
  const a_um = clamp(sizeRaw, 1, 1e4, 100);
  const z_mm = clamp(zRaw, 0.1, 1e5, 50);
  const lambda = wavelength * 1e-9;
  const a = a_um * 1e-6;
  const z = z_mm * 1e-3;
  const NF = fresnelNumber(a, lambda, z);

  // Show the aperture region in the near field and 20 far-field zeros in the far field.
  const zero_um = (slit ? slitFirstZero(a, lambda, z) : airyFirstZeroRadius(a, lambda, z)) * 1e6;
  const obsCap_um = Math.max(3 * a_um, 40 * ((lambda * z) / a) * 1e6);
  const obs_um = clamp(obsRaw, a_um / 10, obsCap_um, Math.min(500, obsCap_um));

  const tooNear = !slit && NF > MAX_CIRCULAR_FRESNEL_NUMBER;
  const onAxisParaxial = slit ? slitFresnelIntensity(NF, 0) : circularOnAxisIntensity(NF);
  const onAxis = slit ? onAxisParaxial : circularOnAxisIntensityExact(a, lambda, z);
  // Phase the Fresnel step drops at the aperture edge; > 0.1 rad shifts the on-axis value by up to ≈ 0.2 I₀.
  const edgePhase = Math.abs(fresnelEdgePhaseError(a, lambda, z));
  const farField = NF <= 1; // the Fraunhofer curve is worth overlaying
  const regime = NF < 0.1 ? "Fraunhofer (far field)" : NF <= 1 ? "Fresnel, near the far field" : "Fresnel (near field)";
  const zFar_mm = ((a * a) / lambda) * 1e3; // N_F = 1
  const angle = (a + obs_um * 1e-6) / z;

  const points = slit ? 801 : 401;
  const xs = Array.from({ length: points }, (_, i) => round6(slit ? -obs_um + (2 * obs_um * i) / (points - 1) : (obs_um * i) / (points - 1)));
  const fresnel = tooNear ? [] : xs.map((x) => (slit ? slitFresnelIntensity(NF, x / a_um) : circularFresnelIntensity(NF, x / a_um)));
  let peak = 0;
  for (const v of fresnel) peak = Math.max(peak, v);
  const series = [
    ...(tooNear ? [] : [{ name: "Fresnel integral", color: "#60a5fa", points: xs.map((x, i) => ({ x, y: keep(fresnel[i]) })) }]),
    ...(farField && !tooNear
      ? [{
        name: "Fraunhofer (far field)", color: "#f87171", dashed: true,
        points: xs.map((x) => ({ x, y: keep(slit ? slitFraunhoferIntensity(NF, x / a_um) : circularFraunhoferIntensity(NF, x / a_um)) })),
      }]
      : []),
    ...(a_um <= obs_um && !tooNear
      ? [{ name: "Aperture edge", color: "#9ca3af", dashed: true, points: [{ x: round6(a_um), y: 0 }, { x: round6(a_um), y: round6(peak) }] }]
      : []),
  ];

  // Cross-section of the circular pattern from the radial profile (linear interpolation), corners inside the profile.
  const G = 201;
  const half_um = obs_um / Math.SQRT2;
  const axis = Array.from({ length: G }, (_, i) => round6(-half_um + (2 * half_um * i) / (G - 1)));
  const lookup = (r: number) => {
    const s = (r / obs_um) * (points - 1);
    const i = Math.min(points - 2, Math.floor(s));
    return fresnel[i] + (s - i) * (fresnel[i + 1] - fresnel[i]);
  };
  const heat = slit || tooNear ? null : [{
    z: axis.map((y) => axis.map((x) => keep(lookup(Math.hypot(x, y))))),
    x: axis, y: axis, type: "heatmap" as const, colorscale: "Inferno", colorbar: { title: { text: "I / I₀" } },
  }];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Aperture</span>
          <select value={slit ? "slit" : "circular"} onChange={(e) => setAperture(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="circular">Circular aperture (radius a)</option>
            <option value="slit">Single slit (half-width a)</option>
          </select>
        </label>
        <ValidatedNumberInput label="Wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={11000} />
        <ValidatedNumberInput label={slit ? "Slit half-width a (µm)" : "Aperture radius a (µm)"} value={sizeRaw} onChange={setSize} min={1} max={1e4} step="any" />
        <ValidatedNumberInput label="Distance to the screen z (mm)" value={zRaw} onChange={setZ} min={0.1} max={1e5} step="any" />
        <ValidatedNumberInput label="Plotted radius on the screen (µm)" value={obsRaw} onChange={setObs} min={round6(a_um / 10)} max={round6(obsCap_um)} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Fresnel number N_F = a²/(λz)" value={fmt(NF)} subtext={regime} tone="blue" />
        <ResultCard
          label="On-axis intensity I(0)/I₀"
          value={fmt(onAxis)}
          subtext={slit
            ? "Fresnel integrals at x = 0"
            : `exact Rayleigh–Sommerfeld; paraxial 4 sin²(πN_F/2) = ${fmt(onAxisParaxial)} (bright for odd N_F, dark for even)`}
          tone="green"
        />
        <ResultCard
          label={slit ? "Far-field first zero λz/(2a)" : "Far-field first dark ring 1.22λz/(2a)"}
          value={`${fmt(zero_um)} µm`}
          subtext={NF < 0.1 ? "Valid here: N_F ≪ 1" : "Only once N_F ≪ 1; not the pattern at this distance"}
          tone="orange"
        />
        <ResultCard label="Far field starts beyond" value={`z ≫ a²/λ = ${fmt(zFar_mm)} mm`} subtext="The distance where N_F = 1" tone="purple" />
      </div>

      {tooNear && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          N_F = {fmt(NF, 3)} is above {MAX_CIRCULAR_FRESNEL_NUMBER}: the screen is so close that the pattern is the
          aperture&apos;s geometric shadow with fine edge fringes. The on-axis value above is the exact Rayleigh–Sommerfeld one; move the screen
          further or shrink the aperture to plot the pattern.
        </p>
      )}
      {edgePhase > 0.1 && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The Fresnel approximation drops a phase πa⁴/(4λz³) = {fmt(edgePhase, 2)} rad at the aperture edge, which is not ≪ 1:
          the {slit ? "on-axis value and the " : ""}plotted Fresnel pattern {slit ? "are" : "is"} only approximate. Use a larger z or a smaller aperture.
        </p>
      )}
      {angle > 0.1 && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The edge of the plot is {fmt(angle, 2)} rad off axis: beyond the paraxial Fresnel approximation, so expect errors
          there. Use z ≫ a.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        {slit ? (
          <p>I/I₀ = ½[(C(ξ₂) − C(ξ₁))² + (S(ξ₂) − S(ξ₁))²], ξ₁,₂ = √(2/(λz)) (∓a − x), with C and S the Fresnel integrals.</p>
        ) : (
          <p>I/I₀ = (k/z)² |∫₀ᵃ e<sup>ikr²/(2z)</sup> J₀(krρ/z) r dr|², the Fresnel–Hankel integral of a plane wave cut by the aperture.</p>
        )}
        <p>Far field (N_F ≪ 1): {slit ? "4N_F sinc²(kax/z)" : "(πN_F)² [2J₁(v)/v]², v = kaρ/z (the Airy pattern)"}. Intensities are relative to the incident I₀.</p>
      </div>

      <div className="space-y-6">
        {!tooNear && (
          <SimpleLineChart
            title="Intensity on the screen"
            xLabel={slit ? "Position x (µm)" : "Radius ρ (µm)"}
            yLabel="I / I₀ (incident intensity)"
            series={series}
          />
        )}
        {heat && (
          <div className="rounded-lg bg-gray-900 p-4">
            <ChartPanel data={heat} layout={{
              paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
              title: { text: "Pattern on the screen" },
              xaxis: { title: { text: "x (µm)" }, gridcolor: "#374151" },
              yaxis: { title: { text: "y (µm)" }, gridcolor: "#374151", scaleanchor: "x" },
              margin: { t: 40, r: 30, b: 50, l: 70 },
            }} />
          </div>
        )}
      </div>
    </>
  );
}
