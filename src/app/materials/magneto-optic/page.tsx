import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/magneto-optic",
    title: 'Magneto-Optic Materials',
  description: 'Faraday rotation, Verdet constants, and isolator design calculations',
};

export default function Page() {
  return <PageClient />;
}
