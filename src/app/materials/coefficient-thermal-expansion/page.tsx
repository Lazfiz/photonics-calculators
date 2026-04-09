import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/coefficient-thermal-expansion",
    title: 'Coefficient of Thermal Expansion',
  description: 'Thermal expansion of optical materials',
};

export default function Page() {
  return <PageClient />;
}
