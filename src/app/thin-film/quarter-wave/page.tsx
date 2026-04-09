import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/quarter-wave",
      title: 'Quarter-Wave Thickness',
  description: 'Quarter-wave optical thickness (QWOT): nd = /4. Optimal AR when nfilm = (nincnsub).',
};

export default function Page() {
  return <PageClient />;
}
