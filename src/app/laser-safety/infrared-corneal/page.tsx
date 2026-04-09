import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/infrared-corneal",
    title: 'IR Corneal Exposure',
  description: 'Interactive IR Corneal Exposure calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
