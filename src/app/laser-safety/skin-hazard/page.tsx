import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/skin-hazard' },
    title: 'Skin Hazard Assessment',
  description: 'Evaluate skin exposure risk from laser irradiation per ANSI Z136.1 simplified skin MPE.'
};

export default function Page() {
  return <PageClient />;
}
