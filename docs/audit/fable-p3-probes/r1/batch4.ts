import { run, cmp, show } from "./lib";
const s = (slug: string) => require(`../../../../src/schemas/wave-optics/${slug}`).default;
const rng = (slug: string, k: string) => { const i = s(slug).inputs.find((x: any) => x.key === k); return `${k}∈[${i.min},${i.max}]`; };
// diffraction: exact RS on-axis for circular aperture at short z
for (const z of [1, 0.3]) { const lam = 632.8e-9, a = 100e-6, zz = z * 1e-3, k = 2 * Math.PI / lam, R = Math.hypot(zz, a);
  const I = 1 + (zz / R) ** 2 - 2 * (zz / R) * Math.cos(k * (R - zz)); const Ip = 4 * Math.sin(Math.PI * a * a / (lam * zz) / 2) ** 2;
  const r = run("diffraction-integral", { propDist: z }); cmp(`diff z=${z}mm onAxis RS`, I, r.outputs.onAxis); cmp(`diff z=${z}mm paraxial`, Ip, r.outputs.onAxisParaxial); console.log("   N=", r.outputs.fresnelNumber, r.warnings.map((w: string) => w.slice(0, 80))); }
console.log(rng("diffraction-integral", "propDist"));
// chirped pulse: no first-order diffraction
show("cp 2500 l/mm", run("chirped-pulse", { gratingLines: 2500 }), ["separation", "residualGdd", "recompressed"]);
// FEL low energy
show("fel 2MeV", run("free-electron-laser", { electronEnergy: 2 }), ["gamma", "wavelength", "rho", "gainLength"]);
// cavity dumped above max rate
show("cd 200MHz", run("cavity-dumped", { repRate: 200 }), ["roundTrip", "maxRate", "peakPower", "dutyCycle"]);
// attosecond helium, 5e14
{ const r = run("attosecond-pulse", { gas: "helium", intensity: 5e14 }); const Up = 9.3373e-14 * 5e14 * 0.64; cmp("hhg He Up", Up, r.outputs.ponderomotive); cmp("hhg He cutoff", 24.5874 + 3.17 * Up, r.outputs.cutoff); show("he", r, ["highestHarmonic", "keldysh", "fourierLimit"]); }
// bessel large alpha
{ const r = run("bessel-beam", { alpha: 0.5 }); const k = 2 * Math.PI / 632.8e-9; cmp("bessel α=0.5 core", 2.404826 / (k * Math.sin(0.5)) * 1e6, r.outputs.coreRadius); cmp("bessel zmax", 5 / Math.tan(0.5), r.outputs.maxDistance); console.log("  ", r.warnings.map((w: string) => w.slice(0, 80)), rng("bessel-beam", "alpha")); }
// slow light index model below n
show("slow ng<n", run("slow-light", { nGroup: 1.2 }), ["groupDelay", "excessDelay", "delayBandwidth"]);
// injection unlocked
show("inj detune 5GHz", run("injection-locking", { detuning: 5 }), ["locked", "upperEdge"]);
// spatial filter pinhole smaller than spot
{ const r = run("spatial-filter", { pinhole: 30 }); cmp("sf T(30µm)", 100 * (1 - Math.exp(-2 * (15 / 33.86815) ** 2)), r.outputs.transmission); }
// mode-locked flat-top shape? none. kerr lens P > Pcr
show("kerr P>Pcr", run("kerr-lens", { peakPower: 3000 }), ["focalLength", "powerRatio"]);
// m2 rayleigh
{ const r = run("m2-factor", { theta: 4 }); cmp("m2 θ=4 zR=w0/θhalf mm", 0.5 / 2e-3 * 1e-3, r.outputs.rayleighRange); }
// gas laser: Psat from <w²>
{ const r = run("gas-laser-resonator"); console.log("gas Psat mW", r.outputs.saturationPower); }
