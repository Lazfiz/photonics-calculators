"use client";

import CavityBandpassCalculator from "../../../components/cavity-bandpass-calculator";

// A two-cavity filter with short mirrors: a pass band about 19 nm wide at 1550 nm.
export default function BandpassFilterPage() {
  return (
    <CavityBandpassCalculator
      defaults={{ nH: 2.35, nL: 1.45, nSub: 1.52, spacerN: 2.1, centerWl: 1550, pairs: 3, cavities: 2 }}
      pairsKey="cavityPairs"
      maxPairs={15}
    />
  );
}
