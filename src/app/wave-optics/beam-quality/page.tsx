import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/beam-quality",
    title: 'Beam Quality M² Measurement',
  description: 'Detailed beam quality analysis from measured parameters.'
};

export default function Page() {
  return <PageClient />;
}
