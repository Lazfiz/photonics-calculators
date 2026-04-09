import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/thermal-dndt' },
    title: 'Thermo-Optic Coefficient (dn/dT)',
  description: 'Temperature-dependent refractive index change. Positive dn/dT means n increases with temperature.'
};

export default function Page() {
  return <PageClient />;
}
