import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/narrow-bandpass",
    title: 'Narrow Bandpass Filter',
  description: 'High-finesse Fabry-Perot with multiple cavities for ultra-narrow transmission peaks.'
};

export default function Page() {
  return <PageClient />;
}
