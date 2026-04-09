import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/enclosure-class' },
    title: 'Enclosure Classification',
  description: 'Determines laser enclosure safety class based on emission through apertures, per IEC 60825-1 and ANSI Z136.1. Evaluates whether the enclosure provides Class 1 protection.'
};

export default function Page() {
  return <PageClient />;
}
