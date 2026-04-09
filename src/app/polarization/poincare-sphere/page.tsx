import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/poincare-sphere' },
    title: 'Poincaré Sphere',
  description: 'Interactive visualization of polarization states on the Poincaré sphere.'
};

export default function Page() {
  return <PageClient />;
}
