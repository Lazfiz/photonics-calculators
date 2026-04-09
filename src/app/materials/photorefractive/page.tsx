import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/photorefractive",
    title: 'Photorefractive Effect',
  description: 'Light-induced refractive index changes via space-charge fields in electro-optic materials. Key for holographic storage, phase conjugation, and beam coupling.'
};

export default function Page() {
  return <PageClient />;
}
