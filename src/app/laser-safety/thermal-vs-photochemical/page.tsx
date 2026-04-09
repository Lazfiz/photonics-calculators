import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/thermal-vs-photochemical' },
    title: 'Thermal vs Photochemical MPE',
  description: 'Interactive Thermal vs Photochemical MPE calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
