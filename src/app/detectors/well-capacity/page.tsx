import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/well-capacity' },
      title: 'Well Capacity Dynamic Range',
  description: 'DR = 20log₀(Nwell/read). C = Nwellq/Vswing. Larger wells more DR but slower charge transfer.',
};

export default function Page() {
  return <PageClient />;
}
