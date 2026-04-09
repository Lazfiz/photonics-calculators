import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/environmental-stability",
      title: 'Environmental Stability',
  description: 'Environmental factors shift thin film spectral performance. Temperature changes refractive index',
};

export default function Page() {
  return <PageClient />;
}
