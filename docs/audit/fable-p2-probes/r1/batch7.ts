// R1 batch 7: spinning-disk crosstalk floor vs open-area/throughput estimate
import * as C from "../../../../src/physics/imaging/confocal";
for (const [P, a] of [[1, 10], [1, 5], [0.5, 10]]) {
  const r = C.spinningDiskSection(P, a) as unknown as Record<string, number>;
  const fill = Math.PI * (P / 2) ** 2 / (a * a);
  console.log(`P=${P} pitch=${a}AU`, JSON.stringify(r, (k, v) => (typeof v === "number" ? +v.toPrecision(5) : Array.isArray(v) ? undefined : v)).slice(0, 220), ` fill=${fill.toPrecision(4)} fill/T=${(fill / C.pinholeThroughput(P)).toPrecision(4)}`);
}
