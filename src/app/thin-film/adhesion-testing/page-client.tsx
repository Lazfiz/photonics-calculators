"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  TAPE_CLASSES,
  TAPE_CLASS_RANGE,
  benjaminWeaver,
  benjaminWeaverMaxLoad,
  bendTest,
  kendallPeelEnergy,
  tapeClass,
} from "../../../physics/thin-film/adhesion";

const METHODS = { scratch: "Scratch test", peel: "Peel test", tape: "Tape test (ASTM D3359 B)", bend: "Bend test" } as const;
type Method = keyof typeof METHODS;
const isMethod = (s: string): s is Method => Object.hasOwn(METHODS, s);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const layoutBase = {
  paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
  margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true,
};

export default function AdhesionTestingPage() {
  const [methodParam, setMethod] = useURLState("method", "scratch");
  // Scratch test
  const [criticalLoad, setCriticalLoad] = useURLState("criticalLoad", 10, { min: 0 }); // N
  const [tipRadius, setTipRadius] = useURLState("tipRadius", 200, { min: 1 }); // µm
  const [hardness, setHardness] = useURLState("hardness", 6, { min: 0.01 }); // GPa
  // Peel test
  const [peelForce, setPeelForce] = useURLState("peelForce", 100, { min: 0 }); // N/m
  const [peelAngle, setPeelAngle] = useURLState("peelAngle", 90, { min: 0, max: 180 }); // degrees
  const [armModulus, setArmModulus] = useURLState("armModulus", 3, { min: 0.001 }); // GPa
  const [armThickness, setArmThickness] = useURLState("armThickness", 50, { min: 0.01 }); // µm
  // Tape test
  const [removed, setRemoved] = useURLState("removed", 0, { min: 0, max: 100 }); // % of the lattice
  // Bend test
  const [substrateThickness, setSubstrateThickness] = useURLState("substrateThickness", 0.2, { min: 0.001 }); // mm
  const [bendRadius, setBendRadius] = useURLState("bendRadius", 20, { min: 0.01 }); // mm
  const [filmModulus, setFilmModulus] = useURLState("filmModulus", 70, { min: 0.1 }); // GPa
  const [filmPoisson, setFilmPoisson] = useURLState("filmPoisson", 0.2, { min: 0, max: 0.49 });
  const [filmThickness, setFilmThickness] = useURLState("filmThickness", 100, { min: 1 }); // nm
  const [residualStress, setResidualStress] = useURLState("residualStress", 0); // MPa, tensile > 0

  const method: Method = isMethod(methodParam) ? methodParam : "scratch";

  const errors = (
    method === "scratch"
      ? [
          !(criticalLoad >= 0) && "the critical load can't be negative",
          !(tipRadius > 0) && "the tip radius must be positive",
          !(hardness > 0) && "the substrate hardness must be positive",
        ]
      : method === "peel"
        ? [
            !(peelForce >= 0) && "the peel force can't be negative",
            !(peelAngle >= 0 && peelAngle <= 180) && "the peel angle must be 0–180°",
            !(armModulus > 0) && "the modulus of the peel arm must be positive",
            !(armThickness > 0) && "the thickness of the peel arm must be positive",
          ]
        : method === "tape"
          ? [!(removed >= 0 && removed <= 100) && "the area removed must be 0–100 %"]
          : [
              !(substrateThickness > 0) && "the substrate thickness must be positive",
              !(bendRadius > 0) && "the bend radius must be positive",
              substrateThickness > 0 && bendRadius > 0 && !(substrateThickness < 2 * bendRadius) && "the bend radius must exceed half the substrate thickness",
              !(filmModulus > 0) && "the film modulus must be positive",
              !(filmPoisson >= 0 && filmPoisson < 0.5) && "Poisson's ratio must be 0 to < 0.5",
              !(filmThickness > 0) && "the film thickness must be positive",
              !Number.isFinite(residualStress) && "the residual stress must be a number",
            ]
  ).filter((e): e is string => typeof e === "string");
  const valid = errors.length === 0;

  const R_tip = tipRadius * 1e-6;
  const H = hardness * 1e9;
  const scratch = useMemo(() => benjaminWeaver(criticalLoad, R_tip, H), [criticalLoad, R_tip, H]);
  const maxLoad = benjaminWeaverMaxLoad(R_tip, H);
  const peelG = kendallPeelEnergy(peelForce, (peelAngle * Math.PI) / 180, armModulus * 1e9, armThickness * 1e-6);
  const peelStretch = (peelForce * peelForce) / (2 * armModulus * 1e9 * armThickness * 1e-6);
  const cls = tapeClass(removed);
  const bend = useMemo(
    () => bendTest(substrateThickness * 1e-3, bendRadius * 1e-3, filmModulus * 1e9, filmPoisson, filmThickness * 1e-9, residualStress * 1e6),
    [substrateThickness, bendRadius, filmModulus, filmPoisson, filmThickness, residualStress],
  );

  const chart = useMemo(() => {
    if (!valid) return null;
    const n = 120;
    if (method === "scratch") {
      const top = Math.min(Math.max(3 * criticalLoad, 1), 0.9 * maxLoad);
      const L: number[] = [];
      const tau: number[] = [];
      for (let i = 0; i <= n; i++) {
        const l = (top * i) / n;
        L.push(l);
        tau.push(benjaminWeaver(l, R_tip, H).shearStress / 1e6);
      }
      return {
        data: [{ x: L, y: tau, type: "scatter" as const, mode: "lines" as const, name: "τ", line: { color: "#60a5fa" } }],
        layout: { ...layoutBase, xaxis: { title: "Critical load (N)", gridcolor: "#374151" }, yaxis: { title: "Shear stress τ (MPa)", gridcolor: "#374151" } },
      };
    }
    if (method === "peel") {
      const th: number[] = [];
      const G: number[] = [];
      for (let i = 0; i <= n; i++) {
        const deg = (180 * i) / n;
        th.push(deg);
        G.push(kendallPeelEnergy(peelForce, (deg * Math.PI) / 180, armModulus * 1e9, armThickness * 1e-6));
      }
      return {
        data: [{ x: th, y: G, type: "scatter" as const, mode: "lines" as const, name: "G", line: { color: "#60a5fa" } }],
        layout: { ...layoutBase, xaxis: { title: "Peel angle (°)", gridcolor: "#374151" }, yaxis: { title: "G at this peel force (J/m²)", gridcolor: "#374151" } },
      };
    }
    if (method === "bend") {
      // keep the input radius inside the plotted range, but stay above the h_s/2 limit
      const rMin = Math.max(Math.min(Math.max(0.6 * substrateThickness, 0.2 * bendRadius), 0.9 * bendRadius), 0.5 * substrateThickness * 1.001);
      const radii: number[] = [];
      const ch: number[] = [];
      const de: number[] = [];
      for (let i = 0; i <= n; i++) {
        const r = rMin * Math.pow((5 * bendRadius) / rMin, i / n); // mm, log spaced
        const b = bendTest(substrateThickness * 1e-3, r * 1e-3, filmModulus * 1e9, filmPoisson, filmThickness * 1e-9, residualStress * 1e6);
        if (!Number.isFinite(b.channelG)) continue;
        radii.push(r);
        ch.push(b.channelG);
        de.push(b.delaminationG);
      }
      return {
        data: [
          { x: radii, y: ch, type: "scatter" as const, mode: "lines" as const, name: "Channel crack", line: { color: "#f87171" } },
          { x: radii, y: de, type: "scatter" as const, mode: "lines" as const, name: "Delamination", line: { color: "#60a5fa" } },
        ],
        layout: { ...layoutBase, xaxis: { title: "Bend radius (mm)", gridcolor: "#374151", type: "log" }, yaxis: { title: "G (J/m²)", gridcolor: "#374151", type: "log" } },
      };
    }
    return null;
  }, [valid, method, criticalLoad, maxLoad, R_tip, H, peelForce, armModulus, armThickness, substrateThickness, bendRadius, filmModulus, filmPoisson, filmThickness, residualStress]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Test method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {(Object.keys(METHODS) as Method[]).map((k) => <option key={k} value={k}>{METHODS[k]}</option>)}
          </select>
        </label>

        {method === "scratch" && (
          <>
            <ValidatedNumberInput label={<>Critical load L<sub>c</sub> (N)</>} value={criticalLoad} onChange={setCriticalLoad} min={0} step="0.5" />
            <ValidatedNumberInput label="Stylus tip radius (µm)" value={tipRadius} onChange={setTipRadius} min={1} step="10" />
            <ValidatedNumberInput label="Substrate hardness H (GPa)" value={hardness} onChange={setHardness} min={0.01} step="0.5" />
          </>
        )}
        {method === "peel" && (
          <>
            <ValidatedNumberInput label="Peel force per unit width F/b (N/m)" value={peelForce} onChange={setPeelForce} min={0} step="10" />
            <ValidatedNumberInput label="Peel angle θ (°)" value={peelAngle} onChange={setPeelAngle} min={0} max={180} step="5" />
            <ValidatedNumberInput label="Young's modulus of the peel arm (GPa)" value={armModulus} onChange={setArmModulus} min={0.001} step="0.5" />
            <ValidatedNumberInput label="Thickness of the peel arm (µm)" value={armThickness} onChange={setArmThickness} min={0.01} step="5" />
          </>
        )}
        {method === "tape" && (
          <ValidatedNumberInput label="Lattice area removed by the tape (%)" value={removed} onChange={setRemoved} min={0} max={100} step="1" />
        )}
        {method === "bend" && (
          <>
            <ValidatedNumberInput label="Substrate thickness (mm)" value={substrateThickness} onChange={setSubstrateThickness} min={0.001} step="0.05" />
            <ValidatedNumberInput label="Bend radius at the substrate mid-plane (mm)" value={bendRadius} onChange={setBendRadius} min={0.01} step="1" />
            <ValidatedNumberInput label="Film Young's modulus (GPa)" value={filmModulus} onChange={setFilmModulus} min={0.1} step="5" />
            <ValidatedNumberInput label="Film Poisson's ratio" value={filmPoisson} onChange={setFilmPoisson} min={0} max={0.49} step="0.01" />
            <ValidatedNumberInput label="Film thickness (nm)" value={filmThickness} onChange={setFilmThickness} min={1} step="10" />
            <ValidatedNumberInput label="Residual film stress (MPa; tensile > 0)" value={residualStress} onChange={setResidualStress} step="50" />
          </>
        )}
      </div>

      {errors.length > 0 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">No result: {errors.join("; ")}.</p>
      )}

      {valid && method === "scratch" && (
        <>
          {!Number.isFinite(scratch.shearStress) && (
            <p className="mb-6 text-sm text-yellow-300" role="status">
              No result: the contact radius would reach the tip radius (L<sub>c</sub> ≥ πR²H = {fmt(maxLoad, 1, " N")}); the stylus is buried.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <ResultCard label="Interfacial shear stress τ" value={fmt(scratch.shearStress / 1e6, 0, " MPa")} tone="yellow" subtext="H a / √(R² − a²)" />
            <ResultCard label="Contact radius a" value={fmt(scratch.contactRadius * 1e6, 1, " µm")} tone="cyan" subtext="√(L_c / (π H))" />
          </div>
        </>
      )}

      {valid && method === "peel" && (
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <ResultCard label="Interfacial fracture energy G" value={fmt(peelG, 2, " J/m²")} tone="yellow" subtext="Kendall: F/b (1 − cos θ) + (F/b)² / (2Eh)" />
          <ResultCard label="Peel-arm stretching share" value={fmt(peelG > 0 ? (100 * peelStretch) / peelG : NaN, 2, " %")} tone="cyan" subtext="(F/b)² / (2Eh) as a share of G" />
        </div>
      )}

      {valid && method === "tape" && (
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <ResultCard label="ASTM D3359 class" value={cls ?? "—"} tone="yellow" subtext={cls ? `area removed ${TAPE_CLASS_RANGE[cls]}` : undefined} />
        </div>
      )}

      {valid && method === "bend" && bend.stress < 0 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No crack or delamination G: the film is in net compression ({fmt(bend.stress / 1e6, 0, " MPa")}), so it fails by buckling, which isn&apos;t modelled.
        </p>
      )}
      {valid && method === "bend" && (
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <ResultCard label="Film strain (convex side)" value={fmt(bend.strain * 100, 3, " %")} tone="cyan" subtext="h_s / (2R), tensile" />
          <ResultCard label="Film stress along the bend" value={fmt(bend.stress / 1e6, 0, " MPa")} tone="green" subtext="σ_res + E_f ε / (1 − ν_f²)" />
          <ResultCard label="G, channel crack" value={fmt(bend.channelG, 3, " J/m²")} tone="red" subtext="1.976 σ² h / Ē_f; cracks when ≥ film toughness" />
          <ResultCard label="G, interface delamination" value={fmt(bend.delaminationG, 3, " J/m²")} tone="yellow" subtext="σ² h / (2 Ē_f); debonds when ≥ interface toughness" />
        </div>
      )}

      {method === "tape" && (
        <table className="mb-6 text-sm text-gray-300">
          <tbody>
            {TAPE_CLASSES.map((k) => (
              <tr key={k} className={k === cls ? "text-yellow-300" : undefined}>
                <td className="pr-6 font-mono">{k}</td>
                <td>{TAPE_CLASS_RANGE[k]} of the cross-cut area removed</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Model</p>
        {method === "scratch" && (
          <p>
            Benjamin–Weaver: a spherical stylus sinks into a fully plastic substrate until the mean contact pressure equals the
            hardness H, and τ is the shear stress at the leading edge of the contact. It ranks coatings tested with one stylus;
            the critical load also depends on friction, film thickness, the stylus wear and the failure mode, so τ is not a work
            of adhesion. Use the substrate hardness from indentation at a similar depth (optical glasses ≈ 5–7 GPa).
          </p>
        )}
        {method === "peel" && (
          <p>
            Kendall&apos;s energy balance for steady peeling of a linear-elastic strip; G is the energy per unit area to separate
            the interface. Plastic bending of the arm near the peel front adds to the measured force and is not removed here, so
            G is an upper bound for a ductile arm. At small angles the stretching term dominates.
          </p>
        )}
        {method === "tape" && (
          <p>
            ASTM D3359 Method B: a cross-cut lattice is taped and pulled; the class follows from the area removed. The test is a
            pass/fail ranking and gives no adhesion energy.
          </p>
        )}
        {method === "bend" && (
          <p>
            A film on the convex side of a wide substrate bent to radius R carries ε = h<sub>s</sub>/(2R) with no strain across
            the bend (plane strain). G = Z σ²h/Ē<sub>f</sub> from Hutchinson &amp; Suo for a film much thinner than the substrate:
            Z = 1.976 for a channel crack with matched film and substrate moduli, ½ for steady-state delamination. A substrate
            more compliant than the film (a polymer) raises the channel-crack Z, and a stiffer one lowers it; the delamination G
            doesn&apos;t depend on the substrate. Residual stress from deposition and thermal mismatch, often hundreds of MPa in
            optical coatings, adds to the bending stress. A film in net compression (or on the concave side) buckles instead,
            which isn&apos;t modelled.
          </p>
        )}
      </div>

      {chart && <ChartPanel data={chart.data} layout={chart.layout} />}
    </>
  );
}
