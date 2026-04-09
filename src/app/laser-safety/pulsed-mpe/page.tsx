import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/pulsed-mpe' },
      title: 'Pulsed Laser MPE',
  description: 'Repetitive pulse MPE with N⁻⁰²⁵ correction factor. Simplified ANSI Z136 model.',
};

export default function Page() {
  return <PageClient />;
}
