import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/nohd' },
    title: 'Nominal Ocular Hazard Distance (NOHD)',
    description: 'Bounded CW point-source NOHD pre-check for educational use only. Based on ANSI Z136.1 direct-beam ocular MPE calculations.'
};

export default function Page() {
  return (
    <>
      <PageClient />
    </>
  );
}
