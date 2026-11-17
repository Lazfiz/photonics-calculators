import { lcTransmission, goochTarryParallel } from "../../../../src/physics/polarization/twisted-nematic";
const D = Math.PI / 180;
// --- my own TN: integrate 200 thin retarder slabs with rotating director (Jones, diag(1,e^{-i dG}) in director frame)
type C = [number, number];
const cm = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const ca = (a: C, b: C): C => [a[0] + b[0], a[1] + b[1]];
function tnSlab(twist: number, G: number, pol: number, ana: number, N = 4000) {
  let E: [C, C] = [[Math.cos(pol), 0], [Math.sin(pol), 0]];
  for (let j = 0; j < N; j++) {
    const phi = twist * (j + 0.5) / N; const c = Math.cos(phi), s = Math.sin(phi);
    // to director frame
    let a: C = ca([c * E[0][0], c * E[0][1]], [s * E[1][0], s * E[1][1]]);
    let b: C = ca([-s * E[0][0], -s * E[0][1]], [c * E[1][0], c * E[1][1]]);
    const dG = G / N; // slow axis = director (positive dn): director component delayed
    a = cm(a, [Math.cos(-dG), Math.sin(-dG)]);
    E = [ca([c * a[0], c * a[1]], [-s * b[0], -s * b[1]]), ca([s * a[0], s * a[1]], [c * b[0], c * b[1]])];
  }
  const r = Math.cos(ana) * E[0][0] + Math.sin(ana) * E[1][0], i = Math.cos(ana) * E[0][1] + Math.sin(ana) * E[1][1];
  return r * r + i * i;
}
const G = 2 * Math.PI * 0.2 * 5e-6 / 550e-9;
for (const [tw, p, a] of [[90, 0, 0], [90, 0, 90], [240, 45, -45], [0, 45, -45], [45, 0, 0]]) {
  console.log(`TN tw=${tw} p=${p} a=${a}: module ${lcTransmission(tw * D, G, p * D, a * D).toFixed(5)} mine ${tnSlab(tw * D, G, p * D, a * D).toFixed(5)}`);
}
console.log("GT parallel", goochTarryParallel(G).toFixed(5));
