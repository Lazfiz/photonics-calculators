import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/etalon-finesse",
    title: 'Etalon / Fabry-Pérot Analysis',
  description: 'Detailed etalon transmission, finesse, and spectral properties.'
};

export default function Page() {
  return <PageClient />;
}
