import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/dispersion-compensation",
    title: 'Dispersion Compensation',
  description: 'GVD and TOD compensation analysis for fiber optic links.'
};

export default function Page() {
  return <PageClient />;
}
