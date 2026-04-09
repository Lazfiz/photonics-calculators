import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/medical-laser-safety",
    title: 'Medical Laser Safety Calculator',
  description: 'Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.'
};

export default function Page() {
  return <PageClient />;
}
