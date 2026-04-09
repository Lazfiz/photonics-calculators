import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/retarder-types",
    title: 'Retarder Types Comparison',
  description: 'Compare waveplate and retarder types: bandwidth, accuracy, temperature sensitivity.'
};

export default function Page() {
  return <PageClient />;
}
