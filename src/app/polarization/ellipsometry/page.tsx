import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/ellipsometry' },
    title: 'Ellipsometry',
  description: 'Calculate Ψ, from Fresnel equations; model thin film interference in ellipsometry.'
};

export default function Page() {
  return <PageClient />;
}
