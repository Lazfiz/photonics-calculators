import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/polymer-optics' },
    title: 'Polymer Optical Materials',
  description: 'Refractive index, dispersion, and loss data for optical polymers',
};

export default function Page() {
  return <PageClient />;
}
