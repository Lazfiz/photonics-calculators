import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/telecentricity' },
    title: 'Telecentric Lens Design',
  description: 'Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.'
};

export default function Page() {
  return <PageClient />;
}
