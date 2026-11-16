import { run, cmp, show } from "./lib";
type C = [number, number]; const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; const conj = (a: C): C => [a[0], -a[1]];
const add = (...x: C[]): C => x.reduce((s, a) => [s[0] + a[0], s[1] + a[1]], [0, 0] as C); const sc = (a: C, k: number): C => [a[0] * k, a[1] * k]; const ei = (t: number): C => [Math.cos(t), Math.sin(t)];
function fwm(lossDbKm: number, b2psKm: number) { const g = 2 * Math.PI * 2.6e-20 / (1550e-9 * 11e-12), P0 = 1, L = 500, a = lossDbKm / 4.343 / 1e3;
  const c = 299792458, W = 2 * Math.PI * c * (1 / 1550e-9 - 1 / 1560e-9), db = b2psKm * 1e-27 * W * W; const n = 20000, h = L / n;
  let s: C = [Math.sqrt(1e-5), 0], i: C = [0, 0]; const Pz = (z: number) => P0 * Math.exp(-a * z); const phip = (z: number) => a > 0 ? g * P0 * (1 - Math.exp(-a * z)) / a : g * P0 * z;
  const f = (z: number, s: C, i: C): [C, C] => { const P = Pz(z); const Ap2 = sc(ei(2 * phip(z) - db * z), P);
    const ds = add(sc(s, -a / 2), mul([0, g], add(sc(s, 2 * P), mul(Ap2, conj(i))))); const di = add(sc(i, -a / 2), mul([0, g], add(sc(i, 2 * P), mul(Ap2, conj(s))))); return [ds, di]; };
  for (let k = 0; k < n; k++) { const z = k * h; const k1 = f(z, s, i), k2 = f(z + h / 2, add(s, sc(k1[0], h / 2)), add(i, sc(k1[1], h / 2))), k3 = f(z + h / 2, add(s, sc(k2[0], h / 2)), add(i, sc(k2[1], h / 2))), k4 = f(z + h, add(s, sc(k3[0], h)), add(i, sc(k3[1], h)));
    s = add(s, sc(add(k1[0], sc(k2[0], 2), sc(k3[0], 2), k4[0]), h / 6)); i = add(i, sc(add(k1[1], sc(k2[1], 2), sc(k3[1], 2), k4[1]), h / 6)); }
  return (s[0] ** 2 + s[1] ** 2) / 1e-5; }
for (const [lo, b2] of [[0, -0.1], [0.2, -0.1], [20, -0.1], [20, 0.1], [5, -1]]) { const r = run("four-wave-mixing", { fiberLoss: lo, beta2: b2 }); cmp(`fwm loss=${lo} b2=${b2} G`, fwm(lo, b2), r.outputs.signalGain); }
// FEL unsaturated: P(z) = (Pn/9) e^{z/Lg}, Pn = ρ² γ m c³/λ
{ const r = run("free-electron-laser", { undulatorLength: 5 }); const rho = r.outputs.rho as number, g = r.outputs.gamma as number, lam = (r.outputs.wavelength as number) * 1e-9, Lg = r.outputs.gainLength as number;
  const Pn = rho * rho * g * 9.1093837e-31 * 299792458 ** 3 / lam; cmp("FEL P(5m) W", Pn / 9 * Math.exp(5 / Lg), r.outputs.powerAtEnd); }
