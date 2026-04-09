import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/ellipsometry-measurement",
    title: 'Ellipsometry Measurement',
  description: 'Analyze ellipsometry data (Ψ, ) to extract pseudo-dielectric function, refractive index, and approximate film thickness.'
};

export default function Page() {
  return <PageClient />;
}
