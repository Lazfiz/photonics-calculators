import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/damage-threshold",
    title: 'Laser Damage Threshold',
  description: 'LIDT for pulsed and CW laser optics',
};

export default function Page() {
  return <PageClient />;
}
