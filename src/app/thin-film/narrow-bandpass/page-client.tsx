"use client";

import CavityBandpassCalculator from "../../../components/cavity-bandpass-calculator";

// Longer mirrors and three cavities: a flat-topped pass band about 1.1 nm wide at 1550 nm.
export default function NarrowBandpassPage() {
  return (
    <CavityBandpassCalculator
      defaults={{ nH: 2.35, nL: 1.45, nSub: 1.52, spacerN: 2.1, centerWl: 1550, pairs: 6, cavities: 3 }}
      pairsKey="mirrorPairs"
      maxPairs={20}
    />
  );
}
