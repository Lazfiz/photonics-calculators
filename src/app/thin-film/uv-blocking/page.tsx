import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/uv-blocking' },
    title: 'UV Blocking Filter',
  description: 'Quarter-wave stack designed to reflect UV (200–400 nm) while transmitting visible light.'
};

export default function Page() {
  return <PageClient />;
}
