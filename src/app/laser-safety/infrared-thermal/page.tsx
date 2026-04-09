import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/infrared-thermal' },
    title: 'Infrared Thermal Limits',
  description: 'Calculates MPE for infrared lasers (780nm–1000µm) covering corneal thermal and retinal thermal hazards per ANSI Z136.1.'
};

export default function Page() {
  return <PageClient />;
}
