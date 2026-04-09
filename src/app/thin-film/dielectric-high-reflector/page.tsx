import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/dielectric-high-reflector",
    title: 'Dielectric High Reflector',
  description: 'Quarter-wave dielectric stack HR mirror — stopband width, peak reflectance, and dispersion.'
};

export default function Page() {
  return <PageClient />;
}
