import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/heat-mirror' },
      title: 'Heat Mirror Design',
  description: 'Heat mirrors reflect infrared (thermal radiation) while transmitting visible light.',
};

export default function Page() {
  return <PageClient />;
}
