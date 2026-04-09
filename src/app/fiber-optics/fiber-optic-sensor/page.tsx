import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-optic-sensor' },
    title: 'Fiber Optic Sensors',
  description: 'Calculate sensitivity, resolution, and response for FBG, MZI, Fabry-Pérot, and evanescent fiber sensors.'
};

export default function Page() {
  return <PageClient />;
}
