import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/coupled-mode",
    title: 'Coupled Mode Theory',
  description: 'Power exchange between two coupled waveguides.'
};

export default function Page() {
  return <PageClient />;
}
