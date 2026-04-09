import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/spatial-filter' },
    title: 'Spatial Filter Pinhole Sizing',
  description: 'Calculate optimal pinhole diameter for spatial filtering.'
};

export default function Page() {
  return <PageClient />;
}
