import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/thermal-expansion",
      title: 'Thermal Expansion',
  description: 'L = T L — dimensional change from temperature',
};

export default function Page() {
  return <PageClient />;
}
