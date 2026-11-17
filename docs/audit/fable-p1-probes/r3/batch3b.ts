// R3 batch 3b: diversity outage Monte Carlo with Math.random (batch3's LCG lost precision in float arithmetic).
import { row } from "./lib";
import * as T from "../../../../src/physics/free-space-comms/turbulence";
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
for (const [n, rho, s2] of [[2, 0, 0.3], [2, 0.5, 0.3], [3, 0.3, 1]] as const) {
  const sl2 = Math.log(1 + s2), sl = Math.sqrt(sl2), N = 4e6, ts = [0.6, 0.4], cE = [0, 0], cM = [0, 0], cS = [0, 0];
  for (let i = 0; i < N; i++) {
    const z0 = gauss(); let sum = 0, sq = 0, mx = 0;
    for (let j = 0; j < n; j++) { const I = Math.exp(sl * (Math.sqrt(rho) * z0 + Math.sqrt(1 - rho) * gauss()) - sl2 / 2); sum += I; sq += I * I; mx = Math.max(mx, I); }
    ts.forEach((t, j) => { if (sum / Math.sqrt(n) < t) cE[j]++; if (Math.sqrt(sq) < t) cM[j]++; if (mx < t) cS[j]++; });
  }
  ts.forEach((t, j) => {
    row(`n=${n} rho=${rho} s2=${s2} t=${t} EGC`, cE[j] / N, T.diversityOutage(t, n, s2, rho, "egc"));
    row(`n=${n} rho=${rho} s2=${s2} t=${t} MRC`, cM[j] / N, T.diversityOutage(t, n, s2, rho, "mrc"));
    row(`n=${n} rho=${rho} s2=${s2} t=${t} SC`, cS[j] / N, T.diversityOutage(t, n, s2, rho, "sc"));
  });
}
