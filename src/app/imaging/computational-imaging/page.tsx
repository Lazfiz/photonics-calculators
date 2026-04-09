import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/computational-imaging' },
    title: 'Computational Imaging',
  description: 'Multi-view fusion, resolution scaling, and SNR improvement through computational techniques.'
};

export default function Page() {
  return <PageClient />;
}
