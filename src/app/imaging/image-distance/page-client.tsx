"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { conjugatesFromMag, thinLensImage } from "../../../physics/imaging/gaussian-optics";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function ImageDistancePage() {
  const [focalLengthRaw, setFocalLength] = useURLState("focalLengthMm", 50);
  const [solve, setSolve] = useURLState("solve", "object"); // object: o given; mag: M given
  const [objectDistRaw, setObjectDist] = useURLState("objectDistMm", 200);
  const [magRaw, setMag] = useURLState("mag", -2);
  const f = clamp(focalLengthRaw, -5000, 5000, 50);
  const o0 = clamp(objectDistRaw, 0.1, 100000, 200);
  const M0 = clamp(magRaw, -1000, 1000, -2);
  const fromMag = solve === "mag";

  let o = o0;
  let i = NaN;
  let M = NaN;
  let problem = "";
  if (Math.abs(f) < 0.1) problem = "The focal length must not be 0.";
  else if (fromMag) {
    if (M0 === 0) problem = "M = 0 puts the object at infinity: use the focal length as the image distance.";
    else {
      ({ o, i } = conjugatesFromMag(f, M0));
      M = M0;
      if (!(o > 0)) {
        problem = `M = ${M0} with f = ${f} mm needs o = ${o.toFixed(2)} mm, a virtual object (light converging onto the lens). ${
          f > 0 ? "A converging lens forms M < 0 (real) or M > 1 (virtual) from a real object." : "A diverging lens forms only 0 < M < 1 from a real object."
        }`;
      }
    }
  } else if (Math.abs(o - f) < 1e-9 * Math.abs(f)) problem = "The object is at the front focal point: the image is at infinity (collimated light).";
  else ({ i, M } = thinLensImage(f, o));

  const real = i > 0;
  const newtonX = o - f;
  const newtonXp = i - f;

  // i(o) in two branches split at the asymptote o = f, clipped at |i| ≤ 10|f|.
  const af = Math.abs(f);
  const oMax = Math.max(5 * af, 1.5 * o);
  const branch = (lo: number, hi: number, name: string, color: string) => {
    const os = Array.from({ length: 150 }, (_, k) => lo + ((hi - lo) * k) / 149);
    return { x: os, y: os.map((ob) => thinLensImage(f, ob).i), type: "scatter" as const, mode: "lines" as const, name, line: { color } };
  };
  const chart = Math.abs(f) < 0.1 ? [] : [
    ...(f > 0
      ? [branch((10 * f) / 9, oMax, "Real image (i > 0)", "#60a5fa"), branch(0.01 * f, (10 * f) / 11, "Virtual image (i < 0)", "#c084fc")]
      : [branch(0.01 * af, oMax, "Virtual image (i < 0)", "#c084fc")]),
    ...(!problem && Math.abs(i) <= 10 * af
      ? [{ x: [o], y: [i], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 10 } }]
      : []),
  ];

  const layout = { paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 70, r: 20, t: 20, b: 60 } };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Focal length f (mm, negative for a diverging lens)" value={focalLengthRaw} onChange={setFocalLength} min={-5000} max={5000} step="0.1" />
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="image-distance-solve">Given</label>
            <select id="image-distance-solve" value={fromMag ? "mag" : "object"} onChange={(e) => setSolve(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="object">Object distance o: find the image</option>
              <option value="mag">Magnification M: find both conjugates</option>
            </select>
          </div>
          {fromMag ? (
            <ValidatedNumberInput label="Magnification M (negative for an inverted image)" value={magRaw} onChange={setMag} min={-1000} max={1000} step="0.1" />
          ) : (
            <ValidatedNumberInput label="Object distance o (mm, in front of the lens)" value={objectDistRaw} onChange={setObjectDist} min={0.1} max={100000} step="0.1" />
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {problem ? (
            <p className="text-red-400">{problem}</p>
          ) : (
            <>
              {fromMag && row("Object distance o", fmt(o, 2, " mm"), "text-yellow-400")}
              {row("Image distance i", fmt(i, 2, " mm"), "text-blue-400")}
              {row("Magnification M = −i/o", fmt(M, 4, "×"), "text-green-400")}
              {row("Image", `${real ? "real" : "virtual"}, ${M < 0 ? "inverted" : "upright"}, ${Math.abs(M) > 1 ? "enlarged" : Math.abs(M) < 1 ? "reduced" : "same size"}`, "text-purple-400")}
              {row("Conjugate ratio |i/o|", fmt(Math.abs(i / o), 4))}
              {row("Object-to-image distance |o + i|", fmt(Math.abs(o + i), 2, " mm"))}
              {row("Newtonian x = o − f, x′ = i − f", `${fmt(newtonX, 2)}, ${fmt(newtonXp, 2)} mm`)}
            </>
          )}
          <p className="text-xs text-gray-500">
            The distances run from the lens (its principal planes, for a thick lens). A microscope objective&apos;s
            working distance, from its front lens to the sample, is set by its mechanics and is shorter than o.
          </p>
        </div>
      </div>

      {chart.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Image distance vs object distance</h2>
          <ChartPanel data={chart} layout={{ ...layout, xaxis: { title: "Object distance o (mm)", gridcolor: "#333" }, yaxis: { title: "Image distance i (mm)", gridcolor: "#333" }, showlegend: true }} />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>1/o + 1/i = 1/f, i = f·o/(o − f), M = −i/o</p>
          <p>From M: o = f(1 − 1/M), i = f(1 − M)</p>
          <p>Newtonian: x·x′ = f², x = o − f, x′ = i − f</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Paraxial thin lens in air, real-is-positive signs: o &gt; 0 for a real object in front of the lens, i &gt; 0
          for a real image behind it, f &gt; 0 for a converging lens. An object inside the focal length of a converging
          lens gives a virtual, upright, enlarged image (a magnifier); a diverging lens always gives a virtual, upright,
          reduced one. The real object-to-image distance is shortest, 4f, at M = −1.
        </p>
      </div>
    </>
  );
}
