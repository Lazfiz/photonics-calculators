import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/d-shaped-fiber",
    title: 'D-Shaped Fiber',
  description: 'Birefringence, evanescent field, and polarization properties of D-shaped (flat) fibers.'
};

export default function Page() {
  return <PageClient />;
}
