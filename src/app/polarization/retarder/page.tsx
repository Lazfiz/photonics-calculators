import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/retarder",
    title: 'Waveplate / Retarder',
  description: 'Polarization state transformation by a birefringent waveplate with variable retardance and fast-axis orientation.'
};

export default function Page() {
  return <PageClient />;
}
