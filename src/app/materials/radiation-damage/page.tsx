import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/radiation-damage' },
    title: 'Radiation Damage Effects',
  description: 'Radiation-induced absorption and transmission loss in optical materials',
};

export default function Page() {
  return <PageClient />;
}
